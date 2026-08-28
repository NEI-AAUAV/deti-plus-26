import { test, expect } from "@playwright/test";

// One browser is enough for pixel comparison; the other projects still run the
// functional suites.
test.describe.configure({ mode: "parallel" });

const WIDTHS = [320, 375, 768, 1024, 1440, 1920];

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    test.skip(
      test.info().project.name !== "chromium",
      "run layout checks once",
    );
    await page.setViewportSize({ width, height: 900 });
    await page.goto("index.html");

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, `page scrolls horizontally at ${width}px`).toBeLessThanOrEqual(1);
  });

  // Baselines are rendered by the local OS, so pixel comparison is opt-in
  // (`VISUAL=1 pnpm test:e2e`) rather than a CI gate that would fail on a
  // different platform's font rasterization.
  test(`hero screenshot at ${width}px`, async ({ page }) => {
    test.skip(!process.env.VISUAL, "set VISUAL=1 to compare screenshots");
    test.skip(
      test.info().project.name !== "chromium",
      "screenshot on one browser only",
    );
    await page.setViewportSize({ width, height: 900 });
    await page.goto("index.html");
    // Background decorations animate forever; freeze them for stable pixels.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("#about")).toHaveScreenshot(`hero-${width}.png`, {
      maxDiffPixelRatio: 0.005,
    });
  });
}
