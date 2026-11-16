const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
export default function DaysOfTheWeek() {
  return (
    <div className="grid w-full grid-cols-7 items-center gap-1 border-b border-primary-border pb-2">
      {days.map((day) => (
        <span key={day} title={day} className="truncate text-center text-sm">
          {day[0]}
        </span>
      ))}
    </div>
  );
}
