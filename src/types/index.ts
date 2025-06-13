export interface ResponseAPI<T> {
  data: T;
  error: boolean;
  message: string;
}

export interface UserAPI {
  userId: number;
  name: string;
  email: string; 
  role: string;
}

export interface Field {
  label: string;
  description?: string;
  className?: string;
  placeholder?: string;
}
