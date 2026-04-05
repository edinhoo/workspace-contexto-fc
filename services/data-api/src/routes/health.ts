import type { FastifyInstance } from "fastify";

import { healthResponseSchema } from "../contracts/common.js";

export const registerHealthRoute = (app: FastifyInstance): void => {
  app.get("/health", async () => {
    return healthResponseSchema.parse({
      status: "healthy",
      service: "data-api",
    });
  });
};
