import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run this check with npm run check:consumer");
function run(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw result.error ?? new Error(`Command failed: ${args[0]}`);
  }
  return result.stdout;
}
const packed = JSON.parse(run([npm, "pack", "--ignore-scripts", "--json"], root))[0];
for (const file of packed.files)
  assert.ok(
    file.path.startsWith("dist/") || ["package.json", "README.md", "LICENSE"].includes(file.path),
    `Unexpected packed file: ${file.path}`,
  );
const archive = path.join(root, packed.filename).replaceAll("\\", "/");
const smoke = `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToString } from 'react-dom/server';
import DatePicker, { DatePicker as Named, DatePickerModal } from '@mohammad-masoudi/persian-datepicker';
const require = createRequire(import.meta.url);
assert.ok(!require('@mohammad-masoudi/persian-datepicker/package.json').dependencies?.['@headlessui/react']);
assert.ok(!require('@mohammad-masoudi/persian-datepicker/package.json').dependencies?.['framer-motion']);
assert.ok(!require('@mohammad-masoudi/persian-datepicker/package.json').dependencies?.['@mohammad-masoudi/persian-datepicker']);
assert.equal(DatePicker, Named);
for (const Modal of [DatePickerModal, require('@mohammad-masoudi/persian-datepicker').DatePickerModal]) {
  assert.equal(typeof Modal, 'function');
  assert.equal(renderToString(React.createElement(Modal, { show: false, onHide() {}, setSelectedDate() {} })), '');
}
for (const Picker of [DatePicker, require('@mohammad-masoudi/persian-datepicker').default]) {
  const html = renderToString(React.createElement(Picker, { selectedDate: { year: 1403, month: 1, day: 1 }, minYear: 1403, maxYear: 1404, setSelectedDate() {}, onSubmit() {} }));
  assert.ok(html.includes('فروردین') && html.includes('dir="rtl"'));
}
assert.ok(require.resolve('@mohammad-masoudi/persian-datepicker/styles.css').endsWith('styles.css'));
console.log('Packed consumer passed on React ' + React.version);
`;
const types = `import DatePicker, { DatePicker as Named, DatePickerModal, type DatePickerProps, type DatePickerSelectedDate, type DatePickerModalProps, type DatePickerLabels, type DatePickerButtonProps, type DatePickerContainerProps } from '@mohammad-masoudi/persian-datepicker';
const value: DatePickerSelectedDate = { year: 1403, month: 1, day: 1 };
const props: DatePickerProps = { selectedDate: value, setSelectedDate(date) { console.log(date); }, onSubmit() {} };
const Component: typeof DatePicker = Named;
const modalProps: DatePickerModalProps = { show: true, onHide() {}, selectedDate: value, setSelectedDate(date) { console.log(date); }, title: 'انتخاب تاریخ', afterLeave() {}, options: { containerClass: 'calendar-theme', parentClass: 'calendar-position' } };
const ModalComponent: typeof DatePickerModal = DatePickerModal;
const labels: DatePickerLabels = { submit: 'Confirm', close: 'Close', day: (day) => 'Day ' + day };
const button: DatePickerButtonProps = { className: 'confirm', title: 'Save', style: { borderRadius: 24 }, 'data-testid': 'confirm', 'aria-describedby': 'hint' };
const container: DatePickerContainerProps = { id: 'booking', 'data-booking': true, style: { maxWidth: 360 } };
const customized: DatePickerProps = { ...props, primaryColor: '#004f98', buttonColor: '#00695c', buttonTextColor: '#fff', labels, submitButtonProps: button, containerProps: container, disabled: true };
const customizedModal: DatePickerModalProps = { ...modalProps, ...customized, closeButtonProps: button, options: { backdropClass: 'backdrop' } };
// @ts-expect-error Internal click handling cannot be replaced.
const invalidButton: DatePickerButtonProps = { onClick() {} };
// @ts-expect-error Disable through the picker rather than a button prop bag.
const invalidDisabled: DatePickerButtonProps = { disabled: false };
// @ts-expect-error The calendar keeps its RTL direction.
const invalidContainer: DatePickerContainerProps = { dir: 'ltr' };
void customized; void customizedModal; void invalidButton; void invalidDisabled; void invalidContainer;
void props; void Component; void modalProps; void ModalComponent;
`;
for (const major of [18, 19]) {
  const consumer = path.join(root, ".consumer-check", `react${major}`);
  mkdirSync(consumer, { recursive: true });
  writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@mohammad-masoudi/persian-datepicker": `file:${archive}`,
          react: `${major}`,
          "react-dom": `${major}`,
        },
        devDependencies: {
          typescript: "5.8.3",
          "@types/react": `${major}`,
          "@types/react-dom": `${major}`,
        },
      },
      null,
      2,
    ),
  );
  run(
    [
      npm,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--fetch-retries=0",
      "--fetch-timeout=20000",
    ],
    consumer,
  );
  writeFileSync(path.join(consumer, "smoke.mjs"), smoke);
  writeFileSync(path.join(consumer, "types.mts"), types);
  writeFileSync(path.join(consumer, "types.cts"), types);
  writeFileSync(
    path.join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      files: ["types.mts", "types.cts"],
    }),
  );
  run(["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"], consumer);
  console.log(run(["smoke.mjs"], consumer).trim());
}
console.log(`Artifact: ${packed.filename} (${packed.size} bytes, ${packed.files.length} files)`);
