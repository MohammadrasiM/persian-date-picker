import type { CSSProperties } from "react";
import type { DatePickerLabels, DatePickerProps } from "./types.js";

export const defaultLabels: Required<DatePickerLabels> = {
  submit: "ثبت",
  previousMonth: "ماه قبل",
  nextMonth: "ماه بعد",
  month: "ماه",
  year: "سال",
  chooseMonth: "انتخاب ماه",
  chooseYear: "انتخاب سال",
  close: "بستن",
  emptyRange: "تاریخی در بازه انتخابی وجود ندارد.",
  day: (day) => `روز ${day}`,
};

export function themeStyle({
  primaryColor,
  buttonColor,
  buttonTextColor,
}: Pick<DatePickerProps, "primaryColor" | "buttonColor" | "buttonTextColor">): CSSProperties {
  const style: CSSProperties & Record<string, string> = {};
  if (primaryColor && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(primaryColor)) {
    const hex = primaryColor.slice(1);
    const full = hex.length === 3 ? [...hex].map((value) => value + value).join("") : hex;
    style["--mpd-primary"] = [0, 2, 4]
      .map((index) => parseInt(full.slice(index, index + 2), 16))
      .join(" ");
  }
  if (buttonColor) style["--mpd-button-background"] = buttonColor;
  if (buttonTextColor) style["--mpd-button-text"] = buttonTextColor;
  return style;
}
