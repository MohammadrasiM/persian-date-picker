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
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
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
| `options.backdropClass` | `string` | No | Additional classes for the backdrop. |
| `closeButtonProps` | `DatePickerButtonProps` | No | Classes, styles, title, ID, and native attributes for the close button. |

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
| `primaryColor` | `string` | No | Calendar accent and default submit background, as `#RGB` or `#RRGGBB`. |
| `buttonColor` | `string` | No | Submit-button background as a CSS color. Defaults to the primary color. |
| `buttonTextColor` | `string` | No | Submit-button text as a CSS color. Default: white. |
| `submitButtonProps` | `DatePickerButtonProps` | No | Submit-button classes, styles, title, ID, and native attributes. |
| `containerProps` | `DatePickerContainerProps` | No | Calendar container classes, styles, ID, and native attributes. |
| `labels` | `DatePickerLabels` | No | Override button text, tooltips, accessible labels, and empty-range text. |
| `disabled` | `boolean` | No | Disables calendar controls and confirmation. Modal dismissal remains available. Default: `false`. |

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

### Colors, classes, and button text

Both picker variants accept the same customization props:

```tsx
<DatePicker
  selectedDate={selectedDate}
  setSelectedDate={setSelectedDate}
  onSubmit={() => setIsOpen(false)}
  primaryColor="#004f98"
  buttonColor="#00695c"
  buttonTextColor="#ffffff"
  labels={{ submit: "تأیید تاریخ" }}
  submitButtonProps={{
    className: "booking-submit",
    title: "ذخیره تاریخ رزرو",
    "data-testid": "confirm-date",
    style: { borderRadius: 24 },
  }}
  containerProps={{ id: "booking-calendar", className: "booking-calendar" }}
/>
```

`primaryColor` accepts three- or six-digit hex colors. Invalid values are ignored,
preserving the inherited theme or default accent. `buttonColor` and
`buttonTextColor` accept CSS colors such as hex, `rgb(...)`, or `var(--brand-color)`.
Colors apply independently to each picker, including the modal portal.

The button prop bags support `className`, `style`, `title`, `id`, `aria-*`, and
`data-*` attributes. The picker owns `onClick`, `type`, `disabled`, and button
contents to preserve selection and dismissal behavior. Use `labels.submit` to
change the visible confirmation text. `containerProps` targets the calendar
itself, including inside a modal; its RTL direction is preserved.

Import your custom stylesheet after the package stylesheet. Match the package's
selector specificity when overriding default button utilities:

```css
.mpd-datepicker .booking-submit {
  min-height: 48px;
  border-radius: 24px;
  font-weight: 700;
}
```

Inline `style` values override the default styles directly. Class names are
appended; conflicting Tailwind utilities are not automatically merged.

### Labels and tooltips

Pass only the labels you want to change. Others keep their Persian defaults.
Navigation, selector, day, and close labels also set native button tooltips.
You can override the submit and close tooltips through their button prop bags.

| Label | Default | Applies to |
| --- | --- | --- |
| `submit` | `ثبت` | Visible submit text and tooltip. |
| `previousMonth` | `ماه قبل` | Previous-month button. |
| `nextMonth` | `ماه بعد` | Next-month button. |
| `month` | `ماه` | Month selector button. |
| `year` | `سال` | Year selector button. |
| `chooseMonth` | `انتخاب ماه` | Month choices container. |
| `chooseYear` | `انتخاب سال` | Year choices container. |
| `day` | `(day) => "روز " + day` | Day-button label and tooltip; receives the day number. |
| `close` | `بستن` | Modal close button. |
| `emptyRange` | `تاریخی در بازه انتخابی وجود ندارد.` | Empty-range message. |

These labels do not replace Persian month names or weekday headings.
`DatePickerLabels`, `DatePickerButtonProps`, and `DatePickerContainerProps` are
exported for typed configurations.

### CSS variable themes

To change the colors, add `className="calendar-theme"` to the wrapper in the
quick-start example and define these CSS variables in your app's stylesheet:

```css
.calendar-theme {
  --mpd-primary: 0 79 152;
  --mpd-text: 45 52 94;
  --mpd-border: 219 221 220;
  --mpd-background: 255 255 255;
  --mpd-error: 229 59 86;
  --mpd-button-background: #00695c;
  --mpd-button-text: #fff;
}
```

Use **space-separated RGB channels**, such as `0 79 152`, for the calendar
variables. `--mpd-button-background` and `--mpd-button-text` use complete CSS
colors. Each variable is optional. The submit background inherits the primary
color when its variable is omitted; other omitted variables use their defaults.
Color props set variables on the picker and take precedence over inherited themes.

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
