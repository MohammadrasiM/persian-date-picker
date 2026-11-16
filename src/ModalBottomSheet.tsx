"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
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
};

export default function ModalBottomSheet({
  show,
  afterLeave,
  ...contentProps
}: ModalBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence onExitComplete={afterLeave}>
      {show ? <SheetContent key="datepicker-modal" {...contentProps} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

function SheetContent({
  children,
  onHide,
  title,
  options,
}: Omit<ModalBottomSheetProps, "show" | "afterLeave">) {
  const isPresent = useIsPresent();
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ isPresent, onHide });
  const titleId = useId();

  useEffect(() => {
    callbacks.current = { isPresent, onHide };
  });
  useEffect(() => {
    if (!rootRef.current || !panelRef.current) return;
    return manageModal(rootRef.current, panelRef.current, () => {
      if (callbacks.current.isPresent) callbacks.current.onHide();
    });
  }, []);

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="mpd-datepicker mpd-modal"
      dir="rtl"
      initial={{ "--mpd-modal-progress": 0 }}
      animate={{ "--mpd-modal-progress": 1 }}
      exit={{ "--mpd-modal-progress": 0 }}
      transition={{
        duration: reducedMotion ? 0 : isPresent ? 0.3 : 0.2,
        ease: isPresent ? "easeOut" : "easeIn",
      }}
      data-closing={!isPresent ? "true" : undefined}
      onClickCapture={(event) => {
        if (!isPresent) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div
        aria-hidden="true"
        className="mpd-modal-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm"
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
          className={`mpd-modal-panel max-h-[90dvh] w-full min-w-0 overflow-y-auto overscroll-contain rounded-t-2xl bg-surface px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 md:max-h-[75dvh] md:max-w-[26.25rem] md:rounded-2xl md:px-6 md:pb-4 ${options?.containerClass ?? ""}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="m-0 text-base font-medium text-dashboard-text">
              {title}
            </h2>
            <button
              type="button"
              aria-label="بستن"
              disabled={!isPresent}
              onClick={onHide}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dashboard-text hover:bg-primary-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500"
            >
              <CloseIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
