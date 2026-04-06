import type { FastifyInstance } from "fastify";

import {
  matchParamsSchema,
  matchResponseSchema,
  matchSlugParamsSchema,
} from "../contracts/matches.js";
import { parseParams } from "../http/parse.js";
import { getMatchContext, getMatchContextBySlug } from "../queries/matches.js";
import type { DbClient } from "../types.js";

export const registerMatchRoutes = (
  app: FastifyInstance,
  db: DbClient,
): void => {
  app.get("/matches/:id", async (request) => {
    const params = parseParams(matchParamsSchema, request.params);
    const response = await getMatchContext(db, params.id);

    return matchResponseSchema.parse(response);
  });

  app.get("/matches/by-slug/:slug", async (request) => {
    const params = parseParams(matchSlugParamsSchema, request.params);
    const response = await getMatchContextBySlug(db, params.slug);

    return matchResponseSchema.parse(response);
  });
};
