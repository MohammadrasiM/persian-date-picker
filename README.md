# Persian DatePicker for React

An inline or modal Persian (Jalali) date picker with an RTL layout, animated navigation,
and customizable colors. Works with **React 18 and 19** and includes TypeScript types.

## Features

- Persian month and weekday labels with a Saturday-first calendar.
- Month and year selectors, navigation buttons, and horizontal swipe navigation.
- A responsive modal that opens as a bottom sheet on mobile.
- Minimum date and year-range limits.
- Keyboard-operable buttons and reduced-motion support.
- Standalone, scoped CSS with theme variables. No Tailwind setup required.

## Installation

Install the package in an existing React project:

```sh
npm install @mohammad-masoudi/persian-datepicker
```

**Import the stylesheet once in your app.** It is required for the datepicker's layout and colors:

```tsx
import "@mohammad-masoudi/persian-datepicker/styles.css";
```

## Quick start

This example opens the calendar, saves the confirmed date, and lets the user reopen it.
The picker renders inline; your app controls when it is visible.

```tsx
import { useState } from "react";
import DatePicker, {
  type DatePickerSelectedDate,
} from "@mohammad-masoudi/persian-datepicker";
import "@mohammad-masoudi/persian-datepicker/styles.css";

export default function Example() {
  const [selectedDate, setSelectedDate] = useState<DatePickerSelectedDate>();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div dir="rtl" style={{ maxWidth: 360 }}>
      {selectedDate && (
        <p>
          تاریخ انتخاب‌شده: {selectedDate.year}/{selectedDate.month}/{selectedDate.day}
        </p>
      )}

      {isOpen ? (
        <DatePicker
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onSubmit={() => setIsOpen(false)}
        />
      ) : (
        <button type="button" onClick={() => setIsOpen(true)}>
          انتخاب تاریخ
        </button>
      )}
    </div>
  );
}
```

A named import is also available:

```tsx
import { DatePicker } from "@mohammad-masoudi/persian-datepicker";
```

### How selection works

- The calendar starts at `selectedDate`, or today when no date is provided.
- Clicking a day updates the draft selection. Pressing **ثبت** confirms it.
- Confirmation calls `setSelectedDate` with numeric Jalali date values, then calls `onSubmit`.
- Changing the displayed month or year does not change the selected date.
- The initial date is clamped to the allowed range. An empty range shows a Persian message and disables confirmation.

`selectedDate` initializes the picker when it mounts. To replace the selection
externally while the picker is open, remount it with a different React `key`.

## Modal and bottom sheet

Use the named `DatePickerModal` export for a ready-to-use dialog. It opens as a
full-width bottom sheet on small screens and a centered modal from 768px wide.
The calendar has 16px horizontal padding on mobile and 24px on desktop, with
scrolling for short screens and space for the mobile safe area.

```tsx
import { useState } from "react";
import {
  DatePickerModal,
  type DatePickerSelectedDate,
} from "@mohammad-masoudi/persian-datepicker";
import "@mohammad-masoudi/persian-datepicker/styles.css";

export default function ModalExample() {
  const [selectedDate, setSelectedDate] = useState<DatePickerSelectedDate>();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div dir="rtl">
      <button type="button" onClick={() => setIsOpen(true)}>
        {selectedDate
          ? `${selectedDate.year}/${selectedDate.month}/${selectedDate.day}`
          : "انتخاب تاریخ"}
      </button>
      <DatePickerModal
        show={isOpen}
        onHide={() => setIsOpen(false)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
    </div>
  );
}
```

Pressing **ثبت** saves the date and requests closing. The close button, Escape,
and clicking outside dismiss the dialog without saving the draft. Your `onHide`
handler must set `show` to `false`. Reopening the dialog starts from the confirmed date.

### Modal props

`DatePickerModal` accepts the same date and range props as `DatePicker`, plus the
props below. Its `onSubmit` callback is optional. `DatePickerModalProps` is also exported.

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `show` | `boolean` | Yes | Controls whether the dialog is open. |
| `onHide` | `() => void` | Yes | Requests closing after confirmation or dismissal. |
| `onSubmit` | `() => void` | No | Runs after `setSelectedDate` and before `onHide` when confirming. |
| `afterLeave` | `() => void` | No | Runs after the closing transition finishes. |
| `title` | `string` | No | Dialog heading and accessible name. Default: `انتخاب تاریخ`. |
| `options.containerClass` | `string` | No | Additional classes for the padded dialog panel, such as a theme class. |
| `options.parentClass` | `string` | No | Replaces the default positioning wrapper classes for custom layouts. |

The dialog manages keyboard focus, restores focus to the opening control, and
respects reduced-motion preferences. The existing stylesheet includes its styles;
you do not need to install or configure a separate UI library.

## Props

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `selectedDate` | `DatePickerSelectedDate` | No | Initial Jalali date. Defaults to today. |
| `setSelectedDate` | `(date?: DatePickerSelectedDate) => void` | Yes | Receives the date when the user confirms. |
| `onSubmit` | `() => void` | Yes | Runs after `setSelectedDate`. Use it to close the picker or continue your form. |
| `minDate` | `string` | No | Earliest allowed date as a Unix timestamp in **seconds**, interpreted in local time. |
| `minYear` | `number` | No | First allowed Jalali year. Defaults to the current Jalali year minus `pastYears`. |
| `maxYear` | `number` | No | Last allowed Jalali year. Defaults to the current Jalali year plus `nextYears`. |
| `pastYears` | `number` | No | Years before the current year when `minYear` is omitted. Default: `100`. |
| `nextYears` | `number` | No | Years after the current year when `maxYear` is omitted. Default: `5`. |

### Date format

`DatePickerSelectedDate` uses Jalali year, month, and day values. Months are **1–12**.
Input fields accept numbers or numeric strings; confirmation returns numbers.

```ts
type DatePickerSelectedDate = {
  year: number | string;
  month: number | string;
  day: number | string;
};

const initialDate: DatePickerSelectedDate = {
  year: 1403,
  month: 1,
  day: 15,
};
```

Both `DatePickerSelectedDate` and `DatePickerProps` are exported from the package.

## Limit the date range

Add `minYear` and `maxYear` to the picker in the quick-start example to restrict
the available Jalali years:

```tsx
<DatePicker
  selectedDate={selectedDate}
  setSelectedDate={setSelectedDate}
  onSubmit={() => setIsOpen(false)}
  minYear={1400}
  maxYear={1410}
/>
```

For a minimum date of today, calculate a Unix timestamp and pass it as `minDate`:

```ts
const minDate = String(Math.floor(Date.now() / 1000));
```

`minDate` uses the start of that day in the user's local timezone. Dates before
it are disabled. When combined with `minYear`, the later lower bound applies.

## Customize the appearance

The picker fills its container's width and inherits its font family. Set a width
on a wrapper and use your preferred Persian font in your app.

To change the colors, add `className="calendar-theme"` to the wrapper in the
quick-start example and define these CSS variables in your app's stylesheet:

```css
.calendar-theme {
  --mpd-primary: 0 79 152;
  --mpd-text: 45 52 94;
  --mpd-border: 219 221 220;
  --mpd-background: 255 255 255;
  --mpd-error: 229 59 86;
}
```

Use **space-separated RGB channels**, such as `0 79 152`. Each variable is
optional; omitted variables use the default colors.

For the modal, pass your theme class to the panel:

```tsx
<DatePickerModal
  show={isOpen}
  onHide={() => setIsOpen(false)}
  selectedDate={selectedDate}
  setSelectedDate={setSelectedDate}
  options={{ containerClass: "calendar-theme" }}
/>
```

Styles are scoped under `.mpd-datepicker`, with no global CSS reset.
The picker also preserves your app's active Moment locale.

## Next.js App Router

Import the stylesheet in your root layout, usually `app/layout.tsx`:

```tsx
import "@mohammad-masoudi/persian-datepicker/styles.css";
```

Place the quick-start component in a Client Component file and add `"use client";`
as its first line. Keep the stylesheet import in the root layout.

## License

[MIT](./LICENSE)
# persian-date-picker
