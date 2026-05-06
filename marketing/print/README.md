# Bridgepointe Print Collateral — Pressure Washing Launch

Physical marketing pieces for Bridgepointe Flooring & Painting's hot-water pressure
washing service launch. All artwork is print-ready PNG with embedded DPI metadata.

Phone: **(862) 421-8973** · URL: **bridgepointepainting.com**

---

## File inventory

| File | Pixels | Trim size | DPI | Notes |
|---|---|---|---|---|
| `door-hanger-front.png` | 1275 x 3300 | 4.25" x 11" portrait | 300 | Front side, neighbor pitch |
| `door-hanger-back.png` | 1275 x 3300 | 4.25" x 11" portrait | 300 | Back side, "Why hot water" + 2-yr guarantee + QR placeholder |
| `yard-sign.png` | 3600 x 2700 | 24" x 18" landscape | 150 | Single-sided artwork (print double-sided same image) |
| `trailer-rear-panel.png` | 2400 x 1200 | 8 ft x 4 ft (proportional) | 150 | Before/after composite + central CTA block |
| `trailer-side-panel.png` | 1800 x 600 | 6 ft x 2 ft (proportional) | 150 | Logo + headline + phone, readable at speed |
| `business-card-front.png` | 1050 x 600 | 3.5" x 2" landscape | 300 | Contact + name placeholder `[NAME]` |
| `business-card-back.png` | 1050 x 600 | 3.5" x 2" landscape | 300 | Wordmark + service list + tagline |

DPI is encoded in PNG `pHYs` chunk. ImageMagick stores it normalized to
PixelsPerCentimeter — the values are mathematically exact (118.11 ppcm = 300 ppi,
59.05 ppcm = 150 ppi). Every modern print RIP and prepress tool reads `pHYs` as
ppcm or ppi interchangeably; if a vendor's portal asks you to confirm, the
intended physical dimensions are the trim sizes in the table above.

---

## Print specs by piece

### Door hangers (front + back)

- **Trim**: 4.25" x 11" portrait
- **Bleed**: add 0.125" on every edge (final cut size 4.5" x 11.25")
- **Safe zone**: keep critical text 0.25" from trim edges
- **Hole punch**: 0.5" diameter, centered horizontally, ~0.5" from top edge.
  The white circle outline at the top of each side is the indicator — vendor will replace it with an actual punch.
- **Paper**: 16pt cardstock with matte or soft-touch finish. UV coating optional but
  costs more and is unnecessary for a door-drop piece.
- **Print sides**: 4/4 full color, both sides
- **Quantity recommendation**: **1,000** for the first run. Door drops in
  Atlanta neighborhoods consume them fast; per-unit cost drops sharply at 1k vs 250.
- **Vendors**:
  - VistaPrint — https://www.vistaprint.com/marketing-materials/door-hangers (cheapest, slow turnaround)
  - GotPrint — https://www.gotprint.com/g/door-hangers.do (best price-to-quality, ~5 day turn)
  - 4OVER4 — https://www.4over4.com/category/door-hangers (premium stock + faster turn)
  - PrintPlace — https://www.printplace.com/door-hangers/

### Yard signs

- **Trim**: 24" x 18" landscape
- **Bleed**: 0.25" all sides (vendors typically auto-add for corrugated plastic)
- **Material**: 4mm corrugated plastic ("Coroplast"). Single-sided print is fine —
  print the same artwork on both sides for double-sided ($5–8 more per sign).
- **Stakes**: H-frame wire stakes, 30" tall — order one per sign
- **Quantity**: **25–50** for first run. Plant one in every cleaned yard with
  homeowner permission; rotate them to new yards weekly.
- **Vendors**:
  - SignsOnTheCheap — https://www.signsonthecheap.com/products/yard-signs
  - DiscountSignsAndPrinting — https://www.discountsignsandprinting.com/yard-signs
  - BuildASign — https://www.buildasign.com/yard-signs
  - Local: any sign shop in metro Atlanta will turn these in 24–48 hours

### Trailer panels (rear + side)

- **Material**: outdoor vinyl decal with laminate, OR aluminum composite
  (Dibond/Alupanel) for permanent install
- **Mounting**: rear panel adheres to trailer back doors; side panels wrap onto
  side walls. Confirm exact trailer surface dimensions before final print —
  files are sized proportionally.
- **Resolution**: 150 DPI is sufficient for vehicle wraps viewed from 10 ft+
- **Quantity**: 1 each
- **Vendors**:
  - SignaRama Atlanta — https://www.signarama.com/locations
  - FastSigns Atlanta — https://www.fastsigns.com/atlanta
  - Speedpro Imaging — https://speedpro.com — vehicle wrap specialists
  - Any trailer-wrap shop with their own large-format printer

**IMPORTANT**: The trailer-rear-panel.png uses interior renovation photos
(`gallery/painting/47.jpg` and `gallery/painting/14.jpg`) as before/after
placeholders because no real pressure-washing photography exists yet. **Swap
both halves for actual driveway before/after pressure-washing photos before
final print.** The composite is built so the left and right halves can be
replaced independently while keeping the headline, BEFORE/AFTER tabs, central
logo block, and tagline.

### Business cards

- **Trim**: 3.5" x 2" landscape (standard US card)
- **Bleed**: 0.125" all sides (final cut 3.625" x 2.125")
- **Safe zone**: 0.125" from trim edge
- **Stock**: 16pt or 32pt with soft-touch matte. 32pt feels premium and only
  costs ~30% more.
- **Quantity**: **250** to start, **500** if multiple crew members carry them
- **Name field**: replace `[NAME]` with the actual cardholder before sending to
  print. Front-side layout has space for owner name + title (currently `OWNER`).
- **Vendors**:
  - Moo — https://www.moo.com/us/products/business-cards (best feel, premium price)
  - VistaPrint — https://www.vistaprint.com/business-cards
  - GotPrint — https://www.gotprint.com/g/business-cards.do
  - PrintingCenterUSA — https://www.printingcenterusa.com/business-cards

---

## Brand notes

- Colors used:
  - Logo navy `#1d2e51` (primary)
  - Logo green `#3ba848` (accent / CTA)
  - Charcoal `#0f0f0f` (services block)
  - Warm white `#f5f1e8` (backgrounds)
  - Gold `#b8956a` (price callouts on door hanger)
- Fonts: Helvetica Neue (system font). For final-final production, swap to
  the brand display font when one is established.
- White-knockout logo is generated from the source RGBA logo by extracting the
  alpha channel as the mask. No standalone `/marketing/brand/` folder existed
  at build time — when a brand-foundation agent later produces canonical logo
  variants, replace inline knockouts with those files.

## Design tradeoffs made

- **Door hanger front "STARTING PRICES"**: prices use gold `#b8956a` for visual
  warmth without competing with the green CTA bar. Bundle line is highlighted in
  green to draw the eye to the upsell.
- **Yard sign**: cream background was chosen over white for outdoor legibility
  (cream + navy + green has higher perceived contrast in midday glare than
  pure white + navy). Phone number is the largest single element by design.
- **Trailer rear panel**: BEFORE side is intentionally desaturated and slightly
  dark (modulate 78,68,100) to feel "before." AFTER side is brightened
  (modulate 110,115,100). The green seam stripe makes the split read as a
  deliberate comparison rather than a stitching artifact.
- **Trailer side panel**: split into three explicit columns (logo / headline /
  phone) with thin green dividers. This prevents text overlap at any viewing
  angle and the columns mean each piece of info sits in its own visual cell.
- **Business card back**: kept intentionally minimal — the wordmark dominates,
  service list reads as supporting copy, "PRESSURE WASHING" is in green to flag
  the new offering. Tagline at the bottom is the value prop in one line.

## Source images used as placeholders

- `gallery/painting/47.jpg` — interior hallway, used as BEFORE on trailer rear.
  Date stamp "September 13, 2025" was cropped out (top 88% of frame retained).
- `gallery/painting/14.jpg` — interior kitchen/great-room, used as AFTER on
  trailer rear. No source artifacts.

Both will be replaced with real pressure-washing before/after photos once the
crew completes the first jobs and captures driveway/house images.
