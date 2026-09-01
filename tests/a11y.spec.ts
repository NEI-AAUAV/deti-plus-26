import {
  test,
  expect,
} from "@playwright/test";

import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  {
    name: "home",
    path: "index.html",
  },
  {
    name: "registration",
    path: "registration/index.html",
  },
  {
    name: "cv upload",
    path: "registration/cv/index.html",
  },
];

for (const {
  name,
  path,
} of PAGES) {
  test(
    `${name} page has no serious or critical accessibility violations`,
    async ({
             page,
           }) => {
      /*
       * Accessibility should be evaluated against the settled UI, not against
       * intermediate opacity values produced by entrance animations.
       *
       * The application already supports prefers-reduced-motion and renders
       * Reveal content fully visible in that mode.
       */
      await page.emulateMedia({
        reducedMotion:
          "reduce",
      });

      await page.goto(
        path,
      );

      const {
        violations,
      } =
        await new AxeBuilder({
          page,
        })
          .withTags([
            "wcag2a",
            "wcag2aa",
            "wcag21a",
            "wcag21aa",
          ])
          .analyze();

      const blocking =
        violations.filter(
          (violation) =>
            [
              "serious",
              "critical",
            ].includes(
              violation.impact ??
              "",
            ),
        );

      const details =
        blocking.flatMap(
          (violation) =>
            violation.nodes.map(
              (
                node,
                index,
              ) => {
                const target =
                  node.target.join(
                    " > ",
                  );

                return [
                  `Rule: ${violation.id}`,
                  `Impact: ${violation.impact}`,
                  `Help: ${violation.help}`,
                  `Node: ${index + 1}/${violation.nodes.length}`,
                  `Target: ${target}`,
                  `HTML: ${node.html}`,
                  `Failure: ${node.failureSummary ?? "No failure summary"}`,
                ].join(
                  "\n",
                );
              },
            ),
        );

      expect(
        details,
      ).toEqual([]);
    },
  );
}
