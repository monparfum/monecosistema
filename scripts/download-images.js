import fs from 'node:fs';
import path from 'node:path';

const items = [
  {
    name: 'marketing-olfativo.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/09/Imagem-ChatGPT-24_09_2026-16_48_32.png'
  },
  {
    name: 'velas-perfumadas.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/09/ChatGPT-Image-16_09_2026-14_04_42.png'
  },
  {
    name: 'baunilha-fava-formula.jpeg',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/09/6fd259f2-abdc-4ee9-bec7-9a1b496ecde2.jpeg'
  },
  {
    name: 'aspectos-legais.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/06/ChatGPT-Image-22_06_2026-10_26_56.png'
  },
  {
    name: 'diluicao-perfumaria.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/05/ChatGPT-Image-22_05_2026-18_10_58-1024x1024.png'
  },
  {
    name: 'madeiras-composicao.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/05/ChatGPT-Image-22_05_2026-16_30_23.png'
  },
  {
    name: 'curiosidades-perfumaria.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/04/ChatGPT-Image-22_05_2026-12_53_28.png'
  },
  {
    name: 'gourmand-sensorial.png',
    url: 'https://experienciamon.com.br/wp-content/uploads/2026/04/ChatGPT-Image-22_05_2026-12_42_27-1024x1024.png'
  }
];

const destStore = 'c:/Users/Torelli/Desktop/MON PARFUM/CODEMONPARFUM/public/products';
const destMembers = 'C:/Users/Torelli/Desktop/SISTEMAS E GITS/isanetflix-main/isanetflix-main/public/courses';

fs.mkdirSync(destStore, { recursive: true });
fs.mkdirSync(destMembers, { recursive: true });

async function downloadAll() {
  for (const item of items) {
    try {
      console.log('Downloading', item.name, 'from', item.url);
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(destStore, item.name), buffer);
      fs.writeFileSync(path.join(destMembers, item.name), buffer);
      console.log('Saved', item.name, `(${buffer.length} bytes)`);
    } catch (e) {
      console.error('Failed', item.name, e.message);
    }
  }
}

downloadAll();
