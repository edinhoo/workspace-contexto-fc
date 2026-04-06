import assert from "node:assert/strict";
import test from "node:test";

import { validateCommitMessage } from "./commit-rules.mjs";

test("accepts full commit template", () => {
  const errors = validateCommitMessage(`feat(web): adicionar cliente de busca

Contexto:
- O ciclo precisava melhorar a busca.

O que foi feito:
- criado cliente HTTP de busca

Impactos:
- melhora a navegacao do app

Validacao:
- [x] build
- [x] test
`);

  assert.deepEqual(errors, []);
});

test("rejects commit without required sections", () => {
  const errors = validateCommitMessage("feat(web): resumo curto");

  assert.ok(errors.length > 0);
});
