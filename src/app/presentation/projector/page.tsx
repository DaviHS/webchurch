"use client";

import dynamic from "next/dynamic";
import { useDisplayPageStyles } from "../_hooks/use-display-page-styles";

const OutputWindow = dynamic(
  () => import("@/components/presentation/output-window").then((mod) => mod.OutputWindow),
  { ssr: false }
);

export default function ProjectorPage() {
  useDisplayPageStyles("#003F2D");
  return <OutputWindow role="projector" />;
}
