import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, resolve, sep } from 'path';

export const dynamic = 'force-dynamic';

// Só imagens raster — SVG fica de fora (pode conter scripts) e nada de PDFs/ebooks
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

function getPublicDir(): string {
  const candidates = [
    join(process.cwd(), 'apps/web/public'), // Docker standalone (/app)
    join(process.cwd(), 'public'),           // next dev
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[candidates.length - 1];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const publicDir = resolve(getPublicDir());
    // Apenas ficheiros dentro de public/images/ (impede path traversal com ../)
    const imagesRoot = join(publicDir, 'images');
    const filePath = resolve(publicDir, ...path);
    if (!filePath.startsWith(imagesRoot + sep)) {
      return new NextResponse('Not found', { status: 404 });
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext];
    if (!contentType) {
      return new NextResponse('Not found', { status: 404 });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
