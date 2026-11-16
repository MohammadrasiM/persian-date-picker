"use client";

import { date, moment } from "./date.js";
import Day from "./Day.js";

type Props = {
  year: number;
  month: number;
  selectedDate: string;
  minimum: moment.Moment;
  maximum: moment.Moment;
  onSelect: (value: string) => void;
};

export default function DayPicker({
  year,
  month,
  selectedDate,
  minimum,
  maximum,
  onSelect,
}: Props) {
  const first = date(`${year}/${month + 1}/1`, "jYYYY/jM/jD");
  const offset = (first.day() + 1) % 7;
  const count = moment.jDaysInMonth(year, month);
  const cells = Math.max(35, Math.ceil((offset + count) / 7) * 7);
  const today = date();
  const selected = date(selectedDate, "jYYYY/jMM/jD");
  return (
    <div className="grid grid-cols-7 items-center gap-0.5">
      {Array.from({ length: cells }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1 || day > count) return <span key={index} aria-hidden="true" />;
        const value = first.clone().jDate(day);
        return (
          <Day
            key={index}
            day={day}
            today={value.isSame(today, "day")}
            selected={value.isSame(selected, "day")}
            disabled={value.isBefore(minimum, "day") || value.isAfter(maximum, "day")}
            onSelect={() => onSelect(value.format("jYYYY/jMM/jD"))}
          />
        );
      })}
    </div>
  );
}
