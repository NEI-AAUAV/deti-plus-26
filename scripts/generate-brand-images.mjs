// One-off generator for the static brand images consumed by Next's file
// conventions (app/icon.png, app/opengraph-image.png).
//
// These are committed to the repo on purpose: the dynamic `next/og` route
// variants emit extensionless files under `output: "export"`, which GitHub
// Pages serves with the wrong Content-Type, and the generated <link rel="icon">
// href drops the configured basePath.
//
// Run with: node scripts/generate-brand-images.mjs
import { ImageResponse } from "next/og.js";
import { createElement as h } from "react";
import { readFile, writeFile } from "node:fs/promises";

const BLACK = "#000000";
const WHITE = "#ffffff";
const CYAN = "#99ffff"; // hsl(180 100% 80%) — the --accent token

const architype = await readFile("public/fonts/Architype-Stedelijk.ttf");

async function render(element, options, outPath) {
  const response = new ImageResponse(element, options);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, buffer);
  console.log(`${outPath} — ${buffer.length} bytes`);
}

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
