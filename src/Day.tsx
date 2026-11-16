"use client";

type DayProps = {
  day: number;
  today: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

export default function Day({ day, today, selected, disabled, onSelect }: DayProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`روز ${day}`}
      aria-pressed={selected}
      aria-current={today ? "date" : undefined}
      className={`relative h-11 overflow-hidden rounded-lg bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500 ${disabled ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 opacity-50" : "cursor-pointer"} ${today || selected ? "border border-primary-border" : ""}`}
      onClick={onSelect}
    >
      <span
        className={`relative flex h-full items-center justify-center text-base font-medium text-dashboard-text ${selected ? "rounded-lg !bg-primary-500/20" : ""}`}
      >
        {today && (
          <span
            aria-hidden="true"
            className="absolute top-0.5 h-1.5 w-1.5 rounded-full bg-primary-500"
          />
        )}
        {day}
      </span>
    </button>
  );
}
