# 02 — Admin Operating Manual

This is the manual for the two people who actually drive the portal day to day: you (Mark) and Brenda. It tells you what to click, in what order, and what you'll see on the screen when you get there. Keep it next to the keyboard for the first month. After that, most of this becomes muscle memory.

The portal has two halves. The half you live in is the **admin** side, at `/admin`. The half the crew lives in is the **portal** side, at `/portal`. This manual is about the admin side. The crew side gets its own short guide that you can hand to Marcus or to a new hire on day one.

---

## Getting in

Open your browser and go to `/admin` on your live site (the same domain Brenda uses for invoicing). You'll see a black sign-in card with a gold lock icon, the word **Bridgepointe** in serif type, and two fields: **Username** and **Password**. Type `Mark` in the username field, type your password in the password field, and click the gold **Sign In** button.

If you ever need to change the password, it lives in one specific file in the codebase: `src/components/admin/admin-auth.tsx`. Whoever maintains the portal for you (or you, if you're handy enough) edits the constant near the top of that file, redeploys, and the new password is live. You don't have a "change password" button inside the portal yet — that's deliberately off until the team is bigger. For now: one password, written down somewhere safe, shared only with you and Brenda.

Once you're signed in, you stay signed in for the rest of the browser session. Closing the tab logs you out. You'll know you're in when the page goes dark and a sidebar appears on the left.

The sidebar is the spine of the whole admin side. Five sections, top to bottom:

- **Dashboard.** Overview of the business and a recent activity log.
- **Operations.** Projects, Estimates, Invoices, Expenses — the money side.
- **People.** Subcontractors, Sub Compliance, Employees, Timesheets — the people who do the work.
- **Crew Portal.** Portal Accounts, Crew Activity, Crew Photos, Announcements — everything that flows back from the field.
- **Reports.** Profitability, Estimate vs Actual, Subcontractor Spend, Labor, Cash Flow.

The current section you're in lights up gold. Below the five sections, in a smaller "Public" group, are quick links to open the live crew portal and the live website in a new tab. Use those when you want to see what the crew is seeing.

> **Why this matters:** the sidebar is your map. If Brenda is ever lost in the portal, ninety percent of the time the answer is "scroll up the sidebar and pick the section that fits the question." Need to see Marcus's hours? People → Timesheets. Need to look at yesterday's photos? Crew Portal → Crew Photos. Need to know how the Henderson kitchen is tracking? Operations → Projects.

---

## Adding a new employee

This is the workflow for hiring someone in-house — a new painter, a new helper, an apprentice. It is the most common admin task in the first 90 days.

1. In the sidebar, click **Employees** (under People). You'll land on the employee directory: a wall of cards, one per person, with their status badge, role, email, phone, and rate.
2. In the top right of the page, click the gold pill button labeled **Add Employee**. The form opens.
3. Fill in **Identity**. First name and last name are required (you'll see a small gold asterisk next to the labels). Add their email — this is the field that turns on the rest of the workflow, so don't skip it. Add phone (use the format `(404) 555-0100`). Add address if you have it; if you don't, come back later.
4. Fill in **Employment**. Pick a **Role** from the dropdown (Painter is the default — change it for foremen, helpers, apprentices). Pick a **Type** (Full-time, Part-time, Contract, Seasonal). Set the **Hire date** — it's prefilled to today, which is usually right. Fill in either **Hourly rate ($/hr)** *or* **Annual salary ($)** but not both. Brenda's rule of thumb: hourly for everyone except yourself.
5. Fill in **Skills & Certifications**. Both fields are comma-separated lists. So a Marcus profile would have skills like `Cabinet refinishing, Spray finishing, Color matching` and certifications like `OSHA-10, Lead-Safe Renovator (EPA)`. Use commas, not the Enter key. Notes is a free-text field — put anything Brenda needs to remember about this person there.
6. Important — scroll to the bottom. The last section is titled **Crew Portal Access**. Inside it is a single tile with a checkbox labeled **Create login & PIN now**. It's checked by default and the tile glows gold when an email is filled in. Leave it on. The portal will issue a 6-digit PIN automatically as soon as you save the employee. If you forgot the email up in step 3, the tile turns gray and shows an amber note telling you to add an email above. Scroll up, add the email, and the tile lights back up.
7. Click the gold **Save Employee** button at the bottom right. The button is disabled until both names are filled in, so if it's grayed out, scroll up.
8. The page automatically navigates to that employee's **Portal Access** tab. At the top of the tab you'll see a green-bordered banner with a shield icon and the words **New PIN issued**. Below the words is a single, large 6-digit code in a black box, with the digits widely spaced. Next to it is a **Copy** button. Click **Copy**, paste it into a text message to the employee, and you're done. The banner says *"Send this PIN to the user via SMS or in person — it won't be shown again."* That is literal. Once you leave this page or click **Dismiss**, the PIN is gone from the screen. The portal does not store it in cleartext anywhere you can read it back later. If you lose it before you send it, you have to issue a new one.

If you skipped the checkbox in step 6 — say you weren't sure about hiring someone yet, so you wanted to create the record without giving them portal access — no problem. Go to **Employees**, click the person's card, then click the **Portal Access** tab. The card on the left will say *"No credential on file"* and offer a single gold button: **Create Portal Access**. Click it. Same green banner appears, same PIN, same Copy button.

> **Why this matters:** the moment a new hire gets their PIN is the moment they go from being a name on a card to being a participant. They can clock in, post photos, see the schedule. If you delay the PIN by even a day, you've taught them that the portal is optional. So treat the PIN handoff like a key handoff — text it before they leave the office on day one.

---

## Adding a new subcontractor

Subs go through the same shape of form but with a few extra sections because the compliance paperwork matters. You'll do this for any new drywall, flooring, electrical, or HVAC partner.

1. In the sidebar, click **Subcontractors** (under People). You'll see the subcontractor directory.
2. Click the gold **Add Subcontractor** button (top right). The form opens. Notice the four numbered sections — they're labeled **1**, **2**, **3**, **4** in small monospace circles on the left side of each section title.
3. **Section 1: Company Information.** Required: **Company Name**, **Primary Contact**, **Email Address**, **Phone Number**. Optional: **Tax ID / EIN** (in the format `XX-XXXXXXX`) and **Physical Address**. The email is what turns on portal access later, same as with employees.
4. **Section 2: Trade Categories.** A grid of pill buttons: General, Demo / Abatement, Framing, Drywall, Drywall & Paint, Painting, Roofing, Landscaping, Trim & Finish Carpentry, Cabinetry, Flooring, Tile & Stone, Plumbing, Electrical, HVAC, and Cleaning / Disposal. Click every trade this sub can do. Selected pills turn gold and show a dot. You must pick at least one or the Save button stays disabled.
5. **Section 3: Compliance Tracking.** Three checkboxes, stacked: **W-9 Form Collected**, **Master Subcontractor Agreement (MSA) Signed**, and **Certificate of Insurance (COI)**. When you tick COI, the row expands to reveal a required **Policy Expiration Date** field. The note next to the section title says *"You can upload the actual files later in the sub profile."* — that's true, this section is just a status flag for now. Brenda will hand the actual paper to you and you'll attach it inside the sub's profile under the Documents tab.
6. **Section 4: Crew Portal Access.** Same checkbox as the employee form: **Create login & PIN now**, default on, glows gold when an email is filled in, gray with an amber warning when it isn't. Leave it on for any sub crew you actually expect to log time, post photos, or read announcements. Turn it off for vendors you only invoice (a one-time roofer, for example).
7. Click the gold **Create Subcontractor** button at the bottom right. The button is disabled until you have a company name, a primary contact, and at least one trade selected.
8. You land on the sub's **Portal Access** tab, same green banner, same PIN, same Copy button. Send it to the primary contact — usually the foreman, not the office — because the foreman is the one on site every day.

> **Why this matters:** a sub's PIN is what lets their foreman post photos and time entries on your jobs. If you skip giving them one, you'll be back to text-message project management, and you'll never know whether the drywall guys actually showed up Tuesday until you drive to the site. Issuing the PIN at the moment of onboarding is what makes the whole system work.

---

## What employees and subs do with their PIN

You do not need to walk anyone through this in person, but here's what happens on their end so you can answer questions over the phone:

- They open your live portal URL in their phone browser. That's `bridgepointepainting.com/portal` (or whatever the production URL is — Brenda will know the exact one; this is the URL you copy from the **Share with your team** card on the setup page).
- They sign in with the email on file and the 6-digit PIN you texted them.
- On their first login, the portal forces them to change the PIN. They pick something between 4 and 12 digits — usually a number they'll remember without writing down. After that, the new PIN is what they use forever.

That's it. Three steps, one phone, no app to install, no new email account. You don't see their new PIN — it's hashed the moment they save it, and even you couldn't read it back if you tried.

---

## Granting access later, or resetting a PIN

This is where you'll spend the most time once the team is set up. Resets happen for three reasons: (1) Marcus locked himself out, (2) a sub got a new phone and forgot the PIN, (3) you forgot to give Brenda her PIN and she's been waiting two days.

1. Find the person. For an employee: sidebar → **Employees** → click their card. For a sub: sidebar → **Subcontractors** → click the company.
2. On the detail page, click the **Portal Access** tab (it's one of the tabs near the top of the page, right above the cards).
3. The big card on the left of the page is titled **Portal Access** with a key icon. In the top-right corner of that card is a small status pill — **Active** in green if the credential is on, **Disabled** in gray if it's been turned off.

The card shows you four things at a glance:
- **Email.** The email on file, with a note underneath that says where it came from.
- **Last login.** A real date and time like `4/30/2026, 6:42 AM`, or `Never` if the user has never signed in.
- **Failed attempts.** If non-zero, an amber line appears: `2 failed attempt(s)`. That's your tell that someone is fat-fingering their PIN — usually because they wrote it down wrong.
- **Status toggle and force-change toggle**, both as little tile rows.

Below those, you have three controls:

- **Generate New PIN.** Big gold button with a refresh icon. One click, one new random 6-digit PIN, shown once in the green banner at the top of the card. Use this for "I lost my phone" and "I never wrote it down."
- **Set custom PIN.** A small link below the gold button reading *"Set custom PIN"*. Click it; a text input appears with the placeholder `4-12 digits`. Type a PIN you've agreed on with the person (e.g., the last 4 of their SSN, or a number they already use elsewhere), then click **Save Custom PIN**. The portal validates that it's between 4 and 12 digits and rejects anything else. Use this when someone has memory issues with random numbers.
- **Force PIN change on next login.** A toggle row that says *"User will be prompted on next login"* when on, *"User can keep current PIN"* when off. Default is off after the first login. Turn it on if you suspect a PIN has been shared inappropriately and you want to force a fresh one without immediately disabling the account.

Below the controls is the **Status** toggle: a row reading *"User can log in"* (when active) or *"Login is blocked"* (when disabled), with a button on the right. Click the button to flip from one to the other. A disabled account cannot log in — period — but it is not deleted; you can re-enable it later by flipping the toggle the other way.

At the very bottom of the card is a red-bordered button reading **Revoke All Active Sessions**. Click this when someone loses their phone, gets fired, or hands their phone to their cousin. It instantly logs them out of every device. They can still log back in with their PIN if the account is still enabled — so for a true off-boarding, also flip the Status toggle to disabled.

> **Why this matters:** the PIN reset workflow is designed so Brenda can do it on the phone in 90 seconds. *"Hi Marcus, what's your email? OK, hold on. Click. Click. Click. Your new PIN is 8-1-9-3-4-7. Got it?"* That is the whole conversation. If anything in the workflow takes longer than that, something has gone wrong — either you're not on the Portal Access tab, or the email field is blank, or there's an old session you forgot to revoke.

---

## Bulk-seeding all existing crew (one-time)

Run this once, the first day the portal goes live. Don't run it again after that.

The setup page is at `/portal/setup`. Open that URL in your browser. (It's behind the same admin login as the rest of the admin side, so you may have to sign in if your session has expired.)

You'll see a clean dark page titled **Crew Portal Setup**, with the gold caption **Bridgepointe · Admin** above it. Three numbered cards stack down the page.

1. **Step 1 — Create credentials.** A short paragraph under the title explains: *"Generates a portal account for every employee and subcontractor with an email. Default PIN is the last 4 digits of their phone (or 1234 if missing)."* Below the paragraph is a single gold button: **Seed default PINs** (with a key icon).
2. Click **Seed default PINs**. The button shows a spinner and the text changes to *"Seeding..."*. After a few seconds, a green-bordered panel appears below it: *"Credentials seeded. X created · Y skipped · Z errors."* Right below the panel, a table appears titled **Default credentials**, with four columns: **Name**, **Email**, **Default PIN**, and a **Copy** column. The PIN values are shown in gold monospace type.
3. For each row in the table, click the small **Copy** button on the right. It copies a string in the format `email@example.com → 1234`. Paste it into a text message to that person, hit send, and move to the next row. The Copy button briefly shows **Copied** with a green checkmark when it succeeds.
4. **Step 2 — Add sample data (optional).** Below the credentials card is a second numbered card titled **Add sample data (optional)**, with a single button: **Add sample updates and messages**. If you want the portal to feel populated on first visit — a couple of fake project updates, a couple of fake announcements, a few weeks of demo time entries — click it. If you want a clean portal where the only content is real, skip it. The button is **idempotent**, meaning safe to click more than once: it won't double up the demo data.
5. **Step 3 — Reset all PINs.** Below that is a red-bordered card titled **Reset all PINs**. **Do not click this casually.** It wipes every existing PIN and forces every user to re-enroll on next login. The only time you click this is if there's been a security incident, like the master credentials list got loose, and you need to nuke everyone's PIN at once. There's a confirmation dialog after the first click — you have to click **Yes, reset all PINs** to actually do it.
6. At the very bottom of the setup page is a card titled **Share with your team** with a code block showing your live portal URL (e.g., `https://bridgepointepainting.com/portal`). A **Copy** button next to it puts that URL on your clipboard. Paste it into a group text or a crew meeting reminder.

Important rule: **only run Step 1 once.** After everyone has logged in once and changed their PIN, never re-seed. The seed will skip people who already have a credential, but it's a habit you don't want — it's confusing and Brenda will eventually misread "skipped" as "failed." For day-to-day resets, always use the per-person **Generate New PIN** button on the Portal Access tab, not the bulk seed.

> **Why this matters:** the one-time seed is what turns "we have a portal" into "the whole crew has a portal." If you do it once, well, on day one, the rest of the manual just works. If you skip it and try to onboard everyone one at a time over a month, half the team will never log in, and the portal will sit empty.

---

## Sending an announcement

Announcements are how you reach the whole crew at once without sending fifteen texts. Use them for schedule changes, weather holds, payroll cutoff reminders, safety updates, holiday closures, and the occasional "good job last week." Avoid using them for jokes — once the crew thinks announcements are noise, they'll stop reading them.

1. In the sidebar, click **Announcements** (under Crew Portal).
2. On the announcements page, click the gold **Send Announcement** button (top right).
3. The compose page opens. It has four cards stacked top to bottom: **Audience**, **Level**, **Subject**, and **Body**.
4. **Audience** — pick one of four tiles: **Everyone**, **Employees**, **Subcontractors**, or **Individual**. The selected tile glows gold. If you pick **Individual**, two more controls appear below: a row of pill buttons labeled **Employees** and **Subcontractors** (pick which kind of person you're messaging), then a dropdown to pick the actual person. Use **Individual** for things you'd otherwise text, like *"Marcus — please bring the Graco sprayer to the Henderson job tomorrow morning."*
5. **Level** — pick one of three tiles: **Info** (blue), **Important** (yellow), or **Urgent** (red). This controls how the message looks on the recipient's portal feed. Urgent shows a red banner across the top of their portal home until they tap it.
6. **Subject** — optional, up to 140 characters. A short label like *"Schedule update for Tuesday"*. If you skip it, the announcement still sends; the body becomes the subject.
7. **Body** — required. Plain text, free-form. Write it like a text message, not a memo. The placeholder reads *"Write the message here. Plain text. Will appear on every recipient's portal feed."*
8. Click the gold **Send announcement** button at the bottom. It disables itself when the body is empty. Within a second of clicking, you're back on the announcements list and your new message is at the top.

When to use each level:
- **Info.** *"New PPE rules go into effect Monday — see the safety card."* *"Welcome aboard to Carla, our new apprentice."* *"Office is closed for July 4th."*
- **Important.** *"Payroll cutoff moved from Friday 5pm to Thursday 5pm this week only."* *"Henderson kitchen pushed to next Wednesday — sub crews please re-plan."*
- **Urgent.** *"Severe weather hold for tomorrow — do not roll trucks until you hear from me."* *"Stop work on the Olmstead job, the customer changed scope, call me before doing anything else."* *"Safety incident on the Riverside job — everyone read the photo and ack."*

> **Why this matters:** the announcement system is the difference between you running the company by group text — losing track of who said what when — and running it by signal. Treat the levels like real signals. If you label everything Urgent, the red banner stops meaning anything. Brenda's rule: she labels at most one Urgent a month. If you're labeling more than that, the underlying problem isn't the label — it's the schedule.

---

## Reviewing crew photos

Photos are the truth. They're how you know what really happened on site, and they're what you use to defend invoices when a customer pushes back. There are two ways to look at them: across all projects, or scoped to one project.

**All projects view.** In the sidebar, click **Crew Photos** (under Crew Portal). The page is a wall of thumbnails, five columns wide on a desktop, with a filter bar at the top. The filters are: **Project** (dropdown of every project), **Tag** (All, Before, During, After, Issue, Other), **Uploader** (All, Employees, Subcontractors), and **From / To** date range. Each thumbnail shows the photo, a tag badge in the top-left corner if the uploader tagged it, the project name in gold underneath, and the uploader's name in small gray type below that. Click any thumbnail to open it full-screen in a lightbox. The lightbox has download and delete controls.

**Per-project view.** Open the project (sidebar → Projects → click the project), then click the **Photos** tab in the row of tabs near the top of the project page. Same grid, same lightbox, same filters — but everything is scoped to this one job. The tag filter is a row of gold pills along the top: **All**, **Before**, **During**, **After**, **Issue**, **Other**. There's also an **Uploader** dropdown on the right that lets you see only Marcus's photos, only the drywall sub's photos, etc.

When to use this:

- **Before invoicing.** Before Brenda emails an invoice to a customer, she goes to the project's Photos tab and pulls the before/after pair for the bathroom or the kitchen. She drops them into the invoice email. Customers pay 30% faster when they see the work alongside the bill.
- **For marketing.** Before Brenda updates the website portfolio or posts to Instagram, she filters by tag = `after`, then by project, then she has a curated set of finals to pick from.
- **For dispute resolution.** When a customer says *"the wall wasn't prepped properly"* and you remember Marcus shot a photo of the wall before he sprayed it, you go to that project's Photos tab, filter by Marcus and tag = `before`, find the photo, download it, and email it back. The conversation usually ends there.
- **For management review.** Friday afternoon: you scroll the all-projects view filtered to **Issue** tag for the week. Anything tagged Issue is something a crew member flagged as wrong — bad surface, missing materials, customer changed their mind. Each of those is a phone call you should make before Monday.

> **Why this matters:** before this portal existed, your photos lived in five different phones. The crew sometimes texted them to you, sometimes didn't, and the ones they did send you got lost in the message thread. Now every photo is in one place, tagged, dated, attached to a job, and credited to a person. That single change is what turns photos from clutter into evidence.

---

## Reviewing crew updates and activity

Updates are written notes from the field — different from photos. A photo says "look." An update says "here's what happened, here's what's next, here's what you need to know."

**Per-project updates.** Open the project, click the **Updates** tab. You'll see a chronological list of every note posted to this job, newest first. Above the list is a row of pill filters: **All**, **Notes**, **Progress**, **Issues**, **Completion**, **Status Changes**. Click a pill to scope the list. Each update card shows the author, the kind of update, the timestamp, and the body. Issues stand out — they're the ones with red accents.

**Cross-cutting activity feed.** In the sidebar, click **Crew Activity** (under Crew Portal). This is the firehose: every photo upload, every update, every time entry, every login, every PIN change, every announcement — across the whole company, not scoped to one project. The page has a date range (defaults to the last 7 days), an actor / text filter, and a row of entity-type pills you can toggle on and off (project photo, project update, time entry, portal session, portal credential, crew message, photo, update). Click an entity-type pill to include or exclude it.

When to use this:

- **End-of-week review.** Friday afternoon, on the project's Updates tab, filter by **Issues** for the week. Read each one. Any unresolved issue is your homework for Monday.
- **Audit trail.** Question comes up six months later: *who marked the Henderson exterior phase complete on April 14th?* Go to the project's Updates tab, filter by **Completion**, scroll to April 14th, and you have the name and timestamp. Every status change is logged forever.
- **Daily pulse check.** First coffee of the morning: open Crew Activity, last 24 hours, all entity types. Skim. If there's nothing in the feed, the crew didn't post yesterday — call Marcus. If there's a wave of photos and updates, the crew posted, and you can drill in to the ones that matter.

> **Why this matters:** the activity feed is what gives you eyes everywhere without driving to every site. Brenda runs payroll off the time entries showing up in the feed. You run management off the issue updates. The crew runs accountability off knowing that every action they take is visible. None of that worked when the operating manual was a stack of texts.

---

## Approving timesheets

Time entries flow into the portal from two places: the crew taps **Clock In** / **Clock Out** on their phones (which creates a time entry in real time), or they submit a manual entry for a missed clock-in (which goes into a Pending state, waiting for you).

1. In the sidebar, click **Timesheets** (under People).
2. You'll see a list of time entries. Pending entries have a yellow status badge. Approved entries have a green badge. Rejected entries have a red badge.
3. For each Pending entry, click into it to see the details: who worked, what project, what hours, any notes. You can **Approve**, **Reject**, or edit the hours before approving (e.g., if Marcus wrote 9 hours and you know he was at the Henderson job for 8).
4. Once you approve, those hours feed two things: payroll for that person, and the labor cost on that project's **Estimate vs Actual** report. So an unapproved timesheet doesn't show up in your reports — which is sometimes what you want (when you want to verify before counting it) and sometimes a problem (when you forget to approve and the report looks wrong on Friday).

Brenda's habit: **review timesheets every Friday afternoon, before she runs payroll Saturday morning.** Approve everything that's clearly right. Edit and approve everything that's slightly wrong (and message the person so they know you adjusted it). Reject and message anything that doesn't make sense at all.

> **Why this matters:** the moment Brenda approves a week of timesheets, the whole crew can see their pay summary on the portal. They know what they earned. They know it matches what they remember working. And they know it before payday, not after. That's the single biggest morale change a portal like this delivers — and it costs Brenda forty-five minutes a week.

---

## Disabling a former employee

When someone leaves — you let them go, they quit, they retire, you swapped to a new sub — you do this:

1. Sidebar → **Employees** (or **Subcontractors**) → click the person.
2. Click the **Portal Access** tab.
3. On the Portal Access card, find the **Status** row with the **Disable** button on the right. Click it. The status pill at the top of the card flips from **Active** (green) to **Disabled** (gray). The status row text changes to *"Login is blocked"*.
4. Below the status row, click the red-bordered **Revoke All Active Sessions** button. This logs them out of every device they're still signed in on — phone, tablet, laptop. If they had the portal open in a browser tab somewhere, that tab is now signed out.
5. (Optional, but recommended.) Go back to the **Overview** tab on that person's profile and update their status to **Terminated**. This removes them from the active count on the dashboard and excludes them from "active payroll" totals.

The record itself is not deleted — and that's intentional. You want their history (time entries, photos, updates) to stay attached to the projects they worked on, for invoicing, audits, and reference. Disabling the credential just turns off the front door. If you re-hire them later, flip the toggle back to **Enable**, and they're in again.

> **Why this matters:** off-boarding is the part that companies forget. They hire well, they on-board well, and then a person leaves and three months later that person can still see the customer list on their old phone. The two-click disable plus session revoke closes that door immediately, while leaving the record intact for your books. Five minutes of work, one less liability on your shoulders.
