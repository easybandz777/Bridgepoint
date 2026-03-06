// ─── Template Types ───────────────────────────────────────────────────────────

export type LineItem = {
    id: string;
    category: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
};

export type Milestone = { label: string; percentage: number; amount: number; due: string };

export type EstimateTemplate = {
    id: string;
    name: string;
    subtitle: string;
    icon: string;
    color: string;
    description: string;
    highlights: string[];
    defaultDuration: string;
    defaultTitle: string;
    lineItems: Omit<LineItem, 'id'>[];
    milestones: Milestone[];
    terms: string[];
    notes: string;
};

function li(category: string, description: string, quantity: number, unit: string, unitPrice: number): Omit<LineItem, 'id'> {
    return { category, description, quantity, unit, unitPrice, total: quantity * unitPrice };
}

// ─── 1. PAINTING ─────────────────────────────────────────────────────────────

const PAINTING_TEMPLATE: EstimateTemplate = {
    id: 'painting',
    name: 'Painting',
    subtitle: 'Interior & Exterior',
    icon: '🖌️',
    color: '#60a5fa',
    description: 'Premium residential or commercial painting proposal. Covers surface prep, interior walls & ceilings, trim, specialty finishes, exterior siding, and all materials.',
    highlights: ['Interior surface prep & patching', 'Walls, ceilings, trim, doors', 'Cabinetry spray finish', 'Exterior full scope', 'Premium zero-VOC paint materials'],
    defaultDuration: '2–3 weeks',
    defaultTitle: 'Interior & Exterior Painting — [Client] Residence',
    lineItems: [
        // ── Interior Preparation ──
        li('Labor', 'Interior surface inspection, cleaning & lead-safe containment setup', 1, 'job', 480),
        li('Labor', 'Drywall patch & skim coat — nail pops, screw dimples, hairline cracks (per room audit)', 1, 'job', 1200),
        li('Labor', 'Interior surface sanding — walls and ceilings (medium-grit, orbital)', 3200, 'sq ft', 0.45),
        li('Labor', 'Caulking — window casings, door frames, crown-to-wall, base-to-floor joints', 1, 'job', 680),
        li('Labor', 'Spot prime — all repaired areas, stain blocks, tannin-bleed zones', 1, 'job', 540),
        li('Labor', 'Full-coat prime — walls receiving color change of 2+ shades', 2400, 'sq ft', 0.55),

        // ── Interior Walls ──
        li('Labor', 'Interior walls — first finish coat (cut & roll, premium sheen)', 3200, 'sq ft', 0.80),
        li('Labor', 'Interior walls — second finish coat (final coverage, cut & roll)', 3200, 'sq ft', 0.75),
        li('Labor', 'Accent / feature wall — single wall, designer color or specialty finish', 280, 'sq ft', 2.40),

        // ── Ceilings ──
        li('Labor', 'Ceilings — flat latex, two coats (standard 9–10 ft height)', 1600, 'sq ft', 1.40),
        li('Labor', 'Coffered / tray ceiling detail — edge cuts, multiple planes', 1, 'job', 1400),
        li('Labor', 'Smooth ceiling spray (knock-down removal & Level-5 skim, if applicable)', 1, 'job', 2800),

        // ── Trim & Millwork ──
        li('Labor', 'Baseboards — paint or stain grade, caulk, two coats semi-gloss', 420, 'lin ft', 2.10),
        li('Labor', 'Crown molding — cut edges, two coats semi-gloss', 480, 'lin ft', 2.40),
        li('Labor', 'Window casings & stools — sand, caulk, two coats semi-gloss', 18, 'windows', 85),
        li('Labor', 'Interior passage doors & jambs — two coats semi-gloss (both sides)', 18, 'doors', 165),
        li('Labor', 'Interior French doors — glazing bars, two coats', 4, 'doors', 285),
        li('Labor', 'Wainscot paneling — prime, two coats semi-gloss', 360, 'sq ft', 3.20),
        li('Labor', 'Built-in shelving & cabinetry — brush & back-roll, two coats', 1, 'job', 1800),

        // ── Cabinetry ──
        li('Labor', 'Kitchen cabinetry — doors & boxes stripped, spray-primed, two-coat spray finish', 1, 'job', 5200),
        li('Labor', 'Bath vanity cabinets — spray prime & two-coat finish', 3, 'vanities', 680),

        // ── Specialty Finishes ──
        li('Labor', 'Faux or decorative finish — Venetian plaster or limewash (accent area)', 200, 'sq ft', 12),

        // ── Exterior Preparation ──
        li('Labor', 'Exterior pressure wash — full perimeter, 3,500 PSI', 1, 'job', 780),
        li('Labor', 'Exterior scraping & feathering — loose and peeling paint removal', 1, 'job', 1100),
        li('Labor', 'Exterior wood repair & epoxy fill — rotted sill plates, trim boards', 1, 'job', 640),
        li('Labor', 'Exterior caulking — window perimeters, siding joints, trim-to-wall, penetrations', 1, 'job', 820),
        li('Labor', 'Exterior prime coat — all bare wood, repaired surfaces, chalky areas', 1, 'job', 1200),

        // ── Exterior Surfaces ──
        li('Labor', 'Exterior siding — two-coat premium exterior finish (brush, roll, back-roll)', 2800, 'sq ft', 1.85),
        li('Labor', 'Fascia boards & soffits — two coats, cut & brush', 1, 'job', 1640),
        li('Labor', 'Exterior shutters — remove, spray two coats, reinstall', 12, 'pairs', 185),
        li('Labor', 'Decorative columns — hand-brush, two coats, including capitals & bases', 6, 'columns', 320),
        li('Labor', 'Exterior entry doors & surround — strip, prime, two coats + clear topcoat', 2, 'doors', 480),
        li('Labor', 'Garage doors — clean, scuff, two coats acrylic matching exterior scheme', 2, 'panels', 380),
        li('Labor', 'Deck, porch & stair rails — stain or paint, two coats', 1, 'job', 1800),
        li('Labor', 'Wrought iron or metal fence — prime and two-coat enamel', 1, 'job', 1400),

        // ── Materials ──
        li('Materials', 'Benjamin Moore Aura Interior (zero-VOC) — 5-gal buckets', 6, 'buckets', 295),
        li('Materials', 'Benjamin Moore Aura Interior trim & door enamel — quarts & gallons', 8, 'gallons', 82),
        li('Materials', 'Benjamin Moore Aura Exterior — 5-gal buckets', 4, 'buckets', 310),
        li('Materials', 'Benjamin Moore Fresh Start Multi-Purpose primer', 4, 'gallons', 72),
        li('Materials', 'Zinsser BIN shellac-based stain-blocking primer', 2, 'gallons', 62),
        li('Materials', 'Siliconized painter\'s caulk — multiple colors', 1, 'lot', 180),
        li('Materials', 'Patch compound, joint compound & fiberglass mesh tape', 1, 'lot', 240),
        li('Materials', 'Tape, plastic sheeting, drop cloths & painter\'s paper', 1, 'lot', 280),
        li('Materials', 'Brushes, rollers, screens, paint trays & sundries', 1, 'lot', 220),

        // ── Equipment ──
        li('Equipment', 'Scaffold rental & setup — multi-story or complex exterior', 1, 'job', 1200),
        li('Equipment', 'Airless sprayer — cabinetry & interior large-area applications', 1, 'job', 400),

        // ── Specialty ──
        li('Labor', 'Color consultation — on-site palette selection assistance (up to 3 hrs)', 1, 'session', 350),
    ],
    milestones: [
        { label: 'Deposit — Contract Execution', percentage: 33, amount: 0, due: 'Upon signing' },
        { label: 'Progress Payment — Interior Complete', percentage: 34, amount: 0, due: 'Day 10' },
        { label: 'Final Payment — Project Completion & Walkthrough', percentage: 33, amount: 0, due: 'Upon completion' },
    ],
    terms: [
        'This estimate is valid for 30 days from the date issued.',
        'All interior work performed during standard business hours (Mon–Fri, 8 AM–5 PM). Weekend scheduling available at a 15% surcharge.',
        'Client is responsible for moving furniture, decor, and personal belongings from all work areas prior to the start date. Bridgepoint will move and protect large furniture as a courtesy.',
        'Any unforeseen structural repairs, mold remediation, or lead-paint encapsulation requirements will be itemized and quoted separately before work proceeds.',
        'Color selections and paint sheen levels must be finalized and submitted to Bridgepoint no later than 7 days before the scheduled start date.',
        'Bridgepoint warrants all labor for a period of two (2) years from project completion. Normal wear, impact damage, and moisture intrusion are excluded.',
        'Paint materials are covered under the manufacturer\'s product warranty (typically 15–25 years for Aura line).',
        'Exterior start is weather-dependent. Work will not proceed in temperatures below 50°F or above 90°F, or when rain is forecast within 24 hours of application.',
        'Payment is due within 7 days of milestone completion. A 1.5% monthly finance charge applies to balances outstanding beyond 30 days.',
        'All work performed in compliance with EPA RRP (Renovation, Repair and Painting) rules where applicable.',
    ],
    notes: 'Color consultation is included for up to three on-site sessions. Final color selections must be confirmed in writing. Bridgepoint recommends Benjamin Moore Aura for its best-in-class hide and durability ratings.',
};

// ─── 2. FLOORING ─────────────────────────────────────────────────────────────

const FLOORING_TEMPLATE: EstimateTemplate = {
    id: 'flooring',
    name: 'Flooring',
    subtitle: 'Hardwood, Tile & More',
    icon: '🪵',
    color: '#b8956a',
    description: 'Full-scope flooring installation — demo, subfloor prep, hardwood, tile, LVP, carpet, and staircase. Covers all transitions, finishes, and materials with proper overage.',
    highlights: ['Demo & disposal of existing flooring', 'Subfloor leveling & moisture testing', 'Hardwood — engineered or solid', 'Tile, LVP & carpet options', 'Staircase treads & risers', 'Full site prep & protection'],
    defaultDuration: '1–2 weeks',
    defaultTitle: 'Flooring Installation — [Client] Residence',
    lineItems: [
        // ── Site Prep & Demo ──
        li('Labor', 'Pre-installation moisture testing — subfloor RH mapping, 10-point grid', 1, 'job', 360),
        li('Labor', 'Carpet removal & disposal — includes pad and tack strips', 2800, 'sq ft', 0.80),
        li('Labor', 'Existing hardwood / LVP removal & disposal', 400, 'sq ft', 1.20),
        li('Labor', 'Ceramic or tile demo & haul-off — includes adhesive grinding', 1, 'job', 1800),
        li('Labor', 'Furniture moving — labor to clear work areas (both before & after)', 1, 'job', 480),
        li('Labor', 'Site protection — door sealing, HVAC vent covers, carpet masking at thresholds', 1, 'job', 280),

        // ── Subfloor Work ──
        li('Labor', 'Subfloor inspection — probe testing, squeak mapping, fastener refastening', 1, 'job', 540),
        li('Labor', 'Self-leveling underlayment — pour & feather for LP/tile sections (per in depth)', 1, 'job', 1600),
        li('Labor', 'Subfloor plywood overlay — 3/8" ply over existing OSB for instability', 400, 'sq ft', 2.80),
        li('Labor', 'Subfloor repair — sistering joists, replacing damaged sections', 1, 'job', 1200),
        li('Materials', '6-mil poly vapor barrier — under glue-down hardwood applications', 2800, 'sq ft', 0.18),

        // ── Engineered Hardwood ──
        li('Materials', 'Engineered hardwood — 5" white oak, UV matte finish, 10mm wear layer (w/ 10% overage)', 3080, 'sq ft', 9.40),
        li('Materials', 'Premium hardwood adhesive — urethane-based (Bostik Best)', 12, 'gallons', 48),
        li('Labor', 'Engineered hardwood installation — glue-down, racking & blind nail perimeter', 2800, 'sq ft', 4.20),

        // ── Solid Hardwood ──
        li('Materials', 'Solid hardwood — 3.25" select red oak, unfinished (w/ 10% overage)', 880, 'sq ft', 7.80),
        li('Labor', 'Solid hardwood installation — blind nail over ply subfloor', 800, 'sq ft', 3.60),
        li('Labor', 'Sand & refinish — 3-pass drum & edge, buff, stain & 3 coats oil-based poly', 800, 'sq ft', 4.80),
        li('Materials', 'Stain — Minwax oil stain, color TBD, and sealer', 1, 'lot', 320),
        li('Materials', 'Bona Traffic HD finish coat (3 coats, commercial-grade)', 1, 'lot', 480),

        // ── Tile ──
        li('Materials', 'Porcelain tile — 24x24 rectified, large format (w/ 10% overage)', 440, 'sq ft', 6.80),
        li('Materials', 'Schluter DITRA uncoupling membrane — under tile on wood subfloor', 440, 'sq ft', 1.80),
        li('Labor', 'Tile installation — large-format, thinset, grout (standard grout lines)', 400, 'sq ft', 11),
        li('Materials', 'Mapei Flexcolor CQ grout — sanded or unsanded per layout', 1, 'job', 280),
        li('Materials', 'Mapei Kerabond/Keralastic thinset mortar', 1, 'job', 240),

        // ── LVP ──
        li('Materials', 'Luxury vinyl plank (LVP) — 8mm waterproof CoreTec, 6"×48" planks (w/ 10% overage)', 1320, 'sq ft', 4.80),
        li('Materials', 'LVP underlayment — 3-in-1 with vapor barrier (if not pre-attached)', 1200, 'sq ft', 0.45),
        li('Labor', 'LVP installation — floating click-lock method', 1200, 'sq ft', 2.20),

        // ── Carpet ──
        li('Materials', 'Carpet — Shaw Floors solution-dyed nylon, 40 oz, color TBD', 600, 'sq ft', 4.20),
        li('Materials', 'Carpet pad — 8-lb bonded urethane, 7/16" thickness', 600, 'sq ft', 0.85),
        li('Labor', 'Carpet installation — stretch-in, power-stretched, tack strip', 600, 'sq ft', 1.60),

        // ── Staircase ──
        li('Labor', 'Staircase — remove carpet and expose treads/risers', 16, 'stairs', 38),
        li('Materials', 'Engineered wood stair treads — 11.5" deep, matching floor species (pre-finished)', 16, 'treads', 185),
        li('Materials', 'Stair risers — MDF or poplar, paint-grade', 16, 'risers', 38),
        li('Labor', 'Stair tread & riser installation — glue & screw, polyurethane adhesive', 16, 'stairs', 180),
        li('Materials', 'Stair nose profiles (landing & top step)', 2, 'pcs', 88),

        // ── Transitions & Finishing ──
        li('Labor', 'Transition strips — T-molding, reducer, end cap (doorway–to–doorway)', 12, 'transitions', 68),
        li('Labor', 'Base shoe / quarter-round — pin-nail to baseboard perimeter', 420, 'lin ft', 1.40),
        li('Materials', 'Base shoe / quarter-round — primed finger-joint pine', 450, 'lin ft', 0.95),
        li('Labor', 'Threshold installation at exterior doors (marble or oak saddle)', 4, 'thresholds', 120),

        // ── Wood Refinishing (existing floors) ──
        li('Labor', 'Screen & recoat — existing hardwood (scuff, 1-coat poly)', 1, 'job', 1200),

        // ── Materials & Misc ──
        li('Materials', 'Fasteners, foils, adhesive tape & misc consumables', 1, 'lot', 180),
    ],
    milestones: [
        { label: 'Deposit — Contract Execution & Material Order', percentage: 40, amount: 0, due: 'Upon signing' },
        { label: 'Progress Payment — Demo & Subfloor Complete', percentage: 30, amount: 0, due: 'Prior to floor installation start' },
        { label: 'Final Payment — Installation Complete & Walkthrough', percentage: 30, amount: 0, due: 'Upon completion' },
    ],
    terms: [
        'This estimate is valid for 30 days from the date issued.',
        'All wood and engineered flooring must acclimate in the conditioned space for a minimum of 72 hours prior to installation; 5–7 days preferred.',
        'Client is responsible for clearing all furniture, decor, and personal items from the installation area before the scheduled start date. Heavy furniture moving is included in the estimate.',
        'Relative humidity in the home must be maintained between 35–55% RH during and after installation for proper wood acclimation and dimensional stability.',
        'A 10% material overage is standard practice and is included in all material quantities. Leftover material will be left with the client for future repairs.',
        'Bridgepoint is not responsible for pre-existing subfloor defects (rot, structural damage, unlevel sections in excess of 3/16" over 10 ft) discovered after existing flooring removal. Repair costs will be itemized and approved before work proceeds.',
        'Final sand-and-coat schedule on hardwood is humidity-dependent. HVAC must be operational. No wet traffic for 24 hrs after final coat; light foot traffic after 48 hrs; full area rugs after 14 days.',
        'Tile grout choice must be finalized no later than 5 business days before the installation date.',
        'Bridgepoint warrants all installation labor for two (2) years from completion. Material warranties are per manufacturer.',
        'Payment due within 7 days of each milestone. A 1.5% monthly finance charge applies to overdue balances.',
    ],
    notes: 'Wood sample confirmed on-site. Please indicate your preferred grout color, transition metal finish (nickel, oil-rubbed bronze, or brushed gold), and stain color (if applicable) within 5 business days of contract execution.',
};

// ─── 3. BATHROOMS ────────────────────────────────────────────────────────────

const BATHROOM_TEMPLATE: EstimateTemplate = {
    id: 'bathroom',
    name: 'Bathrooms',
    subtitle: 'Full Renovation',
    icon: '🛁',
    color: '#34d399',
    description: 'Comprehensive bathroom renovation covering full demolition, waterproofing, tile, custom shower, heated floors, vanity, fixtures, plumbing, electrical, and all finishes.',
    highlights: ['Full gut & haul-off', 'Schluter waterproofing system', 'Custom shower & glass enclosure', 'In-floor radiant heat', 'Plumbing & electrical subcontractors', 'Vanity, countertop, mirrors & accessories'],
    defaultDuration: '6–8 weeks',
    defaultTitle: 'Bathroom Renovation — [Client] Residence',
    lineItems: [
        // ── Demo ──
        li('Labor', 'Full bathroom gut — demo tile, drywall, subfloor as needed, vanity, toilet, tub/shower unit', 1, 'job', 3200),
        li('Labor', 'Debris haul-off — trailer rental, dump fees & labor (full dumpster load)', 1, 'job', 1400),
        li('Labor', 'Mold inspection & remediation (if discovered post-demo — contingency line)', 1, 'allowance', 1200),
        li('Labor', 'Lead-safe work practice containment — HEPA vac, poly barriers', 1, 'job', 480),

        // ── Structural & Rough Carpentry ──
        li('Labor', 'Subfloor repair / replacement — 3/4" plywood over floor joists', 80, 'sq ft', 8.50),
        li('Labor', 'Cement backer board (Hardiebacker 1/2") — walls & floor', 420, 'sq ft', 2.80),
        li('Materials', 'Hardiebacker 1/2" cement board', 440, 'sq ft', 1.20),
        li('Labor', 'Niche framing — recessed shower niche (12"×24" standard)', 2, 'niches', 580),
        li('Labor', 'Blocking installation — grab bars, toilet paper holders, towel bars', 1, 'job', 320),

        // ── Waterproofing ──
        li('Labor', 'Schluter KERDI waterproofing membrane — shower walls & pan area (full coverage)', 160, 'sq ft', 4.20),
        li('Materials', 'Schluter KERDI membrane, KERDI-BAND & KERDI-DRAIN', 1, 'kit', 880),
        li('Labor', 'RedGard liquid waterproofing membrane — bathroom floor perimeter & backsplash zone', 1, 'job', 480),
        li('Materials', 'Custom Pitch Mortar — pre-sloped shower floor bed', 1, 'job', 280),
        li('Labor', 'Shower curb — mortar-set or Schluter RONDEC profile', 1, 'job', 380),

        // ── Shower Tile ──
        li('Materials', 'Shower floor tile — 2"×2" mosaic (Carrara marble or porcelain), w/ 10% overage', 55, 'sq ft', 14),
        li('Labor', 'Shower floor tile installation — hand-set, back-buttered, epoxy grout', 45, 'sq ft', 18),
        li('Materials', 'Shower wall tile — 4"×12" or 12"×24" field tile, main walls', 210, 'sq ft', 12),
        li('Labor', 'Shower wall tile installation — large format, plumb & level, rectified edge', 190, 'sq ft', 14),
        li('Materials', 'Decorative accent band or niche tile — contrasting pattern', 1, 'allowance', 480),
        li('Labor', 'Accent band installation & niche tile-out', 1, 'job', 680),
        li('Materials', 'Schluter RONDEC & JOLLY trim profiles — all exposed tile edges', 1, 'set', 420),

        // ── Heated Floor ──
        li('Materials', 'In-floor electric radiant heat mat — Nuheat or Warmup (per sq ft rated)', 80, 'sq ft', 12),
        li('Materials', 'Smart thermostat for heated floor — programmable, in-wall', 1, 'unit', 280),
        li('Labor', 'Radiant heat mat installation & thermostat wiring (coordinated with electrician)', 1, 'job', 680),
        li('Labor', 'Self-leveling underlayment over heat mat — 3/8" pour', 80, 'sq ft', 4.80),

        // ── Bathroom Floor Tile ──
        li('Materials', 'Bathroom floor tile — 12"×24" or 18"×18" porcelain, w/ 10% overage', 110, 'sq ft', 8.80),
        li('Labor', 'Bathroom floor tile installation — Ditra membrane under tile, grout', 95, 'sq ft', 12),
        li('Materials', 'Schluter DITRA uncoupling membrane — bathroom floor', 110, 'sq ft', 1.80),

        // ── Glass Enclosure ──
        li('Labor', 'Frameless glass shower enclosure — custom measure, fabricate, install (8mm tempered)', 1, 'job', 4800),
        li('Materials', 'Custom frameless glass panels & door — square or barn-style header, brushed nickel hardware', 1, 'unit', 3200),

        // ── Vanity & Countertop ──
        li('Labor', 'Vanity installation — plumb, level, secure to wall', 1, 'vanity', 480),
        li('Materials', 'Vanity cabinet — 72" double, solid wood, soft-close doors & drawers (from allowance)', 1, 'allowance', 3800),
        li('Materials', 'Vanity countertop — Calacatta marble or quartz slab, 3cm', 24, 'sq ft', 185),
        li('Labor', 'Countertop fabrication & installation — templated, cut, edge profile, backsplash', 1, 'job', 680),
        li('Materials', 'Undermount sink(s) — rectangular ceramic or composite', 2, 'sinks', 320),
        li('Labor', 'Undermount sink cutout & caulk', 2, 'sinks', 180),

        // ── Fixtures & Accessories ──
        li('Materials', 'Faucets — wall-mount or deck-mount, brushed nickel (allowance per unit)', 2, 'faucets', 380),
        li('Materials', 'Rainfall showerhead — ceiling mount, brushed nickel', 1, 'unit', 480),
        li('Materials', 'Hand-held shower wand & slide bar', 1, 'unit', 185),
        li('Materials', 'Body spray jets — 3-jet module, in-wall', 1, 'set', 520),
        li('Materials', 'Shower valve — thermostatic pressure-balancing (Moen or Delta), with diverter', 1, 'unit', 420),
        li('Materials', 'Freestanding soaking tub — acrylic or cast iron, oval (allowance)', 1, 'allowance', 2400),
        li('Labor', 'Tub installation — level, secure, caulk & silicone perimeter', 1, 'job', 620),
        li('Materials', 'Tub filler faucet — floor-mount or wall-mount', 1, 'unit', 580),
        li('Materials', 'Toilet — dual-flush, elongated comfort height (Toto Drake II or equiv.)', 1, 'unit', 520),
        li('Labor', 'Toilet installation — wax ring, supply line, level & caulk', 1, 'unit', 185),
        li('Materials', 'Frameless mirror(s) — custom or standard, beveled edge', 2, 'mirrors', 320),
        li('Labor', 'Mirror installation — level, adhesive & anchor to blocking', 2, 'mirrors', 120),
        li('Materials', 'Medicine cabinet — recessed, soft-close, mirrored', 1, 'unit', 480),
        li('Materials', 'Towel bars, robe hooks, toilet paper holder, hand towel ring — brushed nickel', 1, 'set', 380),
        li('Labor', 'Accessory installation — anchor to blocking, level & plumb', 1, 'job', 280),
        li('Materials', 'Exhaust fan upgrade — Panasonic WhisperCeiling 110 CFM, ENERGY STAR', 1, 'unit', 180),

        // ── Lighting ──
        li('Labor', 'Vanity light bar installation — 2-light or 3-light, coordinated with electrician', 1, 'job', 220),
        li('Materials', 'Vanity light fixture — 3-light bar, brushed nickel (allowance)', 1, 'allowance', 280),
        li('Labor', 'Recessed lighting installation — 4" LED trims (coordinated with electrician)', 4, 'fixtures', 120),

        // ── Subcontractors ──
        li('Subcontractor', 'Licensed plumbing — rough-in supply & drain re-route, new valve locations, shower body rough-in, tub stub-out, vanity supply & drain', 1, 'job', 6400),
        li('Subcontractor', 'Licensed electrical — GFCI circuits, exhaust fan wiring, heated floor thermostat, vanity lighting circuit, recessed lighting, switch plates', 1, 'job', 3800),

        // ── Drywall & Paint ──
        li('Labor', 'Drywall installation — moisture-resistant greenboard, outside shower zone', 120, 'sq ft', 3.80),
        li('Labor', 'Drywall tape, bed & paint — walls and ceiling outside tile zone', 1, 'job', 1200),

        // ── Permits ──
        li('Permits & Fees', 'Building permit — bathroom renovation (plumbing & electrical permit included)', 1, 'lot', 1400),
        li('Permits & Fees', 'Permit expediting & inspection scheduling fee', 1, 'job', 350),
    ],
    milestones: [
        { label: 'Deposit — Contract Execution', percentage: 25, amount: 0, due: 'Upon signing' },
        { label: 'Progress Payment — Demo & Rough-In Complete', percentage: 25, amount: 0, due: 'Week 2' },
        { label: 'Progress Payment — Tile, Glass & Vanity Complete', percentage: 25, amount: 0, due: 'Week 5' },
        { label: 'Final Payment — Punch List & Walkthrough', percentage: 25, amount: 0, due: 'Upon final completion' },
    ],
    terms: [
        'This estimate is valid for 30 days from the date issued.',
        'Permit applications will be submitted within 5 business days of contract execution. Work cannot begin until permits are issued.',
        'All mold or water damage discovered post-demolition will be documented, photographed, and submitted for client approval before remediation proceeds.',
        'Client fixture, tile, vanity, and hardware selections must be finalized within 10 days of contract execution to maintain the scheduled start date. Delays in selection may impact project timeline.',
        'Material allowances represent estimates. Client-directed upgrades or overages will be invoiced at cost plus a 12% procurement coordination fee.',
        'All plumbing and electrical work is performed by licensed, insured subcontractors. Subcontractor warranties pass through to the client.',
        'Bridgepoint carries a $2M general liability policy. Certificate of insurance available upon request.',
        'Bridgepoint warrants all labor for two (2) years from project completion. Subcontractor work is warranted under their respective agreements.',
        'A dedicated site supervisor will be on-site daily. Weekly photo progress reports will be provided every Friday.',
        'Payment due within 7 days of each milestone completion. A 1.5% monthly finance charge applies to overdue balances.',
    ],
    notes: 'All fixture selections should be coordinated with your designer or provided to Bridgepoint for procurement. A site measure will be conducted prior to ordering custom glass and countertop. Plumbing rough-in locations will be finalized at the pre-construction meeting.',
};

// ─── 4. COMPLETE REMODELING ───────────────────────────────────────────────────

const REMODELING_TEMPLATE: EstimateTemplate = {
    id: 'remodeling',
    name: 'Complete Remodeling',
    subtitle: 'Full Home Renovation',
    icon: '🏗️',
    color: '#f59e0b',
    description: 'Comprehensive whole-home or multi-room renovation. Covers structural, MEP (mechanical, electrical, plumbing), kitchen, bathrooms, flooring, painting, exterior, and permit management.',
    highlights: ['Full structural & MEP scope', 'Kitchen & bathroom renovation', 'Flooring throughout', 'Interior & exterior painting', 'GC fee & permit management', 'Weekly progress reporting'],
    defaultDuration: '14–20 weeks',
    defaultTitle: 'Complete Home Renovation — [Client] Residence',
    lineItems: [
        // ── Pre-Construction ──
        li('Labor', 'Pre-construction site survey & scope documentation — full room-by-room audit', 1, 'job', 1200),
        li('Labor', 'Design consultation & space planning — 3 sessions, floor plan review', 1, 'package', 2400),
        li('Labor', 'As-built drawing production & permit drawing submittal package', 1, 'job', 3200),
        li('Labor', 'Structural engineering letter — load-bearing wall removal evaluation', 1, 'letter', 1800),
        li('Labor', 'Material & finish specification package — selections binder, vendor coordination', 1, 'job', 1600),

        // ── Site Prep & Protection ──
        li('Labor', 'Whole-home site protection — floor coverings, door plastic seals, HVAC vent filters, daily cleaning', 1, 'job', 2800),
        li('Labor', 'Lead-safe RRP compliance — containment, HEPA vacuum, certified supervisor', 1, 'job', 1200),
        li('Equipment', 'Dumpster rental — 2x 30-yard dumpsters (sequential) for full-scope haul-off', 2, 'dumpsters', 920),

        // ── Demo & Structural ──
        li('Labor', 'Selective interior demolition — walls, ceilings, flooring (defined scope)', 1, 'job', 6400),
        li('Labor', 'Load-bearing wall removal — shoring, header beam installation, post supports', 1, 'job', 8800),
        li('Materials', 'LVL or steel beam — 20 ft span (structural engineer specified)', 1, 'beam', 3200),
        li('Labor', 'Interior wall framing — non-load new partition walls', 240, 'lin ft', 38),
        li('Labor', 'Ceiling framing modifications — drop, raise, or soffit as required', 1, 'job', 2800),
        li('Labor', 'Window enlargement or new rough openings — framing & header per opening', 4, 'openings', 1200),

        // ── MEP Rough-In ──
        li('Subcontractor', 'Electrical — panel upgrade (200A), complete rewire of renovation scope, new circuits, outlets per code spacing, AFCI/GFCI per code, rough-in for all fixtures', 1, 'job', 18500),
        li('Subcontractor', 'Plumbing — full re-route of supply & drain lines as required, new fixture rough-in (kitchen, 2 baths), water heater, exterior hose bibs', 1, 'job', 16200),
        li('Subcontractor', 'HVAC — ductwork re-route, new returns/supplies in addition, attic & crawl inspection, mini-split addition (if required)', 1, 'job', 9800),
        li('Subcontractor', 'Insulation — batt R-19 walls, blown-in R-49 attic, spray foam rim joists & penetrations', 1, 'job', 6400),

        // ── Drywall ──
        li('Labor', 'Drywall hang — 1/2" throughout renovation scope (all rooms)', 1, 'job', 8400),
        li('Materials', '1/2" drywall — standard & moisture-resistant for wet areas', 1, 'lot', 3200),
        li('Labor', 'Drywall tape, bed & Level-5 finish — three-coat system, sanded', 1, 'job', 6800),
        li('Labor', 'Orange peel or smooth texture match — per existing finish', 1, 'job', 2400),

        // ── Kitchen ──
        li('Labor', 'Kitchen demolition — cabinets, countertops, backsplash, soffit removal', 1, 'job', 2800),
        li('Materials', 'Semi-custom kitchen cabinets — Shaker series, soft-close, dovetail boxes (allowance to adjust)', 1, 'allowance', 18000),
        li('Labor', 'Cabinet installation — level, plumb, shimmed, crown, light rail, scribe molding', 1, 'job', 4200),
        li('Materials', 'Countertops — quartz or Calacatta marble, 3cm slab, per sq ft (allowance)', 68, 'sq ft', 195),
        li('Labor', 'Countertop template, fabrication & installation — undermount sinks included', 1, 'job', 980),
        li('Materials', 'Kitchen backsplash tile — subway, herringbone or designer mosaic (allowance)', 48, 'sq ft', 18),
        li('Labor', 'Backsplash installation — thinset, grout, Schluter trim edges', 48, 'sq ft', 22),
        li('Materials', 'Kitchen island — framing, cabinet base, countertop overhang, electrical circuit', 1, 'allowance', 7800),
        li('Labor', 'Under-cabinet lighting — LED strip, channel & transformer', 1, 'job', 1200),
        li('Labor', 'Appliance integration — built-in range, refrigerator panel, dishwasher, hood rough-in', 1, 'job', 1600),
        li('Materials', 'Appliance procurement management fee (not including appliance cost)', 1, 'job', 680),

        // ── Primary Bath ──
        li('Labor', 'Primary bathroom — full gut & renovation per bathroom scope (see Bath template detail)', 1, 'job', 42000),

        // ── Secondary Bathrooms ──
        li('Labor', 'Secondary bathroom #1 — full renovation (tile, vanity, tub/shower, fixtures)', 1, 'job', 22000),
        li('Labor', 'Secondary bathroom #2 — powder room renovation (vanity, toilet, tile, fixtures)', 1, 'job', 11500),

        // ── Flooring Throughout ──
        li('Labor', 'First floor — engineered hardwood installation, full scope incl. subfloor prep', 2800, 'sq ft', 8.40),
        li('Materials', 'Engineered hardwood — 5" white oak, matte finish, w/ 10% overage', 3080, 'sq ft', 9.80),
        li('Labor', 'Second floor — LVP or carpet installation (defined per room per client preference)', 1800, 'sq ft', 5.80),
        li('Labor', 'Tile — laundry, mudroom, or defined areas', 320, 'sq ft', 11),

        // ── Staircase ──
        li('Labor', 'Staircase renovation — tread replacement, riser, newel post & spindle update', 1, 'job', 7800),
        li('Materials', 'Stair treads, risers, newels & balusters — white oak & paint-grade', 1, 'lot', 4200),

        // ── Interior Painting ──
        li('Labor', 'Interior painting — full home, all walls, ceilings, trim, doors (per paint template scope)', 1, 'job', 24000),
        li('Materials', 'Paint materials — Benjamin Moore Aura, primer, sundries (full home)', 1, 'lot', 5200),

        // ── Trim & Millwork ──
        li('Labor', 'New baseboard installation throughout — 5.5" colonial profile', 620, 'lin ft', 6.80),
        li('Materials', 'Finger-joint MDF baseboard — 5.5" colonial, primed', 650, 'lin ft', 2.80),
        li('Labor', 'Crown molding installation — living areas & primary suite', 420, 'lin ft', 8.40),
        li('Materials', 'Crown molding — 4.5" MDF, primed', 440, 'lin ft', 3.60),
        li('Labor', 'Wainscot / board-and-batten feature — entry hall & dining room', 320, 'sq ft', 14),
        li('Labor', 'Built-in bookcase / entertainment wall — design, frame, finish', 1, 'job', 12000),

        // ── Doors & Windows ──
        li('Labor', 'Interior door replacement — pre-hung, install & case', 14, 'doors', 320),
        li('Materials', 'Interior doors — solid core, 1-3/8" shaker, pre-primed', 14, 'doors', 280),
        li('Labor', 'Window casing & sill upgrades throughout', 18, 'windows', 185),
        li('Labor', 'Exterior door replacement — entry & rear, including weather-strip, threshold', 2, 'doors', 980),
        li('Materials', 'Exterior fiberglass entry door set — pre-hung, with sidelites', 1, 'set', 3400),

        // ── Exterior ──
        li('Labor', 'Exterior painting — full perimeter, siding, trim, shutters, soffits (per paint scope)', 1, 'job', 14000),
        li('Labor', 'Wood rot repair — sills, fascia boards, corner boards', 1, 'job', 2400),
        li('Labor', 'Caulk & seal — full exterior, all penetrations, windows, doors', 1, 'job', 1200),
        li('Labor', 'Gutter cleaning & downspout re-route (divert away from foundation)', 1, 'job', 680),
        li('Labor', 'Driveway & walkway pressure wash & seal', 1, 'job', 880),
        li('Labor', 'Landscaping protection & restoration — beds raked, hedges trimmed post-construction', 1, 'job', 640),

        // ── Project Management & GC Fee ──
        li('Labor', 'General contractor project management — daily supervision, subcontractor coordination, schedule management, client reporting', 1, 'job', 18000),
        li('Labor', 'Weekly progress reporting — photos, schedule updates, material status (20 weeks)', 20, 'weeks', 220),
        li('Labor', 'Final punch list management & completion walkthrough', 1, 'job', 1200),
        li('Labor', 'Post-completion warranty walk & 90-day follow-up visit', 1, 'job', 480),

        // ── Permits ──
        li('Permits & Fees', 'Building permit — general renovation (structural, MEP)', 1, 'lot', 4200),
        li('Permits & Fees', 'Plumbing permit', 1, 'lot', 980),
        li('Permits & Fees', 'Electrical permit', 1, 'lot', 880),
        li('Permits & Fees', 'Permit expediting, inspection scheduling & close-out', 1, 'job', 1200),
    ],
    milestones: [
        { label: 'Deposit — Contract Execution & Pre-Construction', percentage: 20, amount: 0, due: 'Upon signing' },
        { label: 'Progress Payment — Demo, Structural & MEP Rough-In', percentage: 20, amount: 0, due: 'Week 5' },
        { label: 'Progress Payment — Drywall, Flooring & Kitchen Cabinets', percentage: 20, amount: 0, due: 'Week 9' },
        { label: 'Progress Payment — Tile, Fixtures, Countertops & Trim', percentage: 20, amount: 0, due: 'Week 14' },
        { label: 'Final Payment — Punch List, Walkthrough & CO Issued', percentage: 20, amount: 0, due: 'Upon final completion' },
    ],
    terms: [
        'This estimate is valid for 30 days from the date issued.',
        'A pre-construction meeting will be held within 5 business days of contract execution to finalize scope, schedule, and all client selections.',
        'All material and finish selections must be finalized within 10 days of contract execution. Delayed decisions may push the project schedule accordingly.',
        'Material allowances represent realistic estimates based on similar projects. Any client-directed upgrades or overages will be invoiced at cost plus a 12% procurement coordination fee.',
        'Permits must be issued before demolition begins. Bridgepoint will manage all permit applications and inspections.',
        'All subcontractors (plumbing, electrical, HVAC) are licensed, bonded, and insured. Their work is warranted under their respective agreements; warranties pass through to the client.',
        'Any unforeseen conditions discovered during construction (structural damage, hidden mold, asbestos, outdated wiring) will be documented, photographed, and submitted to the client for written approval before additional work proceeds.',
        'Bridgepoint maintains a $2 million general liability policy and workers\' compensation coverage. Certificate of insurance available upon request.',
        'Bridgepoint warrants all self-performed labor for two (2) years from issuance of Certificate of Occupancy (CO).',
        'Weekly written progress reports (with photos) will be emailed every Friday. Client site visits should be scheduled in advance to maintain job site safety.',
        'Payment is due within 7 days of milestone completion. Late balances accrue a 1.5% monthly finance charge. Substantial non-payment may result in a work stoppage as permitted by Georgia lien law.',
        'Bridgepoint reserves the right to file a Preliminary Notice of Lien as a standard business practice to preserve lien rights. This does not indicate any billing dispute.',
    ],
    notes: 'A full materials and finish specification binder will be maintained throughout the project. All selections will be tracked and signed off by both client and Bridgepoint project manager. Site access hours are 7 AM–5 PM Monday–Friday, unless otherwise agreed in writing.',
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const ESTIMATE_TEMPLATES: EstimateTemplate[] = [
    PAINTING_TEMPLATE,
    FLOORING_TEMPLATE,
    BATHROOM_TEMPLATE,
    REMODELING_TEMPLATE,
];

export function applyTemplateIds(template: EstimateTemplate): EstimateTemplate {
    return {
        ...template,
        lineItems: template.lineItems.map((item, i) => ({
            ...item,
            id: `tpl-${template.id}-${i}-${Date.now()}`,
        })) as (Omit<LineItem, 'id'> & { id: string })[],
    } as EstimateTemplate;
}
