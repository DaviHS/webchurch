import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: React.ReactNode
  description?: React.ReactNode
  icon: LucideIcon
  href?: string
  isLoading?: boolean
  valueClassName?: string
  iconClassName?: string
}

export function StatCard({ title, value, description, icon: Icon, href, isLoading, valueClassName, iconClassName }: StatCardProps) {
  const content = (
    <Card className={cn("h-full transition-colors", href && "hover:border-primary/40 hover:bg-accent/40")}>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className={cn("truncate text-2xl font-bold tabular-nums", valueClassName)}>{value}</p>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <Icon className={cn("size-5 shrink-0 text-muted-foreground", iconClassName)} />
      </CardContent>
    </Card>
  )

  return href ? (
    <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  ) : (
    content
  )
}
