// ─── Types ────────────────────────────────────────────────────────────────────

export type ProjectStatus =
    | 'Planning'
    | 'Active'
    | 'On Hold'
    | 'Completed'
    | 'Cancelled'
    | 'Archived';

export type PhaseStatus =
    | 'Not Started'
    | 'In Progress'
    | 'Completed'
    | 'Blocked'
    | 'Skipped';

export type CostCategory =
    | 'Subcontractor Labor'
    | 'Internal Labor'
    | 'Materials'
    | 'Equipment'
    | 'Permits'
    | 'Disposal'
    | 'Travel'
    | 'Design'
    | 'Miscellaneous'
    | 'Change Order Cost'
    | 'Warranty/Callback'
    // Aliases used by reports/pages:
    | 'Demolition'
    | 'Framing'
    | 'Plumbing'
    | 'Electrical'
    | 'HVAC'
    | 'Drywall'
    | 'Painting'
    | 'Flooring'
    | 'Cabinets'
    | 'Countertops'
    | 'Fixtures'
    | 'Appliances'
    | 'Cleaning'
    | 'Other';

export interface ProjectPhase {
    id: string;
    projectId: string;
    name: string;
    status: PhaseStatus | 'Scheduled';
    order: number;
    estimatedBudget: number;
    estimatedCost?: number;     // alias for estimatedBudget
    actualCost: number;
    completionPct: number;
    startDate: string;
    endDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
    assignedSubIds: string[];
    notes: string;
    dependencies: string[];
    issues: string[];
}

export interface BudgetItem {
    id: string;
    projectId: string;
    phaseId?: string;
    name?: string;
    category: CostCategory;
    description: string;
    estimatedAmount: number;
    estimatedCost?: number;     // alias for estimatedAmount
    committedAmount: number;
    actualAmount: number;
    actualCost?: number;        // alias for actualAmount
}

export interface Project {
    id: string;
    projectNumber: string;
    name: string;
    status: ProjectStatus;
    clientName: string;
    clientId?: string;              // optional reference to client record
    clientEmail: string;
    clientPhone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    description: string;
    startDate: string;
    endDate: string;
    targetCompletionDate?: string;  // alias for endDate
    estimateId?: string;
    estimateNumber?: string;
    estimatedRevenue: number;
    revenue?: number;               // alias for estimatedRevenue
    estimatedCost: number;
    actualRevenue: number;
    actualCost: number;
    invoicedAmount: number;
    collectedAmount: number;
    openCommitments: number;
    phases: ProjectPhase[];
    budgetItems: BudgetItem[];
    alertThresholdPct: number;
    projectManager: string;
    createdDate: string;
    updatedDate: string;
}

// ─── Business Logic ────────────────────────────────────────────────────────────

export function calcEstimatedGP(p: Project) {
    return p.estimatedRevenue - p.estimatedCost;
}

export function calcActualGP(p: Project) {
    return p.actualRevenue - p.actualCost;
}

export function calcProjectedFinalCost(p: Project) {
    return p.actualCost + p.openCommitments;
}

export function calcProjectedGP(p: Project) {
    return p.actualRevenue - calcProjectedFinalCost(p);
}

export function calcMarginPct(revenue: number, gp: number): number {
    if (revenue === 0) return 0;
    return (gp / revenue) * 100;
}

export function calcBudgetVariance(p: Project) {
    return p.actualCost - p.estimatedCost;
}

export function isOverBudget(p: Project) {
    const variance = calcBudgetVariance(p);
    const threshold = p.estimatedCost * (p.alertThresholdPct / 100);
    return variance > threshold;
}

export function marginColor(pct: number): string {
    if (pct >= 25) return '#34d399'; // green
    if (pct >= 15) return '#fbbf24'; // amber
    return '#f87171';                 // red
}

export function overallCompletionPct(p: Project): number {
    if (p.phases.length === 0) return 0;
    const total = p.phases.reduce((s, ph) => s + ph.completionPct, 0);
    return Math.round(total / p.phases.length);
}

// Convenience aliases used across multiple feature pages
export type BudgetCategory = CostCategory;

/** Revenue shorthand — pages use `project.revenue` but the type has `estimatedRevenue` */
export function revenue(p: Project): number {
    return p.estimatedRevenue;
}

/** Currency formatter */
export function formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

/** Short alias for formatCurrency — used in admin/page.tsx */
export function fmt(n: number): string {
    return formatCurrency(n);
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

export const SAMPLE_PROJECTS: Project[] = [
    // ── Project 1: Whitmore Repaint (Approved Estimate) ───────────────────────
    {
        id: 'proj-001',
        projectNumber: 'BP-PRJ-2025-001',
        name: 'Full Interior & Exterior Repaint — Whitmore Residence',
        status: 'Completed',
        clientName: 'Harrison & Elaine Whitmore',
        clientEmail: 'h.whitmore@whitmoregrp.com',
        clientPhone: '(404) 882-3310',
        address: '842 Peachtree Hills Dr',
        city: 'Atlanta',
        state: 'GA',
        zip: '30305',
        description: 'Complete repaint of a 6,200 sq ft residence. Interior walls, ceilings, trim, cabinets, doors. Exterior siding, shutters, fascia, columns.',
        startDate: '2025-01-06',
        endDate: '2025-01-28',
        estimateId: 'est-001',
        estimateNumber: 'BP-2024-0047',
        estimatedRevenue: 61358,
        estimatedCost: 42500,
        actualRevenue: 61358,
        actualCost: 44820,
        invoicedAmount: 61358,
        collectedAmount: 61358,
        openCommitments: 0,
        alertThresholdPct: 10,
        projectManager: 'Mark',
        createdDate: '2025-01-02',
        updatedDate: '2025-01-31',
        phases: [
            {
                id: 'ph-001-1', projectId: 'proj-001', name: 'Surface Prep & Prime', status: 'Completed',
                order: 1, estimatedBudget: 8000, actualCost: 8200, completionPct: 100,
                startDate: '2025-01-06', endDate: '2025-01-09', actualStartDate: '2025-01-06', actualEndDate: '2025-01-09',
                assignedSubIds: [], notes: 'Interior sanding, patching, caulk, prime coats done on schedule.', dependencies: [], issues: [],
            },
            {
                id: 'ph-001-2', projectId: 'proj-001', name: 'Interior Paint', status: 'Completed',
                order: 2, estimatedBudget: 18000, actualCost: 19400, completionPct: 100,
                startDate: '2025-01-10', endDate: '2025-01-18', actualStartDate: '2025-01-10', actualEndDate: '2025-01-19',
                assignedSubIds: ['sub-002'], notes: 'Cabinetry sub ran 1 day over — partial repaint on master bath required.', dependencies: ['ph-001-1'], issues: ['Master bath cabinet respray — 1 extra day'],
            },
            {
                id: 'ph-001-3', projectId: 'proj-001', name: 'Exterior Paint', status: 'Completed',
                order: 3, estimatedBudget: 12500, actualCost: 13220, completionPct: 100,
                startDate: '2025-01-20', endDate: '2025-01-25', actualStartDate: '2025-01-20', actualEndDate: '2025-01-25',
                assignedSubIds: ['sub-001'], notes: 'Weather held. Scaffold up and down without issues.', dependencies: ['ph-001-1'], issues: [],
            },
            {
                id: 'ph-001-4', projectId: 'proj-001', name: 'Punch List & Final', status: 'Completed',
                order: 4, estimatedBudget: 4000, actualCost: 4000, completionPct: 100,
                startDate: '2025-01-26', endDate: '2025-01-28', actualStartDate: '2025-01-26', actualEndDate: '2025-01-28',
                assignedSubIds: [], notes: 'Client walkthrough complete. All punch list items resolved.', dependencies: ['ph-001-2', 'ph-001-3'], issues: [],
            },
        ],
        budgetItems: [
            { id: 'bi-001-1', projectId: 'proj-001', category: 'Internal Labor', description: 'Interior labor — walls, ceilings, trim, doors', estimatedAmount: 26000, committedAmount: 26000, actualAmount: 27600 },
            { id: 'bi-001-2', projectId: 'proj-001', category: 'Subcontractor Labor', description: 'Cabinet spray finish — sub (sub-002)', estimatedAmount: 4800, committedAmount: 4800, actualAmount: 5200 },
            { id: 'bi-001-3', projectId: 'proj-001', category: 'Subcontractor Labor', description: 'Exterior crew — sub (sub-001)', estimatedAmount: 5500, committedAmount: 5500, actualAmount: 5820 },
            { id: 'bi-001-4', projectId: 'proj-001', category: 'Materials', description: 'Benjamin Moore paints, primer, sundries', estimatedAmount: 5292, committedAmount: 5292, actualAmount: 5400 },
            { id: 'bi-001-5', projectId: 'proj-001', category: 'Equipment', description: 'Scaffold rental', estimatedAmount: 980, committedAmount: 980, actualAmount: 800 },
        ],
    },

    // ── Project 2: Fontaine Kitchen & Bath (In Progress) ──────────────────────
    {
        id: 'proj-002',
        projectNumber: 'BP-PRJ-2025-002',
        name: 'Primary Kitchen & Master Bath Transformation — Fontaine Estate',
        status: 'Active',
        clientName: 'Celeste & André Fontaine',
        clientEmail: 'celeste.fontaine@fontainecapital.com',
        clientPhone: '(404) 915-2277',
        address: '2280 Tuxedo Rd NW',
        city: 'Atlanta',
        state: 'GA',
        zip: '30309',
        description: 'Full gut renovation of 980 sq ft kitchen and 420 sq ft master bath. Custom cabinetry, marble counters, heated floors, frameless glass shower.',
        startDate: '2025-02-03',
        endDate: '2025-03-28',
        estimateId: 'est-002',
        estimateNumber: 'BP-2024-0053',
        estimatedRevenue: 162796,
        estimatedCost: 108000,
        actualRevenue: 81398,
        actualCost: 62400,
        invoicedAmount: 81398,
        collectedAmount: 81398,
        openCommitments: 38600,
        alertThresholdPct: 10,
        projectManager: 'Mark',
        createdDate: '2025-01-28',
        updatedDate: '2026-03-05',
        phases: [
            {
                id: 'ph-002-1', projectId: 'proj-002', name: 'Demo & Haul-Off', status: 'Completed',
                order: 1, estimatedBudget: 6400, actualCost: 6800, completionPct: 100,
                startDate: '2025-02-03', endDate: '2025-02-07', actualStartDate: '2025-02-03', actualEndDate: '2025-02-08',
                assignedSubIds: ['sub-003'], notes: 'Demo ran 1 day over — discovered asbestos tape on old pipes. Licensed abatement sub called in.', dependencies: [], issues: ['Asbestos tape on drain pipes — abatement required (+$800)'],
            },
            {
                id: 'ph-002-2', projectId: 'proj-002', name: 'Rough-In Plumbing', status: 'Completed',
                order: 2, estimatedBudget: 9200, actualCost: 10200, completionPct: 100,
                startDate: '2025-02-10', endDate: '2025-02-17', actualStartDate: '2025-02-10', actualEndDate: '2025-02-18',
                assignedSubIds: ['sub-004'], notes: 'Kitchen re-route complete. Bath rough-in required extra runs due to wall rerouting.', dependencies: ['ph-002-1'], issues: ['Extra plumbing runs — $1,000 CO submitted'],
            },
            {
                id: 'ph-002-3', projectId: 'proj-002', name: 'Rough-In Electrical', status: 'Completed',
                order: 3, estimatedBudget: 7600, actualCost: 7600, completionPct: 100,
                startDate: '2025-02-12', endDate: '2025-02-19', actualStartDate: '2025-02-14', actualEndDate: '2025-02-20',
                assignedSubIds: ['sub-005'], notes: 'Under-cabinet, island, and recessed layout done. Passed inspection.', dependencies: ['ph-002-1'], issues: [],
            },
            {
                id: 'ph-002-4', projectId: 'proj-002', name: 'Cabinetry & Countertops', status: 'In Progress',
                order: 4, estimatedBudget: 59380, actualCost: 32000, completionPct: 55,
                startDate: '2025-02-24', endDate: '2025-03-14', actualStartDate: '2025-02-25', actualEndDate: undefined,
                assignedSubIds: ['sub-006'], notes: 'Kitchen cabinets 90% installed. Countertop template completed — marble fab lead time 10 days.', dependencies: ['ph-002-2', 'ph-002-3'], issues: ['Marble lead time pushed countertop install 4 days'],
            },
            {
                id: 'ph-002-5', projectId: 'proj-002', name: 'Tile & Stone Work', status: 'In Progress',
                order: 5, estimatedBudget: 24360, actualCost: 5800, completionPct: 25,
                startDate: '2025-03-01', endDate: '2025-03-12', actualStartDate: '2025-03-03', actualEndDate: undefined,
                assignedSubIds: ['sub-007'], notes: 'Bath heated floor in progress. Kitchen backsplash starts after counters set.', dependencies: ['ph-002-4'], issues: [],
            },
            {
                id: 'ph-002-6', projectId: 'proj-002', name: 'Finish Plumbing & Fixtures', status: 'Not Started',
                order: 6, estimatedBudget: 8600, actualCost: 0, completionPct: 0,
                startDate: '2025-03-17', endDate: '2025-03-21', assignedSubIds: ['sub-004'],
                notes: '', dependencies: ['ph-002-4', 'ph-002-5'], issues: [],
            },
            {
                id: 'ph-002-7', projectId: 'proj-002', name: 'Punch List & Final', status: 'Not Started',
                order: 7, estimatedBudget: 5000, actualCost: 0, completionPct: 0,
                startDate: '2025-03-24', endDate: '2025-03-28', assignedSubIds: [],
                notes: '', dependencies: ['ph-002-5', 'ph-002-6'], issues: [],
            },
        ],
        budgetItems: [
            { id: 'bi-002-1', projectId: 'proj-002', category: 'Internal Labor', description: 'Demo, framing, finish carpentry', estimatedAmount: 14200, committedAmount: 14200, actualAmount: 12200 },
            { id: 'bi-002-2', projectId: 'proj-002', category: 'Subcontractor Labor', description: 'Demo crew — sub-003', estimatedAmount: 6400, committedAmount: 6400, actualAmount: 6800 },
            { id: 'bi-002-3', projectId: 'proj-002', category: 'Subcontractor Labor', description: 'Plumbing — sub-004', estimatedAmount: 17800, committedAmount: 17800, actualAmount: 10200 },
            { id: 'bi-002-4', projectId: 'proj-002', category: 'Subcontractor Labor', description: 'Electrical — sub-005', estimatedAmount: 7600, committedAmount: 7600, actualAmount: 7600 },
            { id: 'bi-002-5', projectId: 'proj-002', category: 'Subcontractor Labor', description: 'Cabinetry — sub-006', estimatedAmount: 32000, committedAmount: 32000, actualAmount: 32000 },
            { id: 'bi-002-6', projectId: 'proj-002', category: 'Subcontractor Labor', description: 'Tile & stone — sub-007', estimatedAmount: 12416, committedAmount: 12416, actualAmount: 5800 },
            { id: 'bi-002-7', projectId: 'proj-002', category: 'Materials', description: 'Calacatta marble countertops', estimatedAmount: 27380, committedAmount: 27380, actualAmount: 0 },
            { id: 'bi-002-8', projectId: 'proj-002', category: 'Materials', description: 'Hardware, fixtures, mirrors (allowance)', estimatedAmount: 11000, committedAmount: 11000, actualAmount: 0 },
            { id: 'bi-002-9', projectId: 'proj-002', category: 'Permits', description: 'Building & plumbing permits', estimatedAmount: 2840, committedAmount: 2840, actualAmount: 2840 },
            { id: 'bi-002-10', projectId: 'proj-002', category: 'Miscellaneous', description: 'Asbestos abatement (unplanned)', estimatedAmount: 0, committedAmount: 800, actualAmount: 800 },
        ],
    },

    // ── Project 3: Okonkwo Hardwood (Newly Active) ────────────────────────────
    {
        id: 'proj-003',
        projectNumber: 'BP-PRJ-2025-003',
        name: 'White Oak Hardwood Installation & Statement Wall Feature — Okonkwo',
        status: 'Active',
        clientName: 'Dr. Marcus & Priya Okonkwo',
        clientEmail: 'p.okonkwo@gmail.com',
        clientPhone: '(678) 344-9900',
        address: '3315 Habersham Rd NW',
        city: 'Atlanta',
        state: 'GA',
        zip: '30305',
        description: '2,800 sq ft white oak hardwood installation, custom accent wall with integrated shelving and LED lighting, staircase tread replacement.',
        startDate: '2025-02-17',
        endDate: '2025-03-01',
        estimateId: 'est-003',
        estimateNumber: 'BP-2025-0002',
        estimatedRevenue: 72592,
        estimatedCost: 52000,
        actualRevenue: 29037,
        actualCost: 21600,
        invoicedAmount: 29037,
        collectedAmount: 29037,
        openCommitments: 19800,
        alertThresholdPct: 10,
        projectManager: 'Mark',
        createdDate: '2025-02-10',
        updatedDate: '2026-03-05',
        phases: [
            {
                id: 'ph-003-1', projectId: 'proj-003', name: 'Demo & Subfloor Prep', status: 'Completed',
                order: 1, estimatedBudget: 5180, actualCost: 5400, completionPct: 100,
                startDate: '2025-02-17', endDate: '2025-02-19', actualStartDate: '2025-02-17', actualEndDate: '2025-02-19',
                assignedSubIds: ['sub-003'], notes: 'Existing carpet and LVP removed. Subfloor spotted and leveled.', dependencies: [], issues: [],
            },
            {
                id: 'ph-003-2', projectId: 'proj-003', name: 'Hardwood Installation', status: 'In Progress',
                order: 2, estimatedBudget: 40712, actualCost: 16200, completionPct: 40,
                startDate: '2025-02-20', endDate: '2025-02-27', actualStartDate: '2025-02-20', actualEndDate: undefined,
                assignedSubIds: ['sub-001'], notes: 'Wood acclimated and glue-down started. ~1,100 sq ft done. Running on schedule.', dependencies: ['ph-003-1'], issues: [],
            },
            {
                id: 'ph-003-3', projectId: 'proj-003', name: 'Accent Wall & Shelving', status: 'Not Started',
                order: 3, estimatedBudget: 15540, actualCost: 0, completionPct: 0,
                startDate: '2025-02-26', endDate: '2025-02-28', assignedSubIds: [],
                notes: 'Starts concurrent with floor finish. LED channel order confirmed.', dependencies: [], issues: [],
            },
            {
                id: 'ph-003-4', projectId: 'proj-003', name: 'Sand, Buff & Finish', status: 'Not Started',
                order: 4, estimatedBudget: 5040, actualCost: 0, completionPct: 0,
                startDate: '2025-02-28', endDate: '2025-03-01', assignedSubIds: [],
                notes: 'Final sand, 3 coats matte finish. Humidity sensor installed.', dependencies: ['ph-003-2'], issues: [],
            },
            {
                id: 'ph-003-5', projectId: 'proj-003', name: 'Staircase Treads', status: 'Not Started',
                order: 5, estimatedBudget: 4480, actualCost: 0, completionPct: 0,
                startDate: '2025-03-01', endDate: '2025-03-01', assignedSubIds: [],
                notes: '14 white oak treads pre-cut, ready to install.', dependencies: ['ph-003-4'], issues: [],
            },
        ],
        budgetItems: [
            { id: 'bi-003-1', projectId: 'proj-003', category: 'Internal Labor', description: 'Floor install & finish labor', estimatedAmount: 22240, committedAmount: 22240, actualAmount: 8200 },
            { id: 'bi-003-2', projectId: 'proj-003', category: 'Subcontractor Labor', description: 'Demo crew — sub-003', estimatedAmount: 3360, committedAmount: 3360, actualAmount: 3600 },
            { id: 'bi-003-3', projectId: 'proj-003', category: 'Subcontractor Labor', description: 'Flooring install — sub-001', estimatedAmount: 11760, committedAmount: 11760, actualAmount: 4700 },
            { id: 'bi-003-4', projectId: 'proj-003', category: 'Materials', description: '5" engineered white oak (3,080 sq ft)', estimatedAmount: 28952, committedAmount: 28952, actualAmount: 14600 },
            { id: 'bi-003-5', projectId: 'proj-003', category: 'Materials', description: 'LED cove lighting & channel', estimatedAmount: 1100, committedAmount: 1100, actualAmount: 0 },
            { id: 'bi-003-6', projectId: 'proj-003', category: 'Internal Labor', description: 'Accent wall, shelving, staircase labor', estimatedAmount: 19720, committedAmount: 19720, actualAmount: 0 },
        ],
    },
];
