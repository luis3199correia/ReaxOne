import { NextResponse } from 'next/server';
import { readdir, writeFile, mkdir, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';

export const dynamic = 'force-dynamic';

const SCAN_FOLDERS = [
  'images/produtos',
  'images/lifestyle',
  'images/hero',
  'images/ebooks',
];
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;

/** Converte nome de ficheiro para slug limpo, sem whatsapp nem caracteres especiais */
function sanitiseFilename(name: string): string {
  const ext = extname(name);
  const base = basename(name, ext);
  return base
    .toLowerCase()
    .replace(/whatsapp[\s_-]?image[\s_-]?/gi, 'foto-')
    .replace(/whatsapp/gi, 'foto')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') + ext.toLowerCase();
}

/** Renomeia ficheiros com nomes problemáticos no disco e devolve o novo nome */
async function maybeRename(dir: string, file: string): Promise<string> {
  const clean = sanitiseFilename(file);
  if (clean === file) return file;
  try {
    await rename(join(dir, file), join(dir, clean));
    return clean;
  } catch {
    return file; // se falhar, usa o nome original
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
 * GET /api/images
 * Returns all images from the scanned folders.
 * Each image has:
 *   - path: URL to use in <img src> or next/image (via the /api/images/serve/... route)
 *   - folder: subfolder label
 */
export async function GET() {
  const publicDir = getPublicDir();
  const all: { path: string; folder: string }[] = [];

  for (const folder of SCAN_FOLDERS) {
    const dir = join(publicDir, folder);
    try {
      const files = await readdir(dir);
      for (const rawFile of files) {
        if (!IMAGE_EXT.test(rawFile)) continue;
        // Renomeia automaticamente ficheiros com nomes problemáticos (whatsapp, espaços, etc.)
        const file = await maybeRename(dir, rawFile);
        all.push({
          path: `/api/images/serve/${folder}/${file}`,
          folder,
        });
      }
    } catch {
      // pasta não existe ainda — ignorar
    }
  }

  return NextResponse.json(all);
}

/**
 * POST /api/images
 * Accepts a multipart file upload, saves to public/images/produtos/,
 * and returns the serve-route URL for the new file.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Sem ficheiro' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .toLowerCase();
    const filename = `${Date.now()}-${safeName}`;

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
