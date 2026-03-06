export type ChangeOrderStatus = 'Pending' | 'Customer Approved' | 'Internal Approved' | 'Rejected';

export interface ChangeOrder {
    id: string;
    projectId: string;
    number: string;
    title: string;
    description: string;
    reason: string;
    status: ChangeOrderStatus;
    createdDate: string;
    dateCreated?: string;           // alias for createdDate
    approvedDate?: string;

    // Financials
    customerPriceTarget: number;    // Amount charged to customer
    customerAmount?: number;        // alias for customerPriceTarget
    internalCostImpact: number;     // Expected cost increase for us
    internalCost?: number;          // alias for internalCostImpact
    subcontractorImpactId?: string; // If this increases a sub's PO

    customerApproved: boolean;
    internalApproved: boolean;
}

export type PayoutStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Partially Approved' | 'Rejected' | 'Paid' | 'Disputed' | 'Pending';

export interface PayoutRequest {
    id: string;
    projectId: string;
    subcontractorId: string;
    assignmentId: string;
    invoiceNumber: string;
    description?: string;
    status: PayoutStatus;
    submittedDate: string;
    dateSubmitted?: string;      // alias for submittedDate

    requestedAmount: number;
    approvedAmount: number;
    retainageHeld: number;
    priorPaymentsOnAssignment: number;
    committedAssignmentAmount: number;

    notes: string;
    paymentMethod?: string;
    paymentReference?: string;
    paymentDate?: string;
}

export interface Expense {
    id: string;
    projectId: string;
    phaseId?: string;
    vendor: string;
    description: string;
    category: 'Materials' | 'Equipment' | 'Permits' | 'Disposal' | 'Travel' | 'Misc';
    amount: number;
    date: string;          // kept for backward compat
    dateIncurred: string;
    status: 'Paid' | 'Pending' | 'Flagged';
    notes: string;
    reimbursable: boolean;      // backward compat
    isReimbursable: boolean;
    referenceNumber?: string;
    paymentMethod?: string;
    receiptUrl?: string;
}

export interface ActivityLogEntry {
    id: string;
    projectId: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
}

// ─── Shared Logic ─────────────────────────────────────────────────────────────

export function filterApprovedChangeOrders(cos: ChangeOrder[]) {
    return cos.filter(co => co.customerApproved && co.internalApproved);
}

export function getTotalApprovedCOCost(cos: ChangeOrder[]) {
    return filterApprovedChangeOrders(cos).reduce((sum, co) => sum + co.internalCostImpact, 0);
}

export function getTotalApprovedCOPrice(cos: ChangeOrder[]) {
    return filterApprovedChangeOrders(cos).reduce((sum, co) => sum + co.customerPriceTarget, 0);
}

export function summarizeChangeOrders(cos: ChangeOrder[]) {
    const approved = filterApprovedChangeOrders(cos);
    const approvedCostImpact = getTotalApprovedCOCost(cos);
    const approvedRevenueImpact = getTotalApprovedCOPrice(cos);
    const pendingCos = cos.filter(co => co.status === 'Pending');
    return {
        total: cos.length,
        approved: approved.length,
        pending: pendingCos.length,
        totalCostImpact: cos.reduce((sum, co) => sum + co.internalCostImpact, 0),
        totalRevenueImpact: cos.reduce((sum, co) => sum + co.customerPriceTarget, 0),
        approvedCostImpact,
        approvedRevenueImpact,
        // Aliases used by change-orders page:
        approvedCost: approvedCostImpact,
        approvedRevenue: approvedRevenueImpact,
        pendingCost: pendingCos.reduce((sum, co) => sum + co.internalCostImpact, 0),
        pendingRevenue: pendingCos.reduce((sum, co) => sum + co.customerPriceTarget, 0),
    };
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

export const SAMPLE_CHANGE_ORDERS: ChangeOrder[] = [
    {
        id: 'co-001',
        projectId: 'proj-002', // Fontaine
        number: 'CO-01',
        title: 'Asbestos Abatement in Kitchen Wall',
        description: 'Discovered asbestos tape on old plumbing vent stack during demo. Requires licensed abatement sub to remove before rough-in can continue.',
        reason: 'Unforeseen Conditions',
        status: 'Customer Approved',
        createdDate: '2025-02-05',
        approvedDate: '2025-02-06',
        customerPriceTarget: 1200,
        internalCostImpact: 800,
        customerApproved: true,
        internalApproved: true
    },
    {
        id: 'co-002',
        projectId: 'proj-002', // Fontaine
        number: 'CO-02',
        title: 'Add Pot Filler at Range',
        description: 'Client requested pot filler added above the 48" range. Requires routing water line through exterior wall and additional fixture allowance.',
        reason: 'Client Request',
        status: 'Internal Approved',
        createdDate: '2025-02-12',
        approvedDate: '2025-02-14',
        customerPriceTarget: 1500,
        internalCostImpact: 1000,
        customerApproved: true,
        internalApproved: true
    },
    {
        id: 'co-003',
        projectId: 'proj-003', // Okonkwo
        number: 'CO-01',
        title: 'Upgrade to 7" Wide Plank',
        description: 'Client asking about upgrading from 5" engineered to 7" engineered oak.',
        reason: 'Client Request',
        status: 'Pending',
        createdDate: '2025-02-25',
        customerPriceTarget: 4800,
        internalCostImpact: 3900,
        customerApproved: false,
        internalApproved: false
    }
];

export const SAMPLE_PAYOUTS: PayoutRequest[] = [
    {
        id: 'pay-001',
        projectId: 'proj-001', // Whitmore
        subcontractorId: 'sub-001', // Apex
        assignmentId: 'asg-001',
        invoiceNumber: 'INV-4412',
        status: 'Paid',
        submittedDate: '2025-01-26',
        requestedAmount: 5820,
        approvedAmount: 5820,
        retainageHeld: 0,
        priorPaymentsOnAssignment: 0,
        committedAssignmentAmount: 5500, // Small overage approved
        notes: 'Final exterior crew payout.',
        paymentMethod: 'ACH',
        paymentReference: 'ACH-991244',
        paymentDate: '2025-01-28'
    },
    {
        id: 'pay-002',
        projectId: 'proj-002', // Fontaine
        subcontractorId: 'sub-003', // Ironclad
        assignmentId: 'asg-002',
        invoiceNumber: 'IC-2250',
        status: 'Paid',
        submittedDate: '2025-02-08',
        requestedAmount: 6800,
        approvedAmount: 6800,
        retainageHeld: 0,
        priorPaymentsOnAssignment: 0,
        committedAssignmentAmount: 6400,
        notes: 'Demo complete. Includes $400 for extra dumpster pull.',
        paymentMethod: 'Check',
        paymentReference: 'CHK-1002',
        paymentDate: '2025-02-10'
    },
    {
        id: 'pay-003',
        projectId: 'proj-002', // Fontaine
        subcontractorId: 'sub-006', // Heritage
        assignmentId: 'asg-003',
        invoiceNumber: 'DEP-900',
        status: 'Approved', // Approved but not paid
        submittedDate: '2025-02-28',
        requestedAmount: 16000, // 50% deposit
        approvedAmount: 16000,
        retainageHeld: 0,
        priorPaymentsOnAssignment: 0,
        committedAssignmentAmount: 32000,
        notes: '50% deposit for cabinetry per terms.',
    },
    {
        id: 'pay-004',
        projectId: 'proj-003', // Okonkwo
        subcontractorId: 'sub-001', // Apex
        assignmentId: 'asg-004',
        invoiceNumber: 'INV-4501',
        status: 'Under Review', // Progress bill
        submittedDate: '2025-03-01',
        requestedAmount: 5880, // 50% of install
        approvedAmount: 0,
        retainageHeld: 588, // 10%
        priorPaymentsOnAssignment: 0,
        committedAssignmentAmount: 11760,
        notes: 'Progress bill for flooring. Holding 10% retainage.',
    }
];

export const SAMPLE_EXPENSES: Expense[] = [
    { id: 'exp-001', projectId: 'proj-002', phaseId: 'ph-002-1', vendor: 'Home Depot', description: 'Trash bags, visqueen liner, tape', category: 'Materials', amount: 145.20, date: '2025-02-04', dateIncurred: '2025-02-04', status: 'Paid', notes: 'Demo supplies', reimbursable: false, isReimbursable: false, paymentMethod: 'Company Card', referenceNumber: 'HD-9912' },
    { id: 'exp-002', projectId: 'proj-002', phaseId: 'ph-002-2', vendor: 'Ferguson', description: 'Rough-in valves (pot filler + shower body sprays)', category: 'Materials', amount: 852.00, date: '2025-02-11', dateIncurred: '2025-02-11', status: 'Paid', notes: 'Plumbing rough-in', reimbursable: false, isReimbursable: false, paymentMethod: 'Company Card', referenceNumber: 'FRG-2250' },
    { id: 'exp-003', projectId: 'proj-003', vendor: 'City of Atlanta', description: 'Expedited flooring permit fee', category: 'Permits', amount: 250.00, date: '2025-02-14', dateIncurred: '2025-02-14', status: 'Paid', notes: 'Expedited permit', reimbursable: true, isReimbursable: true, paymentMethod: 'Check', referenceNumber: 'ATL-PERMIT-0312' },
    { id: 'exp-004', projectId: 'proj-002', vendor: 'Sunbelt Rentals', description: '2-day floor scraper rental', category: 'Equipment', amount: 420.00, date: '2025-02-03', dateIncurred: '2025-02-03', status: 'Paid', notes: 'Demo equipment', reimbursable: false, isReimbursable: false, paymentMethod: 'Company Card' },
    { id: 'exp-005', projectId: 'proj-003', vendor: 'MasterShield Adhesives', description: 'Moisture barrier and adhesive for engineered flooring', category: 'Materials', amount: 680.00, date: '2025-02-28', dateIncurred: '2025-02-28', status: 'Pending', notes: 'Flooring prep materials', reimbursable: false, isReimbursable: false, paymentMethod: 'Pending' }
];

export const SAMPLE_ACTIVITY: ActivityLogEntry[] = [
    { id: 'act-001', projectId: 'proj-002', userId: 'u1', userName: 'Mark', action: 'Created Project', details: 'Converted from estimate est-002', timestamp: '2025-01-28T09:00:00Z' },
    { id: 'act-002', projectId: 'proj-002', userId: 'u1', userName: 'Mark', action: 'Assigned Subcontractor', details: 'Assigned Ironclad Demo to Demo Phase', timestamp: '2025-01-28T10:15:00Z' },
    { id: 'act-003', projectId: 'proj-002', userId: 'u1', userName: 'Mark', action: 'Change Order Created', details: 'CO-01: Asbestos Abatement', timestamp: '2025-02-05T14:22:00Z' },
    { id: 'act-004', projectId: 'proj-002', userId: 'u1', userName: 'Mark', action: 'Approved Payout', details: 'Approved $6,800 for Ironclad Demo', timestamp: '2025-02-09T11:05:00Z' }
];

/** Alias — some pages import SAMPLE_ACTIVITY_LOGS, others import SAMPLE_ACTIVITY */
export const SAMPLE_ACTIVITY_LOGS = SAMPLE_ACTIVITY;
