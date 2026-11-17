"use client";

import DatePicker from "./DatePicker.js";
import ModalBottomSheet from "./ModalBottomSheet.js";
import type { DatePickerModalProps } from "./types.js";
import { defaultLabels, themeStyle } from "./customization.js";

export default function DatePickerModal({
  show,
  onHide,
  onSubmit,
  afterLeave,
  title = "انتخاب تاریخ",
  options,
  closeButtonProps,
  ...datePickerProps
}: DatePickerModalProps) {
  return (
    <ModalBottomSheet
      show={show}
      onHide={onHide}
      afterLeave={afterLeave}
      title={title}
      options={options}
      style={themeStyle(datePickerProps)}
      closeLabel={datePickerProps.labels?.close ?? defaultLabels.close}
      closeButtonProps={closeButtonProps}
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
