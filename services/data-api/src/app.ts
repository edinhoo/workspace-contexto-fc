import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";

import { createDb } from "./db/client.js";
import { getConfig } from "./config.js";
import { registerErrorHandler } from "./http/error.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerMatchRoutes } from "./routes/matches.js";
import { registerPlayerRoutes } from "./routes/players.js";
import { registerSeasonRoutes } from "./routes/seasons.js";
import { registerSearchRoute } from "./routes/search.js";
import { registerTeamRoutes } from "./routes/teams.js";
import { registerTournamentRoutes } from "./routes/tournaments.js";
import type { DbClient } from "./types.js";

export const createApp = (db: DbClient = createDb()): FastifyInstance => {
  const config = getConfig();
  const app = Fastify({
    logger: false,
  });

  app.addHook("onRequest", async (request) => {
    console.info(
      JSON.stringify({
        event: "request_started",
        method: request.method,
        url: request.url,
      }),
    );
  });

  app.register(cors, {
    origin: config.corsOrigins,
  });

  registerErrorHandler(app);
  registerHealthRoute(app);
  registerSearchRoute(app, db);
  registerMatchRoutes(app, db);
  registerTeamRoutes(app, db);
  registerPlayerRoutes(app, db);
  registerTournamentRoutes(app, db);
  registerSeasonRoutes(app, db);

  app.addHook("onClose", async () => {
    await db.destroy();
  });

  return app;
};
