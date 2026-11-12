/* =====================================================================
   QUIZ DE PERSONALIDADE OLFATIVA — MON PARFUM
   data.js — CONTEÚDO (perguntas, perfis, textos, imagens, cursos)
   ---------------------------------------------------------------------
   Edite este arquivo para mudar textos, fotos e links.
   A lógica fica em quiz.js; o visual, em quiz.css.

   Perfis (quadrantes do material MON Parfum):
     D = Diplomático  (superior esquerdo)
     C = Comunicador  (superior direito)
     S = Sistemático  (inferior esquerdo)
     M = Dominante    (inferior direito)

   Pontuação: Parte 1 (comportamental) = 1 ponto · Parte 2 (olfativa) = 2 pontos
   Total possível = 5×1 + 7×2 = 19 pontos.
   ===================================================================== */
window.MONQ_DATA = (function () {

  /* Pasta das imagens (relativa ao index.html). A versão demonstrativa
     substitui estes caminhos por imagens embutidas. */
  var IMG = "img/";

  var SITE = "https://experienciamon.com.br";

  var PROFILES = {
    D: {
      key: "D", name: "Diplomático", quadrant: "Quadrante superior esquerdo",
      color: "#c48f8a", soft: "#f3e1dd",
      identity: "A delicadeza que aproxima.",
      description: "Você percebe as pessoas antes das palavras. Acolhimento, empatia e harmonia guiam o seu jeito de estar no mundo, e as suas escolhas costumam buscar o que é macio, afetivo e luminoso. Na perfumaria, essa sensibilidade tende a se encontrar com flores, pétalas atalcadas, frutas doces e o conforto do gourmand: fragrâncias que envolvem sem pesar e criam proximidade.",
      families: [
        { name: "Florais", edwards: "Floral" },
        { name: "Florais atalcados", edwards: "Floral suave (Soft Floral)" },
        { name: "Frutados doces", edwards: "Frutado (Fruity)" },
        { name: "Gourmand", edwards: "Sem família própria na roda; a baunilha e as notas doces aparecem entre Âmbar suave e Âmbar" }
      ],
      notes: ["Rosa", "Peônia", "Jasmim", "Violeta", "Pêssego", "Framboesa", "Baunilha", "Heliotrópio"],
      accords: [
        ["Rosa e framboesa", "uma flor luminosa com um contorno frutado e vivo"],
        ["Peônia e pêssego", "frescor rosado, macio como pétala"],
        ["Heliotrópio e baunilha", "um conforto atalcado, levemente amendoado"],
        ["Violeta e íris", "a elegância empoada dos florais atalcados"]
      ],
      secondary: "Sua faceta Diplomática acrescenta maciez e afeto ao seu repertório. Experimente florais atalcados ou um toque de baunilha para arredondar fragrâncias mais estruturadas: eles trazem calor humano sem apagar a sua assinatura principal.",
      courses: ["rosa", "jasmim", "baunilhas"]
    },
    C: {
      key: "C", name: "Comunicador", quadrant: "Quadrante superior direito",
      color: "#c9a93e", soft: "#f4eccd",
      identity: "A luz que conversa com o mundo.",
      description: "Espontaneidade, curiosidade e alegria movem você. Você gosta de trocas, de novidades e de ambientes cheios de luz, e costuma transformar qualquer encontro em conversa. Na perfumaria, essa energia tende a se reconhecer em cítricos, verdes, notas aquáticas e aldeídos luminosos: fragrâncias que abrem o dia, refrescam e se deixam perceber com leveza.",
      families: [
        { name: "Cítricos", edwards: "Cítrico (Citrus)" },
        { name: "Verdes", edwards: "Verde (Green)" },
        { name: "Aquáticos", edwards: "Água (Water)" },
        { name: "Aldeídicos luminosos", edwards: "Floral suave (Soft Floral), onde ficam os aldeídos" },
        { name: "Frutados verdes e ácidos", edwards: "Frutado (Fruity)" }
      ],
      notes: ["Bergamota", "Limão", "Grapefruit", "Maçã verde", "Folhas de violeta", "Aldeídos", "Chá verde", "Notas marinhas"],
      accords: [
        ["Bergamota e chá verde", "um frescor elegante, limpo e luminoso"],
        ["Grapefruit e folhas verdes", "energia ácida, vibrante e solar"],
        ["Maçã verde e aldeídos", "brilho crocante, quase efervescente"],
        ["Limão e notas marinhas", "a sensação de pele ao sol, perto do mar"]
      ],
      secondary: "Sua faceta Comunicadora traz luz e movimento ao seu repertório. Abrir uma composição com bergamota, folhas verdes ou um toque aquático pode deixar fragrâncias densas mais leves e convidativas, ideais para os dias em que você quer frescor.",
      courses: ["neroli", "introducao", "personalidade"]
    },
    S: {
      key: "S", name: "Sistemático", quadrant: "Quadrante inferior esquerdo",
      color: "#7a5a43", soft: "#ece2d8",
      identity: "A profundidade que permanece.",
      description: "Método, atenção aos detalhes e consistência descrevem a forma como você constrói as coisas. Você prefere compreender antes de escolher e valoriza o que tem estrutura e permanece. Na perfumaria, essa profundidade tende a dialogar com madeiras, terra, musgo, couro e facetas animálicas: fragrâncias com corpo, que se revelam aos poucos e deixam um rastro elegante.",
      families: [
        { name: "Amadeirados", edwards: "Madeiras (Woods)" },
        { name: "Terrosos", edwards: "Madeiras (vetiver) e Âmbar amadeirado (patchouli)" },
        { name: "Musgosos", edwards: "Madeiras musgosas (Mossy Woods), a casa dos chipres" },
        { name: "Couro e facetas animálicas", edwards: "Madeiras secas (Dry Woods)" }
      ],
      notes: ["Vetiver", "Cedro", "Sândalo", "Patchouli", "Musgo de carvalho", "Tabaco", "Couro", "Ládano"],
      accords: [
        ["Chipre", "bergamota, ládano, patchouli e musgo de carvalho em contraste"],
        ["Couro e tabaco", "seco, envolvente e cheio de caráter"],
        ["Vetiver e cedro", "terra úmida e madeira limpa, com precisão"],
        ["Sândalo cremoso", "uma madeira macia que acompanha a pele por horas"]
      ],
      secondary: "Sua faceta Sistemática dá estrutura ao seu repertório. Um fundo de vetiver, cedro ou musgo pode ancorar fragrâncias mais leves e fazer com que durem e se revelem por mais tempo, com elegância discreta.",
      courses: ["madeiras", "familias", "personalidade"]
    },
    M: {
      key: "M", name: "Dominante", quadrant: "Quadrante inferior direito",
      color: "#4f6b66", soft: "#dde6e2",
      identity: "A energia que abre caminhos.",
      description: "Iniciativa, determinação e movimento fazem parte de quem você é. Você gosta de agir, de decidir e de estar em contato com a natureza e com desafios. Na perfumaria, essa energia tende a encontrar eco em notas aromáticas e herbais, mentoladas, canforadas e no frescor dos pinheiros: fragrâncias que despertam, trazem clareza e parecem ar de montanha.",
      families: [
        { name: "Aromáticos", edwards: "Aromático, também chamado Fougère (Aromatic)" },
        { name: "Herbais", edwards: "Aromático (Aromatic)" },
        { name: "Mentolados e canforados", edwards: "Facetas do Aromático e do Verde (Green)" },
        { name: "Amadeirados de pinheiro", edwards: "Madeiras (Woods): pinheiro e cipreste" }
      ],
      notes: ["Alecrim", "Lavanda", "Hortelã", "Eucalipto", "Sálvia", "Cipreste", "Pinheiro", "Zimbro"],
      accords: [
        ["Fougère", "lavanda, cumarina e musgo: o clássico das ervas"],
        ["Alecrim e cipreste", "um verde seco, vertical e revigorante"],
        ["Hortelã e eucalipto", "frescor imediato, quase gelado"],
        ["Sálvia e pinheiro", "ervas e resina de floresta em equilíbrio"]
      ],
      secondary: "Sua faceta Dominante acrescenta energia e clareza ao seu repertório. Um toque de alecrim, lavanda ou pinheiro pode dar vigor a composições mais doces ou florais, trazendo a sensação de ar livre.",
      courses: ["familias", "diluicao", "personalidade"]
    }
  };

  var ORDER = ["D", "C", "S", "M"]; // ordem fixa (também usada no último critério de desempate)

  /* ------------------------------------------------------------------
     PERGUNTAS
     part: 1 = comportamental (1 ponto) · 2 = olfativa (2 pontos)
     cada alternativa: { p: perfil, t: texto, img: arquivo (só parte 2) }
     ------------------------------------------------------------------ */
  var QUESTIONS = [
    /* ---------------- PARTE 1 · PERFIL COMPORTAMENTAL ---------------- */
    { id: "q01", part: 1, theme: "Interação social",
      t: "Em um encontro com pessoas que você ainda não conhece, você costuma…",
      o: [
        { p: "D", t: "Perceber quem está menos à vontade e aproximar as pessoas." },
        { p: "C", t: "Puxar assunto e descobrir algo curioso sobre cada um." },
        { p: "S", t: "Observar primeiro e entrar na conversa quando surge um tema que você domina." },
        { p: "M", t: "Propor o próximo plano e colocar o grupo em movimento." }
      ] },
    { id: "q02", part: 1, theme: "Tomada de decisões",
      t: "Diante de uma decisão importante, o que mais pesa para você?",
      o: [
        { p: "D", t: "Como a escolha vai afetar as pessoas envolvidas." },
        { p: "C", t: "A possibilidade de viver algo novo e inspirador." },
        { p: "S", t: "Dados, comparações e consequências a longo prazo." },
        { p: "M", t: "A chance de agir agora e fazer acontecer." }
      ] },
    { id: "q03", part: 1, theme: "Organização e rotina",
      t: "Como é a sua relação com a rotina?",
      o: [
        { p: "D", t: "Gosto de pequenos rituais de conforto, como um café com alguém querido." },
        { p: "C", t: "Prefiro que cada dia seja diferente; o imprevisto me anima." },
        { p: "S", t: "Tenho meus métodos e gosto de saber onde cada coisa está." },
        { p: "M", t: "Organizo o essencial para ganhar tempo e energia para o que importa." }
      ] },
    { id: "q04", part: 1, theme: "Resolução de desafios",
      t: "Quando surge um desafio inesperado, você…",
      o: [
        { p: "D", t: "Procura entender o que cada pessoa precisa para que todos fiquem bem." },
        { p: "C", t: "Improvisa e encontra uma saída criativa." },
        { p: "S", t: "Analisa a situação com calma antes de agir." },
        { p: "M", t: "Assume a frente e resolve, mesmo sob pressão." }
      ] },
    { id: "q05", part: 1, theme: "Experiências e estilo de vida",
      t: "Um dia livre ideal seria…",
      o: [
        { p: "D", t: "Um almoço longo com quem você ama, flores na mesa e boa conversa." },
        { p: "C", t: "Uma cidade nova para explorar, com mercados, música e gente interessante." },
        { p: "S", t: "Uma livraria antiga, um museu ou um bom documentário." },
        { p: "M", t: "Uma trilha, um esporte ao ar livre ou um desafio físico." }
      ] },

    /* ---------------- PARTE 2 · UNIVERSO OLFATIVO ---------------- */
    { id: "q06", part: 2, theme: "Ambientes naturais",
      t: "Em qual destes lugares você gostaria de estar agora?",
      o: [
        { p: "D", t: "Um vilarejo florido ao pôr do sol, entre buganvílias e uma taça de vinho branco.", img: "q06-a-diplomatico-vilarejo-florido.jpg" },
        { p: "C", t: "Uma praia luminosa pela manhã, com chapéu de palha e brisa do mar.", img: "q06-b-comunicador-praia-luminosa.jpg" },
        { p: "S", t: "Uma floresta antiga, entre cascas de madeira, folhas e resinas.", img: "q06-c-sistematico-floresta-antiga.jpg" },
        { p: "M", t: "Um lago de montanha cercado de pinheiros, com ar frio e limpo.", img: "q06-d-dominante-lago-de-montanha.jpg" }
      ] },
    { id: "q07", part: 2, theme: "Sensações buscadas",
      t: "Que sensação você mais gostaria que um perfume despertasse?",
      o: [
        { p: "D", t: "Ternura e memória afetiva, como cartas guardadas com uma rosa seca.", img: "q07-a-diplomatico-cartas-e-rosa.jpg" },
        { p: "C", t: "Leveza e luz, como uma janela aberta para o mar ao amanhecer.", img: "q07-b-comunicador-janela-para-o-mar.jpg" },
        { p: "S", t: "Profundidade e recolhimento, à meia-luz de velas e veludo.", img: "q07-c-sistematico-meia-luz.jpg" },
        { p: "M", t: "Energia e clareza, como alecrim fresco com gotas de orvalho.", img: "q07-d-dominante-alecrim-fresco.jpg" }
      ] },
    { id: "q08", part: 2, theme: "Escolha intuitiva de matérias-primas",
      t: "Se pudesse levar uma destas matérias-primas para a sua bancada, qual seria?",
      o: [
        { p: "D", t: "Peônia e jasmim, com pétalas macias e luminosas.", img: "q08-a-diplomatico-peonia-e-jasmim.jpg" },
        { p: "C", t: "Limão e flor de laranjeira, recém-cortados.", img: "q08-b-comunicador-limao-e-flor.jpg" },
        { p: "S", t: "Madeira de oud e resina âmbar.", img: "q08-c-sistematico-oud-e-ambar.jpg" },
        { p: "M", t: "Lavanda, sálvia e alecrim.", img: "q08-d-dominante-lavanda-salvia-alecrim.jpg" }
      ] },
    { id: "q09", part: 2, theme: "Paisagens e memórias",
      t: "Qual destas memórias você gostaria de reviver?",
      o: [
        { p: "D", t: "Uma tarde fria, com chocolate quente e uma manta macia perto da lareira.", img: "q09-a-diplomatico-chocolate-e-lareira.jpg" },
        { p: "C", t: "Férias em uma ilha, com frutas tropicais, hibisco e mar turquesa.", img: "q09-b-comunicador-ilha-tropical.jpg" },
        { p: "S", t: "Uma viagem a Marrakech, entre couros, madeiras e especiarias.", img: "q09-c-sistematico-marrakech.jpg" },
        { p: "M", t: "Um fim de tarde entre campos de lavanda e ciprestes.", img: "q09-d-dominante-campos-de-lavanda.jpg" }
      ] },
    { id: "q10", part: 2, theme: "Combinações de ingredientes",
      t: "Qual destas combinações mais desperta a sua curiosidade?",
      o: [
        { p: "D", t: "Chocolate, fava de baunilha e frutas vermelhas.", img: "q10-a-diplomatico-chocolate-baunilha-frutas.jpg" },
        { p: "C", t: "Laranja, manjericão e café ao sol.", img: "q10-b-comunicador-laranja-manjericao.jpg" },
        { p: "S", t: "Couro, livros antigos e madeira encerada.", img: "q10-c-sistematico-couro-e-livros.jpg" },
        { p: "M", t: "Lavanda fresca, óleo essencial e vapor quente.", img: "q10-d-dominante-lavanda-e-vapor.jpg" }
      ] },
    { id: "q11", part: 2, theme: "Descrições olfativas",
      t: "Qual destas descrições mais se parece com o seu perfume ideal?",
      o: [
        { p: "D", t: "Pétalas macias, flores do campo e um toque empoado.", img: "q11-a-diplomatico-flores-do-campo.jpg" },
        { p: "C", t: "Folhas molhadas de orvalho e algodão limpo ao sol.", img: "q11-b-comunicador-folhas-e-orvalho.jpg" },
        { p: "S", t: "Madeira escura, resinas e couro, guardados em vidro âmbar.", img: "q11-c-sistematico-vidro-ambar.jpg" },
        { p: "M", t: "Pinheiro, hortelã e eucalipto, como ar gelado de montanha.", img: "q11-d-dominante-pinheiro-hortela-eucalipto.jpg" }
      ] },
    { id: "q12", part: 2, theme: "Fragrâncias escolhidas repetidamente",
      t: "Quando você volta sempre ao mesmo perfume, o que ele costuma ter?",
      o: [
        { p: "D", t: "Um fundo cremoso de baunilha e flores brancas que fica na pele.", img: "q12-a-diplomatico-baunilha-e-flor-branca.jpg" },
        { p: "C", t: "Um frescor marinho com flores brancas, leve do começo ao fim.", img: "q12-b-comunicador-frescor-marinho.jpg" },
        { p: "S", t: "Um rastro seco e preciso, como papel, tinta e madeira clara.", img: "q12-c-sistematico-papel-tinta-madeira.jpg" },
        { p: "M", t: "Ervas secas e lavanda, com a sensação de campo aberto.", img: "q12-d-dominante-ervas-e-campo.jpg" }
      ] }
  ];

  var COURSES = {
    personalidade: { nome: "Personalidade Olfativa: o que seus perfumes revelam sobre você?", desc: "Aprofunde a relação entre perfume, comportamento e identidade.", url: SITE + "/produto/curso-personalidade-olfativa/" },
    introducao: { nome: "Introdução à Perfumaria", desc: "O primeiro passo para entender e criar fragrâncias.", url: "/cursos/introducao-a-perfumaria" },
    familias: { nome: "Famílias Olfativas: novas construções", desc: "Como as famílias se formam, se combinam e se renovam.", url: "/cursos/familias-olfativas-novas-construcoes" },
    jasmim: { nome: "Os Segredos do Jasmim", desc: "A flor mais sedutora da perfumaria, do natural às moléculas sintéticas.", url: "/cursos/os-segredos-do-jasmim" },
    rosa: { nome: "Rosa: a rainha da perfumaria", desc: "A flor mais versátil da perfumaria, em todas as suas faces.", url: "/cursos/rosa-a-rainha-da-perfumaria" },
    neroli: { nome: "Néroli & Flor de Laranjeira", desc: "Acordes com a flor mais luminosa dos cítricos.", url: "/cursos/neroli-e-flor-de-laranjeira" },
    baunilhas: { nome: "Baunilhas na Perfumaria: da fava à fórmula", desc: "A matéria-prima que traz calor e conforto às composições.", url: "/cursos/baunilhas-na-perfumaria" },
    madeiras: { nome: "Madeiras na composição: do acorde à fragrância", desc: "Sândalo, cedro, vetiver e a estrutura de um fundo.", url: "/cursos/madeiras-na-composicao" },
    diluicao: { nome: "Diluição: aspectos práticos", desc: "A técnica que transforma matéria-prima em fragrância.", url: "/cursos/diluicao-aspectos-praticos" }
  };

  var EXPERIENCE = {
    title: "Crie o seu próprio perfume",
    text: "Na Experiência MON On-line, você recebe em casa um kit sensorial selecionado para o seu perfil, explora acordes com a orientação da equipe MON e cria a sua própria fórmula. Ao final, a MON produz o seu perfume autoral de 50 ml.",
    url: SITE + "/produto/crie-seu-perfume-autoral-experiencia-mon-on-line/",
    button: "Conhecer a Experiência MON On-line"
  };

  /* Textos fornecidos e aprovados pela MON Parfum — não alterar sem solicitação */
  var REFLECTION = [
    "Você não precisa ser a mesma pessoa todos os dias. Seu perfume também não.",
    "Há dias em que buscamos delicadeza. Em outros, queremos energia, liberdade ou profundidade.",
    "Uma escolha isolada não define quem somos. O interessante é perceber a frequência com que retornamos a determinados aromas — aqueles que continuam nos encantando, mesmo quando experimentamos novas possibilidades.",
    "Seu perfil olfativo não é uma regra. É um ponto de partida para descobrir tudo o que ainda pode despertar seus sentidos."
  ];
  var CTA = {
    title: "A perfumaria despertou algo em você?",
    text: [
      "Descobrir suas preferências é só o começo. Na MON Parfum, transformamos curiosidade em repertório, sensibilidade em conhecimento e conhecimento em criação.",
      "Se a perfumaria faz parte da sua jornada, seu lugar é aqui."
    ],
    button: "Conhecer os cursos da MON Parfum",
    url: "/cursos"
  };

  var METHOD = [
    ["Das referências", "A roda de Michael Edwards organiza a perfumaria em quatro grandes famílias (Floral, Âmbar, Amadeirada e Fresca) e 14 subfamílias. É dela que vêm as famílias citadas no resultado. Paul Jellinek, em trabalho revisto por J. Stephan Jellinek, propôs mapear o efeito dos odores (refrescante, estimulante, narcótico e erógeno); essa ideia inspira a leitura de sensações nas perguntas olfativas."],
    ["Do quadrante MON Parfum", "Os quatro perfis (Diplomático, Comunicador, Sistemático e Dominante), sua posição no quadrante e as famílias e notas de afinidade de cada um vêm do material de referência da MON Parfum."],
    ["Da interpretação criativa", "As perguntas, as imagens, a pontuação e os textos de resultado foram criados para este quiz, como ferramenta educativa e de autoconhecimento. A relação entre personalidade e preferência olfativa ainda é estudada pela ciência: este resultado é um convite à reflexão, não um diagnóstico psicológico."]
  ];

  /* ------------------------------------------------------------------
     CAPTAÇÃO DE CONTATOS (antes de iniciar o quiz)
     endpoint: endereço que recebe os dados (ex.: o "App da Web" do
     Google Apps Script — veja captura-de-leads/google-apps-script.gs).
     Vazio = os dados não são enviados a lugar nenhum (modo demonstração).
     ------------------------------------------------------------------ */
  var LEAD = {
    required: true,
    endpoint: "",
    title: "Antes de começar, conte quem é você",
    text: "Seu resultado aparece na hora. Com seus dados, a MON pode enviar conteúdos sobre o seu perfil olfativo e novidades sobre cursos e experiências.",
    consent: "Autorizo a MON Parfum a usar meus dados para entrar em contato e enviar conteúdos sobre perfumaria. Posso cancelar quando quiser.",
    privacy: "Seus dados são usados apenas pela MON Parfum e não são compartilhados com terceiros.",
    button: "Começar o quiz"
  };

  return { IMG: IMG, LEAD: LEAD, SITE: SITE, PROFILES: PROFILES, ORDER: ORDER, QUESTIONS: QUESTIONS, COURSES: COURSES,
           EXPERIENCE: EXPERIENCE, REFLECTION: REFLECTION, CTA: CTA, METHOD: METHOD,
           HERO: "inicio-quatro-perfis.jpg", LOGO: "logo-mon.png", LOGO_LIGHT: "logo-mon-claro.png",
           EXPERIENCE_IMG: "resultado-experiencia-mon.jpg" };
})();
