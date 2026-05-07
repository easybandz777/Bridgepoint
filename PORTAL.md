# Crew Portal

A bilingual (EN/ES) self-service portal for Bridgepointe employees and
subcontractors. Crew can view assigned jobs, post site updates, upload
photos, message the office, clock in and out, see their pay, and read
admin announcements — all from a phone.

The portal lives at `/portal` on the same Next.js deployment as the
public marketing site and the back-office admin app at `/admin`.

---

## Initial setup

After deploying the app for the first time:

1. Open `https://YOUR_DOMAIN/portal/setup`.
2. Sign in with the admin password.
3. Click **Seed default PINs**. Every employee and subcontractor
   with an email gets a portal credential. Their default PIN is the
   last 4 digits of their phone number (or `1234` if no phone is on
   file).
4. (Optional) Click **Add sample updates and messages** to populate
   the portal with demo data so it doesn't feel empty on the first
   walk-through.
5. Share `/portal` with your team. They sign in with their work
   email + default PIN.

The setup page is admin-only and safe to revisit. Re-running the
seed only adds *missing* credentials. Use the **Reset all PINs**
button only when PINs need to be reissued for everyone.

---

## User guide

### Logging in

- Go to `/portal/login`.
- Enter your work email and your 4-digit PIN.
- If your manager just set up your account, your starting PIN is
  the last 4 digits of your phone number.

After 8 failed attempts the account is locked for 15 minutes.

### Changing your PIN

- After login, you'll be prompted to change your PIN if you're still
  on the default. You can change it any time from your profile.
- New PINs must be 4-12 digits.

### Viewing your jobs

- The dashboard at `/portal/dashboard` lists your active assignments
  with quick stats and recent activity.
- `/portal/jobs` shows the full list. Tap a project to see phases,
  the timeline, and crew photos.

### Posting updates

- On a job page, tap **Post update**.
- Pick a kind: note, progress, issue, or completion.
- Updates appear in the project timeline immediately and are visible
  to the office and other crew on that job.

### Uploading photos

- On a job page, open **Photos** and tap the upload button.
- Phone gallery or camera both work. Photos are compressed in the
  browser before upload.
- Add a caption. The photo is tagged with your name and the project
  automatically.

### Clocking in / out

- Tap **Clock** in the bottom nav.
- Pick the project (and phase if applicable) and tap **Clock in**.
- Tap **Clock out** when you're done. Hours are computed from your
  clock-in / clock-out timestamps and roll into your weekly timesheet.

### Messages

- `/portal/messages` lists announcements from the office and any
  direct messages addressed to you.
- Read receipts are tracked so the office knows who has seen what.

### Language

- Tap the EN / ES toggle in the topbar. Your preference is saved on
  the device.

---

## Admin guide

### Managing accounts

- `/admin/portal` lists every portal credential, their status, and
  last login.
- You can disable an account, force a PIN reset, or revoke active
  sessions.

### Sending announcements

- `/admin/portal/messages/new` opens the compose form.
- Pick an audience (everyone / employees only / subs only / a single
  user) and a level (info, urgent, or announcement).
- Sent messages appear in users' `/portal/messages` inbox the next
  time they refresh.

### Viewing crew photos

- `/admin/portal/photos` is the unified gallery of every photo
  uploaded by the crew, filterable by project and uploader.

### Audit trail

- Every portal action is logged to `activity_log` and surfaced at
  `/admin/activity`.

---

## Architecture

### Tables

| Table                  | Purpose                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `portal_credentials`   | One row per portal account (employee or sub). PIN hash + salt, lockout state. |
| `portal_sessions`      | Server-side session rows. Cookie carries opaque token.      |
| `project_photos`       | Crew-uploaded photos. Image bytes stored in Postgres BYTEA. |
| `project_updates`      | Timeline entries (note / progress / issue / completion).    |
| `crew_messages`        | Announcements + direct messages.                            |
| `crew_message_reads`   | Per-user read receipts.                                     |

### Auth flow

1. User submits email + PIN to `POST /api/portal/auth/login`.
2. Server verifies PIN against `sha256(salt + pin)`.
3. On success, server creates a row in `portal_sessions`, hashes
   the random token, and issues an `httpOnly` cookie
   (`bp_portal_session`) carrying the plaintext token.
4. Subsequent requests resolve the user via `getPortalUserFromCookie`,
   which compares `sha256(cookie)` against `portal_sessions.token_hash`.
5. Sessions expire after 30 days. Logout revokes the row.

### Bilingual support

Strings are looked up via `useT()` from `@/lib/portal-i18n`. Each
feature has its own dictionary file:

- `auth.ts`, `clock.ts`, `common.ts`, `dashboard.ts`, `jobs.ts`,
  `messages.ts`, `photos.ts`, `profile.ts`, `updates.ts`.

To add a string: add the key to the right file with `en` and `es`
values, then call `t('jobs.title')` from a component.

The selected locale is stored in `localStorage` under
`bp_portal_locale`.

---

## Routes

### Pages

| Path                                       | Description                       |
| ------------------------------------------ | --------------------------------- |
| `/portal`                                  | Redirects to dashboard or login.  |
| `/portal/login`                            | Email + PIN sign-in.              |
| `/portal/setup`                            | Admin-only first-run setup.       |
| `/portal/dashboard`                        | Personalized home.                |
| `/portal/jobs`                             | List of assigned projects.        |
| `/portal/jobs/[projectId]`                 | Project detail + phases.          |
| `/portal/jobs/[projectId]/photos`          | Project photo gallery.            |
| `/portal/jobs/[projectId]/updates`         | Project update timeline.          |
| `/portal/clock`                            | Clock in / out.                   |
| `/portal/timesheets`                       | Weekly hours.                     |
| `/portal/pay`                              | Pay history.                      |
| `/portal/documents`                        | Personal documents (W-4, etc.).   |
| `/portal/messages`                         | Inbox for announcements + DMs.    |
| `/portal/profile`                          | Change PIN, language, etc.        |

### API endpoints

| Method | Path                                              | Description                                      |
| ------ | ------------------------------------------------- | ------------------------------------------------ |
| POST   | `/api/portal/auth/login`                          | Email + PIN sign-in.                             |
| POST   | `/api/portal/auth/logout`                         | Revoke session + clear cookie.                   |
| GET    | `/api/portal/me`                                  | Current user + employee/sub profile.             |
| POST   | `/api/portal/me/change-pin`                       | Change own PIN.                                  |
| GET    | `/api/portal/dashboard`                           | Dashboard payload.                               |
| GET    | `/api/portal/jobs`                                | Assigned projects.                               |
| GET    | `/api/portal/jobs/[projectId]`                    | Project detail.                                  |
| GET    | `/api/portal/jobs/[projectId]/phases/[phaseId]`   | Phase detail.                                    |
| GET    | `/api/portal/jobs/[projectId]/photos`             | Photos for a project.                            |
| GET/POST | `/api/portal/jobs/[projectId]/updates`          | List or create project updates.                  |
| DELETE | `/api/portal/updates/[updateId]`                  | Delete an own update.                            |
| GET    | `/api/portal/photos/[photoId]/image`              | Full-size image bytes.                           |
| GET    | `/api/portal/photos/[photoId]/thumbnail`          | Thumbnail bytes.                                 |
| DELETE | `/api/portal/photos/[photoId]`                    | Delete an own photo.                             |
| GET    | `/api/portal/clock`                               | Currently open shift, if any.                    |
| POST   | `/api/portal/clock/in`                            | Start a shift.                                   |
| POST   | `/api/portal/clock/out`                           | End the open shift.                              |
| GET    | `/api/portal/timesheets`                          | Weekly timesheet entries.                        |
| PATCH  | `/api/portal/timesheets/[entryId]`                | Edit a pending entry.                            |
| GET    | `/api/portal/pay`                                 | Pay-period history.                              |
| GET/POST | `/api/portal/documents`                         | Personal documents list / upload.                |
| GET    | `/api/portal/documents/[docId]`                   | Download a document.                             |
| GET    | `/api/portal/messages`                            | Messages addressed to current user.              |
| POST   | `/api/portal/messages/[messageId]/read`           | Mark a message read.                             |
| POST   | `/api/portal/seed`                                | Admin: seed credentials. `?force=true` resets.   |
| POST   | `/api/portal/sample-data`                         | Admin: load demo updates / messages / time.      |
| GET    | `/api/portal/setup/credentials`                   | Admin: list credentials + computed default PINs. |

---

## Security

- PINs are stored as `sha256(salt + pin)` with a 16-byte random salt
  per credential. We never store plaintext.
- Sessions are server-side. The cookie is `httpOnly`, `sameSite=lax`,
  and `secure` in production. The cookie carries a random token; we
  store only `sha256(token)` in the database.
- Sessions expire after 30 days.
- After 8 consecutive failed login attempts, the account is locked
  for 15 minutes.
- Login attempts use timing-safe comparison.
- Disabling an account also revokes all of its active sessions.
- Authorization is per-user-per-project: employees see projects they
  have time entries on (or are leads/PMs for); subcontractors see
  projects they're assigned to.

---

## Related integrations

The portal reads from the same Postgres database that backs the back-office
admin app and the QuickBooks Online sync. If a crew posts an update or
clocks in, the office sees it on the same project record they sync to QB.

- **QuickBooks Online** — invoice, estimate, customer, vendor, bill, and
  payment sync between the CRM and QB. Operations runbook, env vars,
  routes, and failure modes are documented in
  [`QUICKBOOKS.md`](./QUICKBOOKS.md). Admin UI lives at
  `/admin/integrations/quickbooks`.
