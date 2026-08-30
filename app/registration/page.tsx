import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { RegistrationForm } from "@/components/registration/registration-form";

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
      <Navbar />
      <main id="main" tabIndex={-1} className="relative z-10">
        <section
          aria-labelledby="registration-heading"
          className="mx-auto w-full max-w-2xl px-6 py-20 sm:py-28"
        >
          <h1 id="registration-heading" className="text-4xl font-bold sm:text-5xl">
            Register
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Secure your place at DETI+. You can submit your CV right after signing up, or
            later — we will email you a personal link that stays valid.
          </p>

          <div className="mt-12">
            <RegistrationForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
