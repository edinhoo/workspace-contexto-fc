import Fastify, { type FastifyInstance } from "fastify";

import { createDb } from "./db/client.js";
import { registerErrorHandler } from "./http/error.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerMatchRoutes } from "./routes/matches.js";
import { registerPlayerRoutes } from "./routes/players.js";
import { registerSearchRoute } from "./routes/search.js";
import { registerTeamRoutes } from "./routes/teams.js";
import type { DbClient } from "./types.js";

export const createApp = (db: DbClient = createDb()): FastifyInstance => {
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
  registerSearchRoute(app, db);
  registerMatchRoutes(app, db);
  registerTeamRoutes(app, db);
  registerPlayerRoutes(app, db);

  app.addHook("onClose", async () => {
    await db.destroy();
  });

  return app;
};
