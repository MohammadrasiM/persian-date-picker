"use client";

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, type ReactNode } from "react";
import { CloseIcon } from "./Icons.js";
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
  children,
  show,
  onHide,
  afterLeave,
  title,
  options,
}: ModalBottomSheetProps) {
  return (
    <Transition appear show={show} afterLeave={afterLeave} as={Fragment}>
      <Dialog as="div" className="mpd-datepicker mpd-modal" dir="rtl" onClose={onHide}>
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-out duration-300 motion-reduce:duration-0"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200 motion-reduce:duration-0"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div aria-hidden="true" className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div
          className={
            options?.parentClass ??
            "fixed inset-0 flex h-[100dvh] w-full flex-col justify-end md:items-center md:justify-center md:px-4"
          }
        >
          <TransitionChild
            as={Fragment}
            enter="transition-[transform,opacity] ease-out duration-300 motion-reduce:duration-0"
            enterFrom="translate-y-full md:translate-y-4 md:opacity-0 md:scale-95"
            enterTo="translate-y-0 opacity-100 md:scale-100"
            leave="transition-[transform,opacity] ease-in duration-200 motion-reduce:duration-0"
            leaveFrom="translate-y-0 opacity-100 md:scale-100"
            leaveTo="translate-y-full md:translate-y-4 md:opacity-0 md:scale-95"
          >
            <DialogPanel
              className={`max-h-[90dvh] w-full min-w-0 overflow-y-auto overscroll-contain rounded-t-2xl bg-surface px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 md:max-h-[75dvh] md:max-w-[26.25rem] md:rounded-2xl md:px-6 md:pb-4 ${options?.containerClass ?? ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="m-0 text-base font-medium text-dashboard-text">
                  {title}
                </DialogTitle>
                <button
                  type="button"
                  aria-label="بستن"
                  onClick={onHide}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dashboard-text hover:bg-primary-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500"
                >
                  <CloseIcon aria-hidden="true" className="size-5" />
                </button>
              </div>
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
