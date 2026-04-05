import type { FastifyInstance } from "fastify";

import { teamParamsSchema, teamQuerySchema, teamResponseSchema } from "../contracts/teams.js";
import { parseParams, parseQuery } from "../http/parse.js";
import { getTeamContext } from "../queries/teams.js";
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
};
