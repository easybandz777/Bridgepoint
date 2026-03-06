export type TradeCategory =
    | 'General'
    | 'Demo / Abatement'
    | 'Framing'
    | 'Drywall & Paint'
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
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    trade: TradeCategory;
    status: SubStatus;
    rating: number; // 1-5
    tags: string[];
    paymentTerms: string;
    defaultRate?: string;
    documents: RequiredDocument[];
    notes: string;

    // Aggregated metrics
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
    scopeOfWork: string;
    assignmentStatus: 'Invited' | 'Assigned' | 'Scheduled' | 'In Progress' | 'Completed' | 'Approved' | 'Paid' | 'Issue Flagged';
    agreedAmount: number;
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
        contactPerson: 'David Ross',
        phone: '(404) 555-0199',
        email: 'david@apexfloors.com',
        address: '1120 Industrial Pkwy, Atlanta, GA',
        trade: 'Flooring',
        status: 'Preferred',
        rating: 4.8,
        tags: ['Premium Quality', 'Fast', 'White Oak Specialists'],
        paymentTerms: 'Net 15',
        defaultRate: '$4.20/sqft install',
        documents: [
            { id: 'doc-01', type: 'W-9', filename: 'W9_Apex_2024.pdf', url: '#', uploadedDate: '2024-01-15', verified: true },
            { id: 'doc-02', type: 'COI', filename: 'COI_Apex_GL_WC.pdf', url: '#', uploadedDate: '2024-02-01', expiryDate: '2026-02-01', verified: true }
        ],
        notes: 'Best floor finishers we have. Use for all high-end properties. Always strictly adherence to humidity guidelines.',
        jobsCompleted: 34,
        activeJobs: 2,
        totalPaidYTD: 42500,
        avgCompletionTimeDays: 7,
        issueRatePct: 2
    },
    {
        id: 'sub-002',
        companyName: 'Pinnacle Spray Finishes',
        contactPerson: 'Sarah Jenkins',
        phone: '(770) 555-0233',
        email: 'billing@pinnaclespray.com',
        address: '88 Paint Ln, Marietta, GA',
        trade: 'Drywall & Paint',
        status: 'Active',
        rating: 4.2,
        tags: ['Cabinets', 'Doors', 'High Sheen'],
        paymentTerms: 'Due on Receipt',
        defaultRate: '$450/door avg',
        documents: [
            { id: 'doc-03', type: 'W-9', filename: 'Pinnacle_W9.pdf', url: '#', uploadedDate: '2023-11-10', verified: true },
            { id: 'doc-04', type: 'COI', filename: 'Pinnacle_Ins_Exp.pdf', url: '#', uploadedDate: '2023-12-05', expiryDate: '2024-12-05', verified: false } // Expired COI
        ],
        notes: 'Good quality but sometimes misses timeline. Watch their prep work on corners.',
        jobsCompleted: 14,
        activeJobs: 1,
        totalPaidYTD: 18400,
        avgCompletionTimeDays: 4,
        issueRatePct: 15
    },
    {
        id: 'sub-003',
        companyName: 'Ironclad Demo & Disposal',
        contactPerson: 'Marcus Vance',
        phone: '(404) 555-8812',
        email: 'dispatch@ironcladdemo.com',
        address: '44 Landfill Rd, Decatur, GA',
        trade: 'Demo / Abatement',
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
        notes: 'Great crew. Always sweeps the site before they leave.',
        jobsCompleted: 42,
        activeJobs: 3,
        totalPaidYTD: 58000,
        avgCompletionTimeDays: 2,
        issueRatePct: 0
    },
    {
        id: 'sub-004',
        companyName: 'Flow State Plumbing',
        contactPerson: 'Tommy Rivera',
        phone: '(678) 555-9191',
        email: 'tommy@flowstate.com',
        address: '210 Water works Dr, Roswell, GA',
        trade: 'Plumbing',
        status: 'Preferred',
        rating: 4.9,
        tags: ['Reliable', 'Custom Fixtures', 'High End'],
        paymentTerms: 'Net 15',
        defaultRate: '$145/hr',
        documents: [
            { id: 'doc-08', type: 'W-9', filename: 'FlowState_W9.pdf', url: '#', uploadedDate: '2024-05-11', verified: true },
            { id: 'doc-09', type: 'COI', filename: 'FlowState_COI.pdf', url: '#', uploadedDate: '2024-05-11', expiryDate: '2025-05-11', verified: true }
        ],
        notes: 'Never a leak. Handled the complicated wet-room at Fontaine without a hitch.',
        jobsCompleted: 18,
        activeJobs: 2,
        totalPaidYTD: 34200,
        avgCompletionTimeDays: 5,
        issueRatePct: 1
    },
    {
        id: 'sub-005',
        companyName: 'Lumen Electrical',
        contactPerson: 'Chris Chen',
        phone: '(404) 555-3344',
        email: 'chris@lumenelectric.com',
        address: '800 Volt Ave, Atlanta, GA',
        trade: 'Electrical',
        status: 'Active',
        rating: 4.6,
        tags: ['Smart Home', 'Lighting Design'],
        paymentTerms: 'Net 30',
        defaultRate: '$135/hr',
        documents: [
            { id: 'doc-10', type: 'W-9', filename: 'Lumen_W9.pdf', url: '#', uploadedDate: '2024-03-10', verified: true },
            { id: 'doc-11', type: 'COI', filename: 'Lumen_COI.pdf', url: '#', uploadedDate: '2024-03-10', expiryDate: '2025-03-10', verified: true }
        ],
        notes: 'Good at hiding wires. Sometimes reschedules last minute.',
        jobsCompleted: 22,
        activeJobs: 1,
        totalPaidYTD: 28500,
        avgCompletionTimeDays: 4,
        issueRatePct: 5
    },
    {
        id: 'sub-006',
        companyName: 'Heritage Custom Cabinetry',
        contactPerson: 'Bill Masters',
        phone: '(770) 555-8877',
        email: 'bill@heritagecabs.com',
        address: '500 Woodshop Rd, Alpharetta, GA',
        trade: 'Cabinetry',
        status: 'Preferred',
        rating: 5.0,
        tags: ['Premium', 'Inset', 'Slow'],
        paymentTerms: '50% Dep / 50% on Delivery',
        defaultRate: 'Project based',
        documents: [
            { id: 'doc-12', type: 'W-9', filename: 'Heritage_W9.pdf', url: '#', uploadedDate: '2024-08-12', verified: true },
            { id: 'doc-13', type: 'COI', filename: 'Heritage_COI.pdf', url: '#', uploadedDate: '2024-08-12', expiryDate: '2025-08-12', verified: true }
        ],
        notes: 'Flawless work but 10-12 week lead time. Plan far ahead.',
        jobsCompleted: 8,
        activeJobs: 1,
        totalPaidYTD: 84000,
        avgCompletionTimeDays: 3, // install time
        issueRatePct: 0
    },
    {
        id: 'sub-007',
        companyName: 'Artisan Stone & Tile',
        contactPerson: 'Maria Gonzalez',
        phone: '(404) 555-4422',
        email: 'maria@artisantile.com',
        address: '100 Granite Way, Atlanta, GA',
        trade: 'Tile & Stone',
        status: 'Active',
        rating: 4.7,
        tags: ['Marble', 'Mosaics', 'Large Format'],
        paymentTerms: 'Net 15',
        defaultRate: '$25/sqft install avg',
        documents: [
            { id: 'doc-14', type: 'W-9', filename: 'Artisan_W9.pdf', url: '#', uploadedDate: '2024-06-01', verified: true },
            { id: 'doc-15', type: 'COI', filename: 'Artisan_COI.pdf', url: '#', uploadedDate: '2024-06-01', expiryDate: '2025-06-01', verified: true }
        ],
        notes: 'Excellent herringbone work.',
        jobsCompleted: 27,
        activeJobs: 2,
        totalPaidYTD: 49200,
        avgCompletionTimeDays: 6,
        issueRatePct: 3
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
