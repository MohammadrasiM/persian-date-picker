import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DatePicker from "../src/index.js";
import { date, moment } from "../src/date.js";

function props(extra = {}) {
  return {
    selectedDate: { year: 1403, month: 1, day: 1 },
    minYear: 1402,
    maxYear: 1404,
    setSelectedDate: vi.fn(),
    onSubmit: vi.fn(),
    ...extra,
  };
}

describe("Persian DatePicker", () => {
  it("keeps selection local until confirmation, then calls the callbacks in order", () => {
    const options = props();
    render(<DatePicker {...options} />);
    fireEvent.click(screen.getByRole("button", { name: "روز 10" }));
    expect(screen.getByRole("button", { name: "روز 10" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(options.setSelectedDate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 10 });
    expect(options.onSubmit).toHaveBeenCalledOnce();
    expect(options.setSelectedDate.mock.invocationCallOrder[0]).toBeLessThan(
      options.onSubmit.mock.invocationCallOrder[0],
    );
  });

  it("navigates with a horizontal swipe without selecting the touched day", async () => {
    const options = props();
    render(<DatePicker {...options} />);
    const day = screen.getByRole("button", { name: "روز 2" });
    fireEvent.pointerDown(day, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(day, { pointerId: 1, clientX: 170, clientY: 100 });
    fireEvent.pointerUp(day, { pointerId: 1, clientX: 170, clientY: 100 });
    fireEvent.click(day, { detail: 1 });
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain(
      "اردیبهشت",
    );
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 1 });
    await waitFor(() => expect(screen.getAllByRole("button", { name: "روز 2" })).toHaveLength(1));
  });

  it("does not change months during a vertical scroll gesture", () => {
    render(<DatePicker {...props()} />);
    const day = screen.getByRole("button", { name: "روز 2" });
    fireEvent.pointerDown(day, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(day, { pointerId: 1, clientX: 110, clientY: 180 });
    fireEvent.pointerUp(day, { pointerId: 1, clientX: 110, clientY: 180 });
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain(
      "فروردین",
    );
  });

  it("clamps the initial date and disables days before the Unix-second minimum", () => {
    render(
      <DatePicker
        {...props({ minDate: date("1403/1/10", "jYYYY/jM/jD").format("X"), minYear: 1403 })}
      />,
    );
    expect(screen.getByRole("button", { name: "روز 9" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "روز 10" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "ماه قبل" }).hasAttribute("disabled")).toBe(true);
  });

  it("respects the last year and disables navigation after Esfand", () => {
    render(<DatePicker {...props({ selectedDate: { year: 1404, month: 12, day: 29 } })} />);
    expect(screen.getByRole("button", { name: "ماه بعد" }).hasAttribute("disabled")).toBe(true);
  });

  it("changes months and years, returning focus to their header controls", async () => {
    render(<DatePicker {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: "ماه", exact: true }));
    fireEvent.click(await screen.findByRole("button", { name: "اردیبهشت", exact: true }));
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain(
      "اردیبهشت",
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "ماه", exact: true }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "اردیبهشت", exact: true })).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "سال", exact: true }));
    fireEvent.click(await screen.findByRole("button", { name: "1404", exact: true }));
    expect(screen.getByRole("button", { name: "سال", exact: true }).textContent).toContain("1404");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "سال", exact: true }));
  });

  it("reports an empty range and prevents confirmation", () => {
    const options = props({ minYear: 1405, maxYear: 1403 });
    render(<DatePicker {...options} />);
    expect(screen.getByRole("alert").textContent).toBe("تاریخی در بازه انتخابی وجود ندارد.");
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
    expect(options.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ثبت" }).hasAttribute("disabled")).toBe(true);
  });

  it("renders Esfand 30 only in a leap year", () => {
    const first = render(
      <DatePicker {...props({ selectedDate: { year: 1403, month: 12, day: 1 } })} />,
    );
    expect(screen.getByRole("button", { name: "روز 30" })).toBeTruthy();
    first.unmount();
    render(<DatePicker {...props({ selectedDate: { year: 1402, month: 12, day: 1 } })} />);
    expect(screen.queryByRole("button", { name: "روز 30" })).toBeNull();
  });

  it("aligns weeks from Saturday and allocates six rows when necessary", () => {
    const first = render(<DatePicker {...props()} />);
    let grid = screen.getByRole("button", { name: "روز 1" }).parentElement!;
    expect(Array.from(grid.children).indexOf(screen.getByRole("button", { name: "روز 1" }))).toBe(
      (date("1403/1/1", "jYYYY/jM/jD").day() + 1) % 7,
    );
    first.unmount();
    let month = 0;
    while (
      ((date(`1403/${month + 1}/1`, "jYYYY/jM/jD").day() + 1) % 7) +
        moment.jDaysInMonth(1403, month) <=
      35
    )
      month++;
    render(<DatePicker {...props({ selectedDate: { year: 1403, month: month + 1, day: 1 } })} />);
    grid = screen.getByRole("button", { name: "روز 1" }).parentElement!;
    expect(grid.children.length).toBe(42);
  });

  it("keeps numeric formatting and weekday placement stable under a host locale", async () => {
    await import("moment/locale/ar.js");
    const previous = moment.locale();
    moment.locale("ar");
    try {
      render(<DatePicker {...props()} />);
      expect(moment.locale()).toBe("ar");
      expect(screen.getByRole("button", { name: "سال", exact: true }).textContent).toContain(
        "1403",
      );
      expect(screen.getAllByRole("button", { name: /^روز / })).toHaveLength(31);
      expect(date("1403/1/1", "jYYYY/jM/jD").format("jYYYY/jM/jD")).toBe("1403/1/1");
    } finally {
      moment.locale(previous);
    }
  });

  it("supports keyboard activation through native day buttons", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const options = props();
    render(<DatePicker {...options} />);
    screen.getByRole("button", { name: "روز 12" }).focus();
    await user.keyboard(" ");
    await user.click(screen.getByRole("button", { name: "ثبت" }));
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 12 });
  });
});
