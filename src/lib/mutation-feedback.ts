import { toast } from "sonner";
import { errorMessage, toastError } from "@/lib/toast";

interface FeedbackMessages<TData> {
  loading?: string;
  success?: string | ((data: TData) => string);
  error: string;
  onSuccess?: (data: TData) => unknown;
}

interface FeedbackContext {
  toastId?: string | number;
}

export function mutationFeedback<TData>({ loading, success, error, onSuccess }: FeedbackMessages<TData>) {
  return {
    onMutate: (): FeedbackContext => ({ toastId: loading ? toast.loading(loading) : undefined }),
    onSuccess: async (data: TData, _variables: unknown, context?: FeedbackContext) => {
      const message = typeof success === "function" ? success(data) : success;
      if (message) toast.success(message, { id: context?.toastId });
      else if (context?.toastId !== undefined) toast.dismiss(context.toastId);
      await onSuccess?.(data);
    },
    onError: (cause: { message: string }, _variables: unknown, context?: FeedbackContext) => {
      toastError(errorMessage(error, cause), { id: context?.toastId });
    },
  };
}
