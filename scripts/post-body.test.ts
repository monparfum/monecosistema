// node --test scripts/post-body.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBody, parseInline, plainText } from "../src/lib/post-body.ts";

test("subtítulos, lista e parágrafo", () => {
  const b = parseBody("Intro **forte**\nsegunda linha\n\n## Título\n- um\n- dois\n\nfim");
  assert.deepEqual(b.map((x) => x.t), ["p", "h2", "ul", "p"]);
  assert.equal((b[0] as { lines: unknown[] }).lines.length, 2);
  assert.equal((b[2] as { items: unknown[] }).items.length, 2);
});

test("links seguros viram link; javascript: fica texto", () => {
  assert.deepEqual(parseInline("veja [curso](/cursos) e [x](https://a.com)").filter((i) => i.t === "a").map((i) => (i as { href: string }).href), ["/cursos", "https://a.com"]);
  assert.ok(parseInline("[mal](javascript:alert(1))").every((i) => i.t === "text"));
  assert.ok(parseInline("[mal](//evil.com)").every((i) => i.t === "text"));
});

test("imagem só com URL segura", () => {
  assert.equal(parseBody("![alt](/img/a.webp)")[0].t, "img");
  assert.equal(parseBody("![alt](javascript:x)")[0].t, "p");
});

test("texto puro tira marcação", () => {
  assert.equal(plainText("## Oi\n**a** [b](/c) - d"), "Oi a b - d");
});
