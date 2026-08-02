export interface Field {
  label: string;
  description?: string;
  className?: string;
  placeholder?: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  closeOnSelect?: boolean;
}