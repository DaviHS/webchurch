"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageContextType {
  title: string
  subtitle?: string
  breadcrumbs: BreadcrumbItem[]
  setPageInfo: (info: {
    title: string
    subtitle?: string
    breadcrumbs?: BreadcrumbItem[]
  }) => void
}

const PageContext = createContext<PageContextType | undefined>(undefined)

export function PageProvider({ children }: { children: ReactNode }) {
  const [pageInfo, setPageInfo] = useState({
    title: "Igrela Central VCP",
    subtitle: "",
    breadcrumbs: [{ label: "Igrela Central VCP", href: "/app" }] as BreadcrumbItem[],
  })

  const setPageInfoHandler = (info: {
    title: string
    subtitle?: string
    breadcrumbs?: BreadcrumbItem[]
  }) => {
      setPageInfo((prev) => {
      const newBreadcrumbs =
        info.breadcrumbs || [{ label: "Igrela Central VCP", href: "/app" }, { label: info.title }];

      const isEqual =
        prev.title === info.title &&
        prev.subtitle === (info.subtitle || "") &&
        JSON.stringify(prev.breadcrumbs) === JSON.stringify(newBreadcrumbs);

      if (isEqual) return prev;

      return {
        title: info.title,
        subtitle: info.subtitle || "",
        breadcrumbs: newBreadcrumbs,
      };
    });
  };

  return (
    <PageContext.Provider
      value={{
        ...pageInfo,
        setPageInfo: setPageInfoHandler,
      }}
    >
      {children}
    </PageContext.Provider>
  )
}

export function usePageContext() {
  const context = useContext(PageContext)
  if (context === undefined) {
    throw new Error("usePageContext must be used within a PageProvider")
  }
  return context
}
