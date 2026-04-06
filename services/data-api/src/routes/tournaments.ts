import type { FastifyInstance } from "fastify";

import {
  tournamentResponseSchema,
  tournamentSlugParamsSchema,
} from "../contracts/tournaments.js";
import { parseParams } from "../http/parse.js";
import { getTournamentContextBySlug } from "../queries/tournaments.js";
import type { DbClient } from "../types.js";

export const registerTournamentRoutes = (
  app: FastifyInstance,
  db: DbClient,
): void => {
  app.get("/tournaments/by-slug/:slug", async (request) => {
    const params = parseParams(tournamentSlugParamsSchema, request.params);
    const response = await getTournamentContextBySlug(db, params.slug);

    return tournamentResponseSchema.parse(response);
  });
};
