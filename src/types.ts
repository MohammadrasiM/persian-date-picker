import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

type DataAttributes = { [key: `data-${string}`]: string | number | boolean | undefined };

export type DatePickerButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "dangerouslySetInnerHTML" | "onClick" | "type" | "disabled"
> & DataAttributes;

export type DatePickerContainerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "dangerouslySetInnerHTML" | "dir"
> & DataAttributes;

export type DatePickerLabels = {
  submit?: string;
  previousMonth?: string;
  nextMonth?: string;
  month?: string;
  year?: string;
  chooseMonth?: string;
  chooseYear?: string;
  close?: string;
  emptyRange?: string;
  day?: (day: number) => string;
};

export type DatePickerSelectedDate = {
  day: number | string;
  month: number | string;
  year: number | string;
};

export type DatePickerProps = {
  selectedDate?: DatePickerSelectedDate;
  setSelectedDate: (date?: DatePickerSelectedDate) => void;
  minDate?: string;
  minYear?: number;
  maxYear?: number;
  pastYears?: number;
  nextYears?: number;
  primaryColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  submitButtonProps?: DatePickerButtonProps;
  containerProps?: DatePickerContainerProps;
  labels?: DatePickerLabels;
  disabled?: boolean;
  onSubmit: () => void;
};

export type DatePickerModalProps = Omit<DatePickerProps, "onSubmit"> & {
  show: boolean;
  onHide: () => void;
  onSubmit?: () => void;
  afterLeave?: () => void;
  title?: string;
  closeButtonProps?: DatePickerButtonProps;
  options?: {
    containerClass?: string;
    parentClass?: string;
    backdropClass?: string;
  };
};
