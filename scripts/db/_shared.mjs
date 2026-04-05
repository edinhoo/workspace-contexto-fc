import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKDIR = resolve(SCRIPT_DIR, "../..");
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

export const runPsqlFile = (absoluteFilePath, options = {}) => {
  const workspaceRelativePath = relative(WORKDIR, absoluteFilePath).replaceAll("\\", "/");

  const args = [
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
    DB_NAME
  ];

  if (options.tuplesOnly) {
    args.push("-At", "-F", "\t");
  }

  args.push("-f", `/workspace/${workspaceRelativePath}`);

  return runCommand("docker", args);
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
  const tempRoot = resolve(WORKDIR, ".tmp/db");
  mkdirSync(tempRoot, { recursive: true });

  const directory = mkdtempSync(join(tempRoot, `${prefix}-`));
  const filePath = join(directory, "script.sql");

  writeFileSync(filePath, content, "utf8");

  return {
    filePath,
    cleanup: () => rmSync(directory, { recursive: true, force: true })
  };
};
