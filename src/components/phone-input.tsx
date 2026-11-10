"use client"

import { forwardRef, type ComponentProps } from "react"
import { Input } from "@/components/ui/input"
import { formatPhone } from "@/lib/phone"

type PhoneInputProps = Omit<ComponentProps<typeof Input>, "type">

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput({ onChange, ...props }, ref) {
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="tel"
      maxLength={15}
      {...props}
      onChange={(event) => {
        event.target.value = formatPhone(event.target.value)
        onChange?.(event)
      }}
    />
  )
})
