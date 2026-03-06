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

export interface RequiredDocument {
    id: string;
    type: 'W-9' | 'COI' | 'License' | 'Agreement' | 'Other';
    filename: string;
    url: string;
    uploadedDate: string;
    expiryDate?: string;
    verified: boolean;
}

export interface Subcontractor {
    id: string;
    companyName: string;
    name?: string;               // alias for companyName
    contactPerson: string;
    primaryContact?: string;     // alias for contactPerson
    phone: string;
    email: string;
    address: string;
    trade: TradeCategory;
    trades?: TradeCategory[];    // multi-trade alias (pages use sub.trades)
    status: SubStatus;
    rating: number; // 1-5
    tags: string[];
    paymentTerms: string;
    defaultRate?: string;
    documents: RequiredDocument[];
    documentsRequired?: {        // convenience flags used by newer pages
        hasW9: boolean;
        hasCOI: boolean;
        hasMSA: boolean;
    };
    notes: string;
    insuranceExpiry?: string;    // COI expiry convenience accessor
    compliance?: {
        isCompliant: boolean;
        issues: string[];
    };
    metrics?: {
        jobsCompleted: number;
        totalJobsCompleted: number;   // alias for jobsCompleted
        onTimeRate: number;
        avgRating: number;
        averageRating: number;        // alias for avgRating
        issueRatePct: number;
        totalPaidYTD: number;
        reliabilityScore: number;     // computed 0-100
    };
    stats?: {                        // alias for metrics
        jobsCompleted: number;
        totalJobsCompleted: number;
        onTimeRate: number;
        avgRating: number;
        averageRating: number;
        issueRatePct: number;
        totalPaidYTD: number;
        reliabilityScore: number;
    };

    // Aggregated metrics (also direct on the object)
    jobsCompleted: number;
    activeJobs: number;
    totalPaidYTD: number;
    avgCompletionTimeDays: number;
    issueRatePct: number;
}

export interface SubcontractorAssignment {
    id: string;
    subcontractorId: string;
    projectId: string;
    phaseId?: string;
    subcategoryId?: string;
    scopeOfWork: string;
    scopeDescription?: string;   // alias for scopeOfWork
    assignmentStatus: 'Invited' | 'Assigned' | 'Scheduled' | 'In Progress' | 'Completed' | 'Approved' | 'Paid' | 'Issue Flagged';
    status?: string;             // alias for assignmentStatus
    agreedAmount: number;
    agreedPrice?: number;        // alias for agreedAmount
    billedAmount: number;
    approvedAmount: number;
    paidAmount: number;
    startDate: string;
    endDate: string;
    completionPct: number;
    rating?: number;
}

// ─── Shared Logic ─────────────────────────────────────────────────────────────

export function isCompliant(sub: Subcontractor): boolean {
    const hasW9 = sub.documents.some(d => d.type === 'W-9' && d.verified);

    const activeCOI = sub.documents.find(d => d.type === 'COI');
    const coiValid = activeCOI && activeCOI.verified && (!activeCOI.expiryDate || new Date(activeCOI.expiryDate) > new Date());

    return !!(hasW9 && coiValid && sub.status !== 'Blacklisted' && sub.status !== 'Inactive');
}

export function statusColor(status: SubStatus): string {
    switch (status) {
        case 'Active': return '#60a5fa'; // blue
        case 'Preferred': return '#b8956a'; // gold
        case 'Probation': return '#fbbf24'; // amber
        case 'Inactive': return '#9ca3af'; // gray
        case 'Blacklisted': return '#f87171'; // red
        default: return '#9ca3af';
    }
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

export const SAMPLE_SUBCONTRACTORS: Subcontractor[] = [
    {
        id: 'sub-001',
        companyName: 'Apex Hardwood & Finish',
        name: 'Apex Hardwood & Finish',
        contactPerson: 'David Ross',
        primaryContact: 'David Ross',
        phone: '(404) 555-0199',
        email: 'david@apexfloors.com',
        address: '1120 Industrial Pkwy, Atlanta, GA',
        trade: 'Flooring',
        trades: ['Flooring'],
        status: 'Preferred',
        rating: 4.8,
        tags: ['Premium Quality', 'Fast', 'White Oak Specialists'],
        paymentTerms: 'Net 15',
        defaultRate: '$4.20/sqft install',
        documents: [
            { id: 'doc-01', type: 'W-9', filename: 'W9_Apex_2024.pdf', url: '#', uploadedDate: '2024-01-15', verified: true },
            { id: 'doc-02', type: 'COI', filename: 'COI_Apex_GL_WC.pdf', url: '#', uploadedDate: '2024-02-01', expiryDate: '2026-02-01', verified: true }
        ],
        documentsRequired: { hasW9: true, hasCOI: true, hasMSA: false },
        notes: 'Best floor finishers we have. Use for all high-end properties. Always strictly adherence to humidity guidelines.',
        insuranceExpiry: '2026-02-01',
        jobsCompleted: 34,
        activeJobs: 2,
        totalPaidYTD: 42500,
        avgCompletionTimeDays: 7,
        issueRatePct: 2,
        metrics: { jobsCompleted: 34, totalJobsCompleted: 34, onTimeRate: 97, avgRating: 4.8, averageRating: 4.8, issueRatePct: 2, totalPaidYTD: 42500, reliabilityScore: 97 },
        stats: { jobsCompleted: 34, totalJobsCompleted: 34, onTimeRate: 97, avgRating: 4.8, averageRating: 4.8, issueRatePct: 2, totalPaidYTD: 42500, reliabilityScore: 97 },
        compliance: { isCompliant: true, issues: [] },
    },
    {
        id: 'sub-002',
        companyName: 'Pinnacle Spray Finishes',
        name: 'Pinnacle Spray Finishes',
        contactPerson: 'Sarah Jenkins',
        primaryContact: 'Sarah Jenkins',
        phone: '(770) 555-0233',
        email: 'billing@pinnaclespray.com',
        address: '88 Paint Ln, Marietta, GA',
        trade: 'Drywall & Paint',
        trades: ['Drywall & Paint', 'Painting'],
        status: 'Active',
        rating: 4.2,
        tags: ['Cabinets', 'Doors', 'High Sheen'],
        paymentTerms: 'Due on Receipt',
        defaultRate: '$450/door avg',
        documents: [
            { id: 'doc-03', type: 'W-9', filename: 'Pinnacle_W9.pdf', url: '#', uploadedDate: '2023-11-10', verified: true },
            { id: 'doc-04', type: 'COI', filename: 'Pinnacle_Ins_Exp.pdf', url: '#', uploadedDate: '2023-12-05', expiryDate: '2024-12-05', verified: false }
        ],
        documentsRequired: { hasW9: true, hasCOI: false, hasMSA: false },
        notes: 'Good quality but sometimes misses timeline. Watch their prep work on corners.',
        insuranceExpiry: '2024-12-05',
        jobsCompleted: 14,
        activeJobs: 1,
        totalPaidYTD: 18400,
        avgCompletionTimeDays: 4,
        issueRatePct: 15,
        metrics: { jobsCompleted: 14, totalJobsCompleted: 14, onTimeRate: 78, avgRating: 4.2, averageRating: 4.2, issueRatePct: 15, totalPaidYTD: 18400, reliabilityScore: 78 },
        stats: { jobsCompleted: 14, totalJobsCompleted: 14, onTimeRate: 78, avgRating: 4.2, averageRating: 4.2, issueRatePct: 15, totalPaidYTD: 18400, reliabilityScore: 78 },
        compliance: { isCompliant: false, issues: ['COI expired'] },
    },
    {
        id: 'sub-003',
        companyName: 'Ironclad Demo & Disposal',
        name: 'Ironclad Demo & Disposal',
        contactPerson: 'Marcus Vance',
        primaryContact: 'Marcus Vance',
        phone: '(404) 555-8812',
        email: 'dispatch@ironcladdemo.com',
        address: '44 Landfill Rd, Decatur, GA',
        trade: 'Demo / Abatement',
        trades: ['Demo / Abatement', 'General'],
        status: 'Active',
        rating: 4.5,
        tags: ['Clean', 'Fast', 'Asbestos Cert'],
        paymentTerms: 'Net 30',
        defaultRate: '$1800/day crew',
        documents: [
            { id: 'doc-05', type: 'W-9', filename: 'Ironclad_W9.pdf', url: '#', uploadedDate: '2024-01-20', verified: true },
            { id: 'doc-06', type: 'COI', filename: 'Ironclad_COI.pdf', url: '#', uploadedDate: '2025-01-20', expiryDate: '2026-01-20', verified: true },
            { id: 'doc-07', type: 'License', filename: 'Abatement_Lic.pdf', url: '#', uploadedDate: '2025-01-20', verified: true }
        ],
        documentsRequired: { hasW9: true, hasCOI: true, hasMSA: true },
        notes: 'Great crew. Always sweeps the site before they leave.',
        insuranceExpiry: '2026-01-20',
        jobsCompleted: 42,
        activeJobs: 3,
        totalPaidYTD: 58000,
        avgCompletionTimeDays: 2,
        issueRatePct: 0,
        metrics: { jobsCompleted: 42, totalJobsCompleted: 42, onTimeRate: 100, avgRating: 4.5, averageRating: 4.5, issueRatePct: 0, totalPaidYTD: 58000, reliabilityScore: 100 },
        stats: { jobsCompleted: 42, totalJobsCompleted: 42, onTimeRate: 100, avgRating: 4.5, averageRating: 4.5, issueRatePct: 0, totalPaidYTD: 58000, reliabilityScore: 100 },
        compliance: { isCompliant: true, issues: [] },
    },
    {
        id: 'sub-004',
        companyName: 'Flow State Plumbing',
        name: 'Flow State Plumbing',
        contactPerson: 'Tommy Rivera',
        primaryContact: 'Tommy Rivera',
        phone: '(678) 555-9191',
        email: 'tommy@flowstate.com',
        address: '210 Water works Dr, Roswell, GA',
        trade: 'Plumbing',
        trades: ['Plumbing'],
        status: 'Preferred',
        rating: 4.9,
        tags: ['Reliable', 'Custom Fixtures', 'High End'],
        paymentTerms: 'Net 15',
        defaultRate: '$145/hr',
        documents: [
            { id: 'doc-08', type: 'W-9', filename: 'FlowState_W9.pdf', url: '#', uploadedDate: '2024-05-11', verified: true },
            { id: 'doc-09', type: 'COI', filename: 'FlowState_COI.pdf', url: '#', uploadedDate: '2024-05-11', expiryDate: '2025-05-11', verified: true }
        ],
        documentsRequired: { hasW9: true, hasCOI: true, hasMSA: true },
        notes: 'Never a leak. Handled the complicated wet-room at Fontaine without a hitch.',
        insuranceExpiry: '2025-05-11',
        jobsCompleted: 18,
        activeJobs: 2,
        totalPaidYTD: 34200,
        avgCompletionTimeDays: 5,
        issueRatePct: 1,
        metrics: { jobsCompleted: 18, totalJobsCompleted: 18, onTimeRate: 99, avgRating: 4.9, averageRating: 4.9, issueRatePct: 1, totalPaidYTD: 34200, reliabilityScore: 99 },
        stats: { jobsCompleted: 18, totalJobsCompleted: 18, onTimeRate: 99, avgRating: 4.9, averageRating: 4.9, issueRatePct: 1, totalPaidYTD: 34200, reliabilityScore: 99 },
        compliance: { isCompliant: true, issues: [] },
    },
    {
        id: 'sub-005',
        companyName: 'Lumen Electrical',
        name: 'Lumen Electrical',
        contactPerson: 'Chris Chen',
        primaryContact: 'Chris Chen',
        phone: '(404) 555-3344',
        email: 'chris@lumenelectric.com',
        address: '800 Volt Ave, Atlanta, GA',
        trade: 'Electrical',
        trades: ['Electrical'],
        status: 'Active',
        rating: 4.6,
        tags: ['Smart Home', 'Lighting Design'],
        paymentTerms: 'Net 30',
        defaultRate: '$135/hr',
        documents: [
            { id: 'doc-10', type: 'W-9', filename: 'Lumen_W9.pdf', url: '#', uploadedDate: '2024-03-10', verified: true },
            { id: 'doc-11', type: 'COI', filename: 'Lumen_COI.pdf', url: '#', uploadedDate: '2024-03-10', expiryDate: '2025-03-10', verified: true }
        ],
        documentsRequired: { hasW9: true, hasCOI: true, hasMSA: false },
        notes: 'Good at hiding wires. Sometimes reschedules last minute.',
        insuranceExpiry: '2025-03-10',
        jobsCompleted: 22,
        activeJobs: 1,
        totalPaidYTD: 28500,
        avgCompletionTimeDays: 4,
        issueRatePct: 5,
        metrics: { jobsCompleted: 22, totalJobsCompleted: 22, onTimeRate: 89, avgRating: 4.6, averageRating: 4.6, issueRatePct: 5, totalPaidYTD: 28500, reliabilityScore: 89 },
        stats: { jobsCompleted: 22, totalJobsCompleted: 22, onTimeRate: 89, avgRating: 4.6, averageRating: 4.6, issueRatePct: 5, totalPaidYTD: 28500, reliabilityScore: 89 },
        compliance: { isCompliant: true, issues: [] },
    },
    {
        id: 'sub-006',
        companyName: 'Heritage Custom Cabinetry',
        name: 'Heritage Custom Cabinetry',
        contactPerson: 'Bill Masters',
        primaryContact: 'Bill Masters',
        phone: '(770) 555-8877',
        email: 'bill@heritagecabs.com',
        address: '500 Woodshop Rd, Alpharetta, GA',
        trade: 'Cabinetry',
        trades: ['Cabinetry', 'Trim & Finish Carpentry'],
        status: 'Preferred',
        rating: 5.0,
        tags: ['Premium', 'Inset', 'Slow'],
        paymentTerms: '50% Dep / 50% on Delivery',
        defaultRate: 'Project based',
        documents: [
            { id: 'doc-12', type: 'W-9', filename: 'Heritage_W9.pdf', url: '#', uploadedDate: '2024-08-12', verified: true },
            { id: 'doc-13', type: 'COI', filename: 'Heritage_COI.pdf', url: '#', uploadedDate: '2024-08-12', expiryDate: '2025-08-12', verified: true }
        ],
        documentsRequired: { hasW9: true, hasCOI: true, hasMSA: true },
        notes: 'Flawless work but 10-12 week lead time. Plan far ahead.',
        insuranceExpiry: '2025-08-12',
        jobsCompleted: 8,
        activeJobs: 1,
        totalPaidYTD: 84000,
        avgCompletionTimeDays: 3,
        issueRatePct: 0,
        metrics: { jobsCompleted: 8, totalJobsCompleted: 8, onTimeRate: 100, avgRating: 5.0, averageRating: 5.0, issueRatePct: 0, totalPaidYTD: 84000, reliabilityScore: 100 },
        stats: { jobsCompleted: 8, totalJobsCompleted: 8, onTimeRate: 100, avgRating: 5.0, averageRating: 5.0, issueRatePct: 0, totalPaidYTD: 84000, reliabilityScore: 100 },
        compliance: { isCompliant: true, issues: [] },
    },
    {
        id: 'sub-007',
        companyName: 'Artisan Stone & Tile',
        name: 'Artisan Stone & Tile',
        contactPerson: 'Maria Gonzalez',
        primaryContact: 'Maria Gonzalez',
        phone: '(404) 555-4422',
        email: 'maria@artisantile.com',
        address: '100 Granite Way, Atlanta, GA',
        trade: 'Tile & Stone',
        trades: ['Tile & Stone', 'Flooring'],
        status: 'Active',
        rating: 4.7,
        tags: ['Marble', 'Mosaics', 'Large Format'],
        paymentTerms: 'Net 15',
        defaultRate: '$25/sqft install avg',
        documents: [
            { id: 'doc-14', type: 'W-9', filename: 'Artisan_W9.pdf', url: '#', uploadedDate: '2024-06-01', verified: true },
            { id: 'doc-15', type: 'COI', filename: 'Artisan_COI.pdf', url: '#', uploadedDate: '2024-06-01', expiryDate: '2025-06-01', verified: true }
        ],
        documentsRequired: { hasW9: true, hasCOI: true, hasMSA: false },
        notes: 'Excellent herringbone work.',
        insuranceExpiry: '2025-06-01',
        jobsCompleted: 27,
        activeJobs: 2,
        totalPaidYTD: 49200,
        avgCompletionTimeDays: 6,
        issueRatePct: 3,
        metrics: { jobsCompleted: 27, totalJobsCompleted: 27, onTimeRate: 95, avgRating: 4.7, averageRating: 4.7, issueRatePct: 3, totalPaidYTD: 49200, reliabilityScore: 95 },
        stats: { jobsCompleted: 27, totalJobsCompleted: 27, onTimeRate: 95, avgRating: 4.7, averageRating: 4.7, issueRatePct: 3, totalPaidYTD: 49200, reliabilityScore: 95 },
        compliance: { isCompliant: true, issues: [] },
    }
];



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
        rating: 5
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
        rating: 4.5
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
        completionPct: 0
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
        completionPct: 50
    }
];
