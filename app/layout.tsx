import React from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

const architype = localFont({
  src: "../public/fonts/Architype-Stedelijk.ttf",
  variable: "--font-architype",
  display: "swap",
});

const vayuSans = localFont({
  src: "../public/fonts/VayuSans-Medium.ttf",
  variable: "--font-vayusans",
  display: "swap",
});

const SITE_ORIGIN = "https://nei-aauav.github.io";
const BASE_PATH = "/deti-plus-26";
const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;
const TITLE = "DETI+ 2026 — Company Fair at Universidade de Aveiro";
const DESCRIPTION =
  "DETI+ is a 3-day company fair organized by NEEETA, NEI and NEECT at DETI, Universidade de Aveiro. September 29–October 1, 2026. Meet leading engineering and technology companies, explore internships and job offers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "DETI+ 2026",
  keywords: [
    "DETI+",
    "DETI Plus 2026",
    "feira de empresas",
    "company fair",
    "Universidade de Aveiro",
    "DETI",
    "NEI",
    "NEEETA",
    "NEECT",
    "internships",
    "engineering careers",
  ],
  alternates: {
    canonical: `${BASE_PATH}/`,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "DETI+ 2026",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "DETI+ 2026",
  description: DESCRIPTION,
  startDate: "2026-09-29T17:00:00+01:00",
  endDate: "2026-10-01",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  url: SITE_URL,
  location: {
    "@type": "Place",
    name: "Departamento de Eletrónica, Telecomunicações e Informática (DETI), Universidade de Aveiro",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Campus Universitário de Santiago",
      addressLocality: "Aveiro",
      postalCode: "3810-193",
      addressCountry: "PT",
    },
  },
  organizer: [
    { "@type": "Organization", name: "NEEETA" },
    { "@type": "Organization", name: "NEI" },
    { "@type": "Organization", name: "NEECT" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${architype.variable} ${vayuSans.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:uppercase focus:tracking-widest focus:text-accent-foreground"
        >
          Skip to content
        </a>

        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      </body>
    </html>
  );
}
