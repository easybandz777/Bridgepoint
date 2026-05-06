# Typography

System fonts only. No webfont licensing, no FOUT, no per-asset cost.

## Font stack

```css
--bridgepointe-font-display: "Helvetica Neue", "AvenirNext-Heavy", "Avenir Next", system-ui, -apple-system, sans-serif;
--bridgepointe-font-body:    "Helvetica Neue", "Avenir Next", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--bridgepointe-font-mono:    "SF Mono", ui-monospace, "Menlo", "Monaco", "Consolas", monospace;
```

| Role     | Family                          | Weight              | Tracking | Use                                          |
| -------- | ------------------------------- | ------------------- | -------- | -------------------------------------------- |
| Display  | Helvetica Neue / Avenir Next    | 800 (Heavy / Black) | -0.02em  | Hero headlines, billboard text, social card  |
| Heading  | Helvetica Neue                  | 700 (Bold)          | -0.01em  | H1–H3, section titles                        |
| Subhead  | Helvetica Neue                  | 600 (Semibold)      | -0.005em | H4–H6, eyebrow labels, button text           |
| Body     | Helvetica Neue                  | 400 (Regular)       |  0       | Paragraphs, descriptions                     |
| Caption  | Helvetica Neue                  | 400 (Regular)       |  0.01em  | Captions, metadata, fine print               |
| Mono     | SF Mono                         | 400                 |  0       | Numbers in cost breakdowns, code snippets    |

The website itself uses Inter / Playfair Display via Google Fonts (see `globals.css`). For *print, social, and offline assets* — where webfonts can't render — use the system stack above. They're tonally consistent with Inter and ship on every Mac, iOS, and modern Windows.

## Type scale

Two scales. Pick by medium.

### Screen scale (px / line-height / weight)

| Token   | Size | LH   | Weight | Use                              |
| ------- | ---- | ---- | ------ | -------------------------------- |
| display | 72   | 1.05 | 800    | Hero on landing                  |
| h1      | 48   | 1.10 | 700    | Page titles                      |
| h2      | 36   | 1.15 | 700    | Section titles                   |
| h3      | 28   | 1.20 | 700    | Subsection                       |
| h4      | 22   | 1.25 | 600    | Card titles                      |
| h5      | 18   | 1.30 | 600    | Eyebrow / labels                 |
| body-lg | 18   | 1.55 | 400    | Hero body, lead paragraphs       |
| body    | 16   | 1.55 | 400    | Default body                     |
| body-sm | 14   | 1.50 | 400    | Secondary text, form labels      |
| caption | 12   | 1.40 | 400    | Captions, fine print, metadata   |

### Print / social scale (px @ 300 DPI = points × ~4.17)

For 8.5×11 print docs and 1080-wide social posts, scale up. Targets readability at arm's length.

| Token   | Size (px) | Equivalent print pt | Use                       |
| ------- | --------- | ------------------- | ------------------------- |
| display | 144       | 48 pt               | Flyer hero, IG carousel 1 |
| h1      | 96        | 32 pt               | Flyer headline            |
| h2      | 72        | 24 pt               | Subheadings, callouts     |
| h3      | 56        | 18 pt               | Card titles               |
| body-lg | 36        | 12 pt               | Print body                |
| body    | 30        | 10 pt               | Print body, dense layouts |
| caption | 24        | 8 pt                | Legal, address line       |

## Pairing rules

- One display font per layout. Don't mix Helvetica display with Avenir display in the same composition.
- Use weight contrast — not color contrast — to establish hierarchy first.
- Numbers in pricing or square-footage callouts: use SF Mono. Tabular figures align cleanly.
- Wordmark text in the logo is custom — never recreate it from Helvetica or any other font. Always use the wordmark PNG asset.

## Setext rhythm

- Body line-length target: 60–75 characters per line.
- Paragraphs: 2–3 lines max (per voice guide).
- Always pin headings to the 8pt grid (see `spacing.md`).
