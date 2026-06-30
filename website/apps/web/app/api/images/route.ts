import { NextResponse } from 'next/server';
import { readdir, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const FOLDERS = ['images/produtos', 'images/lifestyle'];
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

/**
 * Resolve the public/ directory at runtime.
 *
 * Development:  cwd = <repo>/website/apps/web/  → public/ is at cwd/public
 * Docker standalone: cwd = /app, server runs as `node apps/web/server.js`
 *   → public/ is copied to /app/apps/web/public/
 */
function getPublicDir(): string {
  const candidates = [
    join(process.cwd(), 'apps/web/public'), // Docker standalone
    join(process.cwd(), 'public'),           // Development / next dev
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[candidates.length - 1];
}

export async function GET() {
  const publicDir = getPublicDir();
  const all: { path: string; folder: string }[] = [];

  for (const folder of FOLDERS) {
    try {
      const files = await readdir(join(publicDir, folder));
      for (const file of files) {
        if (IMAGE_EXT.test(file)) {
          all.push({ path: `/${folder}/${file}`, folder });
        }
      }
    } catch {
      // folder doesn't exist yet — skip
    }
  }

  return NextResponse.json(all);
}

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

    const dir = join(getPublicDir(), 'images', 'produtos');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    return NextResponse.json({ path: `/images/produtos/${filename}` });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Upload falhou' }, { status: 500 });
  }
}
