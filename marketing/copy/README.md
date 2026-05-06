# Bridgepointe Pressure Washing — Marketing Copy

Eight deliverables for the 90-day pressure washing launch. All copy is final — match the voice rules in the campaign brief if anything needs editing.

---

## File index

| # | File | What it is |
|---|---|---|
| 01 | `01-content-calendar-90day.md` | 12-week Facebook + Instagram content calendar — 48 posts, 4 per week (Mon/Wed/Fri/Sun). Each post: date, theme, hook, full caption, hashtags, image direction. |
| 02 | `02-google-ads-campaign.md` | Three Responsive Search Ads (Broad pressure washing, Driveway, Commercial). 15 headlines + 4 descriptions each, 5 sitelinks, 8 callouts, structured snippets, 10 negative keywords, 25 keyword ideas grouped by intent. |
| 03 | `03-email-sequence.md` | Four-email launch sequence to existing customers. Day 0 announcement, Day 7 hot-water explainer, Day 14 before/after, Day 21 limited 14-day offer. Subject + 3 alternates per email, full body, plain-text fallback. |
| 04 | `04-cold-outreach-commercial.md` | B2B cold outreach for restaurants, property managers, auto dealerships. Three subject variants, opening email under 150 words, two follow-ups, and a 10–15 second phone opener per category. |
| 05 | `05-neighborhood-letter.md` | Single-page printed letter to drop in mailboxes within one block of every completed job. Fill-in fields, print spec, drop hygiene. |
| 06 | `06-landing-page-pressure-washing-atlanta.md` | Full Markdown spec for the new website page at `/pressure-washing-atlanta`. Metadata, JSON-LD schemas, all writeable copy. Engineer implements using `/src/app/cabinet-painting-atlanta/page.tsx` as the template. |
| 07 | `07-review-request-templates.md` | SMS, email, printed handoff card, and 5-line in-person walkthrough script. Sent within 24 hours of every job. |
| 08 | `README.md` | This file. |

---

## Recommended ship sequence

### Week 1 (now — May 8)
- Ship the **landing page** (`06`) — engineer implements, then push live.
- Send **Email 1** (`03`) to the existing customer list — Tue or Thu morning.
- Post the first three **calendar posts** (`01` posts 01–02, week 1).

### Week 2 (May 11–17)
- Launch **Google Ads** (`02`) — start at $50/day. Send the day after the landing page is live so the destination URL works.
- Begin daily **review request workflow** (`07`) on every completed job.
- Continue calendar posts (week 2).

### Week 3 (May 18–24)
- Send **Email 2** (`03`).
- Begin **B2B cold outreach** (`04`) — start with restaurants, 25 prospects/week.
- Continue calendar posts (week 3).

### Week 4 (May 25–31)
- Send **Email 3** (`03`).
- Begin **neighborhood letter drops** (`05`) — every completed job, no exceptions.
- Add property managers to outreach rotation (`04`).
- Continue calendar posts (week 4).

### Week 5 (Jun 1–7)
- Send **Email 4** (`03`) — the 14-day offer. Suppress anyone who already booked.
- Add auto dealerships to outreach rotation (`04`).
- Continue calendar posts (week 5).

### Weeks 6–12
- Calendar runs on autopilot — schedule a month at a time.
- Google Ads — review weekly. Tighten negatives, raise bids on best converting keywords.
- Cold outreach — three categories on a rolling rotation. Three touches per prospect, then drop for 90 days.
- Review requests — every job, every time.
- Letter drops — every job, every time.

---

## Voice + brand reminders (read before publishing anything)

- Direct. Confident. Never salesy.
- Real numbers, not "premium" or "luxury."
- Short sentences. 2–3 line paragraphs max.
- Em dashes for emphasis.
- No exclamation points except in CTAs.
- "We" and "you" — never "our team."
- Avoid: synergy, leverage, optimize, world-class, top-tier, world-renowned, second to none, unparalleled.
- All prices in real dollars — never "starting at competitive rates."
- Testimonials are placeholders (`[QUOTE]`, `[NAME]`) until real customer copy is collected. Do not invent.

---

## What's NOT in this folder

- Brand assets — `/marketing/brand/`
- Pressure-washing graphics — `/marketing/pressure-washing/`
- Print pieces (other than the neighborhood letter spec) — `/marketing/print/`
- Site code — `/src/`

The engineer implementing `06` should pull from `/src/app/cabinet-painting-atlanta/page.tsx` as the structural template and use `/marketing/pressure-washing/01-launch.png` for the OG image.

---

## Reporting cadence (recommended)

- **Daily:** Google Ads cost per qualified call.
- **Weekly:** Calendar post engagement; cold-outreach reply rate; review-request conversion.
- **Monthly:** Total leads by source (organic, Google Ads, social, referral, neighborhood letter, cold outreach).
- **Quarterly:** Cost per booked job by channel. Re-baseline the email sequence and landing page if conversion drifts more than 20%.
