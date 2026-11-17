import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DatePicker, { DatePickerModal, type DatePickerProps } from "../src/index.js";

function props(extra: Partial<DatePickerProps> = {}): DatePickerProps {
  return {
    selectedDate: { year: 1403, month: 1, day: 1 },
    minYear: 1402,
    maxYear: 1404,
    setSelectedDate: vi.fn(),
    onSubmit: vi.fn(),
    ...extra,
  };
}

describe("DatePicker customization", () => {
  it("keeps instance colors separate and updates them without remounting", () => {
    const options = props();
    const view = render(<>
      <DatePicker {...options} primaryColor="#04A" buttonColor="#00695c" buttonTextColor="#eee"
        containerProps={{ id: "booking", className: "my-calendar", "data-testid": "booking" }} />
      <DatePicker {...options} primaryColor="#abCDEF" containerProps={{ "data-testid": "other" }} />
    </>);
    const calendar = screen.getByTestId("booking");
    expect(calendar.id).toBe("booking");
    expect(calendar.classList.contains("mpd-datepicker")).toBe(true);
    expect(calendar.classList.contains("my-calendar")).toBe(true);
    expect(calendar.style.getPropertyValue("--mpd-primary")).toBe("0 68 170");
    expect(calendar.style.getPropertyValue("--mpd-button-background")).toBe("#00695c");
    expect(calendar.style.getPropertyValue("--mpd-button-text")).toBe("#eee");
    expect(screen.getByTestId("other").style.getPropertyValue("--mpd-primary")).toBe("171 205 239");
    view.rerender(<DatePicker {...options} primaryColor="#123456" containerProps={{ "data-testid": "booking" }} />);
    expect(screen.getByTestId("booking").style.getPropertyValue("--mpd-primary")).toBe("18 52 86");
    view.rerender(<DatePicker {...options} primaryColor="invalid" containerProps={{ "data-testid": "booking" }} />);
    expect(screen.getByTestId("booking").style.getPropertyValue("--mpd-primary")).toBe("");
    expect(screen.getByTestId("booking").style.getPropertyValue("--mpd-button-background")).toBe("");
  });

  it("forwards native attributes and inline styles without replacing confirmation behavior", () => {
    const options = props();
    render(<DatePicker {...options}
      containerProps={{ "aria-label": "Booking calendar", style: { maxWidth: 360 } }}
      labels={{ submit: "Confirm date" }}
      submitButtonProps={{ id: "confirm", className: "my-button", title: "Save booking date",
        "data-testid": "confirm", "aria-describedby": "hint", style: { borderRadius: 24, backgroundColor: "navy" } }} />);
    const submit = screen.getByRole("button", { name: "Confirm date" });
    expect(submit.id).toBe("confirm");
    expect(submit.classList.contains("my-button")).toBe(true);
    expect(submit.title).toBe("Save booking date");
    expect(submit.getAttribute("data-testid")).toBe("confirm");
    expect(submit.getAttribute("aria-describedby")).toBe("hint");
    expect(submit.style.borderRadius).toBe("24px");
    expect(submit.style.backgroundColor).toBe("navy");
    expect(screen.getByLabelText("Booking calendar").style.maxWidth).toBe("360px");
    fireEvent.click(screen.getByRole("button", { name: "روز 10" }));
    fireEvent.click(submit);
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 10 });
    expect(options.onSubmit).toHaveBeenCalledOnce();
  });

  it("customizes navigation, selector, day, and empty-range labels", () => {
    const options = props({ labels: {
      previousMonth: "Previous", nextMonth: "Next", month: "Month", year: "Year",
      chooseMonth: "Choose month", chooseYear: "Choose year", day: (day) => `Day ${day}`,
      emptyRange: "No dates available",
    } });
    const view = render(<DatePicker {...options} />);
    for (const name of ["Previous", "Next", "Month", "Year", "Day 10"]) {
      expect(screen.getByRole("button", { name, exact: true }).title).toBe(name);
    }
    fireEvent.click(screen.getByRole("button", { name: "Month", exact: true }));
    expect(screen.getByLabelText("Choose month")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Year", exact: true }));
    expect(screen.getByLabelText("Choose year")).toBeTruthy();
    view.rerender(<DatePicker {...options} minYear={1405} maxYear={1404} />);
    expect(screen.getByRole("alert").textContent).toBe("No dates available");
    expect(screen.getByRole("button", { name: "ثبت" }).hasAttribute("disabled")).toBe(true);
  });

  it("disables selection, navigation, swipes, and confirmation, then supports reenabling", () => {
    const options = props();
    const view = render(<DatePicker {...options} disabled />);
    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
    const day = screen.getByRole("button", { name: "روز 10" });
    fireEvent.click(day);
    fireEvent.click(screen.getByRole("button", { name: "ماه بعد" }));
    fireEvent.pointerDown(day, { pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(day, { pointerId: 1, clientX: 180, clientY: 100 });
    fireEvent.pointerUp(day, { pointerId: 1, clientX: 180, clientY: 100 });
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain("فروردین");
    expect(day.getAttribute("aria-pressed")).toBe("false");
    expect(options.setSelectedDate).not.toHaveBeenCalled();
    expect(options.onSubmit).not.toHaveBeenCalled();
    view.rerender(<DatePicker {...options} />);
    fireEvent.click(day);
    fireEvent.click(screen.getByRole("button", { name: "ثبت" }));
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 10 });
  });

  it.each(["ماه", "سال"])("disables every choice when disabled while the %s selector is open", (name) => {
    const options = props();
    const view = render(<DatePicker {...options} />);
    fireEvent.click(screen.getByRole("button", { name, exact: true }));
    view.rerender(<DatePicker {...options} disabled />);
    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
  });

  it("preserves owned button behavior even for untyped prop bags", () => {
    const options = props();
    const replacement = vi.fn();
    const unsafe = { onClick: replacement, type: "submit", disabled: false, children: "Replace" } as unknown as NonNullable<DatePickerProps["submitButtonProps"]>;
    const view = render(<DatePicker {...options} submitButtonProps={unsafe} />);
    view.rerender(<DatePicker {...options} submitButtonProps={unsafe} minYear={1405} maxYear={1404} />);
    const submit = screen.getByRole("button", { name: "ثبت" });
    expect(submit.getAttribute("type")).toBe("button");
    expect(submit.hasAttribute("disabled")).toBe(true);
    fireEvent.click(submit);
    expect(replacement).not.toHaveBeenCalled();
    expect(options.onSubmit).not.toHaveBeenCalled();
    view.rerender(<DatePicker {...options} submitButtonProps={unsafe} />);
    fireEvent.click(submit);
    expect(replacement).not.toHaveBeenCalled();
    expect(options.onSubmit).toHaveBeenCalledOnce();
  });

  it("themes the modal portal and lets a disabled calendar be dismissed", async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    const { container } = render(<DatePickerModal {...props()} show onHide={onHide} disabled
      primaryColor="#004f98" buttonColor="#00695c" labels={{ close: "Dismiss", submit: "Confirm" }}
      containerProps={{ "data-testid": "modal-calendar" }}
      closeButtonProps={{ className: "my-close", title: "Close calendar", "data-testid": "close", style: { borderRadius: 24 } }}
      options={{ backdropClass: "my-backdrop" }} />);
    const dialog = await screen.findByRole("dialog");
    expect(container.contains(dialog)).toBe(false);
    expect(dialog.style.getPropertyValue("--mpd-primary")).toBe("0 79 152");
    expect(dialog.querySelector<HTMLElement>(".mpd-modal-panel")?.style.getPropertyValue("--mpd-primary")).toBe("0 79 152");
    expect(screen.getByTestId("modal-calendar").style.getPropertyValue("--mpd-primary")).toBe("0 79 152");
    expect(dialog.querySelector(".mpd-modal-backdrop")?.classList.contains("my-backdrop")).toBe(true);
    const close = within(dialog).getByRole("button", { name: "Dismiss" });
    expect(close.classList.contains("my-close")).toBe(true);
    expect(close.title).toBe("Close calendar");
    expect(close.style.borderRadius).toBe("24px");
    expect(close.hasAttribute("disabled")).toBe(false);
    expect(within(dialog).getByRole("button", { name: "Confirm" }).hasAttribute("disabled")).toBe(true);
    await user.click(close);
    expect(onHide).toHaveBeenCalledOnce();
  });
});
