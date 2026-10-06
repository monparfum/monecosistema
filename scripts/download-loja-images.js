import fs from 'node:fs';
import path from 'node:path';

const raw = JSON.parse(fs.readFileSync('scripts/loja_products.json', 'utf8'));

const destStore = 'c:/Users/Torelli/Desktop/MON PARFUM/CODEMONPARFUM/public/products';
const destMembers = 'C:/Users/Torelli/Desktop/SISTEMAS E GITS/isanetflix-main/isanetflix-main/public/courses';

fs.mkdirSync(destStore, { recursive: true });
fs.mkdirSync(destMembers, { recursive: true });

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function downloadAll() {
  const downloaded = [];
  for (const item of raw) {
    const slug = slugify(item.title);
    const ext = path.extname(new URL(item.img).pathname) || '.png';
    const filename = `${slug}${ext}`;
    const targetStore = path.join(destStore, filename);
    const targetMembers = path.join(destMembers, filename);

    console.log(`Downloading ${filename} from ${item.img}...`);
    try {
      const res = await fetch(item.img);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(targetStore, buf);
      fs.writeFileSync(targetMembers, buf);
      console.log(`Saved ${filename} (${buf.length} bytes)`);
      downloaded.push({ ...item, filename, slug, localUrl: `/products/${filename}` });
    } catch (e) {
      console.error(`Failed ${filename}: ${e.message}`);
      downloaded.push({ ...item, filename, slug, localUrl: item.img });
    }
  }
  fs.writeFileSync('scripts/loja_products_downloaded.json', JSON.stringify(downloaded, null, 2));
}

downloadAll();
