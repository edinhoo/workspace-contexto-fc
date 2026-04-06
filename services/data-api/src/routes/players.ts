import type { FastifyInstance } from "fastify";

import {
  playerParamsSchema,
  playerResponseSchema,
  playerSlugParamsSchema,
} from "../contracts/players.js";
import { parseParams } from "../http/parse.js";
import { getPlayerContext, getPlayerContextBySlug } from "../queries/players.js";
import type { DbClient } from "../types.js";

export const registerPlayerRoutes = (
  app: FastifyInstance,
  db: DbClient,
): void => {
  app.get("/players/:id", async (request) => {
    const params = parseParams(playerParamsSchema, request.params);
    const response = await getPlayerContext(db, params.id);

    return playerResponseSchema.parse(response);
  });

  app.get("/players/by-slug/:slug", async (request) => {
    const params = parseParams(playerSlugParamsSchema, request.params);
    const response = await getPlayerContextBySlug(db, params.slug);

    return playerResponseSchema.parse(response);
  });
};
