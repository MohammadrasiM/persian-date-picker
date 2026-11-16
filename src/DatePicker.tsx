"use client";

import { date as jalaliDate, moment, PERSIAN_MONTH_NAMES } from "./date.js";
import { ArrowLeftIcon, ArrowRightIcon, CaretDownIcon } from "./Icons.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { DatePickerProps } from "./types.js";
import DayPicker from "./DayPicker.js";
import DaysOfTheWeek from "./DaysOfTheWeek.js";

export default function DatePicker({
  selectedDate,
  setSelectedDate,
  minDate,
  minYear,
  maxYear,
  pastYears = 100,
  nextYears = 5,
  onSubmit,
}: DatePickerProps) {
  const currentYear = jalaliDate().jYear();
  const firstYear = minYear ?? currentYear - Math.max(0, Math.floor(pastYears));
  const lastYear = maxYear ?? currentYear + Math.max(0, Math.floor(nextYears));
  const firstDate = jalaliDate(`${firstYear}/1/1`, "jYYYY/jM/jD").startOf("day");
  const maximum = jalaliDate(`${lastYear}/12/1`, "jYYYY/jM/jD").endOf("jMonth");
  const minimumDate = minDate ? jalaliDate(minDate, "X") : undefined;
  const minimum = minimumDate?.isValid()
    ? moment.max(firstDate, minimumDate.startOf("day"))
    : firstDate;
  const hasDates = !minimum.isAfter(maximum, "day");
  const [chosenDate, setChosenDate] = useState(() => {
    const initial = selectedDate
      ? jalaliDate(`${selectedDate.year}/${selectedDate.month}/${selectedDate.day}`, "jYYYY/jM/jD")
      : jalaliDate();
    return moment.max(minimum, moment.min(maximum, initial)).format("jYYYY/jMM/jDD");
  });
  const [selectedDay, setSelectedDay] = useState(chosenDate);
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [direction, setDirection] = useState(0);
  const reduceMotion = useReducedMotion();
  const yearGridRef = useRef<HTMLDivElement>(null);
  const monthGridRef = useRef<HTMLDivElement>(null);
  const monthButtonRef = useRef<HTMLButtonElement>(null);
  const yearButtonRef = useRef<HTMLButtonElement>(null);
  const swipeRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    horizontal: boolean;
    moved: boolean;
  } | null>(null);
  const suppressDateClickRef = useRef(false);
  const date = jalaliDate(chosenDate, "jYYYY/jMM/jDD");
  const year = date.jYear();
  const month = date.jMonth();
  useEffect(() => {
    if (view === "days") return;
    const grid = view === "years" ? yearGridRef.current : monthGridRef.current;
    const selected = grid?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (grid && selected) {
      grid.scrollTop =
        selected.offsetTop - grid.offsetTop - grid.clientHeight / 2 + selected.clientHeight / 2;
      selected.focus({ preventScroll: true });
    }
  }, [view]);
  const selectDay = (value: string) => {
    const selected = jalaliDate(value, "jYYYY/jMM/jD");
    if (
      !hasDates ||
      !selected.isValid() ||
      selected.isBefore(minimum, "day") ||
      selected.isAfter(maximum, "day")
    )
      return;
    setSelectedDay(value);
  };
  const submitDate = () => {
    const selected = jalaliDate(selectedDay, "jYYYY/jMM/jD");
    if (
      !hasDates ||
      !selected.isValid() ||
      selected.isBefore(minimum, "day") ||
      selected.isAfter(maximum, "day")
    )
      return;
    setSelectedDate({
      year: selected.jYear(),
      month: selected.jMonth() + 1,
      day: selected.jDate(),
    });
    onSubmit();
  };
  const changeMonth = (offset: number) => {
    const next = date.clone().startOf("jMonth").add(offset, "jMonth");
    if (
      view !== "days" ||
      !hasDates ||
      next.clone().endOf("jMonth").isBefore(minimum, "day") ||
      next.isAfter(maximum, "day")
    )
      return;
    setDirection(offset > 0 ? -1 : 1);
    setChosenDate(next.format("jYYYY/jMM/jDD"));
  };
  const showDate = (next: moment.Moment) => {
    setDirection(next.isAfter(date, "day") ? -1 : 1);
    setChosenDate(moment.max(minimum, moment.min(maximum, next)).format("jYYYY/jMM/jDD"));
    setView("days");
    (view === "months" ? monthButtonRef : yearButtonRef).current?.focus();
  };
  const choiceClass =
    "flex min-h-12 items-center justify-center rounded-lg border border-primary-border px-2 text-sm text-dashboard-text transition-colors hover:bg-primary-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:border-primary-500 aria-pressed:bg-primary-500 aria-pressed:text-white";

  return (
    <div className="mpd-datepicker" dir="rtl">
      <div className="flex w-full flex-col gap-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="ماه قبل"
            disabled={
              view !== "days" ||
              !hasDates ||
              date
                .clone()
                .startOf("jMonth")
                .isSameOrBefore(minimum.clone().startOf("jMonth"), "day")
            }
            onClick={() => changeMonth(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-primary-500 disabled:opacity-40"
          >
            <ArrowRightIcon aria-hidden="true" />
          </button>
          <div className="flex min-w-0 items-center justify-center gap-1">
            <button
              ref={monthButtonRef}
              type="button"
              aria-label="ماه"
              aria-expanded={view === "months"}
              disabled={!hasDates}
              className="flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-sm text-dashboard-text transition-colors hover:bg-primary-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
              onClick={() => setView(view === "months" ? "days" : "months")}
            >
              {PERSIAN_MONTH_NAMES[month]}
              <CaretDownIcon
                aria-hidden="true"
                className={`size-3.5 shrink-0 transition-transform ${view === "months" ? "rotate-180" : ""}`}
              />
            </button>
            <button
              ref={yearButtonRef}
              type="button"
              aria-label="سال"
              aria-expanded={view === "years"}
              disabled={!hasDates}
              className="flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-sm text-dashboard-text transition-colors hover:bg-primary-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
              onClick={() => setView(view === "years" ? "days" : "years")}
            >
              {year}
              <CaretDownIcon
                aria-hidden="true"
                className={`size-3.5 shrink-0 transition-transform ${view === "years" ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          <button
            type="button"
            aria-label="ماه بعد"
            disabled={
              view !== "days" ||
              !hasDates ||
              date.clone().endOf("jMonth").isSameOrAfter(maximum, "day")
            }
            onClick={() => changeMonth(1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-primary-500 disabled:opacity-40"
          >
            <ArrowLeftIcon aria-hidden="true" />
          </button>
        </div>
        <div className="relative grid min-h-80 overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={view}
              initial={{
                y: reduceMotion || view === "days" ? 0 : -24,
                opacity: 0,
                clipPath: reduceMotion || view === "days" ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
              }}
              animate={{ y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)" }}
              exit={{
                y: reduceMotion || view === "days" ? 0 : -24,
                opacity: 0,
                clipPath: reduceMotion || view === "days" ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                pointerEvents: "none",
              }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
              className="col-start-1 row-start-1 min-h-0 min-w-0"
            >
              {!hasDates ? (
                <p role="alert" className="text-sm text-dashboard-danger">
                  تاریخی در بازه انتخابی وجود ندارد.
                </p>
              ) : view === "months" ? (
                <div
                  ref={monthGridRef}
                  aria-label="انتخاب ماه"
                  className="relative grid h-80 grid-cols-4 content-start gap-2 overflow-y-auto p-1"
                >
                  {PERSIAN_MONTH_NAMES.map((name, index) => {
                    const next = date.clone().startOf("jMonth").jMonth(index);
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={month === index}
                        disabled={
                          next.clone().endOf("jMonth").isBefore(minimum, "day") ||
                          next.isAfter(maximum, "day")
                        }
                        className={choiceClass}
                        onClick={() => showDate(next)}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              ) : view === "years" ? (
                <div
                  ref={yearGridRef}
                  aria-label="انتخاب سال"
                  className="relative grid h-80 grid-cols-4 content-start gap-2 overflow-y-auto overscroll-contain p-1"
                >
                  {Array.from(
                    { length: Math.max(0, lastYear - minimum.jYear() + 1) },
                    (_, index) => {
                      const value = minimum.jYear() + index;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={year === value}
                          className={choiceClass}
                          onClick={() => showDate(date.clone().startOf("jMonth").jYear(value))}
                        >
                          {value}
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <div
                  className="touch-pan-y select-none overflow-x-hidden"
                  onPointerDown={(event) => {
                    if (!event.isPrimary || event.button !== 0) return;
                    suppressDateClickRef.current = false;
                    swipeRef.current = {
                      pointerId: event.pointerId,
                      x: event.clientX,
                      y: event.clientY,
                      horizontal: false,
                      moved: false,
                    };
                  }}
                  onPointerMove={(event) => {
                    const swipe = swipeRef.current;
                    if (!swipe || swipe.pointerId !== event.pointerId) return;
                    const x = Math.abs(event.clientX - swipe.x);
                    const y = Math.abs(event.clientY - swipe.y);
                    if (x > 8 || y > 8) swipe.moved = true;
                    if (!swipe.horizontal && x > 8 && x > y * 1.2) {
                      swipe.horizontal = true;
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }
                  }}
                  onPointerUp={(event) => {
                    const swipe = swipeRef.current;
                    if (!swipe || swipe.pointerId !== event.pointerId) return;
                    swipeRef.current = null;
                    suppressDateClickRef.current = swipe.moved;
                    const x = event.clientX - swipe.x;
                    const y = event.clientY - swipe.y;
                    if (swipe.horizontal && Math.abs(x) >= 48 && Math.abs(x) > Math.abs(y) * 1.2) {
                      changeMonth(x > 0 ? 1 : -1);
                    }
                  }}
                  onPointerCancel={() => {
                    swipeRef.current = null;
                    suppressDateClickRef.current = true;
                  }}
                  onLostPointerCapture={() => {
                    swipeRef.current = null;
                  }}
                  onClickCapture={(event) => {
                    if (suppressDateClickRef.current && event.detail > 0) {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                >
                  <DaysOfTheWeek />
                  <div className="relative mt-2 grid overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.div
                        key={`${year}-${month}`}
                        custom={direction}
                        variants={{
                          enter: (value: number) => ({
                            x: reduceMotion ? 0 : value * 60,
                            opacity: 0,
                          }),
                          center: { x: 0, opacity: 1, pointerEvents: "auto" },
                          exit: (value: number) => ({
                            x: reduceMotion ? 0 : value * -60,
                            opacity: 0,
                            pointerEvents: "none",
                          }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
                        className="col-start-1 row-start-1"
                      >
                        <DayPicker
                          year={year}
                          month={month}
                          selectedDate={selectedDay}
                          minimum={minimum}
                          maximum={maximum}
                          onSelect={selectDay}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          type="button"
          disabled={!hasDates || view !== "days"}
          onClick={submitDate}
          className="flex h-10 w-full items-center justify-center rounded-md bg-primary-500 text-white disabled:opacity-40"
        >
          ثبت
        </button>
      </div>
    </div>
  );
}
