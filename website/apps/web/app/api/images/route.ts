import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

const FOLDERS = ['images/produtos', 'images/lifestyle'];
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

export async function GET() {
  const publicDir = join(process.cwd(), 'public');
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
      // folder may not exist
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

    const dir = join(process.cwd(), 'public', 'images', 'produtos');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    return NextResponse.json({ path: `/images/produtos/${filename}` });
  } catch {
    return NextResponse.json({ error: 'Upload falhou' }, { status: 500 });
  }
}
