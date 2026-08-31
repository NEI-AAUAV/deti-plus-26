# Registration backend (Google Apps Script)

The site is a static export on GitHub Pages, so it has no server of its own.
Registrations, CV storage and the confirmation emails are handled by this Apps
Script project: a Sheet is the database, a private Drive folder is the file
store, and `GmailApp` sends the magic links from the NEI account.

## Operations runbook

The production flow is **frontend → Apps Script → Sheets/Drive/Email Queue**.
Set `SHEET_ID`, `CV_FOLDER_ID`, `SITE_URL`, and `EVENT_EMAIL`; then run
`migrateSystem`, `initializeOperations`, `installOperationalTriggers`, and
`runHealthCheck` before deployment. The Operations menu processes the email
queue, exports CSVs, applies protections, promotes the waitlist, and runs
retention. The canonical registration values are `confirmed`, `waitlisted`,
and `cancelled`; check-in is stored independently in `checkedIn` and
`checkedInAt`. Legacy `timestamp`, `curse`, and `state` remain compatibility
fields only. Before/after the event, take an export backup and run retention
only after its configured deadline.

## One-time setup

1. **Create the Sheet.** New Google Sheet, name it e.g. `DETI+ 2026 —
   Registrations`. The `Registration` tab and its headers are created
   automatically on the first submission. Copy the id from the URL:
   `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.

2. **Create the Drive folder** for the CVs. Keep it private — do not share it
   with "anyone with the link". Copy the id from the URL:
   `https://drive.google.com/drive/folders/<CV_FOLDER_ID>`.

3. **Create the script.** Go to <https://script.google.com>, new project, and
   paste the contents of `code.gs` over the default `Code.gs`.

4. **Set the Script Properties** (Project Settings → Script Properties):

   | Key            | Value                                             |
   | -------------- | ------------------------------------------------- |
   | `SHEET_ID`     | id from step 1                                    |
   | `CV_FOLDER_ID` | id from step 2                                    |
   | `SITE_URL`     | `https://nei-aauav.github.io/deti-plus-26`        |
   | `EVENT_EMAIL`  | contact address used as `Reply-To` in the emails  |

5. **Deploy.** Deploy → New deployment → type *Web app*:
   - Execute as: **Me** (the NEI account — it owns the Sheet, the folder and
     the sent mail)
   - Who has access: **Anyone**

   Authorise the scopes when prompted. Copy the `/exec` URL.

6. **Point the site at it.** Locally, put the URL in `.env.local` as
   `NEXT_PUBLIC_SCRIPT_URL`. For CI/CD, add it as a repository **Variable**
   (Settings → Secrets and variables → Actions → Variables) with the same
   name — the build reads it in `ci.yml` and `deploy.yml`.

## Redeploying after a code change

Apps Script keeps serving the deployed version, not the saved one. After
editing, use Deploy → Manage deployments → edit the existing deployment →
Version: **New version**. Creating a *new deployment* instead would issue a
different `/exec` URL and break the site.

## Checking it works

```bash
curl -sL -X POST "$SCRIPT_URL" \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"action":"register","name":"Test Student","email":"you@example.com","mobileNumber":"","curse":"Computer Engineering","year":"3","hasCvConsent":true,"hasGdprConsent":true,"website":""}'
```

Expect `{"ok":true,"registered":true,"alreadyRegistered":false}`, a new row in
the Sheet and an email with the magic link. `-L` matters: Apps Script answers
with a redirect to `googleusercontent.com`.

The request sends `Content-Type: text/plain` on purpose. With
`application/json` the browser fires a preflight `OPTIONS`, which Apps Script
does not answer, and the call fails with a CORS error.

## Quotas

`GmailApp` allows 100 recipients/day on a free account, 1500 on Workspace. Each
registration sends one email, and each CV upload sends another. If registrations
are expected to spike past that, run the sends from a time-driven trigger
instead of inline.

## Data protection

- The Drive folder stays private; nothing is ever shared publicly and the script
  never calls `setSharing`.
- The token in the magic link is the only credential. Anyone holding a link can
  see and replace that person's CV, which is why `/registration/cv/` is served
  with `noindex, nofollow`.
- To delete someone's data: remove their row from the Sheet and their file from
  the Drive folder.
