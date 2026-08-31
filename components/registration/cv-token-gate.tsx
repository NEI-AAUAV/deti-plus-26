"use client";

import {
  useSearchParams,
} from "next/navigation";

import {
  CvUpload,
} from "@/components/registration/cv-upload";

export function CvTokenGate() {
  const searchParams =
    useSearchParams();

  const token =
    searchParams.get(
      "t",
    ) ??
    "";

  return (
    <CvUpload
      token={
        token
      }
    />
  );
}
