import { NextResponse } from 'next/server';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';

export const dynamic = 'force-dynamic';

// Pastas que NÃO devem aparecer na galeria de imagens
const EXCLUDED_FOLDERS = new Set(['og', 'identidade', 'marca']);
// Mesmas extensões que a rota /api/images/serve aceita servir (sem SVG)
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|avif)$/i;

// Upload: só imagens raster, até 10 MB
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_TYPES: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.avif': ['image/avif'],
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Confirma que o pedido vem de um ADMIN autenticado.
 * O JWT vive no cookie httpOnly `reaxone_token` (emitido pela API) e o segredo
 * só existe na API — por isso validamos reencaminhando o cookie para GET /users/me.
 */
async function isAdminRequest(request: Request): Promise<boolean> {
  const token = /(?:^|;\s*)reaxone_token=([^;]+)/.exec(request.headers.get('cookie') ?? '')?.[1];
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { Cookie: `reaxone_token=${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const user = await res.json();
    return user?.role === 'ADMIN';
  } catch (err) {
    console.error('[images] erro a validar sessão:', err);
    return false;
  }
}

/** Bloqueia pedidos cross-site (CSRF) — o cookie de sessão é SameSite=None em produção */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // pedidos same-origin de alguns browsers não enviam Origin
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Confirma o tipo real pelos primeiros bytes (o MIME do browser é só declarativo) */
function matchesSignature(ext: string, buf: Buffer): boolean {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case '.png':
      return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case '.webp':
      return buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
    case '.avif':
      return buf.toString('ascii', 4, 8) === 'ftyp' && /^avi[fs]$/.test(buf.toString('ascii', 8, 12));
    default:
      return false;
  }
}

/**
 * Resolve the public/ directory at runtime.
 *
 * Development  (next dev from apps/web/): process.cwd() = .../apps/web
 *   → public/ at cwd/public
 *
 * Docker standalone (node apps/web/server.js from WORKDIR /app):
 *   process.cwd() = /app
 *   public/ was copied to /app/apps/web/public (see Dockerfile)
 */
function getPublicDir(): string {
  const candidates = [
    join(process.cwd(), 'apps/web/public'), // Docker standalone
    join(process.cwd(), 'public'),           // local dev
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[candidates.length - 1];
}

/**
 * GET /api/images  (apenas ADMIN)
 * Returns all images from the scanned folders.
 * Each image has:
 *   - path: URL to use in <img src> or next/image (via the /api/images/serve/... route)
 *   - folder: subfolder label
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const publicDir = getPublicDir();
  const imagesRoot = join(publicDir, 'images');
  const all: { path: string; folder: string }[] = [];

  // Descobre automaticamente todas as subpastas de images/
  let subfolders: string[] = [];
  try {
    const entries = await readdir(imagesRoot, { withFileTypes: true });
    subfolders = entries
      .filter((e) => e.isDirectory() && !EXCLUDED_FOLDERS.has(e.name))
      .map((e) => `images/${e.name}`);
  } catch {
    // images/ não existe
  }

  for (const folder of subfolders) {
    const dir = join(publicDir, folder);
    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (!IMAGE_EXT.test(file)) continue;
        // encodeURIComponent garante URL válida mesmo com espaços/caracteres especiais no nome
        all.push({ path: `/api/images/serve/${folder}/${encodeURIComponent(file)}`, folder });
      }
    } catch {
      // pasta não acessível — ignorar
    }
  }

  return NextResponse.json(all);
}

/**
 * POST /api/images  (apenas ADMIN)
 * Accepts a multipart file upload, saves to public/images/produtos/,
 * and returns the serve-route URL for the new file.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  }
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Rejeita cedo pedidos claramente demasiado grandes (margem para o multipart)
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 10 MB)' }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Sem ficheiro' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 10 MB)' }, { status: 413 });
    }

    const ext = extname(file.name).toLowerCase();
    const allowedMimes = UPLOAD_TYPES[ext];
    if (!allowedMimes || !allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato não suportado (usa JPG, PNG, WEBP ou AVIF)' },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(ext, buffer)) {
      return NextResponse.json({ error: 'Ficheiro de imagem inválido' }, { status: 415 });
    }

    const safeBase = basename(file.name, extname(file.name))
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .toLowerCase()
      .slice(0, 80);
    const filename = `${Date.now()}-${safeBase || 'imagem'}${ext}`;

    const targetFolder = 'images/produtos';
    const dir = join(getPublicDir(), targetFolder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    // Return the serve-route URL so it's always accessible
    return NextResponse.json({
      path: `/api/images/serve/${targetFolder}/${filename}`,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Upload falhou' }, { status: 500 });
  }
}
