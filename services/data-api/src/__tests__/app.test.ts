import assert from "node:assert/strict";
import test from "node:test";

import { errorResponseSchema, healthResponseSchema } from "../contracts/common.js";
import { createApp } from "../app.js";

test("GET /health responde contrato basico da API", async (t) => {
  const app = createApp({
    destroy: async () => undefined,
  } as never);

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);

  const payload = healthResponseSchema.parse(response.json());

  assert.equal(payload.status, "healthy");
  assert.equal(payload.service, "data-api");
});

test("rota inexistente responde erro padrao", async (t) => {
  const app = createApp({
    destroy: async () => undefined,
  } as never);

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/unknown",
  });

  assert.equal(response.statusCode, 404);

  const payload = errorResponseSchema.parse(response.json());

  assert.equal(payload.error.code, "route_not_found");
});
