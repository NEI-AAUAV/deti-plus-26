"use client";

import { useSearchParams} from "next/navigation";

import {CvUpload} from "@/components/registration/cv-upload";

export function CvTokenGate() {
  const token = useSearchParams().get("t") ?? "";
  return <CvUpload token={token} />;
}

