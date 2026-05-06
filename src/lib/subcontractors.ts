// ─── Trade & Status types ─────────────────────────────────────────────────────

export type TradeCategory =
    | 'General'
    | 'Demo / Abatement'
    | 'Framing'
    | 'Drywall & Paint'
    | 'Drywall'
    | 'Painting'
    | 'Roofing'
    | 'Landscaping'
    | 'Trim & Finish Carpentry'
    | 'Cabinetry'
    | 'Flooring'
    | 'Tile & Stone'
    | 'Plumbing'
    | 'Electrical'
    | 'HVAC'
    | 'Cleaning / Disposal';

export type SubStatus = 'Active' | 'Inactive' | 'Preferred' | 'Probation' | 'Blacklisted';

// ─── Document & Compliance ────────────────────────────────────────────────────

export type DocumentType = 'W-9' | 'COI' | 'License' | 'Agreement' | 'Other';

export interface RequiredDocument {
    id: string;
    type: DocumentType;
    filename: string;
    url: string;
    uploadedDate: string;
    expiryDate?: string | null;
    verified: boolean;
    notes?: string;
}

export interface ComplianceState {
    hasW9: boolean;
    hasCOI: boolean;
    hasMSA: boolean;
    coiExpired: boolean;
    coiExpiringSoon: boolean;
    coiExpiry: string | null;
    coiDaysRemaining: number | null;
    isCompliant: boolean;
    issues: string[];
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface SubMetrics {
    jobsCompleted: number;
    activeJobs: number;
    totalPaidYTD: number;
    totalBilledYTD: number;
    onTimeRate: number;
    avgRating: number;
    issueRatePct: number;
    reliabilityScore: number;
    avgCompletionTimeDays: number;
}

// ─── Canonical types ──────────────────────────────────────────────────────────

export interface Subcontractor {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    trades: TradeCategory[];
    status: SubStatus;
    rating: number; // 1-5
    tags: string[];
    paymentTerms: string;
    defaultRate: string | null;
    notes: string;
    insuranceExpiry: string | null;
    documents: RequiredDocument[];
    metrics: SubMetrics;
    compliance: ComplianceState;
    createdAt?: string;
    updatedAt?: string;
}

export interface SubcontractorAssignment {
    id: string;
    subcontractorId: string;
    projectId: string | null;
    phaseId: string | null;
    scopeOfWork: string;
    assignmentStatus:
        | 'Invited'
        | 'Assigned'
        | 'Scheduled'
        | 'In Progress'
        | 'Completed'
        | 'Approved'
        | 'Paid'
        | 'Issue Flagged';
    agreedAmount: number;
    billedAmount: number;
    approvedAmount: number;
    paidAmount: number;
    startDate: string | null;
    endDate: string | null;
    completionPct: number;
    rating: number | null;
    notes?: string;
}

export interface SubcontractorNote {
    id: string;
    subcontractorId: string;
    author: string;
    note: string;
    tag: string | null;
    projectId: string | null;
    createdAt: string;
}

// ─── DB Row types and mappers ─────────────────────────────────────────────────

/** Raw shape returned by `SELECT * FROM subcontractors` */
export interface RowSubcontractor {
    id: string;
    company_name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string | null;
    trades: unknown;
    status: string;
    rating: string | number;
    tags: unknown;
    payment_terms: string | null;
    default_rate: string | null;
    notes: string | null;
    insurance_expiry: string | null;
    documents: unknown;
    metrics: unknown;
    created_at?: string;
    updated_at?: string;
}

/** Raw shape returned by `SELECT * FROM subcontractor_assignments` */
export interface RowAssignment {
    id: string;
    subcontractor_id: string;
    project_id: string | null;
    phase_id: string | null;
    scope_of_work: string;
    assignment_status: string;
    agreed_amount: string | number;
    billed_amount: string | number;
    approved_amount: string | number;
    paid_amount: string | number;
    start_date: string | null;
    end_date: string | null;
    completion_pct: string | number;
    rating: string | number | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
}

/** Raw shape returned by `SELECT * FROM subcontractor_notes` */
export interface RowNote {
    id: string;
    subcontractor_id: string;
    author: string;
    note: string;
    tag: string | null;
    project_id: string | null;
    created_at: string;
}

function asArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
}

function asNum(v: unknown, fallback = 0): number {
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/** Map a documents JSONB blob into typed RequiredDocument[]. */
export function mapDocuments(raw: unknown): RequiredDocument[] {
    return asArray<RequiredDocument>(raw).map((d) => {
        // small `as any` is acceptable inside the JSON-blob normalizer
        // since Postgres returns `unknown` shapes for JSONB.
        const doc = d as Partial<RequiredDocument> & Record<string, unknown>;
        return {
            id: String(doc.id ?? ''),
            type: (doc.type as DocumentType) ?? 'Other',
            filename: String(doc.filename ?? ''),
            url: String(doc.url ?? '#'),
            uploadedDate: String(doc.uploadedDate ?? ''),
            expiryDate: (doc.expiryDate as string | undefined) ?? null,
            verified: Boolean(doc.verified),
            notes: typeof doc.notes === 'string' ? doc.notes : undefined,
        };
    });
}

/**
 * Compute compliance state from a documents array (server-side derivation —
 * never trust a stale `compliance` blob).
 */
export function computeCompliance(
    docs: RequiredDocument[],
    insuranceExpiry: string | null,
    status: SubStatus
): ComplianceState {
    const w9 = docs.find((d) => d.type === 'W-9' && d.verified);
    const coi = docs.find((d) => d.type === 'COI');
    const msa = docs.find((d) => d.type === 'Agreement' && d.verified);

    // Use either the doc's own expiryDate or the column-level fallback
    const coiExpiry = coi?.expiryDate ?? insuranceExpiry ?? null;

    let coiDaysRemaining: number | null = null;
    let coiExpired = false;
    let coiExpiringSoon = false;

    if (coiExpiry) {
        const exp = new Date(coiExpiry).getTime();
        if (!Number.isNaN(exp)) {
            const days = Math.floor((exp - Date.now()) / 86_400_000);
            coiDaysRemaining = days;
            coiExpired = days < 0;
            coiExpiringSoon = days >= 0 && days <= 30;
        }
    }

    const hasW9 = !!w9;
    const hasCOI = !!coi && coi.verified && !coiExpired;
    const hasMSA = !!msa;

    const issues: string[] = [];
    if (!hasW9) issues.push('Missing or unverified W-9');
    if (!coi) issues.push('No COI on file');
    else if (!coi.verified) issues.push('COI not verified');
    else if (coiExpired) issues.push('COI expired');
    else if (coiExpiringSoon) issues.push(`COI expires in ${coiDaysRemaining} day(s)`);
    if (status === 'Blacklisted') issues.push('Sub is blacklisted');
    if (status === 'Inactive') issues.push('Sub is inactive');

    const isCompliant =
        hasW9 && hasCOI && status !== 'Blacklisted' && status !== 'Inactive';

    return {
        hasW9,
        hasCOI,
        hasMSA,
        coiExpired,
        coiExpiringSoon,
        coiExpiry,
        coiDaysRemaining,
        isCompliant,
        issues,
    };
}

/**
 * Compute live metrics from a subcontractor's assignments.
 * Run inside the GET handler — never persist to the metrics blob.
 */
export function computeMetrics(assignments: SubcontractorAssignment[]): SubMetrics {
    const completed = assignments.filter((a) => ['Completed', 'Approved', 'Paid'].includes(a.assignmentStatus));
    const active = assignments.filter((a) => ['Assigned', 'Scheduled', 'In Progress'].includes(a.assignmentStatus));
    const flagged = assignments.filter((a) => a.assignmentStatus === 'Issue Flagged');

    const ratedJobs = completed.filter((a) => typeof a.rating === 'number' && a.rating > 0);
    const avgRating = ratedJobs.length
        ? ratedJobs.reduce((s, a) => s + (a.rating ?? 0), 0) / ratedJobs.length
        : 0;

    // On-time = % of completed jobs whose end_date <= scheduled end_date
    // We don't track planned vs actual separately, so we use completion_pct >= 100 as a proxy
    // for "delivered". Until we have planned_end_date, treat all completed jobs as on-time
    // and let issue flag drag the rate down.
    const totalDecided = completed.length + flagged.length;
    const onTimeRate = totalDecided ? Math.round((completed.length / totalDecided) * 100) : 100;

    const issueRatePct = totalDecided ? Math.round((flagged.length / totalDecided) * 100) : 0;

    // YTD = anything paid/billed this calendar year
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
    const isThisYear = (d: string | null) => {
        if (!d) return false;
        const t = new Date(d).getTime();
        return !Number.isNaN(t) && t >= yearStart;
    };

    const totalPaidYTD = assignments
        .filter((a) => isThisYear(a.endDate) || isThisYear(a.startDate))
        .reduce((s, a) => s + a.paidAmount, 0);

    const totalBilledYTD = assignments
        .filter((a) => isThisYear(a.endDate) || isThisYear(a.startDate))
        .reduce((s, a) => s + a.billedAmount, 0);

    const completionDays = completed
        .map((a) => {
            if (!a.startDate || !a.endDate) return null;
            const s = new Date(a.startDate).getTime();
            const e = new Date(a.endDate).getTime();
            if (Number.isNaN(s) || Number.isNaN(e)) return null;
            return Math.max(0, Math.round((e - s) / 86_400_000));
        })
        .filter((n): n is number => n !== null);

    const avgCompletionTimeDays = completionDays.length
        ? Math.round(completionDays.reduce((s, n) => s + n, 0) / completionDays.length)
        : 0;

    // Reliability composite: on-time rate weighted 0.55, (5 - issue%) weighted 0.25,
    // avg rating (× 20) weighted 0.20.
    const ratingPct = avgRating > 0 ? avgRating * 20 : 80; // default 80 when no ratings
    const reliabilityScore = Math.round(
        onTimeRate * 0.55 + Math.max(0, 100 - issueRatePct * 5) * 0.25 + ratingPct * 0.2
    );

    return {
        jobsCompleted: completed.length,
        activeJobs: active.length,
        totalPaidYTD,
        totalBilledYTD,
        onTimeRate,
        avgRating: Math.round(avgRating * 10) / 10,
        issueRatePct,
        reliabilityScore: Math.max(0, Math.min(100, reliabilityScore)),
        avgCompletionTimeDays,
    };
}

/** Map a single DB row to a Subcontractor (without metrics — those are computed). */
export function dbRowToSub(r: RowSubcontractor): Subcontractor {
    const documents = mapDocuments(r.documents);
    const status = (r.status as SubStatus) ?? 'Active';
    const compliance = computeCompliance(documents, r.insurance_expiry ?? null, status);
    const metricsBlob = (r.metrics ?? {}) as Record<string, unknown>;

    return {
        id: r.id,
        companyName: r.company_name,
        contactPerson: r.contact_person,
        phone: r.phone,
        email: r.email,
        address: r.address ?? '',
        trades: asArray<TradeCategory>(r.trades),
        status,
        rating: asNum(r.rating, 4),
        tags: asArray<string>(r.tags),
        paymentTerms: r.payment_terms ?? 'Net 30',
        defaultRate: r.default_rate ?? null,
        notes: r.notes ?? '',
        insuranceExpiry: r.insurance_expiry ?? null,
        documents,
        metrics: {
            jobsCompleted: asNum(metricsBlob.jobsCompleted ?? metricsBlob.totalJobsCompleted),
            activeJobs: asNum(metricsBlob.activeJobs),
            totalPaidYTD: asNum(metricsBlob.totalPaidYTD),
            totalBilledYTD: asNum(metricsBlob.totalBilledYTD),
            onTimeRate: asNum(metricsBlob.onTimeRate, 100),
            avgRating: asNum(metricsBlob.avgRating ?? metricsBlob.averageRating, 0),
            issueRatePct: asNum(metricsBlob.issueRatePct),
            reliabilityScore: asNum(metricsBlob.reliabilityScore, 100),
            avgCompletionTimeDays: asNum(metricsBlob.avgCompletionTimeDays),
        },
        compliance,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export function dbRowToAssignment(r: RowAssignment): SubcontractorAssignment {
    return {
        id: r.id,
        subcontractorId: r.subcontractor_id,
        projectId: r.project_id,
        phaseId: r.phase_id,
        scopeOfWork: r.scope_of_work,
        assignmentStatus: (r.assignment_status as SubcontractorAssignment['assignmentStatus']) ?? 'Assigned',
        agreedAmount: asNum(r.agreed_amount),
        billedAmount: asNum(r.billed_amount),
        approvedAmount: asNum(r.approved_amount),
        paidAmount: asNum(r.paid_amount),
        startDate: r.start_date,
        endDate: r.end_date,
        completionPct: asNum(r.completion_pct),
        rating: r.rating == null ? null : asNum(r.rating),
        notes: r.notes ?? '',
    };
}

export function dbRowToNote(r: RowNote): SubcontractorNote {
    return {
        id: r.id,
        subcontractorId: r.subcontractor_id,
        author: r.author,
        note: r.note,
        tag: r.tag,
        projectId: r.project_id,
        createdAt: r.created_at,
    };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export function statusColor(status: SubStatus): string {
    switch (status) {
        case 'Active': return '#60a5fa';
        case 'Preferred': return '#b8956a';
        case 'Probation': return '#fbbf24';
        case 'Inactive': return '#9ca3af';
        case 'Blacklisted': return '#f87171';
        default: return '#9ca3af';
    }
}

// ─── Sample Data (used for seeding only) ──────────────────────────────────────

export interface SampleSubcontractor {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    trades: TradeCategory[];
    status: SubStatus;
    rating: number;
    tags: string[];
    paymentTerms: string;
    defaultRate: string;
    documents: RequiredDocument[];
    notes: string;
    insuranceExpiry: string;
}

export const SAMPLE_SUBCONTRACTORS: SampleSubcontractor[] = [
    {
        id: 'sub-001',
        companyName: 'Apex Hardwood & Finish',
        contactPerson: 'David Ross',
        phone: '(404) 555-0199',
        email: 'david@apexfloors.com',
        address: '1120 Industrial Pkwy, Atlanta, GA',
        trades: ['Flooring'],
        status: 'Preferred',
        rating: 4.8,
        tags: ['Premium Quality', 'Fast', 'White Oak Specialists'],
        paymentTerms: 'Net 15',
        defaultRate: '$4.20/sqft install',
        documents: [
            { id: 'doc-01', type: 'W-9', filename: 'W9_Apex_2024.pdf', url: '#', uploadedDate: '2024-01-15', verified: true },
            { id: 'doc-02', type: 'COI', filename: 'COI_Apex_GL_WC.pdf', url: '#', uploadedDate: '2024-02-01', expiryDate: '2026-02-01', verified: true },
        ],
        notes: 'Best floor finishers we have. Use for all high-end properties. Always strict adherence to humidity guidelines.',
        insuranceExpiry: '2026-02-01',
    },
    {
        id: 'sub-002',
        companyName: 'Pinnacle Spray Finishes',
        contactPerson: 'Sarah Jenkins',
        phone: '(770) 555-0233',
        email: 'billing@pinnaclespray.com',
        address: '88 Paint Ln, Marietta, GA',
        trades: ['Drywall & Paint', 'Painting'],
        status: 'Active',
        rating: 4.2,
        tags: ['Cabinets', 'Doors', 'High Sheen'],
        paymentTerms: 'Due on Receipt',
        defaultRate: '$450/door avg',
        documents: [
            { id: 'doc-03', type: 'W-9', filename: 'Pinnacle_W9.pdf', url: '#', uploadedDate: '2023-11-10', verified: true },
            { id: 'doc-04', type: 'COI', filename: 'Pinnacle_Ins_Exp.pdf', url: '#', uploadedDate: '2023-12-05', expiryDate: '2026-06-05', verified: true },
        ],
        notes: 'Good quality but sometimes misses timeline. Watch their prep work on corners.',
        insuranceExpiry: '2026-06-05',
    },
    {
        id: 'sub-003',
        companyName: 'Ironclad Demo & Disposal',
        contactPerson: 'Marcus Vance',
        phone: '(404) 555-8812',
        email: 'dispatch@ironcladdemo.com',
        address: '44 Landfill Rd, Decatur, GA',
        trades: ['Demo / Abatement', 'General'],
        status: 'Active',
        rating: 4.5,
        tags: ['Clean', 'Fast', 'Asbestos Cert'],
        paymentTerms: 'Net 30',
        defaultRate: '$1800/day crew',
        documents: [
            { id: 'doc-05', type: 'W-9', filename: 'Ironclad_W9.pdf', url: '#', uploadedDate: '2024-01-20', verified: true },
            { id: 'doc-06', type: 'COI', filename: 'Ironclad_COI.pdf', url: '#', uploadedDate: '2025-01-20', expiryDate: '2026-05-20', verified: true },
            { id: 'doc-07', type: 'License', filename: 'Abatement_Lic.pdf', url: '#', uploadedDate: '2025-01-20', verified: true },
        ],
        notes: 'Great crew. Always sweeps the site before they leave.',
        insuranceExpiry: '2026-05-20',
    },
    {
        id: 'sub-004',
        companyName: 'Flow State Plumbing',
        contactPerson: 'Tommy Rivera',
        phone: '(678) 555-9191',
        email: 'tommy@flowstate.com',
        address: '210 Waterworks Dr, Roswell, GA',
        trades: ['Plumbing'],
        status: 'Preferred',
        rating: 4.9,
        tags: ['Reliable', 'Custom Fixtures', 'High End'],
        paymentTerms: 'Net 15',
        defaultRate: '$145/hr',
        documents: [
            { id: 'doc-08', type: 'W-9', filename: 'FlowState_W9.pdf', url: '#', uploadedDate: '2024-05-11', verified: true },
            { id: 'doc-09', type: 'COI', filename: 'FlowState_COI.pdf', url: '#', uploadedDate: '2025-05-11', expiryDate: '2026-05-11', verified: true },
        ],
        notes: 'Never a leak. Handled the complicated wet-room at Fontaine without a hitch.',
        insuranceExpiry: '2026-05-11',
    },
    {
        id: 'sub-005',
        companyName: 'Lumen Electrical',
        contactPerson: 'Chris Chen',
        phone: '(404) 555-3344',
        email: 'chris@lumenelectric.com',
        address: '800 Volt Ave, Atlanta, GA',
        trades: ['Electrical'],
        status: 'Active',
        rating: 4.6,
        tags: ['Smart Home', 'Lighting Design'],
        paymentTerms: 'Net 30',
        defaultRate: '$135/hr',
        documents: [
            { id: 'doc-10', type: 'W-9', filename: 'Lumen_W9.pdf', url: '#', uploadedDate: '2024-03-10', verified: true },
            { id: 'doc-11', type: 'COI', filename: 'Lumen_COI.pdf', url: '#', uploadedDate: '2024-03-10', expiryDate: '2026-05-25', verified: true },
        ],
        notes: 'Good at hiding wires. Sometimes reschedules last minute.',
        insuranceExpiry: '2026-05-25',
    },
    {
        id: 'sub-006',
        companyName: 'Heritage Custom Cabinetry',
        contactPerson: 'Bill Masters',
        phone: '(770) 555-8877',
        email: 'bill@heritagecabs.com',
        address: '500 Woodshop Rd, Alpharetta, GA',
        trades: ['Cabinetry', 'Trim & Finish Carpentry'],
        status: 'Preferred',
        rating: 5.0,
        tags: ['Premium', 'Inset', 'Slow'],
        paymentTerms: '50% Dep / 50% on Delivery',
        defaultRate: 'Project based',
        documents: [
            { id: 'doc-12', type: 'W-9', filename: 'Heritage_W9.pdf', url: '#', uploadedDate: '2024-08-12', verified: true },
            { id: 'doc-13', type: 'COI', filename: 'Heritage_COI.pdf', url: '#', uploadedDate: '2024-08-12', expiryDate: '2026-08-12', verified: true },
        ],
        notes: 'Flawless work but 10-12 week lead time. Plan far ahead.',
        insuranceExpiry: '2026-08-12',
    },
    {
        id: 'sub-007',
        companyName: 'Artisan Stone & Tile',
        contactPerson: 'Maria Gonzalez',
        phone: '(404) 555-4422',
        email: 'maria@artisantile.com',
        address: '100 Granite Way, Atlanta, GA',
        trades: ['Tile & Stone', 'Flooring'],
        status: 'Active',
        rating: 4.7,
        tags: ['Marble', 'Mosaics', 'Large Format'],
        paymentTerms: 'Net 15',
        defaultRate: '$25/sqft install avg',
        documents: [
            { id: 'doc-14', type: 'W-9', filename: 'Artisan_W9.pdf', url: '#', uploadedDate: '2024-06-01', verified: true },
            { id: 'doc-15', type: 'COI', filename: 'Artisan_COI.pdf', url: '#', uploadedDate: '2024-06-01', expiryDate: '2026-06-01', verified: true },
        ],
        notes: 'Excellent herringbone work.',
        insuranceExpiry: '2026-06-01',
    },
];

/**
 * Sample assignments — kept for the projects/jobs sample views and for seeding,
 * but no longer the source of truth. Real data lives in `subcontractor_assignments`.
 */
export const SAMPLE_ASSIGNMENTS: SubcontractorAssignment[] = [
    {
        id: 'asg-001',
        subcontractorId: 'sub-001',
        projectId: 'proj-001',
        phaseId: 'ph-001-2',
        scopeOfWork: 'White oak flooring install and sand & finish throughout main floor',
        assignmentStatus: 'Completed',
        agreedAmount: 5500,
        billedAmount: 5820,
        approvedAmount: 5820,
        paidAmount: 5820,
        startDate: '2025-01-20',
        endDate: '2025-01-25',
        completionPct: 100,
        rating: 5,
    },
    {
        id: 'asg-002',
        subcontractorId: 'sub-003',
        projectId: 'proj-002',
        phaseId: 'ph-002-1',
        scopeOfWork: 'Full kitchen & bathrooms gut demo, debris removal, dumpster pulls',
        assignmentStatus: 'Paid',
        agreedAmount: 6400,
        billedAmount: 6800,
        approvedAmount: 6800,
        paidAmount: 6800,
        startDate: '2025-01-30',
        endDate: '2025-02-03',
        completionPct: 100,
        rating: 4.5,
    },
    {
        id: 'asg-003',
        subcontractorId: 'sub-006',
        projectId: 'proj-002',
        phaseId: 'ph-002-3',
        scopeOfWork: 'Custom inset cabinetry — kitchen, bar, master bath',
        assignmentStatus: 'Scheduled',
        agreedAmount: 32000,
        billedAmount: 16000,
        approvedAmount: 16000,
        paidAmount: 0,
        startDate: '2025-04-01',
        endDate: '2025-04-05',
        completionPct: 0,
        rating: null,
    },
    {
        id: 'asg-004',
        subcontractorId: 'sub-001',
        projectId: 'proj-003',
        phaseId: 'ph-003-2',
        scopeOfWork: '3,200 sqft of 5" engineered white oak — install, sand, finish',
        assignmentStatus: 'In Progress',
        agreedAmount: 11760,
        billedAmount: 5880,
        approvedAmount: 0,
        paidAmount: 0,
        startDate: '2025-02-28',
        endDate: '2025-03-08',
        completionPct: 50,
        rating: null,
    },
];
