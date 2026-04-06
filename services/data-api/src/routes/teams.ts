import type { FastifyInstance } from "fastify";

import {
  teamParamsSchema,
  teamQuerySchema,
  teamResponseSchema,
  teamSlugParamsSchema,
} from "../contracts/teams.js";
import { parseParams, parseQuery } from "../http/parse.js";
import { getTeamContext, getTeamContextBySlug } from "../queries/teams.js";
import type { DbClient } from "../types.js";

export const registerTeamRoutes = (
  app: FastifyInstance,
  db: DbClient,
): void => {
  app.get("/teams/:id", async (request) => {
    const params = parseParams(teamParamsSchema, request.params);
    const query = parseQuery(teamQuerySchema, request.query);
    const response = await getTeamContext(db, params.id, query);

    return teamResponseSchema.parse(response);
  });

  app.get("/teams/by-slug/:slug", async (request) => {
    const params = parseParams(teamSlugParamsSchema, request.params);
    const query = parseQuery(teamQuerySchema, request.query);
    const response = await getTeamContextBySlug(db, params.slug, query);

    return teamResponseSchema.parse(response);
  });
};
