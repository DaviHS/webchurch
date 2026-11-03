"use client";

import dynamic from "next/dynamic";
import { useDisplayPageStyles } from "../_hooks/use-display-page-styles";

const OutputWindow = dynamic(
  () => import("@/components/presentation/output-window").then((mod) => mod.OutputWindow),
  { ssr: false }
);

export default function StagePage() {
  useDisplayPageStyles("#09090b");
  return <OutputWindow role="stage" />;
}
