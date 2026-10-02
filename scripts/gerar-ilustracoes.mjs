// Gera as ilustrações minimalistas de matérias-primas (public/img/mon-*.svg).
// Uso: node scripts/gerar-ilustracoes.mjs   — arte vetorial original, fundo transparente.
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "img");
const GROUND = 800; // linha do "chão" (viewBox 1000 × 1000)

// ---------- utilidades ----------
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f = (n) => Number(n.toFixed(1));
const rad = (d) => (d * Math.PI) / 180;

// Curva fechada suave passando pelos pontos (Catmull-Rom → Bézier)
function smooth(pts, closed = true) {
  const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + (closed ? "Z" : "");
}
// Forma orgânica: elipse com raio irregular
function blob(r, cx, cy, rx, ry, { n = 9, jit = 0.12, rot = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rad(rot), k = 1 + (r() * 2 - 1) * jit;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts);
}
// Polígono facetado (cristal / gelo)
function shard(r, cx, cy, rx, ry, n = 7, jit = 0.22) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3, k = 1 + (r() * 2 - 1) * jit;
    pts.push(`${f(cx + Math.cos(a) * rx * k)},${f(cy + Math.sin(a) * ry * k)}`);
  }
  return pts.join(" ");
}

const DEFS = `
  <radialGradient id="gStone" cx="35%" cy="28%" r="85%"><stop offset="0" stop-color="#E4DCCF"/><stop offset=".55" stop-color="#C9BFAF"/><stop offset="1" stop-color="#A89C8A"/></radialGradient>
  <radialGradient id="gStoneDark" cx="35%" cy="28%" r="85%"><stop offset="0" stop-color="#B9AFA2"/><stop offset=".6" stop-color="#8E8377"/><stop offset="1" stop-color="#6E655B"/></radialGradient>
  <radialGradient id="gResin" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#7A5A3E"/><stop offset=".55" stop-color="#4B382A"/><stop offset="1" stop-color="#2A201A"/></radialGradient>
  <linearGradient id="gIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#EFECF4"/><stop offset="1" stop-color="#DAD4E6"/></linearGradient>
  <linearGradient id="gSalt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E6E3DD"/></linearGradient>
  <linearGradient id="gWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A46A45"/><stop offset=".5" stop-color="#8A5536"/><stop offset="1" stop-color="#6F4229"/></linearGradient>
  <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".5" stop-color="#F3F1EC" stop-opacity=".75"/><stop offset="1" stop-color="#DDD8CF" stop-opacity=".95"/></linearGradient>
  <linearGradient id="gAmber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9B36C"/><stop offset="1" stop-color="#B89B5E"/></linearGradient>
  <linearGradient id="gFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="mFade" maskUnits="userSpaceOnUse" x="0" y="${GROUND}" width="1000" height="200"><rect x="0" y="${GROUND}" width="1000" height="200" fill="url(#gFade)"/></mask>
  <filter id="fRough" x="-8%" y="-8%" width="116%" height="116%">
    <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="9" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 .18  0 0 0 0 .15  0 0 0 0 .12  0 0 0 2.2 -1.15" result="sp"/>
    <feComposite in="sp" in2="d" operator="in" result="spk"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="spk"/></feMerge>
  </filter>
  <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>`;

// Sombra de contato no chão
const shadow = (cx, w, o = 0.16) => `<ellipse cx="${cx}" cy="${GROUND + 4}" rx="${w}" ry="${f(w * 0.07)}" fill="#3A3128" opacity="${o}" filter="url(#fSoft)"/>`;

// ---------- elementos ----------
const stone = (r, cx, cy, rx, ry, o = {}) => `<path d="${blob(r, cx, cy, rx, ry, { jit: 0.1, ...o })}" fill="url(#${o.dark ? "gStoneDark" : "gStone"})" filter="url(#fRough)"/>`;

function resin(r, cx, cy, rx, ry) {
  let s = `<path d="${blob(r, cx, cy, rx, ry, { n: 11, jit: 0.16 })}" fill="url(#gResin)" filter="url(#fRough)"/>`;
  const tones = ["#F2D9A4", "#E3B56B", "#C98F4A", "#8A5A2B", "#2B211A", "#EFE6D2", "#B5773A", "#4A3526"];
  const count = Math.round((rx * ry) / 260);
  for (let i = 0; i < count; i++) { // lascas de resina translúcida
    const a = r() * Math.PI * 2, k = Math.sqrt(r()) * 0.8, x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k, w = 5 + r() * 12;
    s += `<polygon points="${shard(r, x, y, w, w * (0.55 + r() * 0.4), 5, 0.3)}" fill="${tones[Math.floor(r() * tones.length)]}" opacity="${f(0.7 + r() * 0.3)}"/>`;
  }
  return s;
}

function crystal(r, cx, cy, rx, ry, fill = "gSalt") {
  const p = shard(r, cx, cy, rx, ry);
  const pts = p.split(" ").map((q) => q.split(",").map(Number));
  let s = `<polygon points="${p}" fill="url(#${fill})" stroke="#CFCAC2" stroke-width="1.2" stroke-linejoin="round"/>`;
  for (let i = 0; i < pts.length; i += 2) s += `<line x1="${f(cx + (r() - 0.5) * rx * 0.5)}" y1="${f(cy + (r() - 0.5) * ry * 0.5)}" x2="${pts[i][0]}" y2="${pts[i][1]}" stroke="#D8D3CB" stroke-width=".8" opacity=".8"/>`;
  return s;
}

// Fava de baunilha: traço longo, fino, com gancho na ponta
function vanilla(x0, y0, x1, y1, bend = 40) {
  const mx = (x0 + x1) / 2 - bend, my = (y0 + y1) / 2;
  const d = `M${x0},${y0} Q${mx},${my} ${x1},${y1} q6,-22 -16,-26 q-14,-2 -18,8`;
  return `<path d="${d}" fill="none" stroke="#1E1915" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#4A3F36" stroke-width="2" stroke-dasharray="3 9" stroke-linecap="round" opacity=".7"/>`;
}

// Ramo com flores pequenas (muguet / jasmim)
function sprig(r, x, y, len, ang, { flowers = 6, leaf = false, color = "#7C8B6F" } = {}) {
  const a = rad(ang), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const cx = x + Math.cos(a) * len * 0.5 - Math.sin(a) * len * 0.22, cy = y + Math.sin(a) * len * 0.5 + Math.cos(a) * len * 0.22;
  let s = `<path d="M${f(x)},${f(y)} Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}" fill="none" stroke="${color}" stroke-width="3.6" stroke-linecap="round"/>`;
  for (let i = 0; i < flowers; i++) {
    const t = 0.35 + (i / flowers) * 0.65, px = (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t * t * ex, py = (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t * t * ey;
    const side = i % 2 ? 1 : -1, bx = px - Math.sin(a) * 28 * side + (r() - 0.5) * 8, by = py + Math.cos(a) * 28 * side + 8;
    s += `<path d="M${f(px)},${f(py)} Q${f((px + bx) / 2)},${f(py - 6)} ${f(bx)},${f(by - 6)}" fill="none" stroke="${color}" stroke-width="2"/>`;
    s += `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(12 + r() * 4)}" fill="#FFFFFF" stroke="#D2CCBE" stroke-width="1.4"/><circle cx="${f(bx + 1)}" cy="${f(by + 3)}" r="3" fill="#D9C27A"/>`;
  }
  if (leaf) s += leafShape(x + Math.cos(a) * len * 0.2, y + Math.sin(a) * len * 0.2, 46, ang - 55, "#6F8262") + leafShape(x + Math.cos(a) * len * 0.42, y + Math.sin(a) * len * 0.42, 40, ang + 60, "#7C8B6F");
  return s;
}
function leafShape(x, y, len, ang, fill) {
  return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})"><path d="M0,0 C${f(len * 0.3)},${f(-len * 0.28)} ${f(len * 0.75)},${f(-len * 0.2)} ${len},0 C${f(len * 0.75)},${f(len * 0.2)} ${f(len * 0.3)},${f(len * 0.28)} 0,0Z" fill="${fill}"/><line x1="0" y1="0" x2="${len}" y2="0" stroke="#fff" stroke-width=".8" opacity=".35"/></g>`;
}

// Ramo de alecrim: haste com agulhas
function rosemary(r, x, y, len, ang, color = "#7C8B6F") {
  let s = `<g transform="translate(${x},${y}) rotate(${ang})"><path d="M0,0 Q${f(len * 0.5)},${f(-len * 0.08)} ${len},0" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;
  for (let i = 4; i < 26; i++) {
    const t = i / 26, px = t * len, py = -Math.sin(t * Math.PI) * len * 0.04, l = 26 + r() * 14, sgn = i % 2 ? 1 : -1;
    s += `<line x1="${f(px)}" y1="${f(py)}" x2="${f(px + l * 0.55)}" y2="${f(py + sgn * l * 0.8)}" stroke="${i % 3 ? color : "#93A286"}" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  return s + "</g>";
}

// Espiga de lavanda
function lavender(r, x, y, len, ang) {
  let s = `<g transform="translate(${x},${y}) rotate(${ang})"><line x1="0" y1="0" x2="${len}" y2="0" stroke="#7C8B6F" stroke-width="4" stroke-linecap="round"/>`;
  for (let i = 0; i < 46; i++) {
    const t = 0.4 + (i / 46) * 0.6, px = t * len, w = 15 * (1 - (t - 0.4) * 0.9) + 5;
    s += `<ellipse cx="${f(px + (r() - 0.5) * 6)}" cy="${f((r() - 0.5) * w * 2.1)}" rx="${f(10 + r() * 5)}" ry="${f(6 + r() * 3)}" fill="${["#8E82B5", "#A79CCB", "#74699E", "#B9B0D6"][i % 4]}" transform="rotate(${f((r() - 0.5) * 50)} ${f(px)} 0)"/>`;
  }
  return s + "</g>";
}

// Bloco de madeira com veios
function wood(r, x, y, w, h, rot = 0) {
  let s = `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><path d="M${x + 6},${y} L${x + w - 10},${y + 5} L${x + w},${y + h - 4} L${x + 3},${y + h} Z" fill="url(#gWood)"/>`;
  for (let i = 0; i < 9; i++) {
    const gx = x + 8 + (i / 9) * (w - 16) + r() * 4;
    s += `<path d="M${f(gx)},${y + 6} Q${f(gx + (r() - 0.5) * 14)},${f(y + h / 2)} ${f(gx + (r() - 0.5) * 8)},${y + h - 6}" fill="none" stroke="#5A3521" stroke-width="${f(0.8 + r() * 1.2)}" opacity="${f(0.25 + r() * 0.35)}"/>`;
  }
  return s + "</g>";
}

// Emaranhado de raízes (vetiver)
function roots(r, cx, top, w, h, count = 150) {
  let s = "";
  for (let i = 0; i < count; i++) {
    let x = cx + (r() - 0.5) * w * 0.8, y = top + r() * h * 0.25;
    const pts = [[x, y]], steps = 6 + Math.floor(r() * 6), reach = h * (0.45 + r() * 0.55);
    for (let k = 1; k <= steps; k++) {
      const env = Math.sin((k / steps) * Math.PI * 0.85 + 0.3); // largura do feixe ao longo da queda
      x += (r() - 0.5) * 120 * env + (cx - x) * 0.1; y += (reach / steps) * (0.5 + r());
      pts.push([x, Math.min(y, GROUND - 2)]);
    }
    s += `<path d="${smooth(pts, false)}" fill="none" stroke="${["#B49A6C", "#9C8358", "#C7B185", "#857048", "#A89064"][i % 5]}" stroke-width="${f(0.9 + r() * 1.9)}" stroke-linecap="round" opacity="${f(0.7 + r() * 0.3)}"/>`;
  }
  return s;
}

// Vagem de cardamomo
const pod = (r, x, y) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(11 + r() * 4)}" ry="${f(6 + r() * 2)}" fill="${["#8C9468", "#7B8459", "#9BA377"][Math.floor(r() * 3)]}" transform="rotate(${f((r() - 0.5) * 70)} ${f(x)} ${f(y)})"/>`;

// Frasco de vidro com essência
function vial(x, w, h, level = 0.5, cap = "#1A1A1A") {
  const y = GROUND - h, lh = h * level;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${f(w * 0.16)}" fill="url(#gGlass)" stroke="#C9C3B8" stroke-width="1.5"/>
    <path d="M${x + 4},${GROUND - lh} h${w - 8} v${lh - w * 0.16} a${f(w * 0.12)},${f(w * 0.12)} 0 0 1 -${f(w * 0.12)},${f(w * 0.12)} h-${f(w - 8 - w * 0.24)} a${f(w * 0.12)},${f(w * 0.12)} 0 0 1 -${f(w * 0.12)},-${f(w * 0.12)}Z" fill="url(#gAmber)" opacity=".8"/>
    <rect x="${f(x + w * 0.28)}" y="${y - 26}" width="${f(w * 0.44)}" height="28" fill="url(#gGlass)" stroke="#C9C3B8" stroke-width="1.5"/>
    <rect x="${f(x + w * 0.2)}" y="${y - 62}" width="${f(w * 0.6)}" height="40" rx="3" fill="${cap}"/>
    <line x1="${f(x + w * 0.2)}" y1="${y + 14}" x2="${f(x + w * 0.2)}" y2="${GROUND - 16}" stroke="#fff" stroke-width="3" opacity=".8" stroke-linecap="round"/>`;
}
// Fita olfativa (mouillette)
const blotter = (x, len, ang, tip = "#B89B5E") => `<g transform="translate(${x},${GROUND}) rotate(${ang})"><path d="M-9,0 L-9,-${len - 18} L0,-${len} L9,-${len - 18} L9,0Z" fill="#FDFCF9" stroke="#D6D0C4" stroke-width="1.3"/><path d="M-9,-${len - 60} L-9,-${len - 18} L0,-${len} L9,-${len - 18} L9,-${len - 60}Z" fill="${tip}" opacity=".28"/></g>`;

// ---------- composições ----------
const scenes = {
  // Fava de baunilha apoiada em pedra, resina e cristais, com ramo de flores
  vanille(r) {
    const body = resin(r, 520, 712, 150, 92) + stone(r, 512, 560, 142, 86, { rot: 12 }) + crystal(r, 506, 438, 96, 58) + crystal(r, 536, 372, 74, 46)
      + sprig(r, 560, 356, 150, -52, { flowers: 6 }) + vanilla(318, GROUND - 4, 420, 196, 30);
    return { body, shadow: shadow(500, 230) };
  },
  // Bloco de gelo com ervas, lavanda por cima
  lavande(r) {
    const block = "M338,404 Q336,392 350,392 L640,398 Q676,400 690,440 L702,640 Q704,700 668,760 L650,800 L346,800 Q338,800 338,790 Z";
    const body = `<clipPath id="cBlock"><path d="${block}"/></clipPath>
      <path d="${block}" fill="url(#gIce)" stroke="#D6D0DE" stroke-width="1.5"/>
      <g clip-path="url(#cBlock)" opacity=".8">${rosemary(r, 420, 780, 330, -62)}${rosemary(r, 400, 560, 260, -18, "#6F8262")}${rosemary(r, 560, 760, 250, -108, "#869678")}${leafShape(372, 742, 96, -8, "#6F8262")}
        <path d="M338,404 L520,400 L420,800 L338,800Z" fill="#fff" opacity=".28"/></g>
      <path d="M348,410 L630,414" stroke="#fff" stroke-width="3" opacity=".9" stroke-linecap="round"/>
      ${crystal(r, 430, 336, 104, 56, "gIce")}${crystal(r, 560, 318, 86, 60, "gIce")}
      ${rosemary(r, 350, 352, 190, -14)}${lavender(r, 640, 268, 300, 196)}${lavender(r, 690, 796, 78, -150)}${leafShape(318, 770, 70, -168, "#6F8262")}`;
    return { body, shadow: shadow(515, 250, 0.12) };
  },
  // Madeiras empilhadas, raízes de vetiver, pedra e cardamomo
  bois(r) {
    let pods = "";
    [[190, 792], [258, 780], [300, 796], [352, 790], [420, 798], [640, 794], [700, 786], [748, 796], [790, 780], [824, 794], [236, 796], [596, 798]].forEach(([x, y]) => (pods += pod(r, x, y)));
    const body = wood(r, 588, 600, 122, 200, 0) + wood(r, 560, 268, 126, 344, 8) + crystal(r, 596, 240, 50, 32)
      + stone(r, 452, 392, 96, 70, { rot: 20 }) + roots(r, 470, 360, 330, 440) + pods;
    return { body, shadow: shadow(500, 300, 0.12) };
  },
  // Kit: frascos de essência, fitas olfativas e uma pedra
  kit(r) {
    const body = blotter(640, 430, 9) + blotter(668, 400, 17, "#7C8B6F") + blotter(694, 362, 26, "#8E82B5")
      + vial(370, 104, 270, 0.42) + vial(492, 92, 196, 0.6, "#B89B5E") + vial(598, 78, 132, 0.5)
      + stone(r, 292, 760, 62, 40) + sprig(r, 276, 730, 170, -108, { flowers: 4, leaf: true });
    return { body, shadow: shadow(510, 280, 0.12) };
  },
  // Seixos empilhados com ramo de jasmim
  jasmin(r) {
    const body = stone(r, 500, 742, 170, 58, { dark: true }) + stone(r, 492, 640, 128, 50) + stone(r, 506, 556, 92, 40, { dark: true }) + stone(r, 498, 490, 58, 30)
      + sprig(r, 520, 470, 250, -74, { flowers: 7, leaf: true }) + sprig(r, 470, 476, 150, -128, { flowers: 3, leaf: true, color: "#6F8262" });
    return { body, shadow: shadow(500, 240) };
  },
  // Resina e âmbar: pedra, lascas de resina e cristal
  ambre(r) {
    const body = stone(r, 500, 728, 168, 74, { dark: true }) + resin(r, 470, 598, 118, 72) + crystal(r, 560, 500, 84, 56)
      + resin(r, 690, 772, 44, 28) + resin(r, 300, 780, 30, 20) + vanilla(700, GROUND - 4, 610, 300, -30);
    return { body, shadow: shadow(500, 260) };
  },
};

fs.mkdirSync(OUT, { recursive: true });
let i = 0;
for (const [name, build] of Object.entries(scenes)) {
  const built = build(rng(1234 + 97 * i++));
  const sh = built.shadow, body = `<g transform="translate(500 ${GROUND}) scale(1.16) translate(-500 -${GROUND})">${built.body}</g>`;
  // Reflexo suave no "chão", como numa superfície polida
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000" role="img">
<defs>${DEFS}
</defs>
<g mask="url(#mFade)"><g transform="translate(0 ${GROUND * 2}) scale(1 -1)">${body.replace(/<clipPath id="cBlock">/g, '<clipPath id="cBlockR">').replace(/url\(#cBlock\)/g, "url(#cBlockR)")}</g></g>
${sh}
${body}
</svg>`;
  fs.writeFileSync(path.join(OUT, `mon-${name}.svg`), svg.replace(/\n\s+/g, "\n"));
  console.log(`mon-${name}.svg`, (svg.length / 1024).toFixed(0) + " KB");
}
