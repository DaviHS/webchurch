import React from "react";
import { useFormContext } from "react-hook-form";

import { Input as InputSC } from "@/components/ui/input";
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
  ({ name, label, placeholder, description, ...props }, ref) => {
    const form = useFormContext();

    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <InputSC
                placeholder={placeholder}
                {...field}
                className="w-full"
                ref={ref}
                {...props}
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
