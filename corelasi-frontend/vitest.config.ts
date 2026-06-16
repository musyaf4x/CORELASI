import { defineConfig } from "vitest/config";
import { mergeConfig } from "vite";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      exclude: [
        "node_modules",
        "dist",
        ".idea",
        ".git",
        ".cache",
        "e2e"
      ]
    },
  })
);
