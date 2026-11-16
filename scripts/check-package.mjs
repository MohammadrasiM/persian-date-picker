import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import postcss from "postcss";
import moment from "moment-jalaali";

const locale = moment.locale();
const esm = await import("@mohammad-masoudi/persian-datepicker");
const require = createRequire(import.meta.url);
const cjs = require("@mohammad-masoudi/persian-datepicker");
const metadata = require("@mohammad-masoudi/persian-datepicker/package.json");
assert.ok(!metadata.dependencies?.["@headlessui/react"], "The package must not depend on Headless UI");
assert.equal(moment.locale(), locale, "Import must preserve the host's locale");
for (const entry of [esm, cjs]) {
  assert.equal(entry.default, entry.DatePicker);
  assert.equal(typeof entry.DatePickerModal, "function");
  for (const show of [false, true]) {
    assert.equal(
      renderToString(
        createElement(entry.DatePickerModal, { show, onHide() {}, setSelectedDate() {} }),
      ),
      "",
    );
  }
  const html = renderToString(
    createElement(entry.DatePicker, {
      selectedDate: { year: 1403, month: 1, day: 1 },
      minYear: 1403,
      maxYear: 1404,
      setSelectedDate() {},
      onSubmit() {},
    }),
  );
  assert.ok(html.includes("فروردین") && html.includes('dir="rtl"'));
}
for (const path of [
  "../dist/esm/index.js",
  "../dist/cjs/index.js",
  "../dist/esm/DatePickerModal.js",
  "../dist/cjs/DatePickerModal.js",
]) {
  assert.match(readFileSync(new URL(path, import.meta.url), "utf8"), /["']use client["']/);
}
const css = readFileSync(require.resolve("@mohammad-masoudi/persian-datepicker/styles.css"), "utf8");
postcss.parse(css).walkRules((rule) => {
  for (const selector of rule.selectors)
    assert.ok(selector.startsWith(".mpd-datepicker"), `Unscoped selector: ${selector}`);
});
for (const token of ["primary", "text", "border", "background", "error"])
  assert.ok(css.includes(`--mpd-${token}`));
console.log(
  "Inline and modal exports, ESM, CommonJS, server rendering, client directives, CSS exports, scoping, and theme variables passed.",
);
