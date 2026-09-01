// One-off generator for static DETI+ brand images consumed by Next and email.
//
// Run with: node scripts/generate-brand-images.mjs
import { ImageResponse } from "next/og.js";
import { createElement as h } from "react";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const BLACK = "#000000";
const WHITE = "#ffffff";
const CYAN = "#99ffff"; // hsl(180 100% 80%) — the site accent token

const architype = await readFile("public/fonts/Architype-Stedelijk.ttf");

async function render(element, options, outPath) {
  const response = new ImageResponse(element, options);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`${outPath} — ${buffer.length} bytes`);
}

await mkdir("public/email", { recursive: true });

const ogSize = { width: 1200, height: 630 };

await render(
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        background: BLACK,
        color: WHITE,
        padding: 80,
        fontFamily: "Architype",
      },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: 20 } },
      h("span", { style: { fontSize: 96 } }, "deti"),
      h("span", { style: { fontSize: 96, color: CYAN } }, "+"),
      h(
        "div",
        { style: { display: "flex", gap: 8, marginLeft: 24 } },
        h("div", { style: { width: 56, height: 56, background: WHITE } }),
        h("div", { style: { width: 56, height: 56, background: CYAN } }),
      ),
    ),
    h(
      "div",
      { style: { fontSize: 76, lineHeight: 1, maxWidth: 900 } },
      "connecting students with the future",
    ),
    h(
      "div",
      { style: { display: "flex", gap: 40, fontSize: 30, color: CYAN } },
      h("span", null, "MAY 19 - 21, 2026"),
      h("span", null, "DETI, UNIVERSIDADE DE AVEIRO"),
    ),
  ),
  {
    ...ogSize,
    fonts: [{ name: "Architype", data: architype, style: "normal", weight: 400 }],
  },
  "app/opengraph-image.png",
);

// Brand mark: white square + cyan square, echoing the hero blocks.
const icon = (px) =>
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        background: BLACK,
        alignItems: "center",
        justifyContent: "center",
        gap: Math.round(px * 0.0625),
      },
    },
    h("div", {
      style: {
        width: Math.round(px * 0.34),
        height: Math.round(px * 0.34),
        background: WHITE,
      },
    }),
    h("div", {
      style: {
        width: Math.round(px * 0.34),
        height: Math.round(px * 0.34),
        background: CYAN,
      },
    }),
  );

await render(icon(64), { width: 64, height: 64 }, "app/icon.png");
await render(icon(180), { width: 180, height: 180 }, "app/apple-icon.png");

// -----------------------------------------------------------------------------
// Email brand assets
// -----------------------------------------------------------------------------
//
// Email clients such as Gmail and Outlook do not reliably load custom webfonts.
// Therefore the logo and display headlines are rasterized at 2x resolution with
// the exact Architype font used by the site. They are displayed at half their
// pixel dimensions in email, keeping them sharp on Retina/HiDPI screens.

const emailFonts = [
  {
    name: "Architype",
    data: architype,
    style: "normal",
    weight: 400,
  },
];

await render(
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "transparent",
        fontFamily: "Architype",
      },
    },
    h(
      "span",
      {
        style: {
          fontSize: 176,
          lineHeight: 1,
          color: WHITE,
        },
      },
      "deti",
    ),
    h(
      "span",
      {
        style: {
          fontSize: 176,
          lineHeight: 1,
          color: CYAN,
          marginLeft: 8,
        },
      },
      "+",
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          gap: 14,
          marginLeft: 42,
          alignItems: "center",
        },
      },
      h("div", {
        style: {
          width: 64,
          height: 64,
          background: WHITE,
        },
      }),
      h("div", {
        style: {
          width: 64,
          height: 64,
          background: CYAN,
        },
      }),
    ),
  ),
  {
    width: 900,
    height: 260,
    fonts: emailFonts,
  },
  "public/email/deti-plus-logo.png",
);

const emailHeadlines = [
  ["headline-youre-in.png", "you're in.", 620],
  ["headline-waiting-list.png", "waiting list.", 780],
  ["headline-your-link.png", "your link.", 570],
  ["headline-cv-received.png", "CV received.", 730],
  ["headline-cv-updated.png", "CV updated.", 700],
  ["headline-cancelled.png", "cancelled.", 600],
  ["headline-restored.png", "restored.", 570],
  ["headline-status-update.png", "status update.", 790],
  ["headline-one-week-left.png", "one week left.", 820],
  ["headline-48-hours-left.png", "48 hours left.", 820],
  ["headline-one-week-to-go.png", "one week to go.", 890],
  ["headline-tomorrow.png", "tomorrow.", 620],
  ["headline-today.png", "today.", 450],
  ["headline-thank-you.png", "thank you.", 600],
];

for (const [fileName, text, width] of emailHeadlines) {
  await render(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "transparent",
          color: WHITE,
          fontFamily: "Architype",
          fontSize: 150,
          lineHeight: 0.9,
          letterSpacing: "-1px",
          whiteSpace: "nowrap",
        },
      },
      text,
    ),
    {
      width,
      height: 190,
      fonts: emailFonts,
    },
    `public/email/${fileName}`,
  );
}
