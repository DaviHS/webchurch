"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const RemoteController = dynamic(
  () => import("@/components/presentation/remote/remote-controller").then((mod) => mod.RemoteController),
  { ssr: false },
);

function RemotePageContent() {
  const params = useSearchParams();
  return <RemoteController initialCode={params.get("code")} />;
}

export default function PresentationRemotePage() {
  return (
    <Suspense>
      <RemotePageContent />
    </Suspense>
  );
}
