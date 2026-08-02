"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

const MainDisplay = dynamic(
  () => import("@/components/shared/presentation/main-display"),
  { ssr: false }
);

export default function MainDisplayPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.margin = "0";
      document.documentElement.style.padding = "0";
      document.documentElement.style.overflow = "hidden";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.overflow = "hidden";
      document.body.style.backgroundColor = "#1e3a8a";
    }

    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
        document.body.style.backgroundColor = "";
      }
    };
  }, []);

  return <MainDisplay />;
}