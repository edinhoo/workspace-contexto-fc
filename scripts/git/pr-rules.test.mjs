import assert from "node:assert/strict";
import test from "node:test";

import { validatePrBody } from "./pr-rules.mjs";

test("accepts PR body in template format", () => {
  const errors = validatePrBody(`## Contexto

- Ajuste de padrao no repositorio

## O que foi feito

- adicionados scripts de validacao

## Impacto

- [x] altera apenas documentacao

## Validacao

- [x] test

## Observacoes

- sem observacoes adicionais
`);

  assert.deepEqual(errors, []);
});

test("rejects PR body without required headings", () => {
  const errors = validatePrBody("texto solto");

  assert.ok(errors.length > 0);
});
