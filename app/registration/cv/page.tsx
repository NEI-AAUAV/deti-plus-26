import { Suspense } from "react";
import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { CvTokenGate } from "@/components/registration/cv-token-gate";
import { BackgroundDecorations } from "@/components/background-decorations";
import { RegistrationShell } from "@/components/registration/registration-shell";

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
        <RegistrationShell step={2}><section aria-labelledby="cv-heading" className="relative border border-border bg-card/50 p-6 sm:p-8 lg:p-10"><div aria-hidden="true" className="absolute left-[-1px] top-[-1px] h-5 w-5 border-l-2 border-t-2 border-accent" /><div className="mb-8 border-b border-border pb-6"><p className="font-display text-xs uppercase tracking-[0.2em] text-accent">Step 02</p><h1 id="cv-heading" className="mt-2 font-display text-3xl lowercase text-primary">your CV</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Upload the CV we will share with the partner companies. You can replace it at any time using this same link.</p></div><Suspense fallback={<p className="text-muted-foreground">Loading…</p>}><CvTokenGate /></Suspense></section></RegistrationShell>
      </main>
      <Footer />
    </>
  );
}
