import type { FastifyInstance } from "fastify";

import { searchResponseSchema, searchQuerySchema } from "../contracts/search.js";
import { parseQuery } from "../http/parse.js";
import { searchEntities } from "../queries/search.js";
import type { DbClient } from "../types.js";

export const registerSearchRoute = (
  app: FastifyInstance,
  db: DbClient,
): void => {
  app.get("/search", async (request) => {
    const query = parseQuery(searchQuerySchema, request.query);
    const items = await searchEntities(db, query);

    return searchResponseSchema.parse({
      query: query.q,
      items,
    });
  });
};
