import { test, expect } from "@playwright/test";

const NAV_LABELS = [
  "About",
  "Countdown",
  "Associations",
  "Timeline",
  "Sponsors",
  "Contacts",
];

test.beforeEach(async ({ page }) => {
  await page.goto("index.html");
});

test("hero renders the headline", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "connecting students with the future",
  );
});

test("every navigation anchor resolves to an existing section", async ({
  page,
}) => {
  const hrefs = await page
    .locator("nav a[href^='#']")
    .evaluateAll((links) => [
      ...new Set(links.map((l) => l.getAttribute("href"))),
    ]);

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    await expect(
      page.locator(href as string),
      `${href} should point at a real section`,
    ).toHaveCount(1);
  }
});

test("desktop navigation exposes every section link", async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) < 768,
    "desktop-only navigation list",
  );
  for (const label of NAV_LABELS) {
    await expect(page.locator("nav ul").first().getByText(label)).toBeVisible();
  }
});

test("countdown section survives hydration and reflects the event date", async ({
  page,
}) => {
  const section = page.locator("#countdown");
  await expect(section).toBeVisible();

  const heading = page.locator("#countdown-heading");
  await expect(heading).toHaveText(
    /the event starts in|this edition has wrapped/,
  );

  if ((await heading.textContent())?.includes("starts in")) {
    // Upcoming: the seconds box must actually tick.
    const seconds = section.getByText("Sec").locator("..").locator("span").first();
    const first = await seconds.textContent();
    await expect
      .poll(async () => seconds.textContent(), { timeout: 5_000 })
      .not.toBe(first);
  } else {
    // Past: never leave a frozen 00:00:00:00 on screen.
    await expect(section.getByText("Sec")).toHaveCount(0);
  }
});

test("countdown does not depend on the visitor timezone", async ({
  browser,
}) => {
  const readCountdown = async (timezoneId: string) => {
    const context = await browser.newContext({ timezoneId });
    const page = await context.newPage();
    await page.goto("index.html");
    await expect(page.locator("#countdown-heading")).not.toHaveText("");
    const text = await page.locator("#countdown").innerText();
    await context.close();
    // Drop the seconds digits, which legitimately differ between two loads.
    return text.replace(/\d{2}\s*Sec/, "");
  };

  expect(await readCountdown("Europe/Lisbon")).toBe(
    await readCountdown("America/Sao_Paulo"),
  );
});

test("contacts accordion opens", async ({ page }) => {
  const trigger = page.getByRole("button", { name: /Coordination/i });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("collapsed mobile menu keeps its links out of the tab order", async ({
  page,
}) => {
  test.skip(
    (page.viewportSize()?.width ?? 0) >= 768,
    "mobile-only navigation panel",
  );

  const menu = page.locator("#mobile-menu");
  await expect(menu).toHaveAttribute("inert", /.*/);

  const toggle = page.getByRole("button", { name: "Toggle menu" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(menu).not.toHaveAttribute("inert", /.*/);
});

test("SEO and social metadata are present", async ({ page }) => {
  await expect(page.locator("link[rel=canonical]")).toHaveAttribute(
    "href",
    "https://nei-aauav.github.io/deti-plus-26/",
  );
  await expect(page.locator("meta[property='og:image']")).toHaveAttribute(
    "content",
    /^https:\/\/nei-aauav\.github\.io\/deti-plus-26\/opengraph-image\.png/,
  );
  await expect(page.locator("link[rel=icon]")).toHaveAttribute(
    "href",
    /^\/deti-plus-26\/icon\.png/,
  );

  const jsonLd = await page
    .locator("script[type='application/ld+json']")
    .textContent();
  expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
    "@type": "Event",
    startDate: "2026-05-19T09:00:00+01:00",
  });
});

test("brand assets and crawler files are served with the right type", async ({
  request,
}) => {
  for (const [path, type] of [
    ["icon.png", "image/png"],
    ["apple-icon.png", "image/png"],
    ["opengraph-image.png", "image/png"],
    ["robots.txt", "text/plain"],
    ["sitemap.xml", "application/xml"],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(type);
  }
});
