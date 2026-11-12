// node --test scripts/quiz.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, PROFILE_KEYS, scoreQuiz, type ProfileKey } from "../src/lib/quiz.ts";

test("12 perguntas, cada uma com os 4 perfis uma vez", () => {
  assert.equal(QUESTIONS.length, 12);
  for (const q of QUESTIONS) assert.deepEqual(q.o.map(([k]) => k).sort(), [...PROFILE_KEYS].sort());
});

test("comportamentais valem 1, olfativas valem 2", () => {
  const a: ProfileKey[] = [...Array(5).fill("d"), ...Array(7).fill("s")];
  const r = scoreQuiz(a);
  assert.deepEqual(r.scores, { d: 5, c: 0, s: 14, m: 0 });
  assert.deepEqual(r.keys.slice(0, 2), ["s", "d"]);
  assert.equal(r.pct("s"), 74);
  assert.equal(r.tie, false);
});

test("empate em pontos: ganha quem tem mais respostas olfativas", () => {
  // d: 4 comportamentais = 4 pontos; c: 2 olfativas = 4 pontos
  const a: (ProfileKey | null)[] = ["d", "d", "d", "d", "m", "c", "c", "m", "m", "m", "m", "m"];
  const r = scoreQuiz(a);
  assert.equal(r.scores.d, r.scores.c);
  assert.ok(r.keys.indexOf("c") < r.keys.indexOf("d"));
});

test("sem respostas não divide por zero", () => {
  assert.equal(scoreQuiz(Array(12).fill(null)).pct("d"), 0);
});
