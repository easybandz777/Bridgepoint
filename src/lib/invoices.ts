export type InvoiceStatus = 'Paid' | 'Partial' | 'Outstanding' | 'Overdue';

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    estimateRef?: string;
    status: InvoiceStatus;
    issuedDate: string;
    dueDate: string;
    paidDate?: string;
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
    };
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    paymentInstructions: {
        bankName: string;
        accountName: string;
        routing: string;
        account: string;
        zelle?: string;
        check?: string;
    };
    notes: string;
}

// ─── Sample Invoices ──────────────────────────────────────────────────────────

export const SAMPLE_INVOICES: Invoice[] = [
    {
        id: 'inv-001',
        invoiceNumber: 'BPINV-2024-0047A',
        estimateRef: 'BP-2024-0047',
        status: 'Paid',
        issuedDate: '2025-01-28',
        dueDate: '2025-02-04',
        paidDate: '2025-01-31',
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
        },
        lineItems: [
            { description: 'Interior painting — all rooms, ceilings, trim & doors (6,200 sq ft)', quantity: 1, unit: 'job', unitPrice: 36276, total: 36276 },
            { description: 'Exterior painting — siding, shutters, fascia, columns (4,100 sq ft)', quantity: 1, unit: 'job', unitPrice: 11810, total: 11810 },
            { description: 'Cabinetry spray finish — kitchen & baths', quantity: 1, unit: 'job', unitPrice: 4800, total: 4800 },
            { description: 'Premium materials — Benjamin Moore Aura series, sundries', quantity: 1, unit: 'lot', unitPrice: 7292, total: 7292 },
            { description: 'Equipment & scaffold', quantity: 1, unit: 'job', unitPrice: 980, total: 980 },
        ],
        subtotal: 61158,
        taxRate: 0,
        taxAmount: 0,
        total: 61158,
        amountPaid: 61158,
        amountDue: 0,
        paymentInstructions: {
            bankName: 'Wells Fargo Business',
            accountName: 'Bridgepoint LLC',
            routing: '121000248',
            account: '****7823',
            zelle: 'Bridgepointefloors@gmail.com',
            check: 'Pay to the order of: Bridgepoint LLC',
        },
        notes: 'Thank you for your business, Harrison & Elaine. It was a pleasure working on your home. We look forward to serving you again.',
    },
    {
        id: 'inv-002',
        invoiceNumber: 'BPINV-2024-0053A',
        estimateRef: 'BP-2024-0053',
        status: 'Partial',
        issuedDate: '2025-02-17',
        dueDate: '2025-02-24',
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
            title: 'Kitchen & Master Bath Transformation — Fontaine Estate',
            address: '2280 Tuxedo Rd NW, Atlanta, GA 30309',
        },
        lineItems: [
            { description: 'Demolition & haul-off — kitchen and master bath', quantity: 1, unit: 'job', unitPrice: 6400, total: 6400 },
            { description: 'Custom inset cabinetry — kitchen (semi-custom Shaker, painted)', quantity: 1, unit: 'job', unitPrice: 32000, total: 32000 },
            { description: 'Calacatta marble countertops — fabrication & installation (148 sq ft)', quantity: 1, unit: 'job', unitPrice: 27380, total: 27380 },
            { description: 'Herringbone tile backsplash — hand-set (92 sq ft)', quantity: 1, unit: 'job', unitPrice: 4416, total: 4416 },
            { description: 'Kitchen island — framing, finish & seating ledge', quantity: 1, unit: 'job', unitPrice: 7800, total: 7800 },
            { description: 'Licensed plumbing — kitchen re-route & fixtures', quantity: 1, unit: 'job', unitPrice: 9200, total: 9200 },
            { description: 'Licensed electrical — lighting plan & sub-panel work', quantity: 1, unit: 'job', unitPrice: 7600, total: 7600 },
            { description: 'Permits — City of Atlanta (building & plumbing)', quantity: 1, unit: 'lot', unitPrice: 2840, total: 2840 },
        ],
        subtotal: 97636,
        taxRate: 0,
        taxAmount: 0,
        total: 97636,
        amountPaid: 40699,
        amountDue: 56937,
        paymentInstructions: {
            bankName: 'Wells Fargo Business',
            accountName: 'Bridgepoint LLC',
            routing: '121000248',
            account: '****7823',
            zelle: 'Bridgepointefloors@gmail.com',
            check: 'Pay to the order of: Bridgepoint LLC',
        },
        notes: 'Progress Invoice #1 of 3 — reflects completed Phase 1 (demo) and Phase 2 (kitchen cabinetry, countertops, rough-in). Phase 3 (master bath) to be invoiced separately upon completion. Deposit of $40,699 received 02/03/2025.',
    },
    {
        id: 'inv-003',
        invoiceNumber: 'BPINV-2025-0002A',
        estimateRef: 'BP-2025-0002',
        status: 'Outstanding',
        issuedDate: '2025-02-28',
        dueDate: '2025-03-07',
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
        },
        lineItems: [
            { description: 'Carpet & LVP removal, disposal and subfloor prep (2,800 sq ft)', quantity: 1, unit: 'job', unitPrice: 5180, total: 5180 },
            { description: '5" engineering white oak — supply & installation (2,800 sq ft)', quantity: 1, unit: 'job', unitPrice: 40712, total: 40712 },
            { description: 'Transitions, thresholds, base shoe molding', quantity: 1, unit: 'job', unitPrice: 1640, total: 1640 },
            { description: 'Final sand, buff & matte finish coat', quantity: 1, unit: 'job', unitPrice: 5040, total: 5040 },
            { description: 'Custom white oak accent feature wall — 280 sq ft with cove lighting', quantity: 1, unit: 'job', unitPrice: 11740, total: 11740 },
            { description: 'Built-in shelving unit — white oak, integrated', quantity: 1, unit: 'job', unitPrice: 3800, total: 3800 },
            { description: 'Staircase tread replacement — 14 treads, white oak matching', quantity: 1, unit: 'job', unitPrice: 4480, total: 4480 },
        ],
        subtotal: 72592,
        taxRate: 0,
        taxAmount: 0,
        total: 72592,
        amountPaid: 29037,
        amountDue: 43555,
        paymentInstructions: {
            bankName: 'Wells Fargo Business',
            accountName: 'Bridgepoint LLC',
            routing: '121000248',
            account: '****7823',
            zelle: 'Bridgepointefloors@gmail.com',
            check: 'Pay to the order of: Bridgepoint LLC',
        },
        notes: 'Final invoice reflecting project completion as of February 27th. Deposit of $29,037 was received on February 14th. Balance of $43,555 due within 7 days. Thank you for choosing Bridgepoint.',
    },
];
