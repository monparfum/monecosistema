// Quiz de personalidade olfativa (12 perguntas, 4 perfis). Conteúdo e regra de pontuação vieram do material da MON.

export type ProfileKey = "d" | "c" | "s" | "m";
export const PROFILE_KEYS: ProfileKey[] = ["d", "c", "s", "m"];

export const PROFILE: Record<ProfileKey, { name: string; tag: string; color: string; text: string; families: string; notes: string }> = {
  d: { name: "Diplomático", tag: "A sensibilidade que acolhe", color: "#bd6680",
    text: "Seu universo olfativo tende ao delicado, envolvente e afetivo. Você pode se identificar com fragrâncias que evocam proximidade, beleza e conforto.",
    families: "Floral, Soft Floral, frutado doce e gourmand.",
    notes: "Rosa, peônia, jasmim, violeta, pêssego, framboesa, baunilha, heliotrópio e acordes atalcados." },
  c: { name: "Comunicador", tag: "A leveza que ilumina", color: "#dcae47",
    text: "Seu repertório aponta para frescor, movimento e luminosidade. Perfumes vibrantes podem acompanhar sua curiosidade, espontaneidade e vontade de explorar.",
    families: "Citrus, Green, Water e frutado fresco.",
    notes: "Bergamota, limão, grapefruit, maçã verde, folhas de violeta, acordes verdes, marinhos e aldeídicos luminosos." },
  s: { name: "Sistemático", tag: "A profundidade que permanece", color: "#89694c",
    text: "Você tende a apreciar fragrâncias com estrutura, textura e identidade. Madeiras, raízes e nuances terrosas podem transmitir consistência e sofisticação.",
    families: "Woods, Mossy Woods e Dry Woods.",
    notes: "Vetiver, cedro, sândalo, patchouli, musgo de carvalho, couro, tabaco e madeiras secas." },
  m: { name: "Dominante", tag: "A energia que transforma", color: "#568d81",
    text: "Seu universo olfativo aponta para movimento, vitalidade e presença. Acordes aromáticos e herbais podem traduzir essa força sem exigir perfumes intensos ou pesados.",
    families: "Aromatic Fougère, aromático herbal e amadeirado fresco.",
    notes: "Alecrim, lavanda, sálvia, hortelã, eucalipto, pinheiro, cipreste e facetas canforadas." },
};

// As cinco primeiras perguntas são comportamentais (peso 1); as sete seguintes, olfativas (peso 2, com foto).
export const BEHAVIORAL = 5;
export const QUESTIONS: { q: string; o: [ProfileKey, string][] }[] = [
  { q: "Quando você chega a um ambiente onde não conhece ninguém, o que costuma acontecer?", o: [["d", "Procuro criar conexões e fazer as pessoas se sentirem acolhidas."], ["s", "Observo primeiro, entendo o ambiente e só depois me aproximo."], ["m", "Tomo a iniciativa e naturalmente ajudo a conduzir a situação."], ["c", "Puxo conversa, faço comentários e logo conheço várias pessoas."]] },
  { q: "Um dia inteiramente livre aparece na sua agenda. Qual cenário parece mais atraente?", o: [["c", "Uma exposição, um passeio inesperado e descobertas pela cidade."], ["m", "Uma experiência nova, estimulante, cheia de movimento."], ["d", "Um encontro especial com pessoas queridas, sem pressa."], ["s", "Um dia tranquilo, organizado no meu ritmo, para fazer o que gosto."]] },
  { q: "Qual característica as pessoas provavelmente reconhecem em você?", o: [["s", "Minha atenção aos detalhes e minha confiabilidade."], ["d", "Minha sensibilidade e capacidade de compreender os outros."], ["c", "Minha criatividade, leveza e facilidade de comunicação."], ["m", "Minha iniciativa e capacidade de resolver situações."]] },
  { q: "Diante de um desafio inesperado, qual costuma ser seu primeiro impulso?", o: [["m", "Agir rapidamente e encontrar um caminho."], ["s", "Analisar as informações antes de tomar uma decisão."], ["c", "Conversar, trocar ideias e explorar possibilidades."], ["d", "Considerar como a decisão afetará as pessoas envolvidas."]] },
  { q: "Qual dessas palavras combina mais com a forma como você gosta de viver?", o: [["d", "Harmonia."], ["m", "Movimento."], ["s", "Consistência."], ["c", "Liberdade."]] },
  { q: "Imagine quatro jardins. Em qual você gostaria de passar uma tarde?", o: [["s", "Um bosque silencioso, com troncos úmidos, raízes e musgo."], ["c", "Um pomar luminoso, com folhas verdes e frutas recém-colhidas."], ["d", "Um jardim romântico, com rosas, peônias e flores macias."], ["m", "Um jardim aromático, com alecrim, hortelã e pinheiros."]] },
  { q: "Qual dessas sensações você gostaria que um perfume trouxesse com mais frequência?", o: [["c", "A leveza de uma manhã ensolarada, fresca e vibrante."], ["s", "A profundidade aconchegante de uma biblioteca de madeira."], ["m", "A energia revigorante de uma caminhada ao ar livre."], ["d", "O conforto delicado de um abraço ou de uma lembrança feliz."]] },
  { q: "Você encontra quatro caixas misteriosas. Qual abriria primeiro?", o: [["m", "Uma caixa com folhas de eucalipto, ervas e ramos de pinheiro."], ["d", "Uma caixa com pétalas de flores, baunilha e frutas maduras."], ["s", "Uma caixa com vetiver, cedro, terra úmida e couro."], ["c", "Uma caixa com bergamota, maçã verde e brisa marinha."]] },
  { q: "Qual paisagem parece traduzir melhor a fragrância que você usaria repetidamente?", o: [["d", "Uma casa florida e acolhedora, com detalhes delicados."], ["s", "Uma floresta de árvores antigas, de atmosfera profunda."], ["c", "Um terraço ensolarado diante do mar, com ar fresco."], ["m", "Uma trilha entre montanhas, pinheiros e vegetação aromática."]] },
  { q: "Qual combinação de ingredientes mais desperta sua curiosidade?", o: [["c", "Grapefruit, folhas de violeta e notas aquáticas."], ["m", "Lavanda, alecrim e eucalipto."], ["s", "Patchouli, vetiver e musgo de carvalho."], ["d", "Rosa, heliotrópio e um toque gourmand."]] },
  { q: "Sem pensar em marcas ou embalagens, qual descrição de perfume você escolheria?", o: [["s", "Seco, amadeirado, terroso e sofisticado."], ["d", "Floral, envolvente, macio e delicadamente doce."], ["m", "Aromático, herbal, fresco e revigorante."], ["c", "Cítrico, luminoso, verde e transparente."]] },
  { q: "Pense nos perfumes que você realmente volta a usar. O que mais costuma atrair você?", o: [["m", "O frescor herbal, com personalidade e presença."], ["c", "A sensação de limpeza, brilho e frescor espontâneo."], ["d", "A suavidade floral, o conforto e a doçura."], ["s", "A estrutura amadeirada, a profundidade e o caráter."]] },
];

// Ordem: pontuação, depois nº de respostas olfativas, depois ordem fixa (d, c, s, m).
export function scoreQuiz(answers: (ProfileKey | null)[]) {
  const scores: Record<ProfileKey, number> = { d: 0, c: 0, s: 0, m: 0 };
  const olf: Record<ProfileKey, number> = { d: 0, c: 0, s: 0, m: 0 };
  answers.forEach((a, i) => {
    if (!a) return;
    scores[a] += i < BEHAVIORAL ? 1 : 2;
    if (i >= BEHAVIORAL) olf[a]++;
  });
  const total = PROFILE_KEYS.reduce((t, k) => t + scores[k], 0);
  const keys = [...PROFILE_KEYS].sort((a, b) => scores[b] - scores[a] || olf[b] - olf[a]);
  const pct = (k: ProfileKey) => (total ? Math.round((scores[k] / total) * 100) : 0);
  return { scores, keys, pct, tie: scores[keys[0]] === scores[keys[1]] };
}
