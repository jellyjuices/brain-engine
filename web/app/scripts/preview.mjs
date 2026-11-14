import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const out = process.argv[2];
if (!out) {
  console.error("Usage: npm run preview:page -- <out.html>");
  process.exit(1);
}

const app = resolve(import.meta.dirname, "..");
const dist = mkdtempSync(join(tmpdir(), "brain-preview-"));
await build({
  configFile: false,
  root: join(app, "preview"),
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": join(app, "src") } },
  build: { outDir: dist, emptyOutDir: true },
  logLevel: "error",
});

const assets = join(dist, "assets");
const files = readdirSync(assets);
function read(ext) {
  return files
    .filter((f) => f.endsWith(ext))
    .map((f) => readFileSync(join(assets, f), "utf8"))
    .join("\n");
}
const js = read(".js").replaceAll("</script>", "<\\/script>");
const page = `<title>Brain Preview</title>
<style>
html, body { height: 100%; }
body { background: var(--bg); }
#root { position: fixed; inset-inline: 0; top: var(--vvt, 0); height: var(--vvh, 100%); display: flex; flex-direction: column; }
.preview-main { flex: 1; overflow: auto; padding: 16px; }
${read(".css")}
</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(out, page);
rmSync(dist, { recursive: true, force: true });
console.log(`Wrote ${out}`);
