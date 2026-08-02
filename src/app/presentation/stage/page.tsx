"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

const StageDisplay = dynamic(
  () => import("@/components/shared/presentation/stage-display"),
  { ssr: false }
);

export default function StageDisplayPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.style.margin = "0";
      document.documentElement.style.padding = "0";
      document.documentElement.style.overflow = "hidden";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.overflow = "hidden";
      document.body.style.backgroundColor = "#111827";
    }

    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
        document.body.style.backgroundColor = "";
      }
    };
  }, []);

  return <StageDisplay />;
}