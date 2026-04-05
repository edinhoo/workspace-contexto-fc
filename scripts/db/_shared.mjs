import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const WORKDIR = resolve(process.cwd());
const COMPOSE_FILE = "infra/docker/docker-compose.yml";
const DB_NAME = "contexto_fc";
const DB_USER = "contexto_fc";

export const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: WORKDIR,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe"
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    const message = [stderr, stdout].filter(Boolean).join("\n");
    throw new Error(message || `Falha ao executar ${command} ${args.join(" ")}`);
  }

  return result.stdout ?? "";
};

export const runPsqlFile = (absoluteFilePath) => {
  const workspaceRelativePath = relative(WORKDIR, absoluteFilePath).replaceAll("\\", "/");

  return runCommand("docker", [
    "compose",
    "-f",
    COMPOSE_FILE,
    "exec",
    "-T",
    "postgres",
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    DB_USER,
    "-d",
    DB_NAME,
    "-f",
    `/workspace/${workspaceRelativePath}`
  ]);
};

export const runPsqlQuery = (query) =>
  runCommand("docker", [
    "compose",
    "-f",
    COMPOSE_FILE,
    "exec",
    "-T",
    "postgres",
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    DB_USER,
    "-d",
    DB_NAME,
    "-At",
    "-F",
    "\t",
    "-c",
    query
  ]);

export const createTempSqlFile = (prefix, content) => {
  const directory = mkdtempSync(join(tmpdir(), `${prefix}-`));
  const filePath = join(directory, "script.sql");

  writeFileSync(filePath, content, "utf8");

  return {
    filePath,
    cleanup: () => rmSync(directory, { recursive: true, force: true })
  };
};
