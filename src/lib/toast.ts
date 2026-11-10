import { toast, type ExternalToast } from "sonner";

export const ERROR_TOAST_DURATION = 7000;

export const toastError = (message: string, options?: ExternalToast) =>
  toast.error(message, { duration: ERROR_TOAST_DURATION, ...options });

const NETWORK_ERROR = /failed to fetch|networkerror|network request failed|load failed|fetch failed/i;

export function errorMessage(prefix: string, cause: { message: string }) {
  return NETWORK_ERROR.test(cause.message) ? "Sem conexão. Verifique a internet e tente novamente." : `${prefix}: ${cause.message}`;
}
