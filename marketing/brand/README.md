# Bridgepointe Flooring & Painting — Brand System

This folder is the source of truth for the Bridgepointe identity. Anything outside this folder that references brand color, type, or logo should pull from here. If a color, font, or asset is not in this folder, it is not on-brand.

---

## What's in here

```
brand/
├── README.md                        ← you are here
├── logo-full-color/                 ← original logo, 4 sizes (256/512/1024/2048 wide PNG)
├── logo-white/                      ← single-color white knockout, transparent bg
├── logo-mark-only/                  ← bridge + brush + pin emblem only, no wordmark
├── logo-wordmark/                   ← "BRIDGE POINTE FLOORING & PAINTING" text block only
├── lockups/
│   ├── logo-on-dark.png             ← logo + tagline on charcoal panel
│   ├── logo-on-light.png            ← logo + tagline on warm-white panel
│   └── logo-stacked-with-tagline.png ← logo + tagline, transparent bg
└── tokens/
    ├── colors.json                  ← machine-readable color tokens
    ├── colors.css                   ← CSS custom properties
    ├── typography.md                ← type stack + scale
    └── spacing.md                   ← 8pt grid + container/social/print sizes
```

---

## Voice & tone

**Direct. Confident. Never salesy.** We did the work, here's what it cost, here's why.

- Use real numbers. "$3,400 cabinet refinish, 4 days" beats "premium results."
- Skip buzzwords: no "luxury," no "world-class," no "passionate." If a competitor would say it, we don't.
- Sentences are short. Paragraphs are 2–3 lines.
- Em dashes — yes. Exclamation points — only inside CTAs ("Get a quote!"), never in body copy.
- First person plural for the company ("we"), second person for the homeowner ("you"). Never "the customer" or "our valued clients."
- Honesty over hype. If a job is slow or messy, say so. Then say how we handle it.

### On-brand sentence examples

> "We re-coated the floors in two days. The HVAC stayed off. No dust on the trim."

> "Cabinet refinishing runs $2,800–$4,500 for a typical kitchen. We spray on-site — no take-down, no shop fees."

> "Exterior paint in Atlanta humidity is a timing problem, not a paint problem."

### Off-brand — don't write this

> "Bridgepointe is your premier choice for luxury flooring solutions in the greater Atlanta area." (delete every word.)

> "Our team of dedicated craftsmen are passionate about delivering world-class results!" (false certainty + filler.)

---

## Color combinations

### Use these
- **Navy on warm-white** — default headline color. Highest contrast, cleanest look.
- **Green on warm-white** — accent CTA, secondary buttons, "paint" callouts.
- **Charcoal body text on warm-white** — never pure black on pure white; warm-white softens the page.
- **White logo on charcoal** — dark hero sections, social cards, video overlays.
- **Green-bright on navy** — small accent badges only (e.g., "New" pills). Don't use as text color on navy.

### Don't use
- Navy on charcoal — both dark, no contrast. The eye can't separate them.
- Green on gold — muddy. Pick one accent per layout.
- Gold on warm-white as a CTA — leftover from pre-rebrand site styling. Use green instead for new work.
- Any pure black or pure white. Use `#1A1A1A` for "black" and `#F5F2ED` for "white" body surfaces.
- Green-bright (`#6B9E35`) for body text — fails AA contrast on warm-white.

### Quick contrast cheat-sheet (WCAG AA)

| Foreground         | Background            | Ratio  | Pass for body text |
| ------------------ | --------------------- | ------ | ------------------ |
| `#17233B` (navy)   | `#F5F2ED` (warm-white) | 13.7:1 | yes                |
| `#365E1F` (green)  | `#F5F2ED` (warm-white) |  7.0:1 | yes                |
| `#6B9E35` (bright) | `#F5F2ED` (warm-white) |  3.1:1 | large text only    |
| `#F5F2ED` (white)  | `#1A1A1A` (charcoal)   | 17.4:1 | yes                |
| `#F5F2ED` (white)  | `#17233B` (navy)       | 13.4:1 | yes                |

---

## Logo: do / don't

### Do

- Always use the supplied PNG assets. Never re-trace, re-color, or re-typeset the wordmark.
- Maintain clear-space equal to the cap-height of "B" in the wordmark on all sides.
- Use `logo-white/` on dark backgrounds (charcoal, navy, photographs darker than 50% gray).
- Use `logo-full-color/` on warm-white, cream, and light photographs.
- Use `logo-mark-only/` for favicons, social avatars, app icons, and any context where the wordmark would render below 160 px wide.
- Use `logo-wordmark/` when the emblem is redundant — e.g., next to a hero photo where a small plain typographic mark feels less busy.

### Don't

- Don't put the full-color logo on a busy or mid-tone photo background. Add a panel or use the white version.
- Don't recolor the logo. The colors in `tokens/colors.json` are the only acceptable palette.
- Don't stretch, skew, rotate, or apply drop-shadows.
- Don't add a stroke, glow, or gradient overlay.
- Don't crop the wordmark to make it fit. Use `logo-mark-only/` instead.
- Don't shrink the full lockup below 160 px wide on screen or 1 in in print — switch to mark-only.
- Don't reproduce the wordmark text in Helvetica or any other font and call it the logo.

---

## Lockup samples

The three files in `lockups/` are reference compositions, not the only allowed lockups. Use them when you need a quick drop-in for slides, social, or video. For new compositions, follow the clear-space rule and use the typography tokens.

| File | When to use |
| ---- | ----------- |
| `logo-on-dark.png` | Video end cards, dark social posts, footer of dark email templates |
| `logo-on-light.png` | Light social posts, print flyers, presentation slides on warm-white |
| `logo-stacked-with-tagline.png` | Transparent-bg drop-in for any background — overlay onto your own composition |

---

## Tagline

Primary tagline (used in lockups):

> Hot Water Pressure Washing · Metro Atlanta

Note: this tagline emphasizes the pressure-washing service line. The company name still says "Flooring & Painting." Other agents producing campaign content should pick the tagline that matches the campaign's service focus and not assume this one is universal.

Service-line variants when not pressure-washing:
- "Flooring & Painting · Metro Atlanta"
- "Interior + Exterior Painting · Atlanta"
- "Cabinet Refinishing · Atlanta Metro"

Always: middle dot (`·`, U+00B7), single space on each side. Never an em dash, hyphen, or vertical bar in the tagline.

---

## File-naming convention

For new brand assets added to this folder:

```
bridgepointe-{type}-{variant}-{size-or-purpose}.png
```

Examples: `bridgepointe-logo-white-1024.png`, `bridgepointe-mark-256.png`, `bridgepointe-wordmark-512.png`.

Lowercase, hyphens, no spaces, no version numbers in filenames (use git for versioning).

---

## Source files

- Master logo: `/Bridgepoint/public/images/logo.png` (700×506, RGBA). All assets in this folder are derived from it.
- Existing site colors: mirrored in `/Bridgepoint/src/app/globals.css`.
- Site image registry: `/Bridgepoint/src/lib/images.ts`.

If the master logo is updated, regenerate every PNG in this folder by re-running the ImageMagick pipeline documented in commit history.
