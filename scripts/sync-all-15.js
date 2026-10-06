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
const STORE_SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const MEMBERS_URL = getEnv("MEMBERS_SUPABASE_URL") || "https://pvrnnmmvqqlhkfwosymd.supabase.co";
const MEMBERS_ANON_KEY = getEnv("MEMBERS_ANON_KEY") || "sb_publishable_m8KSrONrMEHrbvk2X8l-_A_ZvxwfL3U";
const MEMBERS_TOKEN = getEnv("CATALOG_SYNC_TOKEN") || "ae1a24b6c1db164d4e7c1247c524b0f5bf63e0b29c64344a";

const storeClient = createClient(STORE_URL, STORE_SERVICE_KEY);

const items = [
  {
    order: 1,
    title: "Marketing Olfativo: Cheiro, Emoção e Comportamento",
    slug: "curso-marketing-olfativo-cheiro-emocao-comportamento",
    price_cents: 59800,
    compare_at_cents: null,
    badge: "NOVO",
    stock: 30,
    delivery_type: "hybrid",
    image_url: "/products/marketing-olfativo-cheiro-emocao-e-comportamento.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Descubra como o cheiro participa da construção da experiência de uma marca. Aula com prática sensorial, kit com 10 fragrâncias e fundamentos de marketing olfativo com a professora Kati Trichês Bunn."
  },
  {
    order: 2,
    title: "Velas Perfumadas: da Fragrância à Chama",
    slug: "curso-velas-perfumadas-online",
    price_cents: 66829,
    compare_at_cents: null,
    badge: "NOVO",
    stock: 30,
    delivery_type: "hybrid",
    image_url: "/products/velas-perfumadas-da-fragrancia-a-chama.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Um curso técnico e sensorial para compreender como fragrância, cera, pavio e calor trabalham juntos em uma vela perfumada. Kit sensorial incluso."
  },
  {
    order: 3,
    title: "Baunilhas na Perfumaria: da Fava à Fórmula",
    slug: "baunilhas-na-perfumaria",
    price_cents: 110990,
    compare_at_cents: null,
    badge: "NOVO",
    stock: 30,
    delivery_type: "hybrid",
    image_url: "/products/baunilhas-na-perfumaria-da-fava-a-formula.jpeg",
    category_slug: "cursos",
    kind: "curso",
    description: "Domine a nota mais amada da perfumaria — da fava à fórmula. Análise sensorial, cromatografia e prática olfativa com kit incluso."
  },
  {
    order: 4,
    title: "Perfumaria: Aspectos legais e regulatórios",
    slug: "aspectos-legais-e-regulatorios",
    price_cents: 41500,
    compare_at_cents: null,
    badge: "",
    stock: 30,
    delivery_type: "hybrid",
    image_url: "/products/perfumaria-aspectos-legais-e-regulatorios.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Saiba o que a legislação brasileira e a ANVISA exigem para regularizar, rotular e comercializar perfumes e cosméticos no Brasil com segurança."
  },
  {
    order: 5,
    title: "Curso Diluição: Aspectos práticos do dia-a-dia de um perfumista",
    slug: "diluicao-aspectos-praticos",
    price_cents: 119000,
    compare_at_cents: null,
    badge: "",
    stock: 30,
    delivery_type: "hybrid",
    image_url: "/products/curso-diluicao-aspectos-praticos-do-dia-a-dia-de-um-perfumista.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Pare de perder material com turvamento, precipitação e separação de fases. Aprenda a diluir pós, líquidos e resinas com método e kit incluso."
  },
  {
    order: 6,
    title: "Curso Madeiras na composição: do acorde à fragrância – Aguardar novas datas.",
    slug: "madeiras-na-composicao",
    price_cents: 135990,
    compare_at_cents: null,
    badge: "FORA DE ESTOQUE",
    stock: 0,
    delivery_type: "hybrid",
    image_url: "/products/curso-madeiras-na-composicao-do-acorde-a-fragrancia-8211-aguardar-novas-datas.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Domine as madeiras da perfumaria e construa acordes com estrutura, fixação e personalidade autoral. Kit olfativo incluso."
  },
  {
    order: 7,
    title: "Kit para Treinamento Olfativo: Curiosidades da Perfumaria",
    slug: "curiosidades-da-perfumaria",
    price_cents: 54750,
    compare_at_cents: 58990,
    badge: "-7%",
    stock: 20,
    delivery_type: "hybrid",
    image_url: "/products/kit-para-treinamento-olfativo-curiosidades-da-perfumaria.png",
    category_slug: "kits-treinamento",
    kind: "kit",
    grupo: "treino",
    description: "25 matérias-primas emblemáticas e curiosidades fascinantes da perfumaria. Kit físico enviado para sua casa + acesso à área de membros com e-book e guia sensorial."
  },
  {
    order: 8,
    title: "Kit para Treinamento Olfativo – Notas Gourmand",
    slug: "kit-gourmand",
    price_cents: 64590,
    compare_at_cents: 68990,
    badge: "-6%",
    stock: 20,
    delivery_type: "hybrid",
    image_url: "/products/kit-para-treinamento-olfativo-8211-notas-gourmand.png",
    category_slug: "kits-treinamento",
    kind: "kit",
    grupo: "treino",
    description: "25 principais matérias-primas inspiradas em facetas doces, cremosas, quentes e sofisticadas. Kit físico + acesso online na área de membros com e-book e guia sensorial."
  },
  {
    order: 9,
    title: "Kit para Treinamento Olfativo: Meu Primeiro Kit",
    slug: "meu-primeiro-kit",
    price_cents: 44790,
    compare_at_cents: 48990,
    badge: "-8%",
    stock: 20,
    delivery_type: "hybrid",
    image_url: "/products/kit-para-treinamento-olfativo-meu-primeiro-kit.png",
    category_slug: "kits-treinamento",
    kind: "kit",
    grupo: "treino",
    description: "O ponto de partida na perfumaria. 20 matérias-primas fundamentais com guia passo a passo para treinar seu nariz e construir memória olfativa."
  },
  {
    order: 10,
    title: "Curso de Introdução à Perfumaria – 14 de Novembro de 2026 –",
    slug: "introducao-a-perfumaria",
    price_cents: 69990,
    compare_at_cents: null,
    badge: "EM ALTA",
    stock: 30,
    delivery_type: "hybrid",
    image_url: "/products/curso-de-introducao-a-perfumaria-8211-14-de-novembro-de-2026-8211.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Leia uma fórmula, cheire com método e crie sua primeira composição autoral. Todo curso inclui kit completo de bancada enviado à sua casa."
  },
  {
    order: 11,
    title: "Famílias Olfativas: Novas Construções",
    slug: "familias-olfativas-novas-construcoes",
    price_cents: 289900,
    compare_at_cents: null,
    badge: "EM ALTA",
    stock: 15,
    delivery_type: "hybrid",
    image_url: "/products/familias-olfativas-novas-construcoes.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Estudo aprofundado das principais famílias olfativas, bases clássicas e suas reconstruções contemporâneas na alta perfumaria com kit de acordes nobres."
  },
  {
    order: 12,
    title: "Curso: Mimosa, A Luz Dourada da Perfumaria – 100% on-line",
    slug: "mimosa-a-luz-dourada-da-perfumaria",
    price_cents: 135990,
    compare_at_cents: 149900,
    badge: "-9%",
    stock: 20,
    delivery_type: "hybrid",
    image_url: "/products/curso-mimosa-a-luz-dourada-da-perfumaria-8211-100-on-line.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Explore a luminosidade, facetas atalcadas, meladas e verdes da Mimosa na perfumaria de nicho com kit sensorial exclusivo."
  },
  {
    order: 13,
    title: "Curso: Os Segredos do Jasmim – 100% On-line",
    slug: "os-segredos-do-jasmim",
    price_cents: 93990,
    compare_at_cents: 97990,
    badge: "-4%",
    stock: 25,
    delivery_type: "hybrid",
    image_url: "/products/curso-os-segredos-do-jasmim-8211-100-on-line.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Diferencie Sambac de Grandiflorum, domine o indol e monte acordes florais opulentos e sofisticados com kit de bancada incluso."
  },
  {
    order: 14,
    title: "Curso: Rosa, A Rainha da Perfumaria – 100% on-line",
    slug: "rosa-a-rainha-da-perfumaria",
    price_cents: 97900,
    compare_at_cents: null,
    badge: "",
    stock: 20,
    delivery_type: "hybrid",
    image_url: "/products/curso-rosa-a-rainha-da-perfumaria-8211-100-on-line.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Da rosa de maio à rosa damascena. Compreenda a anatomia olfativa da flor mais célebre do mundo e crie acordes florais modernos com kit incluso."
  },
  {
    order: 15,
    title: "Curso: Néroli & Flor de Laranjeira",
    slug: "neroli-e-flor-de-laranjeira",
    price_cents: 135990,
    compare_at_cents: null,
    badge: "",
    stock: 25,
    delivery_type: "hybrid",
    image_url: "/products/curso-neroli-038-flor-de-laranjeira.png",
    category_slug: "cursos",
    kind: "curso",
    description: "Domine uma das flores mais versáteis e radiantes da perfumaria. Da colônia cítrica aos florais brancos sofisticados. Kit prático incluso."
  }
];

async function main() {
  console.log("=== SINCRONIZANDO OS 15 PRODUTOS E CURSOS NA ORDEM EXATA ===");

  // 1. Auth na Área de Membros
  const authRes = await fetch(`${MEMBERS_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": MEMBERS_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "carlosalbertotorelli@gmail.com", password: "Diretor*1343" })
  });
  const authData = await authRes.json();
  const membersHeaders = {
    "apikey": MEMBERS_ANON_KEY,
    "Authorization": `Bearer ${authData.access_token}`,
    "Content-Type": "application/json"
  };

  const { data: categories } = await storeClient.from("categories").select("id, slug");
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  for (const item of items) {
    console.log(`\nItem ${item.order}: ${item.title}`);

    // Criar ou atualizar curso na área de membros
    let courseId = null;
    const searchCourse = await fetch(`${MEMBERS_URL}/rest/v1/courses?name=eq.${encodeURIComponent(item.title)}&select=id`, {
      headers: membersHeaders
    }).then(r => r.json());

    if (Array.isArray(searchCourse) && searchCourse.length > 0) {
      courseId = searchCourse[0].id;
      await fetch(`${MEMBERS_URL}/rest/v1/courses?id=eq.${courseId}`, {
        method: "PATCH",
        headers: membersHeaders,
        body: JSON.stringify({
          description: item.description,
          image_url: item.image_url,
          status: "published",
          position: item.order
        })
      });
    } else {
      const createRes = await fetch(`${MEMBERS_URL}/rest/v1/courses`, {
        method: "POST",
        headers: { ...membersHeaders, "Prefer": "return=representation" },
        body: JSON.stringify({
          name: item.title,
          description: item.description,
          category: item.kind === "curso" ? "Cursos" : "Kits de Treinamento",
          instructor: "MON Parfum",
          image_url: item.image_url,
          status: "published",
          position: item.order
        })
      }).then(r => r.json());
      courseId = createRes[0]?.id;

      if (courseId) {
        const modRes = await fetch(`${MEMBERS_URL}/rest/v1/modules`, {
          method: "POST",
          headers: { ...membersHeaders, "Prefer": "return=representation" },
          body: JSON.stringify({ course_id: courseId, name: "Módulo 1: Boas-vindas e Materiais", position: 1 })
        }).then(r => r.json());
        if (modRes[0]?.id) {
          await fetch(`${MEMBERS_URL}/rest/v1/lessons`, {
            method: "POST",
            headers: membersHeaders,
            body: JSON.stringify({
              module_id: modRes[0].id,
              course_id: courseId,
              name: "Orientações Iniciais",
              description: "Acesse os materiais e vídeo-aulas da sua formação.",
              type: "text",
              content_text: `Bem-vindo(a) ao ${item.title}!`,
              position: 1
            })
          });
        }
      }
    }

    // Salvar produto na loja
    const catId = catMap[item.category_slug] || catMap["cursos"];
    const productPayload = {
      slug: item.slug,
      name: item.title,
      brand: "MON PARFUM",
      description: item.description,
      price_cents: item.price_cents,
      compare_at_cents: item.compare_at_cents,
      stock: item.stock,
      delivery_type: item.delivery_type,
      active: true,
      category_id: catId,
      image_url: item.image_url,
      member_course_ids: courseId ? [courseId] : [],
      details: {
        order: item.order,
        kind: item.kind,
        grupo: item.grupo,
        badge: item.badge,
        titulo: item.title,
        resumo: item.description
      }
    };

    const { data: upsertedProd, error: prodErr } = await storeClient
      .from("products")
      .upsert(productPayload, { onConflict: "slug" })
      .select("id")
      .single();

    if (prodErr) {
      console.error("Erro loja:", prodErr.message);
      continue;
    }

    // Sincronizar com sales gateway
    if (courseId) {
      await fetch(`${MEMBERS_URL}/functions/v1/monparfum-catalog`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${MEMBERS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: upsertedProd.id,
          name: item.title,
          active: true,
          course_ids: [courseId]
        })
      });
    }
    console.log(`OK: ${item.title} -> Loja ID ${upsertedProd.id} | Curso ${courseId}`);
  }

  console.log("\n=== TODOS OS 15 PRODUTOS CADASTRADOS E SINCRONIZADOS! ===");
}

main().catch(console.error);
