export interface ResponseAPI<T> {
  error: boolean;
  message: string;
  data: T;
}
