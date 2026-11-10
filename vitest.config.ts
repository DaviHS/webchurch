import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      "server-only": fromRoot("./src/test/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: { SKIP_ENV_VALIDATION: "1" },
  },
});
