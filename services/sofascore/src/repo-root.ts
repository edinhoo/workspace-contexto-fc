import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const findRepoRoot = (startPath = dirname(fileURLToPath(import.meta.url))): string => {
  let currentPath = resolve(startPath);

  while (true) {
    if (existsSync(resolve(currentPath, "pnpm-workspace.yaml"))) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);

    if (parentPath === currentPath) {
      throw new Error("Nao foi possivel localizar a raiz do monorepo.");
    }

    currentPath = parentPath;
  }
};
