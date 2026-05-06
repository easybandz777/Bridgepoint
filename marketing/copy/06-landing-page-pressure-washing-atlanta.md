# Landing Page Spec — `/pressure-washing-atlanta`

Engineer: implement using the existing template at `/src/app/cabinet-painting-atlanta/page.tsx`. All copy below is final — drop into the matching slots.

Brand color overlay for hero gradient: use the hot/red accent `#f87171` (matches the pressure-washing graphic palette). Gold accent `#b8956a` stays for the H1 second line and CTAs.

---

## 1. Metadata

```ts
export const metadata: Metadata = {
    title: 'Pressure Washing Atlanta, GA | Hot-Water House Wash | Bridgepointe',
    description: 'Hot-water pressure washing in Metro Atlanta — 200°F kills mildew at the root. House wash from $250, driveway from $125, roof soft wash from $400. Two-year guarantee. Free on-site estimates.',
    keywords: [
        'pressure washing Atlanta', 'hot water pressure washing Atlanta', 'house wash Atlanta GA',
        'soft wash Atlanta', 'roof cleaning Atlanta', 'driveway cleaning Atlanta',
        'pressure washing Buckhead', 'pressure washing Sandy Springs', 'pressure washing Roswell',
        'pressure washing Alpharetta', 'pressure washing Marietta', 'pressure washing East Cobb',
        'commercial pressure washing Atlanta', 'restaurant pressure washing Atlanta',
        'mildew removal Atlanta', 'concrete cleaning Atlanta', 'deck cleaning Atlanta',
    ],
    openGraph: {
        title: 'Hot-Water Pressure Washing Atlanta, GA | Bridgepointe',
        description: '200°F kills mildew at the root. House wash from $250. Two-year guarantee. Free on-site estimates.',
        url: 'https://bridgepointepainting.com/pressure-washing-atlanta',
        images: [{ url: '/marketing/pressure-washing/01-launch.png', width: 1080, height: 1080, alt: 'Bridgepointe hot-water pressure washing — Metro Atlanta' }],
    },
    alternates: { canonical: 'https://bridgepointepainting.com/pressure-washing-atlanta' },
};
```

---

## 2. Schema (JSON-LD)

### Service schema

```ts
const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Hot-Water Pressure Washing',
    provider: { '@type': 'LocalBusiness', name: 'Bridgepointe', url: 'https://bridgepointepainting.com', telephone: '+1-862-421-8973' },
    areaServed: { '@type': 'State', name: 'Metro Atlanta, Georgia' },
    description: 'Hot-water pressure washing across Metro Atlanta. 200°F kills mildew at the root, dissolves grease, and cuts cleaning time in half. House wash, driveway, roof soft wash, deck, patio, and commercial accounts. Two-year guarantee on exterior cleaning.',
    serviceType: 'Pressure Washing Contractor',
    offers: {
        '@type': 'AggregateOffer',
        lowPrice: '125',
        highPrice: '700',
        priceCurrency: 'USD',
    },
};
```

### FAQ schema (mirror to the on-page FAQ section)

```ts
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'How much does pressure washing cost in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe whole-house soft wash starts at $250. Driveway cleaning starts at $125. A house + driveway bundle is $325. Roof soft wash starts at $400. Deck cleaning starts at $250. A full exterior bundle (house + driveway + roof) is $700. Every quote is written, itemized, and on-site at no charge.' } },
        { '@type': 'Question', name: 'Why does Bridgepointe use hot water for pressure washing?', acceptedAnswer: { '@type': 'Answer', text: 'Hot water at 200°F kills mildew at the root, dissolves grease, and cuts cleaning time in half compared to cold-water rigs. Most pressure washing contractors in Metro Atlanta run cold water — they can clean the surface but cannot kill the spore that causes mildew streaks to come back. Heat is the difference between a 90-day clean and a 24-month guarantee.' } },
        { '@type': 'Question', name: 'Will pressure washing damage my paint or siding?', acceptedAnswer: { '@type': 'Answer', text: 'Not when done correctly. Bridgepointe uses soft wash for vinyl siding, painted wood, brick, stucco, and roofs — low pressure, high heat, the right cleaning solution. High-PSI surface cleaners are reserved for concrete and masonry. We pre-wet every plant, mask outlets and HVAC vents, and inspect for soft mortar or chalking paint before any cleaning solution is applied.' } },
        { '@type': 'Question', name: 'How often should my house be pressure washed in Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'House siding every 18 months. Roof every 24 months. Driveway annually. Deck annually with seal every 2–3 years. Atlanta humidity, hardwood canopy shade, and pollen season make this market faster to re-soil than most. Bridgepointe will calendar a reminder so you do not have to track it.' } },
        { '@type': 'Question', name: 'Do you offer a guarantee on pressure washing?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Two-year guarantee on every exterior cleaning. If mildew or algae returns inside 24 months, Bridgepointe re-treats the affected area free. The guarantee is written into the receipt. The reason we can offer it: hot water at 200°F sterilizes the spore, not just the surface.' } },
        { '@type': 'Question', name: 'What neighborhoods do you serve in Metro Atlanta?', acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe serves Buckhead, Vinings, East Cobb, Sandy Springs, Alpharetta, Roswell, Marietta, Milton, Suwanee, Kennesaw, Dunwoody, Brookhaven, Johns Creek, Smyrna, Cobb County, and the broader Metro Atlanta area. Same-week scheduling is typical for the inner ring; outer suburbs may book one to two weeks out during peak pollen and mildew season.' } },
    ],
};
```

### Breadcrumb

```ts
const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/select-services' },
    { name: 'Pressure Washing Atlanta', url: '/pressure-washing-atlanta' },
]);
```

---

## 3. Hero section

**Eyebrow (small uppercase tracked):**
Pressure Washing · Metro Atlanta, GA

**Headline (H1):**
Hot-Water Pressure
*Washing Atlanta* (gold)

**Subhead:**
200°F kills mildew at the root. Same Bridgepointe crew that paints your house — now washing it. Eighteen years in Metro Atlanta.

**Primary CTA:** Get Free Estimate → /select-services
**Secondary CTA:** See Before/After → /before-and-after

---

## 4. Value-prop strip (3 numbered cards with stats)

| Label | Value | Sub |
|---|---|---|
| vs. Cold-Water Rigs | 200°F Hot Water | Kills the spore, not just the surface. |
| Mildew Guarantee | 2 Years | Comes back, we re-treat free. |
| Average Job Time | Half the Hours | One trailer, one crew, one morning. |

---

## 5. Process section (numbered steps)

**Heading:** Our Pressure Washing Process
**Subhead:** Six steps — no shortcuts — for a clean that holds for two years.

| # | Step | Body |
|---|---|---|
| 01 | Walk-Through | We mark fragile plants, tape outlets and HVAC vents, and check for loose siding or soft mortar before any water touches the house. |
| 02 | Pre-Wet | Every plant on the property gets a fresh-water rinse before cleaning solution is applied. Boxwoods stay alive. |
| 03 | Apply Solution | Soft-wash chemistry matched to the surface — vinyl, brick, stucco, painted wood, or roof shingles. Low pressure, high heat. |
| 04 | Hot-Water Wash | 200°F at 8 GPM lifts mildew, pollen, dust, and grime in one pass. Heat is the difference. |
| 05 | Rinse + Neutralize | Final rinse with neutralizer to protect plants and finishes. Concrete dry-time noted on the invoice. |
| 06 | Walk-Around + Sign-Off | Same crew member who started the job walks it with you before we leave. Two-year guarantee on the receipt. |

---

## 6. Service menu (table with prices)

**Heading:** Pressure Washing Service Menu

| Service | Starting Price | Detail |
|---|---|---|
| Whole-House Soft Wash | from $250 | Hot water + soft-wash chemistry. Vinyl, brick, painted wood, stucco. |
| Driveway Cleaning (1–2 car) | from $125 | Surface cleaner + degreaser. Lifts oil, clay, pollen. |
| Roof Soft Wash | from $400 | Low-pressure pump + manufacturer-approved kill solution. No granule loss. |
| Deck Cleaning | from $250 | Hot water + brightener. Stain or seal quoted separately. |
| House + Driveway Bundle | from $325 | Most-booked combo. One morning, one crew, one bill. |
| Full Exterior Bundle | from $700 | House + driveway + roof. Save $50+ vs. booking separately. |
| Commercial Dumpster Pad | from $125/visit | Monthly recurring schedule. |
| Restaurant Exhaust Pad | from $250/visit | Hot water + heavy degreaser. Before opening or after close. |

> Every job comes with a two-year guarantee on the cleaning. If mildew or algae returns inside 24 months, we re-treat free.

---

## 7. FAQs (mirror the FAQ schema; render full answers on the page)

**Heading:** Pressure Washing FAQs — Atlanta, GA

1. **How much does pressure washing cost in Atlanta?**
   Bridgepointe whole-house soft wash starts at $250. Driveway cleaning starts at $125. A house + driveway bundle is $325. Roof soft wash starts at $400. Deck cleaning starts at $250. A full exterior bundle (house + driveway + roof) is $700. Every quote is written, itemized, and on-site at no charge.

2. **Why does Bridgepointe use hot water for pressure washing?**
   Hot water at 200°F kills mildew at the root, dissolves grease, and cuts cleaning time in half compared to cold-water rigs. Most pressure washing contractors in Metro Atlanta run cold water — they can clean the surface but cannot kill the spore that causes mildew streaks to come back. Heat is the difference between a 90-day clean and a 24-month guarantee.

3. **Will pressure washing damage my paint or siding?**
   Not when done correctly. Bridgepointe uses soft wash for vinyl siding, painted wood, brick, stucco, and roofs — low pressure, high heat, the right cleaning solution. High-PSI surface cleaners are reserved for concrete and masonry. We pre-wet every plant, mask outlets and HVAC vents, and inspect for soft mortar or chalking paint before any cleaning solution is applied.

4. **How often should my house be pressure washed in Atlanta?**
   House siding every 18 months. Roof every 24 months. Driveway annually. Deck annually with seal every 2–3 years. Atlanta humidity, hardwood canopy shade, and pollen season make this market faster to re-soil than most. Bridgepointe will calendar a reminder so you do not have to track it.

5. **Do you offer a guarantee on pressure washing?**
   Yes. Two-year guarantee on every exterior cleaning. If mildew or algae returns inside 24 months, Bridgepointe re-treats the affected area free. The guarantee is written into the receipt. The reason we can offer it: hot water at 200°F sterilizes the spore, not just the surface.

6. **What neighborhoods do you serve in Metro Atlanta?**
   Bridgepointe serves Buckhead, Vinings, East Cobb, Sandy Springs, Alpharetta, Roswell, Marietta, Milton, Suwanee, Kennesaw, Dunwoody, Brookhaven, Johns Creek, Smyrna, Cobb County, and the broader Metro Atlanta area. Same-week scheduling is typical for the inner ring; outer suburbs may book one to two weeks out during peak pollen and mildew season.

---

## 8. Hyperlocal section (neighborhoods)

**Heading:** Where We Wash

**Intro:**
Eighteen years in Metro Atlanta. Same crew, same trailer, every neighborhood. If you're in one of these zip codes, we're already on your side of town most weeks.

**Render as a 4-column grid of neighborhood chips. Each links to the matching `/painting-contractor-[neighborhood]` page if it exists; otherwise falls through to `/select-services`.**

- Buckhead
- Vinings
- East Cobb
- Sandy Springs
- Alpharetta
- Roswell
- Marietta
- Milton
- Suwanee
- Kennesaw
- Dunwoody
- Brookhaven
- Johns Creek
- Smyrna
- Cobb County
- All Metro Atlanta

---

## 9. CTA section (closing)

**Heading:** Ready to See What Hot Water Does?

**Sub:**
Free on-site estimate. We measure, photograph, and write the proposal in front of you — itemized, no high-pressure pitch.

**Primary CTA button:** Get Free Pressure Wash Estimate → /select-services

**Phone line below button (clickable on mobile):** Or call (862) 421-8973 — we answer our own phone.

---

## Implementation notes for engineering

- Mirror the structural pattern of `cabinet-painting-atlanta/page.tsx` — same `<section>` order, same Tailwind utility patterns.
- Hero gradient uses `#f87171` (pressure-washing accent) instead of `#34d399` (cabinet accent) — single-token swap.
- Service menu table renders with the same dark card pattern as the value-prop strip — `.bg-[#1a1a1a] border border-white/6 rounded-2xl`.
- FAQ section accordion: optional. Render flat (matching cabinet page) is acceptable.
- Add to `sitemap.ts` and `robots.ts` includes.
- Hreflang and canonical already handled by metadata.alternates.canonical.
- Add link to header navigation under Services.
