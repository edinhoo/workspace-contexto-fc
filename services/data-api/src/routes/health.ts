import type { FastifyInstance } from "fastify";

export const registerHealthRoute = (app: FastifyInstance): void => {
  app.get("/health", async () => {
    return {
      status: "healthy",
      service: "data-api",
    };
  });
};
