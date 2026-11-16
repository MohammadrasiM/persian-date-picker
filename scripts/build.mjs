import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = path.join(root, "dist");
if (path.dirname(dist) !== path.resolve(root)) throw new Error("Invalid output path");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("node_modules/typescript/bin/tsc", ["-p", "tsconfig.json"]);
run("node_modules/typescript/bin/tsc", [
  "-p",
  "tsconfig.json",
  "--module",
  "CommonJS",
  "--moduleResolution",
  "Node",
  "--outDir",
  "dist/cjs",
]);
writeFileSync(path.join(dist, "cjs/package.json"), '{"type":"commonjs"}\n');
run("node_modules/tailwindcss/lib/cli.js", [
  "-c",
  "tailwind.config.cjs",
  "-i",
  "src/styles.css",
  "-o",
  "dist/styles.css",
  "--minify",
]);
// Tailwind's transform/touch variable defaults must also stay inside the component.
const cssPath = path.join(dist, "styles.css");
const css = postcss.parse(readFileSync(cssPath, "utf8"));
css.walkRules((rule) => {
  rule.selectors = rule.selectors.map((selector) =>
    selector.startsWith(".mpd-datepicker") ? selector : `.mpd-datepicker ${selector}`,
  );
});
writeFileSync(cssPath, css.toString());
