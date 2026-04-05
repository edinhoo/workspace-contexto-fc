import type { FastifyInstance } from "fastify";

import { matchParamsSchema, matchResponseSchema } from "../contracts/matches.js";
import { parseParams } from "../http/parse.js";
import { getMatchContext } from "../queries/matches.js";
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
};
