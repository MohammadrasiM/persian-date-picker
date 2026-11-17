"use client";

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDOMEffect, useReducedMotion, watchCssMotion } from "./animation.js";
import { CloseIcon } from "./Icons.js";
import { manageModal } from "./modal-effects.js";
import type { DatePickerModalProps } from "./types.js";

type ModalBottomSheetProps = {
  children: ReactNode;
  show: boolean;
  onHide: () => void;
  afterLeave?: () => void;
  title: string;
  options?: DatePickerModalProps["options"];
  style?: CSSProperties;
  closeLabel: string;
  closeButtonProps?: DatePickerModalProps["closeButtonProps"];
};

export default function ModalBottomSheet({
  show,
  onHide,
  afterLeave,
  children,
  title,
  options,
  style,
  closeLabel,
  closeButtonProps,
}: ModalBottomSheetProps) {
  const [present, setPresent] = useState(false);
  const [entered, setEntered] = useState(false);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ show, onHide, afterLeave });
  const titleId = useId();

  useDOMEffect(() => {
    callbacks.current = { show, onHide, afterLeave };
  });
  useDOMEffect(() => {
    if (show) setPresent(true);
  }, [show]);
  useDOMEffect(() => {
    if (!present) return;
    if (show) {
      let frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (callbacks.current.show) setEntered(true);
        });
      });
      return () => cancelAnimationFrame(frame);
    }
    setEntered(false);
    if (!panelRef.current) return;
    return watchCssMotion(
      panelRef.current,
      "transitionend",
      "transform",
      reducedMotion || !entered ? 0 : 200,
      () => {
        if (callbacks.current.show) return;
        setPresent(false);
        callbacks.current.afterLeave?.();
      },
    );
  }, [show, present, reducedMotion]);
  useDOMEffect(() => {
    if (!present || !rootRef.current || !panelRef.current) return;
    return manageModal(rootRef.current, panelRef.current, () => {
      if (callbacks.current.show) callbacks.current.onHide();
    });
  }, [present]);

  if (!present) return null;
  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="mpd-datepicker mpd-modal"
      style={style}
      dir="rtl"
      data-state={show && entered ? "open" : "closed"}
      data-closing={!show ? "true" : undefined}
      onClickCapture={(event) => {
        if (!show) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div
        aria-hidden="true"
        className={`mpd-modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm ${options?.backdropClass ?? ""}`}
      />
      <div
        className={
          options?.parentClass ??
          "fixed inset-0 flex h-[100dvh] w-full flex-col justify-end md:items-center md:justify-center md:px-4"
        }
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          style={style}
          className={`mpd-modal-panel max-h-[90dvh] w-full min-w-0 overflow-y-auto overscroll-contain rounded-t-2xl bg-surface px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 md:max-h-[75dvh] md:max-w-[26.25rem] md:rounded-2xl md:px-6 md:pb-4 ${options?.containerClass ?? ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="m-0 text-base font-medium text-dashboard-text">
              {title}
            </h2>
            <button
              aria-label={closeLabel}
              title={closeLabel}
              {...closeButtonProps}
              type="button"
              disabled={!show}
              onClick={onHide}
              className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-dashboard-text hover:bg-primary-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500 ${closeButtonProps?.className ?? ""}`}
            >
              <CloseIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
