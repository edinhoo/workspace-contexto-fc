import type { FastifyInstance } from "fastify";

import { playerParamsSchema, playerResponseSchema } from "../contracts/players.js";
import { parseParams } from "../http/parse.js";
import { getPlayerContext } from "../queries/players.js";
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
};
