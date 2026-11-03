import { toast } from "sonner";

interface FeedbackMessages<TData> {
  success?: string | ((data: TData) => string);
  error: string;
  onSuccess?: (data: TData) => unknown;
}

export function mutationFeedback<TData>({ success, error, onSuccess }: FeedbackMessages<TData>) {
  return {
    onSuccess: async (data: TData) => {
      const message = typeof success === "function" ? success(data) : success;
      if (message) toast.success(message);
      await onSuccess?.(data);
    },
    onError: (cause: { message: string }) => {
      toast.error(`${error}: ${cause.message}`);
    },
  };
}
