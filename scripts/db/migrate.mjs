import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import { runPsqlFile } from "./_shared.mjs";

const migrationsDir = resolve(process.cwd(), "infra/db/migrations");
const migrations = readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

for (const migration of migrations) {
  const filePath = resolve(migrationsDir, migration);
  process.stdout.write(`Aplicando migration ${migration}\n`);
  runPsqlFile(filePath);
}

process.stdout.write("Migrations aplicadas com sucesso.\n");
