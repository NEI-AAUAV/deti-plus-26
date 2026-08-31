import {
  expect,
  test,
} from "@playwright/test";

const NAV_LABELS = [
  "About",
  "Countdown",
  "Associations",
  "Timeline",
  "Sponsors",
  "Contacts",
];

test.beforeEach(
  async ({
           page,
         }) => {
    await page.goto(
      "index.html",
    );
  },
);

test(
  "hero renders the headline",
  async ({
           page,
         }) => {
    await expect(
      page.getByRole(
        "heading",
        {
          level:
            1,
        },
      ),
    ).toContainText(
      "connecting students with the future",
    );
  },
);

test(
  "every navigation anchor resolves to an existing section",
  async ({
           page,
         }) => {
    const hrefs =
      await page
        .locator(
          "nav a[href*='#']",
        )
        .evaluateAll(
          (
            links,
          ) => [
            ...new Set(
              links
                .map(
                  (
                    link,
                  ) => {
                    const href =
                      link.getAttribute(
                        "href",
                      );

                    if (
                      !href
                    ) {
                      return null;
                    }

                    const index =
                      href.indexOf(
                        "#",
                      );

                    return index >=
                    0
                      ? href.slice(
                        index,
                      )
                      : null;
                  },
                )
                .filter(
                  (
                    value,
                  ): value is string =>
                    Boolean(
                      value,
                    ) &&
                    value !==
                    "#",
                ),
            ),
          ],
        );

    expect(
      hrefs.length,
    ).toBeGreaterThan(
      0,
    );

    for (
      const href of
      hrefs
      ) {
      await expect(
        page.locator(
          href,
        ),
        `${href} should point at a real section`,
      ).toHaveCount(
        1,
      );
    }
  },
);

test(
  "desktop navigation exposes every section link",
  async ({
           page,
         }) => {
    test.skip(
      (
        page
          .viewportSize()
          ?.width ??
        0
      ) <
      768,
      "desktop-only navigation list",
    );

    for (
      const label of
      NAV_LABELS
      ) {
      await expect(
        page
          .locator(
            "nav ul",
          )
          .first()
          .getByText(
            label,
          ),
      ).toBeVisible();
    }
  },
);

test(
  "countdown survives hydration and reflects event state",
  async ({
           page,
         }) => {
    const section =
      page.locator(
        "#countdown",
      );

    const heading =
      page.locator(
        "#countdown-heading",
      );

    await expect(
      section,
    ).toBeVisible();

    await expect
      .poll(
        async () =>
          (
            await heading
              .textContent()
          )
            ?.trim()
            .toLowerCase() ??
          "",
        {
          timeout:
            10_000,
        },
      )
      .toMatch(
        /the event starts in|this edition has wrapped/,
      );

    const headingText =
      (
        await heading
          .textContent()
      )
        ?.trim()
        .toLowerCase() ??
      "";

    if (
      headingText.includes(
        "starts in",
      )
    ) {
      const secondsLabel =
        section.getByText(
          "Sec",
          {
            exact:
              true,
          },
        );

      await expect(
        secondsLabel,
      ).toBeVisible();

      const seconds =
        secondsLabel
          .locator(
            "..",
          )
          .locator(
            "span",
          )
          .first();

      const first =
        await seconds
          .textContent();

      await expect
        .poll(
          async () =>
            seconds.textContent(),
          {
            timeout:
              7_000,
          },
        )
        .not.toBe(
          first,
        );
    } else {
      await expect(
        section.getByText(
          "Sec",
          {
            exact:
              true,
          },
        ),
      ).toHaveCount(
        0,
      );

      await expect(
        section.getByText(
          /DETI\+ 2026 took place/i,
        ),
      ).toBeVisible();
    }
  },
);

test(
  "countdown does not depend on visitor timezone",
  async ({
           browser,
         }) => {
    /*
     * Freeze time so both browser contexts calculate the countdown from the
     * exact same instant.
     *
     * Without this, the contexts are created sequentially and a minute/hour
     * rollover can make the resulting text differ even though timezone
     * handling is completely correct.
     */
    const frozenNow =
      new Date(
        "2026-04-01T12:34:20.000Z",
      ).getTime();

    const readCountdown =
      async (
        timezoneId:
        string,
      ) => {
        const context =
          await browser
            .newContext({
              timezoneId,
            });

        await context.addInitScript(
          ({
             now,
           }) => {
            const NativeDate =
              Date;

            class MockDate extends NativeDate {
              constructor(
                ...args:
                ConstructorParameters<
                  typeof Date
                >
              ) {
                if (
                  args.length ===
                  0
                ) {
                  super(
                    now,
                  );

                  return;
                }

                super(
                  ...args,
                );
              }

              static now() {
                return now;
              }
            }

            Object.defineProperty(
              window,
              "Date",
              {
                value:
                MockDate,

                configurable:
                  true,

                writable:
                  true,
              },
            );
          },
          {
            now:
            frozenNow,
          },
        );

        const page =
          await context
            .newPage();

        await page.goto(
          "index.html",
        );

        const heading =
          page.locator(
            "#countdown-heading",
          );

        await expect
          .poll(
            async () =>
              (
                await heading
                  .textContent()
              )
                ?.trim()
                .toLowerCase() ??
              "",
            {
              timeout:
                10_000,
            },
          )
          .toBe(
            "the event starts in",
          );

        const section =
          page.locator(
            "#countdown",
          );

        const result = {
          heading:
            (
              await heading
                .textContent()
            )
              ?.trim() ??
            "",

          days:
            await readTimeUnit(
              section,
              "Days",
            ),

          hours:
            await readTimeUnit(
              section,
              "Hours",
            ),

          minutes:
            await readTimeUnit(
              section,
              "Min",
            ),

          seconds:
            await readTimeUnit(
              section,
              "Sec",
            ),
        };

        await context.close();

        return result;
      };

    const lisbon =
      await readCountdown(
        "Europe/Lisbon",
      );

    const saoPaulo =
      await readCountdown(
        "America/Sao_Paulo",
      );

    expect(
      lisbon,
    ).toEqual(
      saoPaulo,
    );
  },
);

test(
  "contacts accordion opens",
  async ({
           page,
         }) => {
    const trigger =
      page.getByRole(
        "button",
        {
          name:
            /Coordination/i,
        },
      );

    await expect(
      trigger,
    ).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await trigger.click();

    await expect(
      trigger,
    ).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
);

test(
  "collapsed mobile menu keeps its links out of the tab order",
  async ({
           page,
         }) => {
    test.skip(
      (
        page
          .viewportSize()
          ?.width ??
        0
      ) >=
      768,
      "mobile-only navigation panel",
    );

    const menu =
      page.locator(
        "#mobile-menu",
      );

    await expect(
      menu,
    ).toHaveAttribute(
      "inert",
      /.*/,
    );

    const toggle =
      page.getByRole(
        "button",
        {
          name:
            "Toggle menu",
        },
      );

    await toggle.click();

    await expect(
      toggle,
    ).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await expect(
      menu,
    ).not.toHaveAttribute(
      "inert",
      /.*/,
    );
  },
);

test(
  "SEO and social metadata are present",
  async ({
           page,
         }) => {
    await expect(
      page.locator(
        "link[rel=canonical]",
      ),
    ).toHaveAttribute(
      "href",
      "https://nei-aauav.github.io/deti-plus-26/",
    );

    await expect(
      page.locator(
        "meta[property='og:image']",
      ),
    ).toHaveAttribute(
      "content",
      /^https:\/\/nei-aauav\.github\.io\/deti-plus-26\/opengraph-image\.png/,
    );

    await expect(
      page.locator(
        "link[rel=icon]",
      ),
    ).toHaveAttribute(
      "href",
      /^\/deti-plus-26\/icon\.png/,
    );

    const jsonLd =
      await page
        .locator(
          "script[type='application/ld+json']",
        )
        .textContent();

    expect(
      JSON.parse(
        jsonLd ??
        "{}",
      ),
    ).toMatchObject({
      "@type":
        "Event",

      startDate:
        "2026-05-19T09:00:00+01:00",
    });
  },
);

test(
  "brand assets and crawler files are served with the right type",
  async ({
           request,
         }) => {
    for (
      const [
        path,
        type,
      ] of [
      [
        "icon.png",
        "image/png",
      ],
      [
        "apple-icon.png",
        "image/png",
      ],
      [
        "opengraph-image.png",
        "image/png",
      ],
      [
        "robots.txt",
        "text/plain",
      ],
      [
        "sitemap.xml",
        "application/xml",
      ],
    ] as const
      ) {
      const response =
        await request.get(
          path,
        );

      expect(
        response.status(),
        path,
      ).toBe(
        200,
      );

      expect(
        response
          .headers()[
          "content-type"
          ],
        path,
      ).toContain(
        type,
      );
    }
  },
);

async function readTimeUnit(
  section:
  import(
    "@playwright/test"
    ).Locator,

  label:
  string,
): Promise<string> {
  const unit =
    section
      .getByText(
        label,
        {
          exact:
            true,
        },
      )
      .locator(
        "..",
      );

  await expect(
    unit,
  ).toBeVisible();

  return (
    (
      await unit
        .locator(
          "span",
        )
        .first()
        .textContent()
    )
      ?.trim() ??
    ""
  );
}
