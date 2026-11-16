import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import wyw from "@wyw-in-js/vite";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

function linariaCssInTests(): Plugin {
  const prefix = "\0linaria-css:";
  return {
    name: "brain-linaria-css-in-tests",
    enforce: "pre",
    apply: () => Boolean(process.env.VITEST),
    resolveId(id) {
      if (id.endsWith(".wyw-in-js.css")) return prefix + id;
    },
    load(id) {
      if (id.startsWith(prefix)) return "";
    },
  };
}

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
  resolve: {
    dedupe: ["react", "react-dom", "radix-ui", "@phosphor-icons/react", "clsx"],
    alias: {
      "@ds": fileURLToPath(new URL("../../design-system/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../../shared", import.meta.url)),
    },
  },
  plugins: [linariaCssInTests(), react(), wyw(), serviceWorker()],
  server: {
    proxy: { "/api": "http://127.0.0.1:8788" },
    fs: {
      allow: [
        fileURLToPath(new URL(".", import.meta.url)),
        fileURLToPath(new URL("../../shared", import.meta.url)),
        fileURLToPath(new URL("../../design-system", import.meta.url)),
      ],
    },
  },
  build: { outDir: "dist", emptyOutDir: true, target: "es2022", assetsInlineLimit: 0 },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
  },
});
