import {
  expect,
  test,
  type Page,
} from "@playwright/test";

const SCRIPT_HOST =
  "https://script.google.com/**";

const TEST_COURSE =
  "Bachelor's Degree in Computer and Informatics Engineering";

type ApiCall =
  Record<
    string,
    unknown
  >;

type StubOptions = {
  responses:
    Record<
      string,
      unknown
    >;

  status?:
    number;
};

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

const openCvStatus = {
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
};

async function stubScript(
  page:
  Page,

  options:
  StubOptions,
) {
  const calls:
    ApiCall[] = [];

  await page.route(
    SCRIPT_HOST,
    async (
      route,
    ) => {
      const raw =
        route
          .request()
          .postData() ??
        "{}";

      const payload =
        JSON.parse(
          raw,
        ) as ApiCall;

      calls.push(
        payload,
      );

      const action =
        String(
          payload.action ??
          "",
        );

      const response =
        options.responses[
          action
          ];

      if (
        typeof response ===
        "undefined"
      ) {
        throw new Error(
          `Unexpected Apps Script action: ${action}`,
        );
      }

      await route.fulfill({
        status:
          options.status ??
          200,

        contentType:
          "application/json",

        body:
          JSON.stringify(
            response,
          ),
      });
    },
  );

  return calls;
}

async function fillValidForm(
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
    .getByRole(
      "combobox",
      {
        name:
          /course/i,
      },
    )
    .click();

  await page
    .getByRole(
      "option",
      {
        name:
          TEST_COURSE,

        exact:
          true,
      },
    )
    .click();

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

function pdfFile(
  name =
  "cv.pdf",
) {
  return {
    name,

    mimeType:
      "application/pdf",

    buffer:
      Buffer.from(
        "%PDF-1.4\nstub\n%%EOF\n",
      ),
  };
}

// -----------------------------------------------------------------------------
// Registration
// -----------------------------------------------------------------------------

test.describe(
  "registration form",
  () => {
    test(
      "submits canonical registration fields",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
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
            },
          );

        await page.goto(
          "registration/index.html",
        );

        await fillValidForm(
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

        await expect(
          page.getByText(
            /registration confirmed/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "ana@ua.pt",
          ),
        ).toBeVisible();

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
          action:
            "register",

          name:
            "Ana Silva",

          email:
            "ana@ua.pt",

          course:
            TEST_COURSE,

          year:
            "3",

          hasGdprConsent:
            true,

          website:
            "",
        });

        /*
         * The legacy typo must never leave the frontend anymore.
         */
        expect(
          registerCall,
        ).not.toHaveProperty(
          "curse",
        );
      },
    );

    test(
      "normalizes email and trims fields",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
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
            },
          );

        await page.goto(
          "registration/index.html",
        );

        await page
          .getByLabel(
            /full name/i,
          )
          .fill(
            "  Ana Silva  ",
          );

        await page
          .getByLabel(
            /^email/i,
          )
          .fill(
            "  ANA@UA.PT  ",
          );

        await page
          .getByRole(
            "combobox",
            {
              name:
                /course/i,
            },
          )
          .click();

        await page
          .getByRole(
            "option",
            {
              name:
                "Other",

              exact:
                true,
            },
          )
          .click();

        await page
          .getByPlaceholder(
            "Specify your course",
          )
          .fill(
            "  Computer Engineering  ",
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
        ).toMatchObject({
          name:
            "Ana Silva",

          email:
            "ana@ua.pt",

          course:
            "Computer Engineering",
        });
      },
    );

    test(
      "blocks invalid registration before server submission",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
                registration_status:
                openAvailability,
              },
            },
          );

        await page.goto(
          "registration/index.html",
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

        await expect(
          page.getByText(
            /provide your full name/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /enter a valid email address/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /specify your course/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /select the academic year/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /accept the data policy/i,
          ),
        ).toBeVisible();

        expect(
          calls.filter(
            (
              call,
            ) =>
              call.action ===
              "register",
          ),
        ).toHaveLength(
          0,
        );
      },
    );

    test(
      "handles capacity race from backend",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
              openAvailability,

              register: {
                ok:
                  false,

                error:
                  "registration_full",

                message:
                  "All available places have been filled.",
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await fillValidForm(
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

        await expect(
          page.getByText(
            "All available places have been filled.",
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /registration confirmed/i,
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "treats duplicate registration as success",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
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
                  true,

                cvUploaded:
                  false,

                magicLinkSent:
                  true,
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await fillValidForm(
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

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /already registered/i,
            },
          ),
        ).toBeVisible();
      },
    );

    test(
      "requires CV sharing consent when registering with CV",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
                registration_status:
                openAvailability,
              },
            },
          );

        await page.goto(
          "registration/index.html",
        );

        await fillValidForm(
          page,
        );

        await page
          .locator(
            "#cv",
          )
          .setInputFiles(
            pdfFile(),
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

        await expect(
          page.getByText(
            /authorize sharing your cv/i,
          ),
        ).toBeVisible();

        expect(
          calls.filter(
            (
              call,
            ) =>
              call.action ===
              "register",
          ),
        ).toHaveLength(
          0,
        );
      },
    );

    test(
      "uploads CV together with registration",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
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
                    true,

                  magicLinkSent:
                    true,
                },
              },
            },
          );

        await page.goto(
          "registration/index.html",
        );

        await fillValidForm(
          page,
        );

        await page
          .locator(
            "#cv",
          )
          .setInputFiles(
            pdfFile(),
          );

        await expect(
          page.getByTitle(
            /preview before submission/i,
          ),
        ).toBeVisible();

        await page
          .getByRole(
            "checkbox",
            {
              name:
                /authorize the sharing/i,
            },
          )
          .check();

        await page
          .getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          )
          .click();

        await expect(
          page.getByText(
            /your cv was received successfully/i,
          ),
        ).toBeVisible();

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
        ).toMatchObject({
          cv: {
            filename:
              "cv.pdf",

            mime:
              "application/pdf",
          },
        });

        expect(
          String(
            (
              registerCall?.cv as
                | Record<
                string,
                unknown
              >
                | undefined
            )?.data ??
            "",
          ),
        ).toMatch(
          /^JVBER/,
        );
      },
    );
  },
);

// -----------------------------------------------------------------------------
// Registration availability
// -----------------------------------------------------------------------------

test.describe(
  "registration availability gate",
  () => {
    test(
      "shows almost-full warning",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ...openAvailability,

                state:
                  "almost_full",

                remaining:
                  2,

                percentage:
                  99,
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByText(
            /only 2 places remain/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toBeVisible();
      },
    );

    test(
      "hides form when registrations are full",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ...openAvailability,

                state:
                  "full",

                registered:
                  500,

                remaining:
                  0,

                percentage:
                  100,
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /registrations are full/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "500",
            {
              exact:
                true,
            },
          ).first(),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "allows joining waitlist",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ...openAvailability,

                state:
                  "waitlist",

                registered:
                  500,

                waitlisted:
                  17,

                remaining:
                  0,

                percentage:
                  100,
              },

              register: {
                ok:
                  true,

                registered:
                  true,

                status:
                  "waitlisted",

                alreadyRegistered:
                  false,

                cvUploaded:
                  false,

                magicLinkSent:
                  true,
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /join the waiting list/i,
            },
          ),
        ).toBeVisible();

        await fillValidForm(
          page,
        );

        await page
          .getByRole(
            "button",
            {
              name:
                /join waiting list/i,
            },
          )
          .click();

        await expect(
          page.getByText(
            /you're on the waiting list/i,
          ),
        ).toBeVisible();
      },
    );

    test(
      "hides form before opening",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ...openAvailability,

                state:
                  "not_started",

                opensAt:
                  "2026-09-01T09:00:00.000Z",
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /not open yet/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "hides form after close",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ...openAvailability,

                state:
                  "closed",

                closesAt:
                  "2026-08-30T23:59:00.000Z",
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /registrations are closed/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "hides form while registrations are disabled",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ...openAvailability,

                state:
                  "disabled",
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /temporarily unavailable/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "fails closed for malformed availability response",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status: {
                ok:
                  true,
              },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /unable to check availability/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "can retry failed availability request",
      async ({
               page,
             }) => {
        let count =
          0;

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
              );

            if (
              payload.action !==
              "registration_status"
            ) {
              throw new Error(
                "Unexpected request",
              );
            }

            count++;

            if (
              count ===
              1
            ) {
              await route.fulfill({
                status:
                  500,

                contentType:
                  "application/json",

                body:
                  "{}",
              });

              return;
            }

            await route.fulfill({
              status:
                200,

              contentType:
                "application/json",

              body:
                JSON.stringify(
                  openAvailability,
                ),
            });
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /unable to check availability/i,
            },
          ),
        ).toBeVisible();

        await page
          .getByRole(
            "button",
            {
              name:
                /try again/i,
            },
          )
          .click();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /confirm registration/i,
            },
          ),
        ).toBeVisible();

        expect(
          count,
        ).toBe(
          2,
        );
      },
    );
  },
);

// -----------------------------------------------------------------------------
// CV access
// -----------------------------------------------------------------------------

test.describe(
  "CV management",
  () => {
    test(
      "rejects URL without token",
      async ({
               page,
             }) => {
        await page.goto(
          "registration/cv/index.html",
        );

        await expect(
          page.getByText(
            /link not valid/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /missing its access code/i,
          ),
        ).toBeVisible();
      },
    );

    test(
      "shows canonical participant registration id",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status:
              openCvStatus,
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByText(
            "Ana Silva",
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "DET26-0042",
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /confirmed/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /no cv has been submitted yet/i,
          ),
        ).toBeVisible();
      },
    );

    test(
      "shows submitted CV",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status: {
                ...openCvStatus,

                cvStatus:
                  "submitted",

                hasCv:
                  true,

                cvName:
                  "CV_ana-silva.pdf",

                cvSubmittedAt:
                  "2026-08-01T10:15:00.000Z",

                cvUpdatedAt:
                  "2026-08-01T10:15:00.000Z",
              },
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByText(
            /cv submitted/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "CV_ana-silva.pdf",
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /first submitted/i,
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
      "distinguishes updated CV from first submission",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status: {
                ...openCvStatus,

                cvStatus:
                  "updated",

                hasCv:
                  true,

                cvName:
                  "CV_ana-silva-v2.pdf",

                cvSubmittedAt:
                  "2026-08-01T10:15:00.000Z",

                cvUpdatedAt:
                  "2026-08-20T17:40:00.000Z",
              },
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
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
      },
    );

    test(
      "uploads first CV",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
                fetch_status:
                openCvStatus,

                upload: {
                  ok:
                    true,

                  uploaded:
                    true,

                  cvStatus:
                    "submitted",

                  cvName:
                    "CV_ana-silva.pdf",

                  cvSubmittedAt:
                    "2026-08-31T19:00:00.000Z",

                  cvUpdatedAt:
                    "2026-08-31T19:00:00.000Z",
                },
              },
            },
          );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await page
          .locator(
            "#cv",
          )
          .setInputFiles(
            pdfFile(),
          );

        await page
          .getByRole(
            "button",
            {
              name:
                /submit cv/i,
            },
          )
          .click();

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /cv received/i,
            },
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            "CV_ana-silva.pdf",
          ),
        ).toBeVisible();

        const uploadCall =
          calls.find(
            (
              call,
            ) =>
              call.action ===
              "upload",
          );

        expect(
          uploadCall,
        ).toMatchObject({
          action:
            "upload",

          token:
            "token-123",

          filename:
            "cv.pdf",

          mime:
            "application/pdf",
        });

        expect(
          String(
            uploadCall?.data ??
            "",
          ),
        ).toMatch(
          /^JVBER/,
        );
      },
    );

    test(
      "replaces existing CV",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status: {
                ...openCvStatus,

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
                  "2026-08-31T19:00:00.000Z",
              },
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await page
          .locator(
            "#cv",
          )
          .setInputFiles(
            pdfFile(
              "new.pdf",
            ),
          );

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

        await expect(
          page.getByText(
            /last updated/i,
          ),
        ).toBeVisible();
      },
    );

    test(
      "rejects non-PDF locally",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
                fetch_status:
                openCvStatus,
              },
            },
          );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await page
          .locator(
            "#cv",
          )
          .setInputFiles({
            name:
              "cv.docx",

            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            buffer:
              Buffer.from(
                "not a pdf",
              ),
          });

        await expect(
          page.getByText(
            /must be a pdf/i,
          ),
        ).toBeVisible();

        expect(
          calls.filter(
            (
              call,
            ) =>
              call.action ===
              "upload",
          ),
        ).toHaveLength(
          0,
        );
      },
    );

    test(
      "previews existing CV only when requested",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              responses: {
                fetch_status: {
                  ...openCvStatus,

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
                },

                fetch_cv: {
                  ok:
                    true,

                  filename:
                    "ana.pdf",

                  data:
                    "JVBERi0xLjQKJUVPRgo=",
                },
              },
            },
          );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        expect(
          calls.filter(
            (
              call,
            ) =>
              call.action ===
              "fetch_cv",
          ),
        ).toHaveLength(
          0,
        );

        await page
          .getByRole(
            "button",
            {
              name:
                /preview cv/i,
            },
          )
          .click();

        await expect(
          page.getByTitle(
            "CV preview",
          ),
        ).toBeVisible();

        expect(
          calls.filter(
            (
              call,
            ) =>
              call.action ===
              "fetch_cv",
          ),
        ).toHaveLength(
          1,
        );
      },
    );

    test(
      "keeps existing CV readable after deadline",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status: {
                ...openCvStatus,

                cvStatus:
                  "submitted",

                hasCv:
                  true,

                cvName:
                  "cv.pdf",

                cvSubmittedAt:
                  "2026-05-01T10:15:00.000Z",

                cvUpdatedAt:
                  "2026-05-01T10:15:00.000Z",

                cvUploadsOpen:
                  false,

                cvDeadline:
                  "2026-05-10T22:59:59.000Z",

                registrationStatus:
                  "confirmed",
              },

              fetch_cv: {
                ok:
                  true,

                filename:
                  "cv.pdf",

                data:
                  "JVBERi0xLjQKJUVPRgo=",
              },
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByText(
            /cv submitted/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByText(
            /CV submissions are closed/i,
          ),
        ).toBeVisible();

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /preview cv/i,
            },
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

    test(
      "blocks CV upload for cancelled registration",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status: {
                ...openCvStatus,

                registrationStatus:
                  "cancelled",

                cvStatus:
                  "none",

                cvUploadsOpen:
                  true,
              },
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
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

    test(
      "shows waitlisted participant status",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              fetch_status: {
                ...openCvStatus,

                registrationStatus:
                  "waitlisted",
              },
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByText(
            /waiting list/i,
          ).first(),
        ).toBeVisible();
      },
    );
  },
);
