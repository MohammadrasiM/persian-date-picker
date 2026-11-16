import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePickerModal, type DatePickerModalProps } from "../src/index.js";
import { date } from "../src/date.js";

type PickerOptions = Omit<DatePickerModalProps, "show" | "onHide">;

function props(extra: Partial<PickerOptions> = {}): PickerOptions {
  return {
    selectedDate: { year: 1403, month: 1, day: 1 },
    minYear: 1402,
    maxYear: 1404,
    setSelectedDate: vi.fn(),
    ...extra,
  };
}

function Harness({ options, onHide }: { options: PickerOptions; onHide?: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setShow(true)}>
        باز کردن تقویم
      </button>
      <DatePickerModal
        {...options}
        show={show}
        onHide={() => {
          onHide?.();
          setShow(false);
        }}
      />
    </>
  );
}

describe("DatePickerModal", () => {
  it("renders only when opened and provides an accessible RTL dialog", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness options={props()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    const dialog = await screen.findByRole("dialog", { name: "انتخاب تاریخ" });
    expect(dialog.getAttribute("dir")).toBe("rtl");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(container.contains(dialog)).toBe(false);
    expect(screen.getByRole("button", { name: "بستن" })).toBeTruthy();
  });

  it("saves the date, calls onSubmit, and requests closing in that order", async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const setSelectedDate = vi.fn(() => order.push("selection"));
    const onSubmit = vi.fn(() => order.push("submit"));
    const onHide = vi.fn(() => order.push("hide"));
    const afterLeave = vi.fn();
    render(
      <Harness options={props({ setSelectedDate, onSubmit, afterLeave })} onHide={onHide} />,
    );
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    await user.click(await screen.findByRole("button", { name: "روز 10" }));
    expect(setSelectedDate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "ثبت" }));
    expect(setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 10 });
    expect(order).toEqual(["selection", "submit", "hide"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(afterLeave).toHaveBeenCalledOnce();
  });

  it("confirms without requiring an onSubmit callback", async () => {
    const user = userEvent.setup();
    const options = props();
    const onHide = vi.fn();
    render(<Harness options={options} onHide={onHide} />);
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    await user.click(await screen.findByRole("button", { name: "ثبت" }));
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 1 });
    expect(onHide).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("discards an unconfirmed draft on Escape and restores the confirmed date on reopening", async () => {
    const user = userEvent.setup();
    const options = props({ onSubmit: vi.fn() });
    const onHide = vi.fn();
    render(<Harness options={options} onHide={onHide} />);
    const trigger = screen.getByRole("button", { name: "باز کردن تقویم" });
    await user.click(trigger);
    await user.click(await screen.findByRole("button", { name: "روز 10" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onHide).toHaveBeenCalledOnce();
    expect(options.setSelectedDate).not.toHaveBeenCalled();
    expect(options.onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.click(trigger);
    expect((await screen.findByRole("button", { name: "روز 1" })).getAttribute("aria-pressed"))
      .toBe("true");
    expect(screen.getByRole("button", { name: "روز 10" }).getAttribute("aria-pressed"))
      .toBe("false");
  });

  it("dismisses from the close button without confirming", async () => {
    const user = userEvent.setup();
    const options = props({ onSubmit: vi.fn() });
    const onHide = vi.fn();
    render(<Harness options={options} onHide={onHide} />);
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    await user.click(await screen.findByRole("button", { name: "بستن" }));
    expect(onHide).toHaveBeenCalledOnce();
    expect(options.setSelectedDate).not.toHaveBeenCalled();
    expect(options.onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("dismisses on an outside click", async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    render(<Harness options={props()} onHide={onHide} />);
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    await screen.findByRole("dialog");
    await user.click(document.body);
    expect(onHide).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps keyboard focus inside the dialog", async () => {
    const user = userEvent.setup();
    render(<Harness options={props()} />);
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    const close = await screen.findByRole("button", { name: "بستن" });
    close.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "ثبت" }));
    await user.tab();
    expect(document.activeElement).toBe(close);
  });

  it("forwards date bounds and supports a custom title and container classes", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        options={props({
          title: "تاریخ تولد",
          minYear: 1403,
          minDate: date("1403/1/10", "jYYYY/jM/jD").format("X"),
          options: { containerClass: "calendar-theme", parentClass: "calendar-position" },
        })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    const dialog = await screen.findByRole("dialog", { name: "تاریخ تولد" });
    expect(dialog.querySelector(".calendar-theme")).toBeTruthy();
    expect(dialog.querySelector(".calendar-position")).toBeTruthy();
    expect(screen.getByRole("button", { name: "روز 9" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "روز 10" }).getAttribute("aria-pressed"))
      .toBe("true");
  });
});
