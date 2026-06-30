import { NextResponse } from 'next/server';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const SCAN_FOLDERS = ['images/produtos', 'images/lifestyle'];
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;

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
    try {
      const files = await readdir(join(publicDir, folder));
      for (const file of files) {
        if (IMAGE_EXT.test(file)) {
          // Always use the serve route — works whether files were there at build
          // time or uploaded at runtime, regardless of standalone path quirks.
          all.push({
            path: `/api/images/serve/${folder}/${file}`,
            folder,
          });
        }
      }
    } catch {
      // folder doesn't exist yet — skip
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
