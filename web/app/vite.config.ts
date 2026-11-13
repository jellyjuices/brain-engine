import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

function serviceWorker(): Plugin {
  return {
    name: "brain-sw",
    apply: "build",
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter(
        (f) => !f.endsWith(".map") && !/fraunces-(?!latin-opsz-normal)/.test(f),
      );
      const urls = [
        "/",
        "/manifest.webmanifest",
        "/icons/icon.svg",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        ...files.map((f) => `/${f}`),
      ];
      const version = createHash("sha256")
        .update(urls.join())
        .update(
          files
            .map((f) => ("code" in bundle[f]! ? (bundle[f] as { code: string }).code : ""))
            .join(),
        )
        .digest("hex")
        .slice(0, 10);
      const template = readFileSync(new URL("./sw/sw.js", import.meta.url), "utf8");
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace("__PRECACHE__", JSON.stringify(urls))
          .replace("__VERSION__", version),
      });
    },
  };
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [react(), serviceWorker()],
  server: { proxy: { "/api": "http://127.0.0.1:8788" } },
  build: { outDir: "dist", emptyOutDir: true, target: "es2022", assetsInlineLimit: 0 },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
  },
});
