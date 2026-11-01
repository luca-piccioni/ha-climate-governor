// esbuild bundler for the Climate Governor panel.
// Emits dist/entrypoint-<buildid>.js (content-hash for cache busting) plus a
// stable dist/entrypoint.js for dev. Commit the hashed output to the repo so
// installing the integration needs no JS toolchain.
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";

const watch = process.argv.includes("--watch");
const outdir = "dist";

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const options = {
  entryPoints: ["src/entrypoint.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: !watch,
  sourcemap: watch ? "linked" : false,
  legalComments: "none",
  outdir,
  // Lit ships ESM; keep it bundled (HA has no import map).
  logLevel: "info",
  // Deterministic output so the content hash only changes when code changes.
  metafile: true,
};

if (watch) {
  const { context } = await import("esbuild");
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching…");
} else {
  const result = await build(options);
  // Rename the output to a content-hashed filename for cache busting. Only the
  // hashed file is kept (that is what HA serves); dev/watch keeps entrypoint.js.
  const { rename, readFile } = await import("node:fs/promises");
  const outfile = `${outdir}/entrypoint.js`;
  const bytes = await readFile(outfile);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const hashed = `${outdir}/entrypoint-${hash}.js`;
  await rename(outfile, hashed);
  console.log(`built ${hashed} (${bytes.length} bytes)`);
  void result;
}
