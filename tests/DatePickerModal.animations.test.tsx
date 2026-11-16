import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DatePickerModal, type DatePickerModalProps } from "../src/index.js";

// Exercise real animations in a separate environment from reduced-motion tests.
const matchMedia = window.matchMedia;
beforeAll(() => {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  window.matchMedia = vi.fn((query) => ({ ...media, media: query, matches: false }));
});
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

describe("DatePickerModal animation lifecycle", () => {
  it("waits for the real exit animation before releasing the modal", async () => {
    const options = props();
    const view = render(<DatePickerModal {...options} />);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog.style.getPropertyValue("--mpd-modal-progress")).toBe("1"));
    const started = performance.now();
    view.rerender(<DatePickerModal {...options} show={false} />);
    expect(dialog.isConnected).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    expect(options.afterLeave).not.toHaveBeenCalled();
    await waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(performance.now() - started).toBeGreaterThanOrEqual(150);
    expect(options.afterLeave).toHaveBeenCalledOnce();
  });

  it("cancels an interrupted exit when reopened and completes only the final close", async () => {
    const options = props();
    const view = render(<DatePickerModal {...options} />);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog.style.getPropertyValue("--mpd-modal-progress")).toBe("1"));
    view.rerender(<DatePickerModal {...options} show={false} />);
    await waitFor(() => {
      const progress = Number(dialog.style.getPropertyValue("--mpd-modal-progress"));
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });
    view.rerender(<DatePickerModal {...options} show />);
    await waitFor(() => expect(dialog.style.getPropertyValue("--mpd-modal-progress")).toBe("1"));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(options.afterLeave).not.toHaveBeenCalled();
    view.rerender(<DatePickerModal {...options} show={false} />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(options.afterLeave).toHaveBeenCalledOnce();
  });
});
