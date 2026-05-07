# Reference + Troubleshooting Appendix

This is the maintenance manual. If you (or whoever sits in the office manager seat next) need to know what's where, why something behaves the way it does, or where to look first when a crew member calls confused — this is the section.

It is intentionally dry. The business case lives elsewhere; this is the part you keep open in a tab on the day something breaks.

## Map of the portal

Everything the system shows the world is on one of these screens. Two surfaces: the crew portal that crew members log into from their phones, and the admin portal that you and Brenda use from a laptop.

**Crew portal (crew sees these):**

- `/portal/login` — sign-in screen. Email + 4-digit PIN.
- `/portal/dashboard` — landing page after login. Today's jobs, recent activity, unread messages.
- `/portal/jobs` — list of jobs the user is assigned to.
- `/portal/jobs/{id}` — overview of one project: phases, recent updates, photos, basic budget visibility for leads.
- `/portal/jobs/{id}/photos` — photo gallery for that project.
- `/portal/jobs/{id}/updates` — full updates timeline for that project.
- `/portal/clock` — clock in / clock out (employees only).
- `/portal/timesheets` — weekly timesheet view (employees only).
- `/portal/pay` — pay history for employees, billing history for subs.
- `/portal/profile` — view and edit own profile, change PIN, change language.
- `/portal/documents` — own document list (W-4, I-9, certs, drug-test results, etc.).
- `/portal/messages` — inbox for announcements and direct messages.

**Admin portal (you and Brenda see these):**

- `/admin` — dashboard with active projects, cash position, exceptions.
- `/admin/portal` — master list of every portal account, last login, status.
- `/admin/portal/activity` — full crew activity feed across all users.
- `/admin/portal/photos` — every photo any crew member has ever uploaded, filterable.
- `/admin/portal/messages` — list of announcements, plus the **Send announcement** button.
- `/admin/employees/{id}/portal` — manage one employee's portal account (the **Portal Access** tab on the employee record).
- `/admin/subcontractors/{id}/portal` — same, for one subcontractor.
- `/admin/projects/{id}/photos` — photos filtered to a single project.
- `/admin/projects/{id}/updates` — updates timeline for a single project.
- `/portal/setup` — one-time bulk seed of default PINs, plus optional sample data. Re-runnable safely; only adds missing credentials unless you click **Reset all PINs**.

## How accounts work

Each crew member has **one underlying record** — either in the `employees` table (W-2 staff) or in `subcontractors` table (1099 partners). That record holds their name, email, phone number, role or trades, hourly rate or default rate, hire date, and so on.

Their **portal credential** is a separate record in the `portal_credentials` table. The credential is linked back to the underlying record by two columns: `user_type` (the literal string `'employee'` or `'subcontractor'`) and `user_id` (which references the corresponding `employees.id` or `subcontractors.id`). One person, two rows: one in their identity table, one in `portal_credentials`.

The credential stores three things plus some bookkeeping:

- The email they sign in with. This must match the email on the underlying employee or subcontractor record. If you change the email on the employee profile, change it on the Portal Access tab too — the system does not auto-sync.
- A hashed PIN. Plaintext PINs are never stored. We never see them, and neither would anyone with database access.
- A handful of state flags: `enabled` (account on or off), `must_change_pin` (forces a password change at next login), `last_login_at` (informational), `failed_attempts` (counts toward lockout), and `locked_until` (set when the lockout kicks in).

PINs are stored as `sha256(salt + pin)` where the salt is a random 16-byte string unique to that user. So two crew members who both pick `1234` end up with completely different stored hashes — and even if the database were to leak, no one could read PINs back out.

**Sessions** live in the `portal_sessions` table. When a crew member signs in successfully, the server creates a row in that table, generates a random opaque token, sets a secure httpOnly cookie carrying that token, and stores `sha256(token)` in the row. Every subsequent request from the phone hits the server, the server reads the cookie, hashes it, and looks up the matching session row to find the user.

The session is **server-side**. The cookie alone is useless — if the row is revoked, the cookie is dead. That's how the **Disable account** and **Revoke sessions** controls instantly kick someone out, even if they have a live phone in their hand.

Sessions expire automatically after **30 days** of inactivity. They can be revoked manually from the Portal Access tab on any employee or subcontractor record.

## Security policy at a glance

| Policy | Setting |
|---|---|
| PIN length | 4 to 12 digits |
| PIN storage | `sha256(salt + pin)`, salt unique per user |
| Failed-attempt lockout | 8 attempts, then 15 minutes |
| Session lifetime | 30 days from last use |
| Session cookie | httpOnly, secure (in production), sameSite=lax |
| PIN reset | Admin generates a new PIN; old PIN cannot be recovered |
| Account disable | Toggle on Portal Access tab; revokes all live sessions |
| Email enumeration on login | Generic error ("Email or PIN is incorrect") on both bad email and bad PIN |
| Server-side credentials | All sensitive operations require the cookie plus a matching session row |

A few notes on the table above. The login error is intentionally vague so that someone trying random emails cannot tell whether the email exists. The lockout counter resets on a successful login or when an admin generates a new PIN. Sessions are independent per device — signing in on a new phone does not boot the old phone — but disabling the account boots everyone.

## What gets written to the activity log

The `activity_log` table is the audit trail for the whole CRM, including the portal. Every state-changing action writes one row: who did it, what they did, when, and a short description.

Things the portal logs:

- Login, logout, failed login attempts, account lockouts.
- Photo upload, photo delete.
- Update post, update delete.
- Phase status changes (when a crew member taps **Mark complete**).
- PIN reset, PIN change, account enable/disable.
- Message send, message delete.
- Time entry submit, edit, approve.
- Session revoke.

The Crew Activity page in the admin portal (`/admin/portal/activity`) reads from this same table, scoped to portal events. You can filter by date range and by actor — start with the date range, narrow to a single user, and the recent picture of what they did is right there.

If you ever wonder whether someone actually performed an action they say they did or did not, this is the table to look at first.

## FAQ

**1. A crew member can't sign in. What do I do?**
Check the email on file. Open their employee or subcontractor record, click the **Portal Access** tab, and confirm the email shown there matches what they're typing on their phone. The most common cause of a sign-in failure is a typo or an outdated email. If the email is correct, generate a new PIN and read it to them.

**2. Marcus changed phones — can he stay logged in on the new one too?**
Yes. He can sign in on the new phone without doing anything on the old one. Each device has its own session. If he wants to actively log out of the old phone (say, he sold it), open his Portal Access tab and click **Revoke all sessions**, then have him sign in fresh on the new device.

**3. Diego forgot his PIN. Can I see what it is?**
No. PINs are stored as one-way hashes, so even with full database access no one can read them back. Generate a new PIN from the Portal Access tab, share it with him verbally or by text, and he can change it from his profile after he logs in.

**4. A subcontractor texted me a photo — should I upload it for them?**
You can, from `/admin/projects/{id}/photos`, but it will show as uploaded by you, not the sub. Better: ask them to upload it through their portal. The project photo trail is part of the audit record (and the sub's accountability), so keeping the uploader correct matters more than getting the photo in fast.

**5. The portal seems slow on a job site. Is something broken?**
Probably bad cell signal. Construction sites — especially basements, old houses, and anything behind metal flashing — eat data signals. The photo upload screen is somewhat tolerant of bad connections (it will retry), but most other actions need a working connection. Have them step outside or move closer to the road. If the whole site is bad, they can post updates and clock in once they're back on Wi-Fi.

**6. Can two people share one login?**
No, and please don't let them. Each crew member has their own login. Sharing logins breaks the audit trail (who actually clocked in? who took that photo?) and is a security risk. If a new crew member shows up and needs access today, create their record and seed a credential — it takes ninety seconds.

**7. A crew member quit. What's the right shutdown procedure?**
Open their employee or subcontractor record. Mark the underlying status as Terminated or Inactive. On the **Portal Access** tab, flip the **Enabled** toggle off — this revokes all their live sessions immediately. Their photos, updates, and time entries all stay in place; nothing is deleted. If they later come back, flip the toggle back on.

**8. I need to send an urgent weather hold to everyone. What's the fastest path?**
Go to `/admin/portal/messages`, click **Send announcement**, set audience to **Everyone**, set level to **Urgent**, type a one-line subject ("No work today — flooding") and a short body. Hit send. It lands in everyone's `/portal/messages` inbox the next time their phone refreshes (which happens automatically when they open the app). Read receipts let you see who has actually opened it.

**9. Where do photos actually live? Can I download them all?**
Photos are stored as binary directly inside the Postgres database (in the `image_data` column of `project_photos`), not in a separate file system or cloud bucket. The advantage is one backup covers everything; the trade-off is no cloud-folder browsing. You can download an individual photo by opening the lightbox in any photo gallery view and clicking the download icon. Bulk download is not built yet — if you need everything for a project at once, an engineer has to write a one-off script.

**10. What's the difference between "Notes" and "Updates" on a project?**
Notes are admin-only project comments, written by you or Brenda from the back office, and the crew never sees them. Updates are crew-authored timeline entries — things like "drywall finished in master bed," "found rotted joist behind tub," "homeowner asking about color change." Updates are visible to everyone on the job (including the office). Use notes for back-office observations; updates are the field-to-office reporting channel.

**11. Spanish translations — are they perfect?**
No. They're construction-trade Spanish, reviewed for clarity, but they're not lexicographic. If a crew member tells you a phrase is awkward or wrong, it's an easy fix: open the appropriate dictionary file in `src/lib/portal-i18n/` (one per feature: `auth.ts`, `jobs.ts`, `clock.ts`, `messages.ts`, etc.), edit the `es` value for that key, redeploy. The English side is the source of truth for keys; the Spanish side is the translation.

**12. How do I change the password for the admin login?**
Open `src/components/admin/admin-auth.tsx`, change the password constant, and redeploy. This is intentionally crude — the admin gate is a single shared password right now, not per-user auth. Long term, this should be moved to a real authentication system. For now, change it whenever the team that knows the current one changes.

## Troubleshooting cheatsheet

| Symptom | First thing to try |
|---|---|
| Crew member says "I can't log in" | Check the email on file (Portal Access tab, Email row) matches what they're typing. |
| Banner says "Account locked" | Wait 15 minutes, or hit **Generate New PIN** to reset the failed-attempt counter. |
| Photo upload fails repeatedly | The file is over 8 MB after compression — usually a high-res HEIC. Have them switch the iPhone camera setting from "High Efficiency" to "Most Compatible." |
| Spanish toggle doesn't stick | The browser is in incognito or private mode (localStorage is cleared each session). Use a regular tab. |
| Activity log feels empty | Check the date-range filter — defaults to last 7 days. Widen it. |
| Time entry won't save | Total hours equal to zero. Even a quick clock-in / clock-out has to span at least one minute. |
| Two phases marked complete on the same day on the same project | Both crew members tapped Complete. Use the Updates tab to see who did what when. |
| Photo shows up but thumbnail is blank | Thumbnail generation failed; the full-size image is fine. Refresh the gallery; if it still doesn't show, re-upload. |
| Crew member sees jobs they shouldn't | Their role in the employee record might be flagged as a lead or PM. Check `role` on the employee record; lead-level roles see all projects by design. |
| Announcement didn't show up for someone | The user hasn't opened the app since you sent it; the inbox loads on app open. Confirm by checking their last login on `/admin/portal`. |

## Backup and data exports

The portal data lives in the same Neon Postgres database that powers the rest of the CRM. Whatever backup schedule applies to that database applies here. There is no separate portal data store and no separate file system to back up — photos are inside the same database.

For a one-off export, anyone with database access can run a SQL query against `portal_credentials`, `project_photos`, `project_updates`, `crew_messages`, and so on. The owner does not usually need to do this directly. If you ever want a CSV of, say, every photo with its timestamp and uploader for an insurance claim, an engineer can put that together in a few minutes.

Photos, again, are stored as binary in the database, not in a separate file system. They are included in the same database backup. The trade-off is that the database is a little bigger than it would be otherwise; the upside is that one backup covers everything and there is no second cloud bucket to manage.

## When something genuinely breaks

**First, look at the Crew Activity feed** at `/admin/portal/activity`. Filter to "today" plus the user who reported the problem. You will usually see an error pattern there — a string of failed login attempts, an empty time entry, a deleted update. The activity feed is the cheapest debugging tool available; check it before you reach for anything else.

**If you need engineering help**, this system was built by Anthropic's Claude as a custom solution. When you write to your engineering contact, document four things in plain English: the symptom (what the crew member or you actually saw), what page it happened on (the URL or the section name), what you expected to happen, and what actually happened instead. Screenshots help. Time-of-day helps too — the activity log is timestamped, so an engineer can correlate. Send all of that and you'll get a real answer back, instead of three rounds of "can you tell me more?"
