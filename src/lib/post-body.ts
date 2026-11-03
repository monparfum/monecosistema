// Texto das publicações (sem HTML: o que vem do painel nunca vira código).
// Linha em branco separa blocos. "## " e "### " = subtítulos, "- " = lista, "![alt](url)" = imagem,
// **negrito** e [texto](link) dentro da linha. Link só aceita http(s) ou caminho do site ("/...").

export type Inline = { t: "text"; v: string } | { t: "b"; v: string } | { t: "a"; v: string; href: string };
export type Block =
  | { t: "h2"; v: string }
  | { t: "h3"; v: string }
  | { t: "p"; lines: Inline[][] }
  | { t: "ul"; items: Inline[][] }
  | { t: "img"; alt: string; src: string };

const SAFE_URL = /^(https?:\/\/|\/(?!\/))[^\s<>"]*$/;
const IMG = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m[1] === undefined && !SAFE_URL.test(m[3])) continue; // link inseguro fica como texto
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    out.push(m[1] !== undefined ? { t: "b", v: m[1] } : { t: "a", v: m[2], href: m[3] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

export function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ t: "p", lines: para.map(parseInline) });
      if (list.length) blocks.push({ t: "ul", items: list.map(parseInline) });
      para = []; list = [];
    };
    for (const l of lines) {
      const img = IMG.exec(l);
      if (l.startsWith("### ")) { flush(); blocks.push({ t: "h3", v: l.slice(4) }); }
      else if (l.startsWith("## ")) { flush(); blocks.push({ t: "h2", v: l.slice(3) }); }
      else if (img && SAFE_URL.test(img[2])) { flush(); blocks.push({ t: "img", alt: img[1], src: img[2] }); }
      else if (l.startsWith("- ")) { if (para.length) flush(); list.push(l.slice(2)); }
      else { if (list.length) flush(); para.push(l); }
    }
    flush();
  }
  return blocks;
}

// Texto puro (para tempo de leitura e descrição automática)
export const plainText = (text: string) =>
  text.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*|^#+ |^- /gm, "").replace(/\s+/g, " ").trim();

export const readingMinutes = (text: string) => Math.max(1, Math.round(plainText(text).split(" ").length / 200));
