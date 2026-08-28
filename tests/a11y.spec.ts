import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home page has no serious or critical accessibility violations", async ({
  page,
}) => {
  await page.goto("index.html");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const blocking = violations.filter((v) =>
    ["serious", "critical"].includes(v.impact ?? ""),
  );

  expect(
    blocking.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`),
  ).toEqual([]);
});
