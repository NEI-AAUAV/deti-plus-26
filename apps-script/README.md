# Registration backend (Google Apps Script)

The site is a static export on GitHub Pages, so it has no server of its own.
Registrations and CV storage are handled by this Apps Script project: a Google
Sheet is the database, a private Drive folder is the file store, and `MailApp`
sends participant communications through a durable `Email Queue` sheet.

The email system uses the DETI+ visual language from the website: black/white,
`#99ffff`, square geometry, Architype Stedelijk for display typography and Vayu
Sans for body typography when the email client supports custom fonts. The logo
itself is exported to `public/email/deti-plus-logo.png` using the real Architype
font, so it remains visually exact even when a client blocks `@font-face`.

## Apps Script files

Create one Apps Script file for each `.gs` file in this directory. In
particular, `emails.gs` is required; do not paste only `code.gs`.

The core files are:

- `code.gs` — public registration/CV API and validation;
- `config.gs` — event/settings configuration and registration counters;
- `sheets.gs` — sheet access/schema helpers;
- `migrations.gs` — schema migrations;
- `audit.gs` — audit log;
- `operations.gs` — queue processing, waitlist, exports, retention and triggers;
- `emails.gs` — participant templates, HTML/text rendering and scheduled lifecycle;
- `admin.gs` — administration interface and state transitions;
- `statistics.gs` — operational statistics/dashboard;
- `tests.gs` — manual pure backend self-tests.

## Operations runbook

The production flow is:

**frontend → Apps Script → Sheets/Drive → Email Queue → MailApp**

Set `SHEET_ID`, `CV_FOLDER_ID`, `SITE_URL`, and `EVENT_EMAIL`; then run:

1. `migrateSystem()`
2. `initializeOperations()`
3. `installOperationalTriggers()`
4. `runHealthCheck()`

`initializeOperations()` also ensures the Email Queue contains the lifecycle
columns used for template/deduplication metadata. Existing queued rows are kept.

The canonical registration values are `confirmed`, `waitlisted`, and
`cancelled`; check-in is stored independently in `checkedIn` and `checkedInAt`.
Legacy `timestamp`, `curse`, and `state` remain compatibility fields only.

## One-time setup

1. **Create the Sheet.** Create a Google Sheet, for example `DETI+ 2026 —
   Registrations`. Copy the id from:

   `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`

2. **Create the Drive folder** for CVs. Keep it private. Copy the id from:

   `https://drive.google.com/drive/folders/<CV_FOLDER_ID>`

3. **Create the Apps Script project.** Go to <https://script.google.com>, create
   a project and add all `.gs` files from `apps-script/`.

4. **Set Script Properties** (Project Settings → Script Properties):

   | Key | Value |
   | --- | --- |
   | `SHEET_ID` | id from step 1 |
   | `CV_FOLDER_ID` | id from step 2 |
   | `SITE_URL` | `https://nei-aauav.github.io/deti-plus-26` |
   | `EVENT_EMAIL` | contact address used as Reply-To and preview recipient |

5. **Generate and commit the email logo** from the repository root:

   ```bash
   node scripts/generate-brand-images.mjs
   ```

   This creates/refreshes:

   - `app/opengraph-image.png`
   - `app/icon.png`
   - `app/apple-icon.png`
   - `public/email/deti-plus-logo.png`

6. **Deploy the website assets** before sending production email, so the logo
   and font URLs referenced by email are publicly available.

7. **Deploy Apps Script**: Deploy → New deployment → Web app:

   - Execute as: **Me** (the account that owns the Sheet/Drive folder)
   - Who has access: **Anyone**

   Authorise the requested scopes and copy the `/exec` URL.

8. **Point the website at the Apps Script URL.** Locally use
   `NEXT_PUBLIC_SCRIPT_URL` in `.env.local`. In GitHub Actions add the same name
   as a repository Variable.

## Settings sheet

In addition to registration/waitlist/CV settings, the backend now manages:

- `eventStartsAt`
- `eventEndsAt`
- `eventVenue`
- `eventAddress`
- `eventPageUrl`
- `emailRemindersEnabled`

These drive scheduled participant communications. Keep dates in the configured
`timezone` (normally `Europe/Lisbon`).

## Participant email lifecycle

Transactional messages:

- registration confirmed;
- waiting-list entry;
- personal/magic-link resend;
- CV received;
- CV replaced/updated;
- promotion from waiting list;
- registration cancellation;
- registration restoration;
- manual move from confirmed to waiting list.

Scheduled messages (when `emailRemindersEnabled` is true):

- CV reminder around 7 days before the CV deadline;
- CV reminder around 48 hours before the CV deadline;
- event reminder around 7 days before the event;
- event reminder around 24 hours before the event;
- event-day reminder;
- waiting-list update near the event;
- post-event thank-you for participants who checked in.

Scheduled messages use `dedupeKey` in `Email Queue`, so an hourly scheduler may
run repeatedly without queueing the same campaign twice for the same person.

## Email queue and retries

`processEmailQueue()` runs every 5 minutes and sends at most 30 messages per run
while respecting the account's remaining daily quota.

Failures retry with backoff:

- first failure → retry after ~5 minutes;
- second failure → retry after ~30 minutes;
- third failure → status `failed`.

A queue/send failure is deliberately non-fatal to registration. Once a
participant has been safely written to the Registration sheet, an email problem
must not turn that successful registration into an API failure.

## Operational triggers

`installOperationalTriggers()` ensures:

- Admin edit trigger;
- Registration edit trigger;
- Settings edit trigger;
- `processEmailQueue` every 5 minutes;
- dashboard refresh every 15 minutes;
- `scheduleParticipantCommunications` every hour;
- data-retention job daily.

## Email preview

Use the DETI+ menu in the spreadsheet:

- **Agendar comunicações**
- **Enviar preview de email**
- **Processar fila de emails**

`sendParticipantEmailPreview()` queues a sample registration-confirmed email to
`EVENT_EMAIL`; it does not email a real participant.

## Redeploying after an Apps Script change

Apps Script serves the deployed version, not merely the saved editor state.
After editing:

Deploy → Manage deployments → Edit → Version: **New version**

Do not create a new deployment unless you also intend to change the `/exec` URL.

## Checking the public API

```bash
curl -sL -X POST "$SCRIPT_URL" \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"register","name":"Test Student","email":"you@example.com","mobileNumber":"","course":"Computer Engineering","year":"3","hasCvConsent":true,"hasGdprConsent":true,"website":""}'
```

Expect an `ok: true` response, a Registration row and a pending/sent email queue
entry. `-L` matters because Apps Script may redirect to `googleusercontent.com`.

`Content-Type: text/plain` is intentional: using `application/json` from the
browser would normally cause an OPTIONS preflight that the Apps Script web app
does not handle.

## Quotas

Email quotas depend on the Google account type and can change. The backend uses
`MailApp.getRemainingDailyQuota()` at runtime rather than assuming a fixed
number. The queue stops sending when the remaining quota is exhausted and keeps
pending rows for a later run.

## Data protection

- The CV Drive folder remains private; the script never makes CVs public.
- The token in the personal link acts as the participant credential. Do not
  share it, log it publicly, or put it in analytics.
- Cancelled registrations cannot use the CV-management endpoint.
- GDPR deletion removes the participant row and trashes the associated CV.
- Data retention runs only after the configured `dataRetentionUntil` date.
