import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ["pattern-administration-aspect-orbit.trycloudflare.com"],
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              // Only compile app source files — skip node_modules.
              // Prevents useMemoCache crashes in third-party libs (e.g. Sonner).
              sources: (filename: string) => {
                return filename.includes("src");
              },
            },
          ],
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
