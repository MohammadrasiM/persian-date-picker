import jalaali from "moment-jalaali";

// Local instance locale keeps numeric formatting stable without changing the host locale.
export function date(input?: jalaali.MomentInput, format?: jalaali.MomentFormatSpecification) {
  return jalaali(input, format, "en").locale("en");
}

export { jalaali as moment };
export const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;
