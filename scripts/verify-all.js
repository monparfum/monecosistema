import { createClient } from '@supabase/supabase-js';

import fs from 'node:fs';

const getEnv = (key) => {
  if (process.env[key]) return process.env[key];
  try {
    const raw = fs.readFileSync('.env.development.local', 'utf8');
    const m = raw.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return m ? m[1].replace(/["']/g, '').trim() : '';
  } catch {
    return '';
  }
};

const STORE_URL = getEnv("SUPABASE_URL") || "https://cnkfqxgovegksyktoszg.supabase.co";
const STORE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const MEMBERS_URL = getEnv("MEMBERS_SUPABASE_URL") || "https://pvrnnmmvqqlhkfwosymd.supabase.co";
const MEMBERS_TOKEN = getEnv("CATALOG_SYNC_TOKEN") || "ae1a24b6c1db164d4e7c1247c524b0f5bf63e0b29c64344a";

async function run() {
  const store = createClient(STORE_URL, STORE_KEY);
  const slugs = [
    "curso-marketing-olfativo-cheiro-emocao-comportamento",
    "curso-velas-perfumadas-online",
    "baunilhas-na-perfumaria",
    "aspectos-legais-e-regulatorios",
    "diluicao-aspectos-praticos",
    "madeiras-na-composicao",
    "curiosidades-da-perfumaria",
    "kit-gourmand"
  ];

  const { data: prods } = await store
    .from("products")
    .select("id, slug, name, delivery_type, price_cents, compare_at_cents, stock, active, image_url, member_course_ids")
    .in("slug", slugs)
    .order("name");

  console.log("\n=== PRODUTOS NO SITE MON PARFUM ===");
  for (const p of prods) {
    const priceStr = `R$ ${(p.price_cents / 100).toFixed(2).replace('.', ',')}`;
    const compStr = p.compare_at_cents ? ` (de R$ ${(p.compare_at_cents / 100).toFixed(2).replace('.', ',')})` : '';
    console.log(`- [${p.delivery_type.toUpperCase()}] ${p.name}`);
    console.log(`  Preço: ${priceStr}${compStr} | Estoque: ${p.stock} | Ativo: ${p.active}`);
    console.log(`  Imagem: ${p.image_url}`);
    console.log(`  Cursos Vinculados (IDs): ${JSON.stringify(p.member_course_ids)}`);
  }

  const catalogRes = await fetch(`${MEMBERS_URL}/functions/v1/monparfum-catalog`, {
    headers: { Authorization: `Bearer ${MEMBERS_TOKEN}` }
  });
  const cat = await catalogRes.json();
  console.log(`\n=== CURSOS DISPONÍVEIS NA ÁREA DE MEMBROS (${cat.courses?.length}) ===`);
  cat.courses?.forEach(c => {
    console.log(`- [${c.status.toUpperCase()}] ${c.name} (ID: ${c.id})`);
  });
}

run();
