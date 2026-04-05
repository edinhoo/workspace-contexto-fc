import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import { getConfig } from "../config.js";
import type { Database } from "./schema.js";

export const createDb = (): Kysely<Database> => {
  const config = getConfig();

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: config.databaseUrl,
      }),
    }),
  });
};
