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
  onSubmit: () => void;
};

export type DatePickerModalProps = Omit<DatePickerProps, "onSubmit"> & {
  show: boolean;
  onHide: () => void;
  onSubmit?: () => void;
  afterLeave?: () => void;
  title?: string;
  options?: {
    containerClass?: string;
    parentClass?: string;
  };
};
