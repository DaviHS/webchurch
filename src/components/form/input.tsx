import React from "react";
import { useFormContext } from "react-hook-form";

import { Input as InputSC } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface InputProps extends React.ComponentProps<"input"> {
  name: string;
  label?: string;
  description?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ name, label, placeholder, description, className, ...props }, ref) => {
    const form = useFormContext();

    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <InputSC
                placeholder={placeholder}
                {...props}
                {...field}
                className={cn("w-full", className)}
                ref={(element) => {
                  field.ref(element);
                  if (typeof ref === "function") ref(element);
                  else if (ref) ref.current = element;
                }}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      ></FormField>
    );
  },
);

Input.displayName = "Input";

export { Input };
