# Spacing & Grid

Base unit: **8 px**. Every margin, padding, gap, and line-height step is a multiple of 8 (or 4 when finer control is unavoidable).

## Spacing scale

| Token   | Px  | Use                                       |
| ------- | --- | ----------------------------------------- |
| `0`     | 0   | Reset                                     |
| `0.5`   | 4   | Hairline gap (icon-to-text only)          |
| `1`     | 8   | Tight gap, icon padding                   |
| `2`     | 16  | Default inline gap                        |
| `3`     | 24  | Card inner padding                        |
| `4`     | 32  | Section break (small)                     |
| `5`     | 40  | Component padding (large)                 |
| `6`     | 48  | Section break (medium)                    |
| `8`     | 64  | Section break (default)                   |
| `10`    | 80  | Section break (large)                     |
| `12`    | 96  | Hero vertical padding                     |
| `16`    | 128 | Page vertical padding (top/bottom)        |
| `20`    | 160 | Mega section break                        |

## Web container widths

| Breakpoint | Container max-width | Side padding |
| ---------- | ------------------- | ------------ |
| Mobile     | 100% – 32 px        | 16 px        |
| Tablet     | 720 px              | 32 px        |
| Desktop    | 1120 px             | 48 px        |
| Wide       | 1280 px             | 64 px        |

## Social formats

| Format            | Canvas         | Safe area inset | Notes                                                         |
| ----------------- | -------------- | --------------- | ------------------------------------------------------------- |
| Square (IG/FB)    | 1080 × 1080    | 64 px all sides | Center logo locks to 480 px wide                              |
| Vertical post     | 1080 × 1350    | 64 / 80 / 64 / 80 | Headline lives in upper third, CTA in lower third           |
| Story / Reel      | 1080 × 1920    | 96 top / 240 bottom | Bottom inset accounts for IG/FB UI overlay                |
| Landscape (FB ad) | 1200 × 628     | 48 px all sides | Logo at 280 px wide, max one line of headline                 |

## Print

Default print size: **US Letter, 8.5 × 11 in @ 300 DPI = 2550 × 3300 px**.

| Region        | Inches      | Pixels @ 300 DPI |
| ------------- | ----------- | ---------------- |
| Trim          | 8.5 × 11    | 2550 × 3300      |
| Bleed         | 8.75 × 11.25 | 2625 × 3375     |
| Safe area     | 8 × 10.5    | 2400 × 3150      |
| Inner margin  | 0.5 in      | 150 px           |
| Gutter        | 0.25 in     | 75 px            |

For half-page (5.5 × 8.5) and postcard (4 × 6) variants, scale the same margin ratios proportionally.

## Logo clear-space rule

Always reserve clear space around the logo equal to the cap-height of "B" in the wordmark — roughly **1/4 of the wordmark height**. Nothing — text, photo edge, frame border — may enter that zone. This is non-negotiable; it protects logo legibility at small sizes.

For the mark-only emblem, the clear-space rule is the height of the location-pin shape inside the bridge.

## Grid for layouts

- Web: 12-column grid, 24 px gutter, fluid columns.
- Print: 6-column grid, 24 px gutter, 150 px outer margin.
- Social square: 6-column grid, 16 px gutter, 64 px outer margin.

## Minimum sizes

- Logo (full lockup): never smaller than **160 px wide on screen** or **1 in (300 px @ 300 DPI) wide in print**.
- Mark only: never smaller than **48 px on screen**, **0.5 in in print**.
- Below those sizes, rendering breaks down — switch to a different asset or remove the logo.
