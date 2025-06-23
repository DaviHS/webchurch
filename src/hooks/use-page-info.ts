"use client"

import { useEffect } from "react"
import { usePageContext } from "@/contexts/page-context"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface UsePageInfoProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
}

export function usePageInfo({ title, subtitle, breadcrumbs }: UsePageInfoProps) {
  const { setPageInfo } = usePageContext()

  useEffect(() => {
    setPageInfo({
      title,
      subtitle,
      breadcrumbs,
    })
  }, [title, subtitle, breadcrumbs, setPageInfo])
}
