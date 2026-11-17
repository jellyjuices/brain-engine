import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import wyw from "@wyw-in-js/vite";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
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

const showLock =
  loadEnv("development", fileURLToPath(new URL(".", import.meta.url)), "SHOW_LOCK").SHOW_LOCK ===
  "true";

function macToken(): string {
  const path = process.env.BRAIN_TOKEN_FILE || join(homedir(), ".config", "brain", "token");
  try {
    return readFileSync(path, "utf8").trim();
  } catch {
    return "";
  }
}

const apiProxy = showLock
  ? { "/api": "http://127.0.0.1:8788" }
  : {
      "/api": {
        target: "http://127.0.0.1:8787",
        headers: { Authorization: `Bearer ${macToken()}` },
      },
    };

export default defineConfig({
  cacheDir: fileURLToPath(new URL("../node_modules/.vite", import.meta.url)),
  envPrefix: ["VITE_", "SHOW_LOCK"],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    dedupe: ["react", "react-dom", "@phosphor-icons/react", "clsx"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("../engine/shared", import.meta.url)),
    },
  },
  plugins: [linariaCssInTests(), react(), wyw(), serviceWorker()],
  server: {
    proxy: apiProxy,
    fs: {
      allow: [
        fileURLToPath(new URL(".", import.meta.url)),
        fileURLToPath(new URL("../engine/shared", import.meta.url)),
        fileURLToPath(new URL("../node_modules", import.meta.url)),
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
