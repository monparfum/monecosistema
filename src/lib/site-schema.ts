// Mapa do conteúdo editável do site. Cada página lista seus campos com o texto padrão (cópia aprovada).
// O Estúdio (/studio/paginas) grava só o que foi alterado em public.site_content; o site junta com estes padrões.
// Textos longos: linha em branco separa parágrafos; **assim** fica em negrito.

export type SubField = { key: string; label: string; type: "text" | "textarea" };
export type Field =
  | { key: string; label: string; type: "text" | "textarea" | "image"; default: string; help?: string }
  | { key: string; label: string; type: "courses"; default: string; help?: string }
  | { key: string; label: string; type: "list"; fields: SubField[]; default: Record<string, string>[]; help?: string };
export type Section = { title: string; fields: Field[] };
export type PageDef = { slug: string; title: string; path: string; sections: Section[] };

const t = (key: string, label: string, def: string, help?: string): Field => ({ key, label, type: "text", default: def, help });
const ta = (key: string, label: string, def: string, help?: string): Field => ({ key, label, type: "textarea", default: def, help });
const img = (key: string, label: string, help?: string, def = ""): Field => ({ key, label, type: "image", default: def, help });
const steps = (key: string, label: string, def: [string, string][]): Field => ({
  key, label, type: "list", fields: [{ key: "titulo", label: "Título", type: "text" }, { key: "texto", label: "Texto", type: "textarea" }],
  default: def.map(([titulo, texto]) => ({ titulo, texto })),
});
const items = (key: string, label: string, def: string[]): Field => ({
  key, label, type: "list", fields: [{ key: "texto", label: "Item", type: "textarea" }], default: def.map((texto) => ({ texto })),
});
const faq = (key: string, label: string, def: [string, string][]): Field => ({
  key, label, type: "list", fields: [{ key: "pergunta", label: "Pergunta", type: "text" }, { key: "resposta", label: "Resposta", type: "textarea" }],
  default: def.map(([pergunta, resposta]) => ({ pergunta, resposta })),
});

export const SITE_PAGES: PageDef[] = [
  {
    slug: "geral", title: "Geral (contato, rodapé)", path: "/",
    sections: [
      { title: "Empresa e contato", fields: [
        t("empresa", "Nome da empresa", "MON PARFUM Experiência Olfativa"),
        t("cnpj", "CNPJ", "43.958.026/0001-50"),
        t("endereco", "Endereço", "Shopping Trindade — Rua Lauro Linhares, 2123, sala 603, Torre B — Trindade"),
        t("cidade", "Cidade / CEP", "Florianópolis/SC — CEP 88036-003"),
        t("whatsapp", "WhatsApp (como aparece)", "(48) 98486-5885"),
        t("whatsapp_numero", "WhatsApp (só números, com DDI)", "5548984865885", "Usado nos botões de WhatsApp. Ex.: 5548984865885"),
        t("email", "E-mail de contato", "", "Vazio = não aparece no site"),
        ta("horarios", "Horário de atendimento", "Terça a sexta: 9h às 18h\nSábado: 9h às 17h\nDomingo e segunda: fechado", "Uma linha por horário"),
      ] },
      { title: "Redes sociais", fields: [
        t("instagram", "Instagram (link)", ""), t("youtube", "YouTube (link)", ""), t("tiktok", "TikTok (link)", ""),
      ] },
      { title: "Rodapé", fields: [
        t("news_titulo", "Newsletter — título", "Receba conteúdos sobre perfumaria"),
        t("news_texto", "Newsletter — texto", "Matérias-primas, técnica e novas turmas. Sem spam."),
      ] },
    ],
  },
  {
    slug: "home", title: "Home", path: "/",
    sections: [
      { title: "Banner de abertura (tela cheia)", fields: [
        img("hero_foto", "Imagem do banner", "Foto horizontal, mínimo 1600×900. O título fica sobre ela, embaixo à esquerda. Sem foto, o site usa a foto padrão da aluna com o kit em casa (com versão para celular)."),
        t("hero_kick", "Rótulo pequeno acima do título", "Escola e atelier de perfumaria", "Aparece entre colchetes: [ ESCOLA E ATELIER DE PERFUMARIA ]"),
        ta("hero_titulo", "Título sobre a imagem", "Crie o seu perfume.\nEm casa, com método.", "Cada linha vira uma linha do título"),
      ] },
      { title: "Nossa missão (logo abaixo do banner)", fields: [
        ta("hero_texto", "Texto da missão", "Matérias-primas na sua casa, aulas com perfumistas experientes, e no final — uma fórmula que é só sua."),
        ta("citacao", "Citação", "\"A perfumaria é um universo de memória, identidade e criação. A MON existe para transformar a curiosidade de quem ama perfume em conhecimento real — com matéria-prima na mão e método na prática.\""),
        t("citacao_autor", "Autoria da citação", "**Daniela Bitelo** e **Letícia Zelaquett** — Fundadoras da MON PARFUM"),
      ] },
      { title: "Faixa do quiz", fields: [
        t("quiz_titulo", "Título", "Qual é o seu momento na perfumaria?"),
        t("quiz_texto", "Texto", "Descubra por onde começar e receba uma recomendação personalizada da MON."),
      ] },
      { title: "Manifesto", fields: [
        t("manifesto_titulo", "Título", "Ler sobre perfume não é sentir perfume"),
        ta("manifesto_texto", "Texto", "Você já leu sobre topo, coração e fundo. Já imaginou como seria misturar.\n\nMas a perfumaria mora no instante em que você cheira a matéria-prima pela primeira vez, erra a diluição e descobre — no silêncio entre um Sambac e um Grandiflorum — que seu nariz sabe mais do que você pensava.\n\nOlfato não se aprende. Se desperta.\n\nNa MON, tudo vem com matéria-prima — a sua bancada no conforto do seu endereço."),
        img("manifesto_foto", "Foto ao lado do manifesto", "Sem foto, o site usa a imagem padrão (manifesto.jpg)."),
      ] },
      { title: "Como a Jornada acontece", fields: [
        t("jornada_titulo", "Título", "Como a Jornada acontece"),
        steps("jornada", "Passos", [["Escolha onde entrar", "Cada nariz tem seu ponto de partida."], ["O kit chega primeiro", "Matérias-primas, fitas, frascos — tudo na sua porta antes da primeira aula."], ["Nariz na bancada", "Daniela Bitelo e perfumistas convidadas. Ao vivo ou gravado, no seu ritmo."], ["A fórmula é sua", "Toda Jornada MON termina com uma criação autoral. Registrada e pronta para evoluir."]]),
      ] },
      { title: "Cursos em destaque", fields: [
        t("destaques_titulo", "Título", "Cursos em destaque"), t("destaques_texto", "Subtítulo", "Os mais procurados"),
        { key: "destaques_cursos", label: "Cursos exibidos", type: "courses", default: "", help: "Marque os cursos na ordem em que devem aparecer. Sem nenhum marcado, entram os 3 primeiros com “Destaque na home” no cadastro do produto." },
      ] },
      { title: "Kit MON", fields: [
        t("kit_titulo", "Título", "Antes de estudar, crie"),
        ta("kit_texto", "Texto", "O Kit MON é a forma mais direta de sentir o que é criar um perfume.\n\nChega na sua casa com matérias-primas, vídeo-guia e tudo para compor. No final — um perfume seu, envasado, com o nome que você deu."),
        img("kit_foto", "Foto do Kit MON aberto", undefined, "/img/kit.webp"),
      ] },
      { title: "Fundadoras", fields: [
        t("fundadoras_titulo", "Título", "As mentes brilhantes por trás da MON"),
        ta("fundadoras_texto", "Texto", "**Daniela Bitelo** — perfumista, fundadora. ISIPCA (Versailles), International Perfume Foundation (Paris). Cria fragrâncias e forma perfumistas há mais de uma década. Cada Jornada MON passa pelas mãos dela.\n\n**Letícia Netto Zelaquett** — sócia, comercial. Formação em saúde, especialista em perfumaria e neurociência do olfato. Na MON, é a ponte entre a ciência e o que você sente."),
        img("fundadoras_foto", "Foto de Daniela na bancada", undefined, "/img/fundadoras.webp"),
      ] },
      { title: "Depoimentos", fields: [
        { key: "depoimentos", label: "Depoimentos de alunos", type: "list", help: "Sem depoimentos, a seção fica escondida",
          fields: [{ key: "texto", label: "Depoimento", type: "textarea" }, { key: "nome", label: "Nome — Cidade/UF", type: "text" }, { key: "curso", label: "Curso · turma", type: "text" }], default: [] },
      ] },
      { title: "MON Club e fechamento", fields: [
        t("club_titulo", "MON Club — título", "Depois do curso, a criação continua"),
        ta("club_texto", "MON Club — texto", "Você entra no MON Club.\n\nNo MON Club, você nunca cria sozinho. Fórmulas, dúvidas, descobertas — compartilhadas com quem percorreu o mesmo caminho."),
        t("final_titulo", "Fechamento — título", "Crie. Sinta. Assine."),
        t("final_texto", "Fechamento — texto", "Curso ou kit. Matérias-primas na sua casa. Sua fórmula, sua assinatura."),
      ] },
    ],
  },
  {
    slug: "cursos", title: "Cursos (lista)", path: "/cursos",
    sections: [
      { title: "Abertura", fields: [
        t("titulo", "Título", "Um curso para cada momento do seu nariz"),
        t("subtitulo", "Subtítulo", "Da primeira matéria-prima à fórmula autoral. Todo curso inclui kit enviado à sua casa."),
        ta("texto", "Texto", "Cursos para todos os momentos — do primeiro contato com matérias-primas à prática profissional. Kit de matérias-primas, aulas ao vivo ou gravadas, e no final: uma fórmula que é sua."),
      ] },
      { title: "O que vem no kit", fields: [
        t("kit_titulo", "Título", "O que vem no seu kit"),
        t("kit_texto", "Texto", "O kit é o coração da Jornada MON. Ele chega na sua casa antes da primeira aula."),
        items("kit_itens", "Itens", ["**Matérias-primas olfativas** — óleos essenciais e moléculas sintéticas selecionados para o curso", "**Acordes MON** — composições de referência para você comparar e estudar", "**Fitas olfativas e porta-fitas**", "**Frascos de ensaio, cânulas e material de bancada**", "**Material didático** — folder técnico e apostila em PDF"]),
        img("kit_foto", "Foto do kit aberto", undefined, "/img/kit.webp"),
      ] },
      { title: "Incluído em todo curso", fields: [
        t("incluso_titulo", "Título", "O que está incluído em todo curso"),
        items("incluso", "Itens", ["**Kit físico** — enviado para todo o Brasil antes do início", "**Aulas** — ao vivo ou gravadas, com acesso na plataforma", "**Gravação** — as aulas ficam disponíveis na plataforma", "**Material didático** — apostila em PDF e folder técnico", "**Criação autoral** — toda formação termina com uma fórmula sua", "**Certificado** — certificado de conclusão emitido pela MON PARFUM", "**MON Club** — acesso à comunidade de alunos após a conclusão"]),
        ta("incluso_nota", "Destaque", "**Depois do curso, você não fica sozinho.** Todo concluinte entra no MON Club — o espaço onde alunos e ex-alunos trocam fórmulas, tiram dúvidas técnicas e continuam evoluindo."),
      ] },
      { title: "Perguntas frequentes", fields: [
        t("faq_titulo", "Título", "Perguntas de quem está decidindo"),
        faq("faq", "Perguntas", [
          ["Preciso ter experiência anterior?", "Não. A Introdução à Perfumaria foi feita para quem começa do zero. Alguns cursos pedem base prévia — indicamos em cada página. Se estiver em dúvida, faça o quiz e receba uma orientação personalizada."],
          ["Qual a diferença entre um curso e um Kit MON?", "O Kit MON é uma experiência de criação: você recebe as matérias-primas de um território, segue um vídeo-guia e sai com um perfume seu. O curso é formação: você aprende o método por trás disso, com aula, orientação e certificado — e passa a criar sozinho, quantas vezes quiser."],
          ["O curso é 100% online?", "Depende do curso. Temos formações totalmente online e ao vivo, cursos gravados e encontros presenciais em Florianópolis. Use o filtro de formato para ver só o que cabe na sua rotina."],
          ["Posso fazer só a parte online, sem o kit?", "Não. O kit é parte pedagógica obrigatória da Jornada MON. Sem matéria-prima na mão, o aprendizado não acontece."],
          ["Recebo certificado?", "Sim, certificado de conclusão emitido pela MON PARFUM. É um certificado de curso livre — a MON não é uma instituição de ensino credenciada pelo MEC e não emite diploma técnico ou superior."],
          ["O que significa a nota de cada curso?", "É a média das avaliações preenchidas pelos alunos ao final de cada turma. Publicamos a nota mesmo quando ela não é perfeita — é assim que a gente melhora."],
          ["Vou conseguir vender perfumes depois?", "Os cursos dão a base técnica para criar. Para comercializar perfumes no Brasil existem exigências sanitárias e regulatórias específicas, tratadas no curso de Regulamentação da Perfumaria Artesanal."],
        ]),
      ] },
      { title: "Página de cada curso (comum a todos)", fields: [
        items("como_funciona", "Como funciona", ["**Kit** — você recebe em casa, antes da primeira aula, as matérias-primas deste curso", "**Aulas** — acesso pela área do aluno MON, com gravação disponível", "**Certificado** — certificado de conclusão MON PARFUM", "**Depois** — acesso ao MON Club"]),
        ta("aviso_vagas", "Aviso de vagas", "Vagas limitadas pelo tamanho da turma. As inscrições encerram com antecedência para garantir que seu kit chegue antes da primeira aula."),
      ] },
    ],
  },
  {
    slug: "produtos", title: "Produtos (lista)", path: "/produtos",
    sections: [
      { title: "Abertura", fields: [
        t("titulo", "Título", "Nossos produtos"),
        ta("subtitulo", "Subtítulo", "Kits de criação, kits de treinamento olfativo e fragrâncias autorais — tudo o que a MON cria, enviado para a sua casa."),
      ] },
      { title: "Grupos", fields: [
        t("criacao_titulo", "Kits de criação — título", "Kits de criação"),
        ta("criacao_texto", "Kits de criação — texto", "O kit é o coração da experiência MON. Chega no conforto do seu endereço com tudo o que você precisa para compor seu próprio perfume."),
        t("treino_titulo", "Treinamento — título", "Kits de treinamento olfativo"),
        ta("treino_texto", "Treinamento — texto", "Cada kit foi desenvolvido com método para ampliar seu repertório olfativo — reconhecendo, comparando e memorizando matérias-primas essenciais para quem ama perfumes."),
        t("limitada_titulo", "Edições limitadas — título", "Edições limitadas"),
        ta("limitada_texto", "Edições limitadas — texto", "Duas criações autorais da MON PARFUM. Cada uma com personalidade própria — e juntas, uma terceira: a Alquimia."),
        t("limitada_nota", "Edições limitadas — observação", "Edições limitadas são produzidas uma única vez. Quando acabam, não voltam."),
        t("outros_titulo", "Outros produtos — título", "Outros produtos"),
      ] },
      { title: "Página de cada kit de criação", fields: [
        items("kit_itens", "No kit você recebe", ["Matérias-primas olfativas do território", "Fitas olfativas e porta-fita", "Frascos de ensaio e frasco final", "Cânulas e material de bancada", "Acesso ao vídeo-guia MON", "Etiqueta para nomear sua criação"]),
        t("kit_assinatura", "Assinatura", "Criado por Daniela Bitelo, perfumista formada pelo ISIPCA — Versailles."),
      ] },
    ],
  },
  {
    slug: "experiencias", title: "Experiências (Kits MON)", path: "/experiencias",
    sections: [
      { title: "Abertura", fields: [
        t("titulo", "Título", "Sinta, crie, descubra."),
        ta("subtitulo", "Subtítulo", "Experiências de criação que colocam a perfumaria nas suas mãos. Escolha seu território, receba o kit em casa e componha seu próprio perfume."),
        t("secao_titulo", "Seção — título", "Experiências de criação"),
        ta("secao_texto", "Seção — texto", "Kits completos para criar seu próprio perfume em casa. Você escolhe o território, recebe tudo e compõe acompanhando o vídeo-guia."),
      ] },
      { title: "Kit e funcionamento", fields: [
        items("kit_itens", "O que vem no kit", ["Matérias-primas olfativas do seu território", "Fitas olfativas e porta-fita", "Frascos de ensaio e frasco final do seu perfume", "Cânulas e material de bancada", "Acesso ao vídeo-guia MON", "Etiqueta para você nomear sua criação"]),
        items("passos", "Como funciona (passos)", ["Escolha seu território e finalize a compra", "O kit chega na sua casa — enviamos para todo o Brasil", "Você recebe por e-mail o acesso ao vídeo-guia", "Separe uma mesa, um horário e siga o vídeo no seu ritmo", "Componha, envase e dê nome ao seu perfume"]),
        t("passos_nota", "Observação", "**Não tem prazo, não tem turma, não tem horário.** Você abre quando quiser."),
      ] },
      { title: "Perguntas frequentes", fields: [
        faq("faq", "Perguntas", [
          ["Preciso entender de perfumaria?", "Não. O vídeo-guia conduz você do zero, etapa por etapa. Se você nunca cheirou uma matéria-prima isolada na vida, o kit foi feito exatamente para isso."],
          ["Quanto tempo leva?", "Você faz no seu ritmo — pode pausar, repetir e voltar outro dia."],
          ["Posso presentear alguém?", "Sim. O kit é presente completo: a pessoa recebe em casa e vive a experiência quando quiser."],
          ["Qual a diferença entre o kit e um curso MON?", "O kit entrega a experiência de criar um perfume. O curso ensina o método por trás disso — com aula, orientação de perfumista, certificado e repertório construído para você criar sozinho, quantas vezes quiser."],
          ["Posso comprar mais de um território?", "Pode. Cada território trabalha matérias-primas diferentes, então são experiências distintas."],
        ]),
      ] },
      { title: "Fechamento", fields: [
        t("jornada_titulo", "Título", "O kit desperta. A Jornada aprofunda."),
        ta("jornada_texto", "Texto", "O kit mostra como um perfume nasce. A Jornada ensina a criar — com método, com autonomia, quantas vezes quiser."),
        ta("prive_texto", "Chamada do Atelier Privé", "Poucas vezes por ano, Daniela Bitelo conduz pessoalmente uma sessão privada de criação no Atelier MON, em Florianópolis.\n\nSão horas na mesa completa de matérias-primas da MON, com orientação individual de uma perfumista formada pelo ISIPCA — Versailles. Não é o kit, não é curso, não é workshop."),
      ] },
    ],
  },
  {
    slug: "atelier", title: "Atelier Privé", path: "/atelier-prive",
    sections: [
      { title: "Conteúdo", fields: [
        t("titulo", "Título", "Atelier Privé"),
        t("subtitulo", "Subtítulo", "Uma tarde. Uma bancada. Daniela Bitelo ao seu lado."),
        ta("intro", "Introdução", "O Atelier Privé é a forma mais íntima de viver a perfumaria na MON — criar ao lado da fundadora, com acesso à mesa completa de matérias-primas do Atelier.\n\nNão é kit. Não é curso. É uma sessão individual com uma perfumista formada pelo ISIPCA, em Versailles — a mesma pessoa que desenvolve as fragrâncias da MON e forma perfumistas no Brasil há mais de uma década."),
        img("foto", "Foto do Atelier", undefined, "/img/atelier.webp"),
        ta("acontece", "O que acontece", "Você trabalha na mesa completa de matérias-primas do Atelier MON — muito além do que cabe em qualquer kit. Cheira, compara, erra e ajusta com orientação individual, matéria-prima por matéria-prima.\n\nDaniela conduz a construção da sua fórmula do começo ao fim. Você sai com seu perfume envasado, nomeado por você, e com a fórmula registrada para poder retomar."),
        ta("agenda", "Por que a agenda é restrita", "A condução é feita pessoalmente por Daniela e não é delegada. Isso limita naturalmente o número de sessões disponíveis a cada trimestre.\n\nNão trabalhamos com calendário aberto. Cada sessão é agendada individualmente, conforme a disponibilidade."),
        t("investimento", "Investimento (valor)", "Sob consulta", "Ex.: A partir de R$ 1.800 por sessão"),
        ta("investimento_texto", "Investimento (o que inclui)", "Inclui a condução individual, acesso integral à mesa de matérias-primas do Atelier, o frasco do seu perfume e o registro da sua fórmula."),
        t("prazo_resposta", "Prazo de resposta", "Retornamos em até 2 dias úteis."),
      ] },
    ],
  },
  {
    slug: "corporativo", title: "Corporativo", path: "/corporativo",
    sections: [
      { title: "Abertura", fields: [
        t("titulo", "Título", "O perfume fica. A memória, também."),
        ta("subtitulo", "Subtítulo", "Cada participante cria e leva o próprio perfume. Meses depois, o frasco ainda está na mesa — e o que viveram juntos, na memória."),
        ta("texto", "Texto", "O Atelier MON Corporativo é um workshop de criação de perfumes para empresas, conduzido por perfumistas da MON PARFUM. Cada participante compõe e envasa sua própria fragrância durante a atividade. A MON leva estrutura completa de bancada, matérias-primas e materiais para eventos em todo o Brasil.\n\n**Cada evento é único.** Os acordes olfativos são desenvolvidos exclusivamente para cada experiência — não repetimos formatos nem reutilizamos composições. A curadoria de matérias-primas é feita sob medida para o briefing, o público e o contexto de cada empresa."),
        img("foto", "Foto de evento corporativo", undefined, "/img/corporativo.webp"),
      ] },
      { title: "Clientes", fields: [
        items("clientes", "Empresas atendidas", ["Porto Seguro", "McLaren", "Boon Saúde", "Hypera", "Rede Múltipla", "MERS"]),
        { key: "depoimentos", label: "Depoimentos de empresas (com autorização)", type: "list", help: "Sem depoimentos, a seção fica escondida",
          fields: [{ key: "texto", label: "Depoimento", type: "textarea" }, { key: "nome", label: "Nome, cargo — Empresa", type: "text" }], default: [] },
      ] },
      { title: "Conteúdo", fields: [
        ta("olfato", "Por que o olfato cria memórias", "O olfato é o único sentido com ligação direta ao sistema límbico — a região do cérebro responsável por emoção e memória. Um cheiro é capaz de trazer de volta uma lembrança inteira em um segundo.\n\nÉ por isso que uma experiência olfativa permanece. Meses depois do evento, o frasco ainda está ali. E a memória do momento que o criou, também."),
        { key: "formatos", label: "Formatos disponíveis", type: "list", fields: [{ key: "titulo", label: "Formato", type: "text" }, { key: "texto", label: "Descrição", type: "textarea" }, { key: "indicado", label: "Indicado para", type: "text" }],
          default: [
            { titulo: "Team Building Sensorial", texto: "Dinâmica de criação coletiva. A equipe trabalha territórios olfativos em grupo e cada pessoa finaliza sua fragrância. Fortalece vínculo e cria repertório comum.", indicado: "integração de times, kickoff, offsite" },
            { titulo: "Ativação de Marca", texto: "Construímos a assinatura olfativa da sua marca e a colocamos na mão do público. Cada participante leva um frasco que carrega o território da marca.", indicado: "lançamentos, feiras, ações com clientes" },
            { titulo: "Momento de Descompressão", texto: "Experiência mais lenta, focada em pausa e presença. Menos dinâmica, mais imersão.", indicado: "convenções longas, semanas internas, ações de bem-estar" },
            { titulo: "Celebração e Premiação", texto: "Formato de reconhecimento. O perfume vira o presente — feito pela própria pessoa homenageada.", indicado: "confraternizações, premiações, datas comemorativas" },
          ] },
        steps("passos", "Como funciona", [["Briefing", "Objetivo, público, número de participantes e contexto do evento."], ["Proposta", "Formato, investimento e requisitos de espaço."], ["Curadoria", "Selecionamos os territórios de matéria-prima conforme o objetivo."], ["Execução", "Levamos bancada, matérias-primas, frascos e materiais."], ["Entrega", "Cada participante sai com seu perfume envasado e nomeado."]]),
        items("leva", "O que a MON leva", ["Perfumista responsável pela condução da atividade", "Mesa de matérias-primas com acordes MON", "Frascos, fitas olfativas, cânulas e porta-fitas", "Etiquetas personalizáveis com a marca do cliente", "Estrutura de bancada completa"]),
        t("prazo_resposta", "Prazo de resposta", "Retornamos em até 1 dia útil com briefing e proposta."),
      ] },
      { title: "Perguntas frequentes", fields: [
        faq("faq", "Perguntas", [
          ["Vocês atendem eventos fora de Florianópolis?", "Sim. Atendemos em todo o Brasil. Já realizamos experiências para empresas como Porto Seguro, McLaren, Hypera e Boon Saúde em diferentes cidades."],
          ["Vocês emitem nota fiscal?", "Sim. A MON PARFUM emite nota fiscal — CNPJ 43.958.026/0001-50."],
        ]),
      ] },
    ],
  },
  {
    slug: "club", title: "MON Club", path: "/mon-club",
    sections: [
      { title: "Conteúdo", fields: [
        t("titulo", "Título", "MON Club"),
        ta("subtitulo", "Subtítulo", "Perfumaria é uma prática solitária quando ninguém ao seu redor entende do que você está falando. Aqui, todo mundo entende."),
        ta("texto", "Texto", "O MON Club é a comunidade de continuidade da MON PARFUM. É onde alunos e ex-alunos trocam fórmulas, tiram dúvidas técnicas, comparam resultados e continuam evoluindo depois que o curso termina."),
        steps("dentro", "O que acontece lá dentro", [["Trocas técnicas", "Sua diluição turvou? Seu acorde não fecha? Pergunte para quem já passou por isso."], ["Encontros ao vivo", "Sessões periódicas com Daniela Bitelo e perfumistas convidadas."], ["Biblioteca de conteúdo", "Materiais, referências e conteúdos que não cabem em um curso específico."], ["Primeiro acesso", "Novas turmas, novos kits e novidades chegam antes aqui."]]),
        ta("porque", "Por que o Club existe", "Um curso termina. A prática não.\n\nO momento mais difícil de quem estuda perfumaria não é durante o curso — é depois. Quando você está sozinho na bancada, a fórmula não fecha e não tem para quem perguntar.\n\nO MON Club existe para esse momento."),
        ta("participar", "Como participar", "O acesso ao MON Club é liberado para todo aluno que conclui um curso da MON PARFUM. Não há custo adicional."),
      ] },
    ],
  },
  {
    slug: "sobre", title: "Sobre", path: "/sobre",
    sections: [
      { title: "A MON", fields: [
        t("titulo", "Título", "A MON PARFUM"),
        ta("intro", "Introdução", "A MON PARFUM é uma plataforma brasileira de formação em perfumaria autoral, sediada em Florianópolis (SC) e com atuação nacional. Fundada pela perfumista Daniela Bitelo, a MON leva pessoas do primeiro contato com uma matéria-prima até a prática profissional — por meio de cursos com kit enviado ao aluno, experiências de criação em casa e workshops corporativos."),
        ta("porque", "Por que a MON existe", "Perfumaria no Brasil é um universo fechado. O conhecimento técnico circula dentro de laboratórios de grandes casas, em francês ou inglês, atrás de barreiras de acesso que quase ninguém atravessa.\n\nQuem quer aprender encontra dois extremos: vídeo raso de internet ou formação internacional cara e distante.\n\nA MON existe para ocupar o espaço entre os dois. Formação séria, em português, com matéria-prima na mão, conduzida por quem se formou na fonte."),
      ] },
      { title: "Daniela Bitelo", fields: [
        t("daniela_cargo", "Cargo", "Perfumista · Fundadora · Responsável técnica"),
        ta("daniela_texto", "Texto", "Formou-se no ISIPCA, em Versailles (França) — instituição fundada em 1970 e reconhecida como principal referência mundial na formação de perfumistas — e pela International Perfume Foundation, em Paris.\n\nCria fragrâncias, conduz Jornadas e orienta cada aluno pessoalmente. Assina os projetos olfativos corporativos da MON."),
        img("daniela_foto", "Foto", undefined, "/img/daniela.webp"),
      ] },
      { title: "Letícia Netto Zelaquett", fields: [
        t("leticia_cargo", "Cargo", "Sócia · Comercial · Neurociência do olfato"),
        ta("leticia_texto", "Texto", "Com formação em saúde e especialização em perfumaria, estuda a neurociência do olfato — como o cérebro processa, memoriza e responde emocionalmente às fragrâncias.\n\nResponsável pelo comercial. Traduz a ciência do olfato em experiências que conectam perfumaria a pessoas e empresas."),
        img("leticia_foto", "Foto", undefined, "/img/leticia.webp"),
      ] },
      { title: "Método e números", fields: [
        steps("metodo", "Nosso método", [["Cheirar antes de nomear", "Repertório se constrói com exposição, não com definição decorada."], ["Erro guiado", "Acorde que não fecha, diluição que turva. Errar com orientação vale mais do que acertar por acaso."], ["Criação autoral desde o primeiro contato", "Nada na MON termina sem uma criação sua. Não reproduzimos fórmulas — ensinamos a construir."]]),
        t("nota_media", "Nota média dos alunos", "9,4"),
        t("nota_texto", "Legenda da nota", "Média das avaliações dos alunos", "Ex.: Média de 312 avaliações"),
      ] },
    ],
  },
  {
    slug: "conteudos", title: "Perguntas frequentes e contato", path: "/conteudos",
    sections: [
      { title: "Perguntas frequentes", fields: [
        faq("faq", "Perguntas", [
          ["O que é a MON PARFUM?", "A MON PARFUM é uma plataforma brasileira de formação e experiência em perfumaria autoral, fundada pela perfumista Daniela Bitelo. Oferecemos cursos com kit de matérias-primas enviado à casa do aluno, experiências de criação de perfumes e workshops corporativos em todo o Brasil."],
          ["A MON é uma escola de perfumaria?", "A MON é uma plataforma de formação em perfumaria e oferece cursos livres. Não somos uma instituição de ensino credenciada pelo MEC e não emitimos diploma técnico ou superior. Emitimos certificado de conclusão MON PARFUM em todos os cursos."],
          ["Quem é a responsável técnica?", "Daniela Bitelo, perfumista formada pelo ISIPCA (Versailles, França) e pela International Perfume Foundation (Paris). Ela conduz as formações, orienta as criações dos alunos e assina os projetos olfativos corporativos."],
          ["Por onde eu começo?", "Se você quer criar um perfume e ver como é, comece por um Kit MON. Se você quer aprender a criar de verdade, comece pela Introdução à Perfumaria. Em dúvida, faça o quiz e veja a recomendação da MON para você."],
          ["O que acontece depois que o curso termina?", "Você entra no MON Club, a comunidade de alunos e ex-alunos da MON. É onde a prática continua: troca de fórmulas, dúvidas técnicas e encontros ao vivo com Daniela Bitelo e perfumistas convidadas."],
          ["O que é edição limitada?", "Nossas edições especiais e limitadas são produzidas em lotes únicos e exclusivos. Quando acabam, não voltam mais ao catálogo."],
          ["Para onde vocês enviam?", "Enviamos para todo o Brasil. O prazo e o valor do frete são calculados no checkout a partir do seu CEP."],
          ["Como faço para agendar o Atelier Privé?", "O Atelier Privé funciona por solicitação, não por compra direta. Preencha o formulário na página do Atelier Privé e retornamos com as datas disponíveis."],
          ["Como falo com a MON?", "Pelo WhatsApp (48) 98486-5885 ou pelo formulário da página de Contato. Atendemos de terça a sexta, das 9h às 18h, e sábados das 9h às 17h."],
        ]),
      ] },
    ],
  },
  {
    slug: "politicas", title: "Políticas (privacidade, termos, trocas, entrega)", path: "/politicas/privacidade",
    sections: [
      { title: "Textos legais", fields: [
        ta("privacidade", "Política de Privacidade", "", "Vazio = usa o texto-base. Use “## Título” para subtítulos"),
        ta("termos", "Termos de Uso", "", "Vazio = usa o texto-base"),
        ta("trocas", "Trocas e Devoluções", "", "Vazio = usa o texto-base"),
        ta("entrega", "Política de Entrega", "", "Vazio = usa o texto-base"),
      ] },
    ],
  },
];

export const pageDef = (slug: string) => SITE_PAGES.find((p) => p.slug === slug);

export type ListItem = Record<string, string>;
export type PageValues = Record<string, string | ListItem[]>;

export function defaultsOf(slug: string): PageValues {
  const out: PageValues = {};
  for (const s of pageDef(slug)?.sections ?? []) for (const f of s.fields) out[f.key] = f.default;
  return out;
}
