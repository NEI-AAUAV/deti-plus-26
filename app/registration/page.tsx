import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { RegistrationGate } from "@/components/registration/registration-gate";
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
        <RegistrationShell step={1}><RegistrationGate /></RegistrationShell>
      </main>
      <Footer />
    </>
  );
}
