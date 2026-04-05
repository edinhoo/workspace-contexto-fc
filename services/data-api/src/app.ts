import Fastify, { type FastifyInstance } from "fastify";

import { registerErrorHandler } from "./http/error.js";
import { registerHealthRoute } from "./routes/health.js";

export const createApp = (): FastifyInstance => {
  const app = Fastify({
    logger: false,
  });

  app.addHook("onRequest", async (request) => {
    console.info(JSON.stringify({
      event: "request_started",
      method: request.method,
      url: request.url,
    }));
  });

  registerErrorHandler(app);
  registerHealthRoute(app);

  return app;
};
