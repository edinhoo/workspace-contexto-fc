import type { Kysely } from "kysely";

import type { Database } from "./db/schema.js";

export type DbClient = Kysely<Database>;
