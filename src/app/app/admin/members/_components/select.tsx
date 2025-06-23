import * as Select from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

interface SelectProps {
  value: string
  onChange: (value: string) => void
}

export function StatusSelect({ value, onChange }: SelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="inline-flex items-center justify-between rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full">
        <Select.Value placeholder="Todos" />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Content className="overflow-hidden rounded-md border border-input bg-background shadow-md z-50">
        <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-background text-muted-foreground">
          ▲
        </Select.ScrollUpButton>
        <Select.Viewport>
          <Select.Item
            value=""
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Todos</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="active"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Ativo</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="inactive"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Inativo</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="visiting"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Visitante</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="transferred"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Transferido</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Viewport>
        <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-background text-muted-foreground">
          ▼
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Root>
  )
}

export function GenderSelect({ value, onChange }: SelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="inline-flex items-center justify-between rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full">
        <Select.Value placeholder="Todos" />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Content className="overflow-hidden rounded-md border border-input bg-background shadow-md z-50">
        <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-background text-muted-foreground">
          ▲
        </Select.ScrollUpButton>
        <Select.Viewport>
          <Select.Item
            value=""
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Todos</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="male"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Masculino</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="female"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Feminino</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Viewport>
        <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-background text-muted-foreground">
          ▼
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Root>
  )
}

export function HasAccessSelect({ value, onChange }: SelectProps) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="inline-flex items-center justify-between rounded border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full">
        <Select.Value placeholder="Todos" />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Content className="overflow-hidden rounded-md border border-input bg-background shadow-md z-50">
        <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-background text-muted-foreground">
          ▲
        </Select.ScrollUpButton>
        <Select.Viewport>
          <Select.Item
            value=""
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Todos</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="true"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Com Acesso</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
          <Select.Item
            value="false"
            className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-4 text-sm font-medium text-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
          >
            <Select.ItemText>Sem Acesso</Select.ItemText>
            <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
              <Check className="h-4 w-4" />
            </Select.ItemIndicator>
          </Select.Item>
        </Select.Viewport>
        <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-background text-muted-foreground">
          ▼
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Root>
  )
}
