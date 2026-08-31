import { Suspense } from "react";
import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { CvTokenGate } from "@/components/registration/cv-token-gate";
import { BackgroundDecorations } from "@/components/background-decorations";

export const metadata: Metadata = {
  title: "Submit your CV — DETI+ 2026",
  description: "Upload or replace the CV linked to your DETI+ 2026 registration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CvPage() {
  return (
    <>
      <BackgroundDecorations />
      <Navbar />
      <main id="main" tabIndex={-1} className="relative z-10">
        <section
          aria-labelledby="cv-heading"
          className="mx-auto w-full max-w-2xl px-6 py-20 sm:py-28"
        >
          <h1 id="cv-heading" className="text-4xl font-bold sm:text-5xl">
            Your CV
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Upload the CV we will share with the partner companies. You can replace it at any
            time using this same link.
          </p>

          <div className="mt-12">
            <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
              <CvTokenGate />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
