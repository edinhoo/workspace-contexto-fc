import { mkdirSync, openSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, "../..");
const stateDir = resolve(workspaceRoot, ".tmp/web-stack");
const stateFile = resolve(stateDir, "state.json");
const dataApiLog = resolve(stateDir, "data-api.log");
const webLog = resolve(stateDir, "web.log");

const ensureStateDir = () => {
  mkdirSync(stateDir, { recursive: true });
};

const runStep = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const spawnDetached = (command, args, options = {}) => {
  const logFd = openSync(options.logFile, "a");
  const child = spawn(command, args, {
    cwd: workspaceRoot,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    shell: false,
    env: {
      ...process.env,
      ...options.env,
    },
  });

  child.unref();
  return child.pid;
};

ensureStateDir();

console.log("Subindo docker...");
runStep("pnpm", ["docker:up"]);

console.log("Aplicando migrations...");
runStep("pnpm", ["db:migrate"]);

console.log("Carregando match de referencia...");
runStep("pnpm", ["--filter", "@services/sofascore", "scrape", "15237889"]);

console.log("Iniciando data-api em background...");
const dataApiPid = spawnDetached(
  "pnpm",
  ["--filter", "@services/data-api", "start"],
  {
    logFile: dataApiLog,
  },
);

console.log("Iniciando web app em background...");
const webPid = spawnDetached(
  "pnpm",
  ["--filter", "@apps/web", "exec", "next", "dev", "--hostname", "127.0.0.1", "--port", "3000"],
  {
    logFile: webLog,
    env: {
      DATA_API_URL: "http://127.0.0.1:3100",
    },
  },
);

writeFileSync(
  stateFile,
  JSON.stringify(
    {
      dataApiPid,
      webPid,
      dataApiLog,
      webLog,
      startedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log("");
console.log("Stack local iniciada.");
console.log("data-api: http://127.0.0.1:3100");
console.log("web: http://127.0.0.1:3000/search?q=palmeiras");
console.log(`estado: ${stateFile}`);
