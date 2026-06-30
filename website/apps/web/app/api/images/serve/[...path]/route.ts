import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
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
  { params }: { params: { path: string[] } },
) {
  try {
    const relativePath = params.path.join('/');
    const filePath = join(getPublicDir(), relativePath);

    const buffer = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME[ext] ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
