import {
  test,
  expect,
  type Page,
} from "@playwright/test";

// The Apps Script endpoint is stubbed: these tests cover our form logic,
// requests and rendered states — not Google's availability.
const SCRIPT_HOST =
  "https://script.google.com/**";

type Stub = {
  status?: number;
  body?: unknown;
  responses?: Record<
    string,
    unknown
  >;
};

const openAvailability = {
  ok: true,
  state: "open",
  opensAt: null,
  closesAt: null,
  capacity: 500,
  registered: 100,
  waitlisted: 0,
  remaining: 400,
  percentage: 20,
  waitlistEnabled: true,
  maxWaitlist: 0,
  eventName:
    "DETI+ 2026",
};

const openCvStatus = {
  ok: true,
  name: "Ana Silva",
  email: "an***@ua.pt",
  registrationStatus:
    "confirmed",
  hasCv: false,
  cvName: "",
  cvUpdatedAt: "",
  cvUploadsOpen: true,
  cvDeadline: null,
};

async function stubScript(
  page: Page,
  stub: Stub,
) {
  const calls: unknown[] =
    [];

  await page.route(
    SCRIPT_HOST,
    async (route) => {
      const payload =
        JSON.parse(
          route
            .request()
            .postData() ??
          "{}",
        );

      calls.push(
        payload,
      );

      const action =
        String(
          (
            payload as {
              action?: string;
            }
          ).action ??
          "",
        );

      const body =
        stub.responses?.[
          action
          ] ??
        stub.body ??
        openAvailability;

      await route.fulfill({
        status:
          stub.status ??
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

async function fillValidForm(
  page: Page,
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
        name: "3",
        exact: true,
      },
    )
    .click();

  await page
    .getByRole(
      "checkbox",
      {
        name: /data/i,
      },
    )
    .check();
}

test.describe(
  "registration form",
  () => {
    test(
      "submits the filled fields and confirms",
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
                  ok: true,
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

        expect(
          calls,
        ).toHaveLength(
          2,
        );

        expect(
          calls[1],
        ).toMatchObject({
          action:
            "register",
          name:
            "Ana Silva",
          email:
            "ana@ua.pt",
          curse:
            "Computer Engineering",
          year: "3",
          hasGdprConsent:
            true,
          website: "",
        });
      },
    );

    test(
      "blocks submission and reports invalid fields",
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
            /accept the data policy/i,
          ),
        ).toBeVisible();

        expect(
          calls,
          "only availability should reach the server",
        ).toHaveLength(
          1,
        );
      },
    );

    test(
      "handles a full-registration race without showing success",
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
                ok: false,
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
      "treats an already registered email as success",
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
                ok: true,
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
                "Already Registered",
            },
          ),
        ).toBeVisible();
      },
    );

    test(
      "requires CV-sharing consent when a CV is selected",
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
          .setInputFiles({
            name:
              "cv.pdf",

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
          calls,
        ).toHaveLength(
          1,
        );
      },
    );

    test(
      "sends the selected CV with a registration",
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
                  ok: true,
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
          .setInputFiles({
            name:
              "cv.pdf",

            mimeType:
              "application/pdf",

            buffer:
              Buffer.from(
                "%PDF-1.4\nstub\n%%EOF\n",
              ),
          });

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

        expect(
          calls[1],
        ).toMatchObject({
          cv: {
            filename:
              "cv.pdf",

            mime:
              "application/pdf",
          },
        });
      },
    );

    test(
      "shows availability states before exposing the form",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
                  ...openAvailability,
                  state:
                    "almost_full",
                  remaining:
                    2,
                },
            },
          },
        );

        await page.goto(
          "registration/index.html",
        );

        await expect(
          page.getByText(
            "Only 2 places remain.",
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
      "shows a full event without the form",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
                  ...openAvailability,
                  state:
                    "full",
                  registered:
                    500,
                  remaining:
                    0,
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
      "joins the waitlist and confirms its status",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
                  ...openAvailability,
                  state:
                    "waitlist",
                  registered:
                    500,
                  remaining:
                    0,
                },

              register: {
                ok: true,
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
      "keeps the form hidden before registration opens",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
                  ...openAvailability,
                  state:
                    "not_started",
                  opensAt:
                    "2026-05-01T10:30:00.000Z",
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
          page.getByText(
            /Registrations open on 1 May 2026/i,
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
      "keeps the form hidden after registration closes",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
                  ...openAvailability,
                  state:
                    "closed",
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
      "keeps the form hidden while registrations are disabled",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
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
      "fails closed when availability cannot be loaded and retries",
      async ({
               page,
             }) => {
        let requests =
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

            requests +=
              1;

            await route.fulfill(
              {
                status:
                  requests ===
                  1
                    ? 500
                    : 200,

                contentType:
                  "application/json",

                body:
                  JSON.stringify(
                    openAvailability,
                  ),
              },
            );
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
          requests,
        ).toBe(
          2,
        );
      },
    );

    test(
      "fails closed for an invalid availability response",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            responses: {
              registration_status:
                {
                  ok: true,
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
  },
);

test.describe(
  "cv upload",
  () => {
    test(
      "rejects a link with no token",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            body: {
              ok: true,
            },
          },
        );

        await page.goto(
          "registration/cv/index.html",
        );

        await expect(
          page.getByText(
            /link not valid/i,
          ),
        ).toBeVisible();
      },
    );

    test(
      "shows the CV already on record",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            body: {
              ...openCvStatus,

              hasCv:
                true,

              cvName:
                "CV_ana-silva_20260501-101500.pdf",

              cvUpdatedAt:
                "2026-05-01T10:15:00.000Z",
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
            /cv on record/i,
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
      "uploads a PDF and confirms",
      async ({
               page,
             }) => {
        const calls: unknown[] =
          [];

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

            calls.push(
              payload,
            );

            const body =
              payload.action ===
              "fetch_status"
                ? openCvStatus
                : {
                  ok: true,
                  uploaded:
                    true,
                  cvName:
                    "CV_ana-silva_20260501-101500.pdf",
                  cvUpdatedAt:
                    "2026-05-01T10:15:00.000Z",
                };

            await route.fulfill(
              {
                status:
                  200,

                contentType:
                  "application/json",

                body:
                  JSON.stringify(
                    body,
                  ),
              },
            );
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /submit cv/i,
            },
          ),
        ).toBeVisible();

        await page
          .locator(
            "#cv",
          )
          .setInputFiles({
            name:
              "cv.pdf",

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
                /submit cv/i,
            },
          )
          .click();

        await expect(
          page.getByText(
            /cv received/i,
          ),
        ).toBeVisible();

        const upload =
          calls.find(
            (
              call,
            ): call is Record<
              string,
              unknown
            > =>
              typeof call ===
              "object" &&
              call !==
              null &&
              "action" in
              call &&
              (
                call as {
                  action:
                    string;
                }
              ).action ===
              "upload",
          );

        expect(
          upload,
        ).toMatchObject({
          token:
            "token-123",
          mime:
            "application/pdf",
        });

        expect(
          String(
            upload?.data,
          ),
        ).toMatch(
          /^JVBER/,
        );
      },
    );

    test(
      "refuses a non-PDF before contacting the upload endpoint",
      async ({
               page,
             }) => {
        const calls =
          await stubScript(
            page,
            {
              body:
              openCvStatus,
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
              (
                call as {
                  action?: string;
                }
              )
                .action ===
              "upload",
          ),
        ).toHaveLength(
          0,
        );
      },
    );

    test(
      "loads a full-width preview only when requested",
      async ({
               page,
             }) => {
        const calls: unknown[] =
          [];

        const pdf =
          Buffer.from(
            "%PDF-1.4\nstub\n%%EOF\n",
          ).toString(
            "base64",
          );

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

            calls.push(
              payload,
            );

            const body =
              payload.action ===
              "fetch_status"
                ? {
                  ...openCvStatus,

                  hasCv:
                    true,

                  cvName:
                    "cv.pdf",

                  cvUpdatedAt:
                    "2026-05-01T10:15:00.000Z",
                }
                : {
                  ok: true,
                  filename:
                    "cv.pdf",
                  data:
                  pdf,
                };

            await route.fulfill(
              {
                status:
                  200,

                contentType:
                  "application/json",

                body:
                  JSON.stringify(
                    body,
                  ),
              },
            );
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByTitle(
            "CV preview",
          ),
        ).toHaveCount(
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
          calls,
        ).toContainEqual(
          expect.objectContaining(
            {
              action:
                "fetch_cv",

              token:
                "token-123",
            },
          ),
        );
      },
    );

    test(
      "keeps an existing CV available after submissions close",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            body: {
              ...openCvStatus,

              hasCv:
                true,

              cvName:
                "cv.pdf",

              cvUpdatedAt:
                "2026-05-01T10:15:00.000Z",

              cvUploadsOpen:
                false,

              cvDeadline:
                "2026-05-10T22:59:59.000Z",
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByText(
            /cv on record/i,
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
          page.getByText(
            /CV submissions are closed/i,
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
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "does not expose the uploader when CV submissions are closed",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            body: {
              ...openCvStatus,

              cvUploadsOpen:
                false,

              cvDeadline:
                "2026-05-10T22:59:59.000Z",
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByText(
            /CV submissions are closed/i,
          ),
        ).toBeVisible();

        await expect(
          page.locator(
            "#cv",
          ),
        ).toHaveCount(
          0,
        );

        await expect(
          page.getByRole(
            "button",
            {
              name:
                /submit cv/i,
            },
          ),
        ).toHaveCount(
          0,
        );
      },
    );

    test(
      "shows a cancelled registration without exposing the uploader",
      async ({
               page,
             }) => {
        await stubScript(
          page,
          {
            body: {
              ...openCvStatus,

              registrationStatus:
                "cancelled",

              cvUploadsOpen:
                false,
            },
          },
        );

        await page.goto(
          "registration/cv/index.html?t=token-123",
        );

        await expect(
          page.getByRole(
            "heading",
            {
              name:
                /registration cancelled/i,
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
      "handles a cv_closed response if the deadline passes during upload",
      async ({
               page,
             }) => {
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

            const body =
              payload.action ===
              "fetch_status"
                ? openCvStatus
                : {
                  ok: false,
                  error:
                    "cv_closed",
                  message:
                    "CV submissions are closed.",
                };

            await route.fulfill(
              {
                status:
                  200,

                contentType:
                  "application/json",

                body:
                  JSON.stringify(
                    body,
                  ),
              },
            );
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
              "cv.pdf",

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
                /submit cv/i,
            },
          )
          .click();

        await expect(
          page.getByText(
            /CV submissions are closed/i,
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
