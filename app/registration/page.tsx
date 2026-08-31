import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { RegistrationForm } from "@/components/registration/registration-form";
import { BackgroundDecorations } from "@/components/background-decorations";
import { RegistrationShell } from "@/components/registration/registration-shell";

const TITLE = "Registration — DETI+";
const DESCRIPTION =
  "Register for DETI+ 2026, the company fair at Universidade de Aveiro, and submit your CV to the partner companies.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/deti-plus-26/registration/",
  },
  openGraph: {
    type: "website",
    url: "https://nei-aauav.github.io/deti-plus-26/registration/",
    siteName: "DETI+ 2026",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_GB",
  },
};

export default function RegistrationPage() {
  return (
    <>
      <BackgroundDecorations />
      <Navbar />
      <main id="main" tabIndex={-1} className="relative z-10">
        <RegistrationShell step={1}><section aria-labelledby="registration-heading" className="relative border border-border bg-card/50 p-6 sm:p-8 lg:p-10"><div aria-hidden="true" className="absolute left-[-1px] top-[-1px] h-5 w-5 border-l-2 border-t-2 border-accent" /><div aria-hidden="true" className="absolute bottom-[-1px] right-[-1px] h-5 w-5 border-b-2 border-r-2 border-accent" /><div className="mb-8 border-b border-border pb-6"><p className="font-display text-xs uppercase tracking-[0.2em] text-accent">Step 01</p><h2 id="registration-heading" className="mt-2 font-display text-3xl lowercase text-primary">your details</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Secure your place at DETI+. You can submit your CV right after signing up, or later — we will email you a personal link that stays valid.</p></div><RegistrationForm /></section></RegistrationShell>
      </main>
      <Footer />
    </>
  );
}
