import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const SCRIPT_HOST =
  "https://script.google.com/**";

const openAvailability = {
  ok:
    true,

  state:
    "open",

  opensAt:
    null,

  closesAt:
    null,

  capacity:
    500,

  registered:
    100,

  waitlisted:
    0,

  remaining:
    400,

  percentage:
    20,

  waitlistEnabled:
    true,

  maxWaitlist:
    100,

  eventName:
    "DETI+ 2026",
};

async function routeActions(
  page:
  Page,

  responses:
  Record<
    string,
    unknown
  >,
) {
  const calls:
    Record<
      string,
      unknown
    >[] = [];

  await page.route(
    SCRIPT_HOST,
    async (
      route,
    ) => {
      const payload =
        JSON.parse(
          route
            .request()
            .postData() ??
          "{}",
        ) as Record<
          string,
          unknown
        >;

      calls.push(
        payload,
      );

      const action =
        String(
          payload.action ??
          "",
        );

      const body =
        responses[
          action
          ];

      if (
        !body
      ) {
        throw new Error(
          `Unexpected Apps Script action: ${action}`,
        );
      }

      await route.fulfill({
        status:
          200,

        contentType:
          "application/json",

        body:
          JSON.stringify(
            body,
          ),
      });
    },
  );

  return calls;
}

async function fillRegistration(
  page:
  Page,
) {
  await page
    .getByLabel(
      /full name/i,
    )
    .fill(
      "Ana Silva",
    );

  await page
    .getByLabel(
      /^email/i,
    )
    .fill(
      "ana@ua.pt",
    );

  await page
    .getByLabel(
      /course/i,
    )
    .fill(
      "Computer Engineering",
    );

  await page
    .getByRole(
      "combobox",
      {
        name:
          /academic year/i,
      },
    )
    .click();

  await page
    .getByRole(
      "option",
      {
        name:
          "3",

        exact:
          true,
      },
    )
    .click();

  await page
    .getByRole(
      "checkbox",
      {
        name:
          /data/i,
      },
    )
    .check();
}

test.describe(
  "registration schema v2",
  () => {
    test(
      "sends course instead of legacy curse",
      async ({
               page,
             }) => {
        const calls =
          await routeActions(
            page,
            {
              registration_status:
              openAvailability,

              register: {
                ok:
                  true,

                registered:
                  true,

                status:
                  "confirmed",

                alreadyRegistered:
                  false,

                cvUploaded:
                  false,

                magicLinkSent:
                  true,
              },
            },
          );

        await page.goto(
          "registration/index.html",
        );

        await fillRegistration(
          page,
        );

        await page
          .getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          )
          .click();

        const registerCall =
          calls.find(
            (
              call,
            ) =>
              call.action ===
              "register",
          );

        expect(
          registerCall,
        ).toBeDefined();

        expect(
          registerCall,
        ).toMatchObject({
          course:
            "Computer Engineering",
        });

        expect(
          registerCall,
        ).not.toHaveProperty(
          "curse",
        );
      },
    );

    test(
      "renders registration id on CV page",
      async ({
               page,
             }) => {
        await routeActions(
          page,
          {
            fetch_status: {
              ok:
                true,

              registrationId:
                "DET26-0042",

              name:
                "Ana Silva",

              email:
                "an***@ua.pt",

              registrationStatus:
                "confirmed",

              cvStatus:
                "none",

              hasCv:
                false,

              cvName:
                "",

              cvSubmittedAt:
                "",

              cvUpdatedAt:
                "",

              cvUploadsOpen:
                true,

              cvDeadline:
                null,
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=test-token",
        );

        await expect(
          page.getByText(
            "DET26-0042",
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /no cv has been submitted/i,
          ),
        ).toBeVisible();
      },
    );

    test(
      "shows original CV submission and last update independently",
      async ({
               page,
             }) => {
        await routeActions(
          page,
          {
            fetch_status: {
              ok:
                true,

              registrationId:
                "DET26-0042",

              name:
                "Ana Silva",

              email:
                "an***@ua.pt",

              registrationStatus:
                "confirmed",

              cvStatus:
                "updated",

              hasCv:
                true,

              cvName:
                "ana-silva.pdf",

              cvSubmittedAt:
                "2026-08-01T10:00:00.000Z",

              cvUpdatedAt:
                "2026-08-20T15:30:00.000Z",

              cvUploadsOpen:
                true,

              cvDeadline:
                "2026-09-15T23:59:00.000Z",
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=test-token",
        );

        await expect(
          page.getByText(
            /cv updated/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /first submitted/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /last updated/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /replace cv/i,
            },
          ),
        ).toBeVisible();
      },
    );

    test(
      "updates CV status after replacing a file",
      async ({
               page,
             }) => {
        await routeActions(
          page,
          {
            fetch_status: {
              ok:
                true,

              registrationId:
                "DET26-0042",

              name:
                "Ana Silva",

              email:
                "an***@ua.pt",

              registrationStatus:
                "confirmed",

              cvStatus:
                "submitted",

              hasCv:
                true,

              cvName:
                "old.pdf",

              cvSubmittedAt:
                "2026-08-01T10:00:00.000Z",

              cvUpdatedAt:
                "2026-08-01T10:00:00.000Z",

              cvUploadsOpen:
                true,

              cvDeadline:
                null,
            },

            upload: {
              ok:
                true,

              uploaded:
                true,

              cvStatus:
                "updated",

              cvName:
                "new.pdf",

              cvSubmittedAt:
                "2026-08-01T10:00:00.000Z",

              cvUpdatedAt:
                "2026-08-20T12:00:00.000Z",
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=test-token",
        );

        await page
          .locator(
            "#cv",
          )
          .setInputFiles({
            name:
              "new.pdf",

            mimeType:
              "application/pdf",

            buffer:
              Buffer.from(
                "%PDF-1.4\nstub\n%%EOF\n",
              ),
          });

        await page
          .getByRole(
            "button",
            {
              name:
                /replace cv/i,
            },
          )
          .click();

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /cv updated/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "new.pdf",
          ),
        ).toBeVisible();
      },
    );

    test(
      "blocks CV replacement when registration is cancelled",
      async ({
               page,
             }) => {
        await routeActions(
          page,
          {
            fetch_status: {
              ok:
                true,

              registrationId:
                "DET26-0042",

              name:
                "Ana Silva",

              email:
                "an***@ua.pt",

              registrationStatus:
                "cancelled",

              cvStatus:
                "submitted",

              hasCv:
                true,

              cvName:
                "ana.pdf",

              cvSubmittedAt:
                "2026-08-01T10:00:00.000Z",

              cvUpdatedAt:
                "2026-08-01T10:00:00.000Z",

              cvUploadsOpen:
                true,

              cvDeadline:
                null,
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=test-token",
        );

        await expect(
          page.getByText(
            /registration cancelled/i,
          ),
        ).toBeVisible();

        await expect(
          page.locator(
            "#cv",
          ),
        ).toHaveCount(
          0,
        );
      },
    );
  },
);
