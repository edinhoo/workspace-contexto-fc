import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@services/data-api": fileURLToPath(
        new URL("../../services/data-api/src", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
  },
});
