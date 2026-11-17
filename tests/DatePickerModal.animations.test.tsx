import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatePicker, { DatePickerModal, type DatePickerModalProps } from "../src/index.js";

const matchMedia = window.matchMedia;
const listeners = new Set<() => void>();
let reducedMotion = false;
beforeAll(() => {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  window.matchMedia = vi.fn((query) => ({
    ...media,
    media: query,
    matches: reducedMotion,
    addEventListener: (_type, listener) => { listeners.add(listener as () => void); },
    removeEventListener: (_type, listener) => { listeners.delete(listener as () => void); },
  }));
});
beforeEach(() => { reducedMotion = false; });
afterAll(() => { window.matchMedia = matchMedia; });

function props(): DatePickerModalProps {
  return {
    show: true,
    onHide() {},
    selectedDate: { year: 1403, month: 1, day: 1 },
    minYear: 1402,
    maxYear: 1404,
    setSelectedDate: vi.fn(),
    afterLeave: vi.fn(),
  };
}

function transitionEnd(element: Element, propertyName = "transform") {
  fireEvent(element, Object.assign(new Event("transitionend", { bubbles: true }), { propertyName }));
}

function animationEnd(element: Element, animationName: string) {
  fireEvent(element, Object.assign(new Event("animationend", { bubbles: true }), { animationName }));
}

async function openModal() {
  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect(dialog.getAttribute("data-state")).toBe("open"));
  return dialog;
}

describe("CSS modal animation lifecycle", () => {
  it("retains the modal and scroll lock until its panel finishes exiting", async () => {
    const options = props();
    const view = render(<DatePickerModal {...options} />);
    const dialog = await openModal();
    const panel = dialog.querySelector(".mpd-modal-panel")!;
    view.rerender(<DatePickerModal {...options} show={false} />);
    expect(dialog.isConnected).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(options.afterLeave).not.toHaveBeenCalled();
    transitionEnd(screen.getByRole("button", { name: "روز 1" }));
    transitionEnd(panel, "opacity");
    expect(options.afterLeave).not.toHaveBeenCalled();
    transitionEnd(panel);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(options.afterLeave).toHaveBeenCalledOnce();
    transitionEnd(panel);
    expect(options.afterLeave).toHaveBeenCalledOnce();
  });

  it("finishes closing when the browser does not emit a completion event", async () => {
    const options = props();
    const view = render(<DatePickerModal {...options} />);
    const dialog = await openModal();
    const started = performance.now();
    view.rerender(<DatePickerModal {...options} show={false} />);
    expect(dialog.isConnected).toBe(true);
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(performance.now() - started).toBeGreaterThanOrEqual(200);
    expect(options.afterLeave).toHaveBeenCalledOnce();
  });

  it("cancels stale completion events and timers when reopened during exit", async () => {
    const options = props();
    const view = render(<DatePickerModal {...options} />);
    const dialog = await openModal();
    const panel = dialog.querySelector(".mpd-modal-panel")!;
    view.rerender(<DatePickerModal {...options} show={false} />);
    view.rerender(<DatePickerModal {...options} show />);
    await waitFor(() => expect(dialog.getAttribute("data-state")).toBe("open"));
    transitionEnd(panel);
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(options.afterLeave).not.toHaveBeenCalled();
    view.rerender(<DatePickerModal {...options} show={false} />);
    transitionEnd(panel);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(options.afterLeave).toHaveBeenCalledOnce();
  });

  it("cancels pending exit work when the component unmounts", async () => {
    const options = props();
    const overflow = document.body.style.overflow;
    const view = render(<DatePickerModal {...options} />);
    await openModal();
    view.rerender(<DatePickerModal {...options} show={false} />);
    view.unmount();
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(options.afterLeave).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe(overflow);
  });

  it("responds to reduced-motion changes while closing", async () => {
    const options = props();
    const view = render(<DatePickerModal {...options} />);
    await openModal();
    view.rerender(<DatePickerModal {...options} show={false} />);
    act(() => {
      reducedMotion = true;
      for (const listener of listeners) listener();
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(options.afterLeave).toHaveBeenCalledOnce();
  });
});

describe("CSS calendar animation lifecycle", () => {
  it("keeps only the latest outgoing month and prevents stale day selections", async () => {
    const user = userEvent.setup();
    const options = { ...props(), onSubmit: vi.fn() };
    const { container } = render(<DatePicker {...options} />);
    await user.click(screen.getByRole("button", { name: "ماه بعد" }));
    const old = container.querySelector('[data-animation="month"][data-phase="exit"]')!;
    await user.click(screen.getByRole("button", { name: "ماه بعد" }));
    const outgoing = container.querySelector('[data-animation="month"][data-phase="exit"]')!;
    expect(container.querySelectorAll('[data-animation="month"][data-phase="exit"]')).toHaveLength(1);
    expect(outgoing).not.toBe(old);
    expect(outgoing.getAttribute("aria-hidden")).toBe("true");
    expect(outgoing.hasAttribute("inert")).toBe(true);
    expect((outgoing as HTMLElement).style.getPropertyValue("--mpd-slide")).toBe("-60px");
    animationEnd(old, "mpd-month-exit");
    expect(outgoing.isConnected).toBe(true);
    fireEvent.click(outgoing.querySelector("button")!);
    await user.click(screen.getByRole("button", { name: "ثبت" }));
    expect(options.setSelectedDate).toHaveBeenCalledWith({ year: 1403, month: 1, day: 1 });
    animationEnd(outgoing, "mpd-view-exit");
    expect(outgoing.isConnected).toBe(true);
    animationEnd(outgoing, "mpd-month-exit");
    expect(outgoing.isConnected).toBe(false);
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain("خرداد");
    await user.click(screen.getByRole("button", { name: "ماه قبل" }));
    const reverse = container.querySelector<HTMLElement>('[data-animation="month"][data-phase="enter"]')!;
    expect(reverse.style.getPropertyValue("--mpd-slide")).toBe("60px");
  });

  it("preserves selector focus through rapid year/month/year changes", async () => {
    const user = userEvent.setup();
    const { container } = render(<DatePicker {...props()} onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "سال", exact: true }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "1403", exact: true }));
    await user.click(screen.getByRole("button", { name: "ماه", exact: true }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "فروردین", exact: true }));
    await user.click(screen.getByRole("button", { name: "سال", exact: true }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "1403", exact: true }));
    const outgoing = container.querySelector('[data-animation="view"][data-phase="exit"]')!;
    animationEnd(outgoing, "mpd-view-exit");
    await user.click(screen.getByRole("button", { name: "1404", exact: true }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "سال", exact: true }));
    await user.click(screen.getByRole("button", { name: "سال", exact: true }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "1404", exact: true }));
  });

  it("skips outgoing calendar layers when reduced motion is requested", async () => {
    reducedMotion = true;
    const user = userEvent.setup();
    const { container } = render(<DatePicker {...props()} onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "ماه بعد" }));
    expect(container.querySelector('[data-phase="exit"]')).toBeNull();
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain("اردیبهشت");
  });

  it("survives reversing direction and cleans up when animationend is missing", async () => {
    const user = userEvent.setup();
    const { container } = render(<DatePicker {...props()} onSubmit={() => {}} />);
    await user.click(screen.getByRole("button", { name: "ماه بعد" }));
    await user.click(screen.getByRole("button", { name: "ماه قبل" }));
    const active = screen.getByRole("button", { name: "روز 1" });
    await waitFor(() => expect(container.querySelector('[data-phase="exit"]')).toBeNull());
    expect(active.isConnected).toBe(true);
    expect(active.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "ماه", exact: true }).textContent).toContain("فروردین");
  });
});
