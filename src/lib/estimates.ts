// ─── Types ────────────────────────────────────────────────────────────────────

export type EstimateStatus = 'Draft' | 'Sent' | 'Approved' | 'Declined';
export type LineItemCategory = 'Labor' | 'Materials' | 'Subcontractor' | 'Equipment' | 'Permits & Fees';

export interface LineItem {
    id: string;
    category: LineItemCategory;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
}

export interface PaymentMilestone {
    label: string;
    percentage: number;
    amount: number;
    due: string;
}

export interface Estimate {
    id: string;
    estimateNumber: string;
    status: EstimateStatus;
    createdDate: string;
    sentDate?: string;
    validUntil: string;
    client: {
        name: string;
        company?: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        email: string;
        phone: string;
    };
    project: {
        title: string;
        address: string;
        description: string;
        startDate: string;
        estimatedDuration: string;
    };
    lineItems: LineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    paymentSchedule: PaymentMilestone[];
    terms: string[];
    notes: string;
    preparedBy: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calcSubtotal(items: LineItem[]) {
    return items.reduce((sum, i) => sum + i.total, 0);
}

export function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

export const SAMPLE_ESTIMATES: Estimate[] = [
    // ── Estimate 1: Full Interior + Exterior Repaint ──────────────────────────
    {
        id: 'est-001',
        estimateNumber: 'BP-2024-0047',
        status: 'Approved',
        createdDate: '2024-11-14',
        sentDate: '2024-11-15',
        validUntil: '2024-12-15',
        client: {
            name: 'Harrison & Elaine Whitmore',
            address: '842 Peachtree Hills Dr',
            city: 'Atlanta',
            state: 'GA',
            zip: '30305',
            email: 'h.whitmore@whitmoregrp.com',
            phone: '(404) 882-3310',
        },
        project: {
            title: 'Full Interior & Exterior Repaint — Whitmore Residence',
            address: '842 Peachtree Hills Dr, Atlanta, GA 30305',
            description:
                'Complete repaint of a 6,200 sq ft single-family residence including all interior walls, ceilings, trim, millwork, doors, and cabinetry. Exterior scope encompasses all siding, shutters, fascia boards, soffits, and decorative columns. Color palette consultation and premium zero-VOC paints are included.',
            startDate: '2025-01-06',
            estimatedDuration: '3 weeks',
        },
        lineItems: [
            { id: 'li-01', category: 'Labor', description: 'Interior surface preparation (sanding, patching, prime coat)', quantity: 6200, unit: 'sq ft', unitPrice: 0.95, total: 5890 },
            { id: 'li-02', category: 'Labor', description: 'Interior walls — two-coat premium finish', quantity: 6200, unit: 'sq ft', unitPrice: 1.85, total: 11470 },
            { id: 'li-03', category: 'Labor', description: 'Interior ceilings — flat finish, two coats', quantity: 3100, unit: 'sq ft', unitPrice: 1.40, total: 4340 },
            { id: 'li-04', category: 'Labor', description: 'Trim, crown molding & baseboard — hand-cut edges', quantity: 2880, unit: 'lin ft', unitPrice: 2.20, total: 6336 },
            { id: 'li-05', category: 'Labor', description: 'Interior doors & jambs (24 units)', quantity: 24, unit: 'doors', unitPrice: 185, total: 4440 },
            { id: 'li-06', category: 'Labor', description: 'Kitchen & bath cabinetry — spray finish', quantity: 1, unit: 'job', unitPrice: 4800, total: 4800 },
            { id: 'li-07', category: 'Labor', description: 'Exterior siding & fascia — pressure wash, prep, two coats', quantity: 4100, unit: 'sq ft', unitPrice: 2.10, total: 8610 },
            { id: 'li-08', category: 'Labor', description: 'Exterior shutters, soffits & decorative columns', quantity: 1, unit: 'job', unitPrice: 3200, total: 3200 },
            { id: 'li-09', category: 'Materials', description: 'Benjamin Moore Aura Interior — zero VOC (38 gallons)', quantity: 38, unit: 'gal', unitPrice: 92, total: 3496 },
            { id: 'li-10', category: 'Materials', description: 'Benjamin Moore Aura Exterior — low-sheen (22 gallons)', quantity: 22, unit: 'gal', unitPrice: 98, total: 2156 },
            { id: 'li-11', category: 'Materials', description: 'Primer, caulk, patch compound, tape & sundries', quantity: 1, unit: 'lot', unitPrice: 1640, total: 1640 },
            { id: 'li-12', category: 'Equipment', description: 'Scaffold rental & equipment logistics', quantity: 1, unit: 'job', unitPrice: 980, total: 980 },
        ],
        subtotal: 61358,
        taxRate: 0,
        taxAmount: 0,
        total: 61358,
        paymentSchedule: [
            { label: 'Deposit — Contract Execution', percentage: 33, amount: 20248, due: 'Upon signing' },
            { label: 'Progress Payment — Interior Complete', percentage: 34, amount: 20862, due: 'Day 12' },
            { label: 'Final Payment — Project Completion', percentage: 33, amount: 20248, due: 'Upon final walkthrough' },
        ],
        terms: [
            'This estimate is valid for 30 days from the date issued.',
            'All work is performed during standard business hours (Mon–Fri, 8 AM–5 PM) unless otherwise agreed.',
            'Client is responsible for moving furniture and personal belongings from work areas prior to start date.',
            'Any unforeseen structural repairs or additional scope will be quoted separately before work proceeds.',
            'Bridgepointe warrants all labor for a period of two (2) years from project completion date.',
            "Materials are covered under the manufacturer's product warranty.",
            'Payment is due within 7 days of milestone completion. A 1.5% monthly finance charge applies to balances over 30 days.',
        ],
        notes: 'Color consultation scheduled for December 18th at the property. Final color selections must be confirmed no later than December 27th to maintain the January 6th start date.',
        preparedBy: 'Bridgepointe — Lead Estimator',
    },

    // ── Estimate 2: High-End Kitchen & Bath Remodel ───────────────────────────
    {
        id: 'est-002',
        estimateNumber: 'BP-2024-0053',
        status: 'Sent',
        createdDate: '2024-12-01',
        sentDate: '2024-12-03',
        validUntil: '2025-01-03',
        client: {
            name: 'Celeste & André Fontaine',
            company: 'Fontaine Capital Partners',
            address: '1140 Buckhead Ave NE, Suite 900',
            city: 'Atlanta',
            state: 'GA',
            zip: '30324',
            email: 'celeste.fontaine@fontainecapital.com',
            phone: '(404) 915-2277',
        },
        project: {
            title: 'Primary Kitchen & Master Bath Transformation — Fontaine Estate',
            address: '2280 Tuxedo Rd NW, Atlanta, GA 30309',
            description:
                "Full gut renovation of the primary kitchen (980 sq ft open-concept) including custom cabinetry, marble countertops, professional-grade appliance integration, chef's island, and premium tile backsplash. Master bath renovation (420 sq ft) includes heated marble floors, custom vanity, wet-room shower enclosure with frameless glass, and freestanding soaking tub. All plumbing and electrical to be re-routed as required.",
            startDate: '2025-02-03',
            estimatedDuration: '8 weeks',
        },
        lineItems: [
            { id: 'li-01', category: 'Labor', description: 'Kitchen & bath demolition, debris haul-off', quantity: 1, unit: 'job', unitPrice: 6400, total: 6400 },
            { id: 'li-02', category: 'Labor', description: 'Custom inset cabinetry — kitchen (semi-custom Shaker, painted)', quantity: 1, unit: 'job', unitPrice: 32000, total: 32000 },
            { id: 'li-03', category: 'Labor', description: 'Countertop fabrication & installation — Calacatta marble', quantity: 148, unit: 'sq ft', unitPrice: 185, total: 27380 },
            { id: 'li-04', category: 'Labor', description: 'Tile backsplash — herringbone mosaic, hand-set', quantity: 92, unit: 'sq ft', unitPrice: 48, total: 4416 },
            { id: 'li-05', category: 'Labor', description: "Chef's island framing, finish, and seating ledge", quantity: 1, unit: 'job', unitPrice: 7800, total: 7800 },
            { id: 'li-06', category: 'Subcontractor', description: 'Licensed plumbing — kitchen re-route & fixtures', quantity: 1, unit: 'job', unitPrice: 9200, total: 9200 },
            { id: 'li-07', category: 'Subcontractor', description: 'Licensed electrical — under-cabinet lighting, island pendants, recessed layout', quantity: 1, unit: 'job', unitPrice: 7600, total: 7600 },
            { id: 'li-08', category: 'Labor', description: 'Master bath custom vanity (double, 72" — painted)', quantity: 1, unit: 'job', unitPrice: 8400, total: 8400 },
            { id: 'li-09', category: 'Labor', description: 'Heated marble floor — engineered stone, in-floor radiant', quantity: 420, unit: 'sq ft', unitPrice: 58, total: 24360 },
            { id: 'li-10', category: 'Labor', description: 'Wet-room shower — frameless glass enclosure, rain head, body jets', quantity: 1, unit: 'job', unitPrice: 12800, total: 12800 },
            { id: 'li-11', category: 'Subcontractor', description: 'Licensed plumbing — bath fixtures, soaking tub, shower valves', quantity: 1, unit: 'job', unitPrice: 8600, total: 8600 },
            { id: 'li-12', category: 'Materials', description: 'Hardware, fixtures, mirrors, accessories (client-approved allowance)', quantity: 1, unit: 'allowance', unitPrice: 11000, total: 11000 },
            { id: 'li-13', category: 'Permits & Fees', description: 'City of Atlanta building & plumbing permits', quantity: 1, unit: 'lot', unitPrice: 2840, total: 2840 },
        ],
        subtotal: 162796,
        taxRate: 0,
        taxAmount: 0,
        total: 162796,
        paymentSchedule: [
            { label: 'Deposit — Contract Execution', percentage: 25, amount: 40699, due: 'Upon signing' },
            { label: 'Progress Payment — Demo & Rough-In Complete', percentage: 25, amount: 40699, due: 'Week 3' },
            { label: 'Progress Payment — Cabinetry & Tile Set', percentage: 25, amount: 40699, due: 'Week 6' },
            { label: 'Final Payment — Punch List & Walkthrough', percentage: 25, amount: 40699, due: 'Upon completion' },
        ],
        terms: [
            'This estimate is valid for 30 days from the date issued.',
            'Material allowances are estimates. Any overages or client-directed upgrades will be invoiced at cost plus 12% procurement fee.',
            'Permits must be issued before demolition begins. Bridgepointe will manage the permit application process.',
            'Client selections (tile, hardware, fixtures) must be finalized within 10 days of contract execution.',
            'Subcontractor schedules are subject to availability and may impact the project timeline.',
            'Bridgepointe warrants all labor for two (2) years. Subcontractor warranties pass through to client.',
            'A site superintendent will be on-site daily. Weekly progress reports will be emailed every Friday.',
        ],
        notes: 'Appliance delivery and integration coordinated with Sub-Zero/Wolf dealer. Client has pre-selected the 48" range and 42" refrigerator — measurements confirmed on-site 11/29.',
        preparedBy: 'Bridgepointe — Senior Project Estimator',
    },

    // ── Estimate 3: Hardwood Floors + Accent Walls ────────────────────────────
    {
        id: 'est-003',
        estimateNumber: 'BP-2025-0002',
        status: 'Draft',
        createdDate: '2025-01-08',
        validUntil: '2025-02-07',
        client: {
            name: 'Dr. Marcus & Priya Okonkwo',
            address: '3315 Habersham Rd NW',
            city: 'Atlanta',
            state: 'GA',
            zip: '30305',
            email: 'p.okonkwo@gmail.com',
            phone: '(678) 344-9900',
        },
        project: {
            title: 'White Oak Hardwood Installation & Statement Wall Feature',
            address: '3315 Habersham Rd NW, Atlanta, GA 30305',
            description:
                'Supply and installation of 5" engineered white oak hardwood flooring (matte natural finish) across entire first floor (2,800 sq ft). Removal and disposal of existing carpet and LVP. Installation of custom white oak accent/feature wall in the great room with integrated shelving and LED cove lighting. Staircase tread replacement with matching white oak to tie the design together.',
            startDate: '2025-02-17',
            estimatedDuration: '9 business days',
        },
        lineItems: [
            { id: 'li-01', category: 'Labor', description: 'Carpet & LVP removal and disposal', quantity: 2800, unit: 'sq ft', unitPrice: 1.20, total: 3360 },
            { id: 'li-02', category: 'Labor', description: 'Subfloor leveling and prep', quantity: 2800, unit: 'sq ft', unitPrice: 0.65, total: 1820 },
            { id: 'li-03', category: 'Materials', description: '5" engineered white oak — matte natural (3,080 sq ft w/ overage)', quantity: 3080, unit: 'sq ft', unitPrice: 9.40, total: 28952 },
            { id: 'li-04', category: 'Labor', description: 'Hardwood flooring installation — glue-down method', quantity: 2800, unit: 'sq ft', unitPrice: 4.20, total: 11760 },
            { id: 'li-05', category: 'Labor', description: 'Transitions, thresholds, and base shoe molding', quantity: 1, unit: 'job', unitPrice: 1640, total: 1640 },
            { id: 'li-06', category: 'Labor', description: 'Custom white oak accent wall — frame, panel, finish', quantity: 280, unit: 'sq ft', unitPrice: 38, total: 10640 },
            { id: 'li-07', category: 'Labor', description: 'Built-in shelving unit integration — white oak to match', quantity: 1, unit: 'job', unitPrice: 3800, total: 3800 },
            { id: 'li-08', category: 'Materials', description: 'LED cove lighting strip, channel & driver', quantity: 1, unit: 'lot', unitPrice: 1100, total: 1100 },
            { id: 'li-09', category: 'Labor', description: 'Staircase tread replacement — 14 treads, white oak to match', quantity: 14, unit: 'treads', unitPrice: 320, total: 4480 },
            { id: 'li-10', category: 'Labor', description: 'Final sand, buff, and finish coat (floors)', quantity: 2800, unit: 'sq ft', unitPrice: 1.80, total: 5040 },
        ],
        subtotal: 72592,
        taxRate: 0,
        taxAmount: 0,
        total: 72592,
        paymentSchedule: [
            { label: 'Deposit — Contract Execution', percentage: 40, amount: 29037, due: 'Upon signing' },
            { label: 'Progress Payment — Floor Installation Complete', percentage: 35, amount: 25407, due: 'Day 6' },
            { label: 'Final Payment — Feature Wall & Punch List', percentage: 25, amount: 18148, due: 'Upon completion' },
        ],
        terms: [
            'This estimate is valid for 30 days from the date issued.',
            'Wood must acclimate in the home for a minimum of 72 hours before installation begins.',
            'Client is responsible for clearing furniture from all work areas prior to the start date.',
            'Bridgepointe is not responsible for pre-existing subfloor damage discovered after removal of existing flooring; additional repair costs will be quoted before proceeding.',
            'A 10% material overage is included in pricing and is standard practice for wood flooring.',
            'Final sand and coat schedule is weather-dependent; humidity levels must remain below 55% RH.',
            'Bridgepointe warrants all installation labor for two (2) years from completion.',
        ],
        notes: 'Client has confirmed white oak sample "WO-112 Natural Matte" on January 5th visit. Wood has been ordered from supplier — estimated ship date January 29th.',
        preparedBy: 'Bridgepointe — Lead Estimator',
    },
];
