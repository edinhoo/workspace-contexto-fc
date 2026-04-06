import type { FastifyInstance } from "fastify";

import { seasonParamsSchema, seasonResponseSchema } from "../contracts/seasons.js";
import { parseParams } from "../http/parse.js";
import { getSeasonContext } from "../queries/seasons.js";
import type { DbClient } from "../types.js";

export const registerSeasonRoutes = (
  app: FastifyInstance,
  db: DbClient,
): void => {
  app.get("/seasons/:id", async (request) => {
    const params = parseParams(seasonParamsSchema, request.params);
    const response = await getSeasonContext(db, params.id);

    return seasonResponseSchema.parse(response);
  });
};
