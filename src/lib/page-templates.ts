// Templates prontos para o Studio — seleção rápida ao criar página.

export type TemplateBlock = {
  type: string;
  content: Record<string, unknown>;
};

export type PageTemplate = {
  id: string;
  label: string;
  description: string;
  eyebrow: string;
  blocks: TemplateBlock[];
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "blank",
    label: "Em branco",
    eyebrow: "Vazio",
    description: "Comece do zero e adicione blocos manualmente.",
    blocks: [],
  },
  {
    id: "ebook",
    label: "Ebook — download com captura",
    eyebrow: "Lead magnet",
    description: "Hero editorial, argumentos, o que você vai aprender, prova social, FAQ e captura por e-mail.",
    blocks: [
      {
        type: "hero",
        content: {
          eyebrow: "Édition · Ebook gratuito",
          title: "Um guia olfativo para descobrir seu perfume signature.",
          subtitle: "Um ebook autoral da Mon Parfum sobre famílias, notas e o gesto de escolher um perfume que combine com você.",
          ctaLabel: "Receber o ebook",
          ctaHref: "#capturar",
        },
      },
      {
        type: "text",
        content: {
          eyebrow: "Manifesto",
          body: "Escolher um perfume não é sobre tendência. É sobre memória, gesto e presença. Este ebook é um convite para desacelerar e reencontrar a sua assinatura olfativa.",
        },
      },
      {
        type: "text_columns",
        content: {
          eyebrow: "O que você vai encontrar",
          columns: [
            { title: "Famílias olfativas", body: "Um mapa claro entre florais, amadeirados, orientais, cítricos e chipres." },
            { title: "Notas e acordes", body: "Como as notas de saída, coração e fundo constroem uma narrativa olfativa." },
            { title: "Seu perfil", body: "Um exercício sensorial para reconhecer o que combina com sua rotina e temperamento." },
          ],
        },
      },
      {
        type: "quote",
        content: {
          body: "Perfume é a forma mais íntima de escrita.",
          author: "Mon Parfum",
        },
      },
      {
        type: "faq",
        content: {
          eyebrow: "Dúvidas frequentes",
          items: [
            { q: "O ebook é gratuito?", a: "Sim. Basta deixar seu e-mail que enviamos o PDF em instantes." },
            { q: "Preciso ter conhecimento prévio?", a: "Não. É pensado para todos os públicos — do curioso ao apreciador." },
            { q: "Vou receber outros conteúdos?", a: "Sim, uma vez por semana enviamos edições curtas com bastidores e novidades. Você pode cancelar quando quiser." },
          ],
        },
      },
      {
        type: "newsletter",
        content: {
          eyebrow: "Capturar · #capturar",
          title: "Receba o ebook no seu e-mail.",
          body: "Enviamos o PDF em instantes e, quando fizer sentido, convites para experiências e edições exclusivas.",
          ctaLabel: "Quero receber",
        },
      },
    ],
  },
  {
    id: "captura",
    label: "Captura de leads — landing curta",
    eyebrow: "Lead capture",
    description: "Landing enxuta com hero, promessa, benefícios e formulário de captura.",
    blocks: [
      {
        type: "hero",
        content: {
          eyebrow: "Convite",
          title: "Entre para a lista Mon Parfum.",
          subtitle: "Edições, convites, pré-vendas e bastidores da maison — antes de qualquer outro canal.",
          ctaLabel: "Fazer parte",
          ctaHref: "#capturar",
        },
      },
      {
        type: "text_columns",
        content: {
          eyebrow: "Por que assinar",
          columns: [
            { title: "Pré-venda", body: "Acesso antecipado às edições limitadas antes de irem ao público." },
            { title: "Convites", body: "Experiências privadas, workshops e encontros com nossos perfumistas." },
            { title: "Bastidores", body: "Histórias, matérias e cartas editoriais direto no seu e-mail." },
          ],
        },
      },
      {
        type: "newsletter",
        content: {
          eyebrow: "Capturar · #capturar",
          title: "Deixe seu e-mail.",
          body: "Um envio por semana, no máximo. Sem ruído.",
          ctaLabel: "Entrar na lista",
        },
      },
    ],
  },
  {
    id: "curso",
    label: "Curso — landing de vendas",
    eyebrow: "Educação",
    description: "Landing completa com hero, módulos, prova, FAQ e CTA final.",
    blocks: [
      {
        type: "hero",
        content: {
          eyebrow: "Le Cours",
          title: "Perfumaria autoral — a formação Mon Parfum.",
          subtitle: "Um curso imersivo sobre construção olfativa, matérias-primas e narrativa. Do gesto criativo ao frasco final.",
          ctaLabel: "Inscrever-se",
          ctaHref: "#inscrever",
        },
      },
      {
        type: "text",
        content: {
          eyebrow: "Convite",
          body: "Uma jornada de doze semanas com aulas ao vivo, sessões práticas em ateliê e mentoria olfativa individual. Turmas reduzidas para uma escuta próxima.",
        },
      },
      {
        type: "cards_list",
        content: {
          eyebrow: "Módulos",
          items: [
            { title: "01 · Matérias", body: "Naturais, sintéticos, absolutos e a arquitetura das notas." },
            { title: "02 · Famílias", body: "Florais, chipres, amadeirados, orientais e suas variações contemporâneas." },
            { title: "03 · Construção", body: "Como desenhar um acorde a partir de uma ideia ou memória." },
            { title: "04 · Ateliê", body: "Aulas práticas de mistura, dosagem e maturação." },
            { title: "05 · Narrativa", body: "Como nomear, embalar e apresentar uma edição." },
            { title: "06 · Projeto final", body: "Sua primeira composição autoral, com mentoria dedicada." },
          ],
        },
      },
      {
        type: "quote",
        content: {
          body: "Sair do curso com uma composição sua, no seu frasco, é o gesto que mais lembramos.",
          author: "Alunos, Édition 2024",
        },
      },
      {
        type: "faq",
        content: {
          eyebrow: "Perguntas frequentes",
          items: [
            { q: "Preciso de experiência?", a: "Não. O curso acolhe iniciantes e aprofunda para quem já tem prática." },
            { q: "É presencial?", a: "Aulas teóricas online ao vivo, encontros práticos no ateliê em São Paulo." },
            { q: "Quantas vagas?", a: "Turmas de até 12 pessoas para garantir mentoria próxima." },
          ],
        },
      },
      {
        type: "cta",
        content: {
          eyebrow: "L'Inscription · #inscrever",
          title: "Faça parte da próxima Édition.",
          body: "As inscrições abrem duas vezes por ano e as vagas são limitadas.",
          ctaLabel: "Inscrever-se",
          ctaHref: "#inscrever",
        },
      },
    ],
  },
  {
    id: "experiencia",
    label: "Experiência / Workshop",
    eyebrow: "Evento",
    description: "Landing para vender uma experiência, workshop ou encontro presencial.",
    blocks: [
      {
        type: "hero",
        content: {
          eyebrow: "Rendez-vous",
          title: "Uma tarde na maison Mon Parfum.",
          subtitle: "Uma experiência sensorial guiada por nossos perfumistas, entre matérias-primas, chás e conversa.",
          ctaLabel: "Reservar lugar",
          ctaHref: "#reservar",
        },
      },
      {
        type: "image_text",
        content: {
          eyebrow: "O gesto",
          title: "Três horas de atenção total ao olfato.",
          body: "Recebemos até dez convidados por sessão. Você vai passar pelas famílias olfativas, provar acordes autorais e construir um pequeno frasco para levar.",
        },
      },
      {
        type: "text_columns",
        content: {
          eyebrow: "O que está incluso",
          columns: [
            { title: "Guia olfativa", body: "Sessão guiada por um perfumista Mon Parfum." },
            { title: "Frasco autoral", body: "Um mini-frasco 10ml com a composição que você construir." },
            { title: "Chá e petiscos", body: "Curadoria autoral servida durante a experiência." },
          ],
        },
      },
      {
        type: "cta",
        content: {
          eyebrow: "Réserver · #reservar",
          title: "Escolha sua data.",
          body: "Encontros mensais, aos sábados, em nosso ateliê editorial.",
          ctaLabel: "Reservar lugar",
          ctaHref: "#reservar",
        },
      },
    ],
  },
];
