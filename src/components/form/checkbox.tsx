import React from "react";
import type * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useFormContext } from "react-hook-form";

import { Checkbox as CheckboxSC } from "@/components/ui/checkbox";
import { type Field } from "@/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    Field {}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ name, label, description, ...props }, ref) => {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name!}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
          <FormControl>
            <CheckboxSC
              ref={ref}
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
              {...props}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
        </FormItem>
      )}
    />
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
