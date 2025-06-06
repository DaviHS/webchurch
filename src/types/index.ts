export interface ResponseAPI<T> {
  data: T;
  error: boolean;
  message: string;
}

export interface Field {
  label: string;
  description?: string;
  className?: string;
  placeholder?: string;
}
