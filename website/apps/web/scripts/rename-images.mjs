/**
 * Renomeia ficheiros de imagem com nomes problemáticos (WhatsApp, espaços, acentos, etc.)
 * para slugs limpos, prontos para web.
 *
 * Uso:
 *   node scripts/rename-images.mjs
 *
 * Corre a partir da raiz de apps/web antes de fazer commit de novas fotos.
 */

import { readdir, rename } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const IMAGES_ROOT = join(PUBLIC_DIR, 'images');
const EXCLUDED = new Set(['og', 'identidade', 'marca']);
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;

function slugify(name) {
  const ext = extname(name);
  const base = basename(name, ext);
  const clean = base
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // remove acentos
    .toLowerCase()
    .replace(/whatsapp[\s_-]?image[\s_-]?/gi, 'foto-')  // WhatsApp Image → foto-
    .replace(/whatsapp/gi, 'foto')
    .replace(/[^a-z0-9._-]/g, '-')                       // espaços e especiais → -
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return clean + ext.toLowerCase();
}

async function run() {
  if (!existsSync(IMAGES_ROOT)) {
    console.error('Pasta public/images não encontrada.');
    process.exit(1);
  }

  const entries = await readdir(IMAGES_ROOT, { withFileTypes: true });
  const folders = entries
    .filter(e => e.isDirectory() && !EXCLUDED.has(e.name))
    .map(e => join(IMAGES_ROOT, e.name));

  let count = 0;

  for (const folder of folders) {
    const files = await readdir(folder);
    for (const file of files) {
      if (!IMAGE_EXT.test(file)) continue;
      const clean = slugify(file);
      if (clean === file) continue;

      const oldPath = join(folder, file);
      const newPath = join(folder, clean);

      if (existsSync(newPath)) {
        console.log(`⚠  Já existe: ${clean} — ignorado`);
        continue;
      }

      await rename(oldPath, newPath);
      console.log(`✓  ${file}  →  ${clean}`);
      count++;
    }
  }

  console.log(`\n${count} ficheiro(s) renomeado(s).`);
}

run().catch(err => { console.error(err); process.exit(1); });
