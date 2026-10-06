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

// Define products and courses catalog
const catalogItems = [
  {
    course: {
      name: "Marketing Olfativo: Cheiro, Emoção e Comportamento",
      description: "Descubra como o cheiro participa da construção da experiência de uma marca. Em uma aula on-line de 3 horas com prática sensorial, kit incluso e conteúdo sobre cheiro, emoção, comportamento e experiência de marca com análise de 10 fragrâncias do Kit Sensorial Mon.",
      category: "Cursos",
      instructor: "Kati Trichês Bunn",
      image_url: "/courses/marketing-olfativo.png",
      position: 1,
      status: "published"
    },
    product: {
      slug: "curso-marketing-olfativo-cheiro-emocao-comportamento",
      name: "Curso de Marketing Olfativo: Cheiro, Emoção e Comportamento",
      brand: "MON PARFUM",
      description: "Descubra como o cheiro participa da construção da experiência de uma marca. Aula on-line com prática sensorial, kit com 10 fragrâncias enviado para sua casa e fundamentos de marketing olfativo com a professora Kati Trichês Bunn.",
      price_cents: 59800,
      compare_at_cents: null,
      stock: 30,
      delivery_type: "hybrid",
      active: true,
      category_slug: "cursos",
      image_url: "/products/marketing-olfativo.png",
      details: {
        kind: "curso",
        estagio: "Iniciante",
        formato: "Online + Kit",
        dor: "Você quer entender como o cheiro impacta a experiência de compra, emoção e comportamento de marcas",
        sub: "Descubra como o cheiro participa da construção da experiência de uma marca. Aula com prática sensorial, kit com 10 fragrâncias e fundamentos de marketing sensorial.",
        aprende: "Compreender a conexão entre cheiro, emoção, memória e comportamento\nIdentificar por que determinadas fragrâncias funcionam em alguns negócios e não em outros\nAvaliar a percepção de permanência e conforto em ambientes comerciais\nPrática sensorial com 10 fragrâncias do Kit Sensorial Mon\nTraduzir atributos de marca em territórios olfativos",
        prereq: "Nenhum",
        naoE: "um treinamento de manipulação química laboratorial.",
        nota: "9,8",
        badge: "Novo",
        turma: "Inscrições abertas",
        destaque: true
      }
    }
  },
  {
    course: {
      name: "Curso de Velas Perfumadas: Fragrância e Performance",
      description: "Um curso técnico e sensorial para compreender como fragrância, cera, pavio e calor trabalham juntos em uma vela perfumada. Você vai estudar estrutura olfativa, volatilidade, Air Care, diferentes bases, sistemas de queima, difusão, performance e os fatores que diferenciam uma vela de qualidade.",
      category: "Cursos",
      instructor: "MON Parfum",
      image_url: "/courses/velas-perfumadas.png",
      position: 2,
      status: "published"
    },
    product: {
      slug: "curso-velas-perfumadas-online",
      name: "Curso de Velas Perfumadas: Fragrância e Performance",
      brand: "MON PARFUM",
      description: "Um curso técnico e sensorial para compreender como fragrância, cera, pavio e calor trabalham juntos em uma vela perfumada. Curso on-line com kit sensorial enviado para sua casa.",
      price_cents: 66829,
      compare_at_cents: null,
      stock: 30,
      delivery_type: "hybrid",
      active: true,
      category_slug: "cursos",
      image_url: "/products/velas-perfumadas.png",
      details: {
        kind: "curso",
        estagio: "Iniciante",
        formato: "Online + Kit",
        dor: "Sua vela não exala ou queima mal e você não entende a interação entre cera, pavio e fragrância",
        sub: "Um curso técnico e sensorial para compreender como fragrância, cera, pavio e calor trabalham juntos em uma vela perfumada de alta performance.",
        aprende: "Compreender a vela como um sistema técnico e olfativo integrado\nDominar estrutura olfativa, volatilidade e threshold em Air Care\nIdentificar os tipos de ceras, bases, pavios e cargas aromáticas\nEntender o comportamento da fragrância a frio e durante a queima\nDiagnosticar e solucionar falhas comuns de queima e difusão",
        prereq: "Nenhum",
        naoE: "apenas uma receita caseira sem fundamentação técnica.",
        nota: "9,7",
        badge: "Novo",
        turma: "Inscrições abertas",
        destaque: true
      }
    }
  },
  {
    course: {
      name: "Baunilhas na Perfumaria: da Fava à Fórmula",
      description: "Descubra a baunilha para além da vanilina. Um curso técnico e sensorial que conecta diversidade botânica, cromatografia, moléculas aromáticas e percepção olfativa, com kit e práticas de reconstrução inspiradas em diferentes perfis de baunilha.",
      category: "Cursos",
      instructor: "MON Parfum",
      image_url: "/courses/baunilha-fava-formula.jpeg",
      position: 3,
      status: "published"
    },
    product: {
      slug: "baunilhas-na-perfumaria",
      name: "Baunilhas na Perfumaria: da Fava à Fórmula",
      brand: "MON PARFUM",
      description: "Domine a nota mais amada da perfumaria — da fava à fórmula. Análise sensorial, cromatografia e prática olfativa com kit incluso.",
      price_cents: 110990,
      compare_at_cents: null,
      stock: 30,
      delivery_type: "hybrid",
      active: true,
      category_slug: "cursos",
      image_url: "/products/baunilha-fava-formula.jpeg",
      details: {
        kind: "curso",
        estagio: "Intermediário",
        formato: "Online + Kit",
        dor: "Baunilha não é uma nota só — são dezenas de moléculas e possibilidades",
        sub: "Da fava de baunilha natural às moléculas sintéticas que a recriam. Construa acordes e fórmulas com profundidade gourmand.",
        aprende: "Conhecer os tipos de baunilha e suas moléculas\nDiferenciar vanilina, etilvanilina e absoluto de baunilha\nConstruir acordes gourmand com baunilha\nCriar fórmulas autorais com diferentes faces da baunilha",
        prereq: "Introdução à Perfumaria ou equivalente",
        naoE: "você nunca cheirou uma matéria-prima isolada.",
        nota: "9,5",
        badge: "Novo",
        turma: "Inscrições abertas",
        destaque: true
      }
    }
  },
  {
    course: {
      name: "Perfumaria: Aspectos Legais e Regulatórios",
      description: "Um curso on-line para quem deseja empreender na perfumaria com mais segurança, entendendo as principais exigências legais e regulatórias para micro e pequenas empresas, marcas autorais e negócios em fase inicial.",
      category: "Cursos",
      instructor: "MON Parfum",
      image_url: "/courses/aspectos-legais.png",
      position: 4,
      status: "published"
    },
    product: {
      slug: "aspectos-legais-e-regulatorios",
      name: "Perfumaria: Aspectos Legais e Regulatórios",
      brand: "MON PARFUM",
      description: "Saiba o que a legislação brasileira e a ANVISA exigem para regularizar, rotular e comercializar perfumes e cosméticos no Brasil com segurança.",
      price_cents: 41500,
      compare_at_cents: null,
      stock: 30,
      delivery_type: "hybrid",
      active: true,
      category_slug: "cursos",
      image_url: "/products/aspectos-legais.png",
      details: {
        kind: "curso",
        estagio: "Avançado",
        formato: "Online",
        dor: "Você quer vender o que cria e não sabe se pode",
        sub: "Entenda o que a legislação e a ANVISA exigem de quem quer comercializar perfumes.",
        aprende: "Entender o que a legislação brasileira estabelece\nIdentificar o papel da ANVISA e das Vigilâncias Sanitárias\nReconhecer limites de alérgenos e exigências de rotulagem\nMapear o que falta para vender dentro da lei",
        prereq: "Nenhum",
        naoE: "você não pretende comercializar o que cria.",
        nota: "9,8",
        turma: "Inscrições abertas"
      }
    }
  },
  {
    course: {
      name: "Diluição: Aspectos Práticos do Dia a Dia de um Perfumista",
      description: "Um curso on-line para aprender, na prática, como preparar diluições de matérias-primas aromáticas, compreender solubilidade, observar turvamento, precipitação e separação de fases, além de entender como escolher melhor o solvente. Inclui prática com kit.",
      category: "Cursos",
      instructor: "MON Parfum",
      image_url: "/courses/diluicao-perfumaria.png",
      position: 5,
      status: "published"
    },
    product: {
      slug: "diluicao-aspectos-praticos",
      name: "Diluição: Aspectos Práticos do Dia a Dia de um Perfumista",
      brand: "MON PARFUM",
      description: "Pare de perder material com turvamento, precipitação e separação de fases. Aprenda a diluir pós, líquidos e resinas com método e kit incluso.",
      price_cents: 119000,
      compare_at_cents: null,
      stock: 30,
      delivery_type: "hybrid",
      active: true,
      category_slug: "cursos",
      image_url: "/products/diluicao-perfumaria.png",
      details: {
        kind: "curso",
        estagio: "Avançado",
        formato: "Online + Kit",
        dor: "Sua fórmula turvou e você não sabe por quê",
        sub: "Solubilidade, precipitação e separação de fases — pare de perder material.",
        aprende: "Diagnosticar turvamento, precipitação e separação de fases\nEscolher o solvente certo para cada matéria-prima\nDiluir pó, líquido e resina com segurança\nCorrigir uma fórmula instável",
        prereq: "Prática prévia de composição",
        naoE: "você ainda não criou nenhuma fórmula própria.",
        nota: "9,7",
        turma: "Inscrições abertas"
      }
    }
  },
  {
    course: {
      name: "Madeiras na Composição: do Acorde à Fragrância",
      description: "Um curso on-line para explorar a riqueza das madeiras nobres na perfumaria, compreendendo suas nuances olfativas, suas aplicações em perfumes conceito e sua importância na construção de fragrâncias sofisticadas. Inclui kit olfativo para prática guiada.",
      category: "Cursos",
      instructor: "MON Parfum",
      image_url: "/courses/madeiras-composicao.png",
      position: 6,
      status: "published"
    },
    product: {
      slug: "madeiras-na-composicao",
      name: "Madeiras na Composição: do Acorde à Fragrância",
      brand: "MON PARFUM",
      description: "Domine as madeiras da perfumaria e construa acordes com estrutura, fixação e personalidade autoral. Kit olfativo incluso.",
      price_cents: 135990,
      compare_at_cents: null,
      stock: 30,
      delivery_type: "hybrid",
      active: true,
      category_slug: "cursos",
      image_url: "/products/madeiras-composicao.png",
      details: {
        kind: "curso",
        estagio: "Intermediário",
        formato: "Online + Kit",
        dor: "Você usa madeiras na fórmula mas não domina as diferenças entre elas",
        sub: "Sândalo, cedro, vetiver, patchouli — cada madeira tem uma função. Aprenda a usá-las com método.",
        aprende: "Reconhecer as principais madeiras da perfumaria no cheiro\nEntender a função estrutural das madeiras numa composição\nConstruir acordes amadeirados com diferentes perfis\nCriar fórmulas autorais com base em madeiras",
        prereq: "Introdução à Perfumaria ou equivalente",
        naoE: "você está começando do zero.",
        nota: "9,4",
        badge: "Inscrições abertas",
        turma: "Inscrições abertas"
      }
    }
  },
  {
    course: {
      name: "Treinamento Olfativo: Curiosidades da Perfumaria",
      description: "Descubra os segredos invisíveis do perfume. Com 25 experiências olfativas cuidadosamente selecionadas, este treinamento explora matérias-primas emblemáticas, efeitos aromáticos e curiosidades fascinantes da perfumaria, guiado por e-book exclusivo e práticas na área de membros.",
      category: "Kits de Treinamento",
      instructor: "MON Parfum",
      image_url: "/courses/curiosidades-perfumaria.png",
      position: 7,
      status: "published"
    },
    product: {
      slug: "curiosidades-da-perfumaria",
      name: "Kit para Treinamento Olfativo: Curiosidades da Perfumaria",
      brand: "MON PARFUM",
      description: "25 matérias-primas emblemáticas e curiosidades fascinantes da perfumaria. Kit físico enviado para sua casa + acesso à área de membros com e-book e guia sensorial.",
      price_cents: 54750,
      compare_at_cents: 58990,
      stock: 20,
      delivery_type: "hybrid",
      active: true,
      category_slug: "kits-treinamento",
      image_url: "/products/curiosidades-perfumaria.png",
      details: {
        cor: "bois",
        kind: "kit",
        grupo: "treino",
        titulo: "Curiosidades da Perfumaria",
        resumo: "Para quem já tem curiosidade e quer ir além. Matérias-primas que surpreendem e exercícios que ampliam o repertório olfativo na área de membros."
      }
    }
  },
  {
    course: {
      name: "Treinamento Olfativo: Notas Gourmand",
      description: "Uma imersão olfativa nos acordes mais envolventes da perfumaria gourmand. Explore 25 principais matérias-primas inspiradas em facetas doces, cremosas, quentes e sofisticadas, com e-book exclusivo e treinamento guiado na área de membros.",
      category: "Kits de Treinamento",
      instructor: "MON Parfum",
      image_url: "/courses/gourmand-sensorial.png",
      position: 8,
      status: "published"
    },
    product: {
      slug: "kit-gourmand",
      name: "Kit para Treinamento Olfativo: Notas Gourmand",
      brand: "MON PARFUM",
      description: "25 principais matérias-primas inspiradas em facetas doces, cremosas, quentes e sofisticadas. Kit físico + acesso online na área de membros com e-book e guia sensorial.",
      price_cents: 64590,
      compare_at_cents: 68990,
      stock: 20,
      delivery_type: "hybrid",
      active: true,
      category_slug: "kits-treinamento",
      image_url: "/products/gourmand-sensorial.png",
      details: {
        cor: "heritage",
        kind: "kit",
        grupo: "treino",
        titulo: "Notas Gourmand",
        resumo: "Baunilha, cacau, caramelo, especiarias doces. Um mergulho no território mais envolvente e acolhedor da perfumaria com prática na área de membros."
      }
    }
  }
];

async function main() {
  console.log("=== INICIANDO CADASTRO E CONEXÃO ===");

  // 1. Auth no Supabase da Área de Membros
  console.log("Autenticando admin na área de membros...");
  const authRes = await fetch(`${MEMBERS_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": MEMBERS_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "carlosalbertotorelli@gmail.com", password: "Diretor*1343" })
  });
  const authData = await authRes.json();
  if (!authData.access_token) {
    throw new Error("Falha no login da área de membros: " + JSON.stringify(authData));
  }
  const membersJwt = authData.access_token;
  const membersHeaders = {
    "apikey": MEMBERS_ANON_KEY,
    "Authorization": `Bearer ${membersJwt}`,
    "Content-Type": "application/json"
  };

  // Buscar categorias da loja
  const { data: categories, error: catErr } = await storeClient.from("categories").select("id, slug");
  if (catErr) throw catErr;
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  for (const item of catalogItems) {
    console.log(`\n--- Processando: ${item.course.name} ---`);

    // 2. Criar ou buscar curso na área de membros
    const searchCourseRes = await fetch(`${MEMBERS_URL}/rest/v1/courses?name=eq.${encodeURIComponent(item.course.name)}&select=*`, {
      headers: membersHeaders
    });
    const existingCourses = await searchCourseRes.json();
    let courseId;

    if (Array.isArray(existingCourses) && existingCourses.length > 0) {
      courseId = existingCourses[0].id;
      console.log(`Curso já existe na área de membros (ID: ${courseId}). Atualizando...`);
      await fetch(`${MEMBERS_URL}/rest/v1/courses?id=eq.${courseId}`, {
        method: "PATCH",
        headers: membersHeaders,
        body: JSON.stringify({
          description: item.course.description,
          category: item.course.category,
          instructor: item.course.instructor,
          image_url: item.course.image_url,
          status: item.course.status,
          position: item.course.position
        })
      });
    } else {
      console.log("Criando curso na área de membros...");
      const createCourseRes = await fetch(`${MEMBERS_URL}/rest/v1/courses`, {
        method: "POST",
        headers: { ...membersHeaders, "Prefer": "return=representation" },
        body: JSON.stringify(item.course)
      });
      const createdCourse = await createCourseRes.json();
      if (!Array.isArray(createdCourse) || !createdCourse[0]?.id) {
        throw new Error("Erro ao criar curso: " + JSON.stringify(createdCourse));
      }
      courseId = createdCourse[0].id;
      console.log(`Curso criado com sucesso (ID: ${courseId})`);

      // Criar módulo e aula inicial para o curso
      const modRes = await fetch(`${MEMBERS_URL}/rest/v1/modules`, {
        method: "POST",
        headers: { ...membersHeaders, "Prefer": "return=representation" },
        body: JSON.stringify({
          course_id: courseId,
          name: "Módulo 1: Introdução e Orientações",
          position: 1
        })
      });
      const createdMod = await modRes.json();
      if (Array.isArray(createdMod) && createdMod[0]?.id) {
        await fetch(`${MEMBERS_URL}/rest/v1/lessons`, {
          method: "POST",
          headers: membersHeaders,
          body: JSON.stringify({
            module_id: createdMod[0].id,
            course_id: courseId,
            name: "Boas-vindas ao Curso",
            description: "Orientações iniciais e materiais de apoio.",
            type: "text",
            content_text: `Bem-vindo(a) ao ${item.course.name}! Aqui você terá acesso a todo o conteúdo, materiais complementares e direcionamento dos exercícios práticos.`,
            position: 1
          })
        });
        console.log("Módulo e aula de boas-vindas criados.");
      }
    }

    // 3. Cadastrar ou atualizar o produto no banco da loja (MON PARFUM)
    const categoryId = catMap[item.product.category_slug];
    const productPayload = {
      slug: item.product.slug,
      name: item.product.name,
      brand: item.product.brand,
      description: item.product.description,
      price_cents: item.product.price_cents,
      compare_at_cents: item.product.compare_at_cents,
      stock: item.product.stock,
      delivery_type: item.product.delivery_type,
      active: item.product.active,
      category_id: categoryId,
      image_url: item.product.image_url,
      member_course_ids: [courseId],
      details: item.product.details
    };

    console.log(`Salvando produto no banco da loja (slug: ${item.product.slug})...`);
    const { data: upsertedProduct, error: prodErr } = await storeClient
      .from("products")
      .upsert(productPayload, { onConflict: "slug" })
      .select("id, name, slug, delivery_type, member_course_ids")
      .single();

    if (prodErr) {
      throw new Error(`Erro ao salvar produto ${item.product.slug}: ${prodErr.message}`);
    }
    console.log(`Produto salvo na loja (ID: ${upsertedProduct.id}, member_course_ids: ${JSON.stringify(upsertedProduct.member_course_ids)})`);

    // 4. Sincronizar produto na Área de Membros via Edge Function monparfum-catalog
    console.log("Sincronizando com a área de membros (função monparfum-catalog)...");
    const syncRes = await fetch(`${MEMBERS_URL}/functions/v1/monparfum-catalog`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MEMBERS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product_id: upsertedProduct.id,
        name: upsertedProduct.name,
        active: true,
        course_ids: [courseId]
      })
    });
    const syncJson = await syncRes.json();
    console.log("Resultado da sincronização:", syncJson);
  }

  // 5. Verificação final
  console.log("\n=== VERIFICAÇÃO FINAL ===");
  const listCatalogRes = await fetch(`${MEMBERS_URL}/functions/v1/monparfum-catalog`, {
    headers: { "Authorization": `Bearer ${MEMBERS_TOKEN}`, "Content-Type": "application/json" }
  });
  const finalCatalog = await listCatalogRes.json();
  console.log("Cursos listados pela API da área de membros:", finalCatalog.courses?.length, "cursos disponíveis.");
  finalCatalog.courses?.forEach(c => console.log(` - [${c.id}] ${c.name} (${c.status})`));

  console.log("\n=== CONCLUÍDO COM SUCESSO! ===");
}

main().catch(err => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
