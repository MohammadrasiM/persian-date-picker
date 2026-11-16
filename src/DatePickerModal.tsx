"use client";

import DatePicker from "./DatePicker.js";
import ModalBottomSheet from "./ModalBottomSheet.js";
import type { DatePickerModalProps } from "./types.js";

export default function DatePickerModal({
  show,
  onHide,
  onSubmit,
  afterLeave,
  title = "انتخاب تاریخ",
  options,
  ...datePickerProps
}: DatePickerModalProps) {
  return (
    <ModalBottomSheet
      show={show}
      onHide={onHide}
      afterLeave={afterLeave}
      title={title}
      options={options}
    >
      <DatePicker
        {...datePickerProps}
        onSubmit={() => {
          onSubmit?.();
          onHide();
        }}
      />
    </ModalBottomSheet>
  );
}
