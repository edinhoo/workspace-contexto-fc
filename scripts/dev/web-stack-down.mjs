import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, "../..");
const stateFile = resolve(workspaceRoot, ".tmp/web-stack/state.json");
const stateDir = resolve(workspaceRoot, ".tmp/web-stack");

const killPid = (pid) => {
  if (!pid) {
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Processo ja encerrado.
  }
};

if (existsSync(stateFile)) {
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  killPid(state.dataApiPid);
  killPid(state.webPid);
}

spawnSync("pnpm", ["docker:down"], {
  cwd: workspaceRoot,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

if (existsSync(stateDir)) {
  rmSync(stateDir, { recursive: true, force: true });
}

console.log("Stack local encerrada.");
