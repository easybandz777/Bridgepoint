/**
 * Employees domain — types, helpers, and seed data.
 *
 * Schema lives in src/lib/db.ts. This file only describes the application
 * shape and provides helpers + sample data. We never modify db.ts.
 */

// ─── Roles & enums ──────────────────────────────────────────────────────────

export type EmployeeRole =
    | 'Lead Painter / Crew Foreman'
    | 'Painter'
    | 'Apprentice Painter'
    | 'Trim Carpenter'
    | 'Cabinet Specialist'
    | 'Estimator / Project Coordinator'
    | 'Office Manager / Bookkeeper'
    | 'Pressure Washing Technician'
    | 'Project Manager'
    | 'Crew';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Seasonal';
export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated' | 'Inactive';
export type TimeEntryStatus = 'Pending' | 'Approved' | 'Rejected';

export type EmployeeDocType =
    | 'W-4'
    | 'I-9'
    | 'Direct Deposit'
    | 'Background Check'
    | 'Drug Test'
    | 'OSHA-10'
    | 'OSHA-30'
    | 'Lead-Safe'
    | 'EPA'
    | 'License'
    | 'Other';

export const EMPLOYEE_ROLES: EmployeeRole[] = [
    'Lead Painter / Crew Foreman',
    'Painter',
    'Apprentice Painter',
    'Trim Carpenter',
    'Cabinet Specialist',
    'Estimator / Project Coordinator',
    'Office Manager / Bookkeeper',
    'Pressure Washing Technician',
    'Project Manager',
    'Crew',
];

export const EMPLOYEE_DOC_TYPES: EmployeeDocType[] = [
    'W-4',
    'I-9',
    'Direct Deposit',
    'Background Check',
    'Drug Test',
    'OSHA-10',
    'OSHA-30',
    'Lead-Safe',
    'EPA',
    'License',
    'Other',
];

// ─── Domain types ───────────────────────────────────────────────────────────

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

export interface EmployeeMetrics {
    hoursThisWeek: number;
    hoursYTD: number;
    jobsCompleted: number;
    avgRating: number;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    role: EmployeeRole | string;
    employmentType: EmploymentType;
    status: EmployeeStatus;
    hireDate: string | null;
    terminationDate: string | null;
    hourlyRate: number;
    overtimeRate: number | null;
    salary: number | null;
    address: string;
    emergencyContact: EmergencyContact | Record<string, unknown>;
    certifications: string[];
    skills: string[];
    notes: string;
    avatarUrl: string | null;
    metrics: EmployeeMetrics;
    createdAt?: string;
    updatedAt?: string;
}

export interface TimeEntry {
    id: string;
    employeeId: string;
    projectId: string | null;
    phaseId: string | null;
    date: string; // YYYY-MM-DD
    clockIn: string | null;
    clockOut: string | null;
    hoursRegular: number;
    hoursOvertime: number;
    costAmount: number;
    status: TimeEntryStatus;
    notes: string;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt?: string;
}

export interface EmployeeDocument {
    id: string;
    employeeId: string;
    docType: EmployeeDocType | string;
    filename: string;
    url: string | null;
    uploadedDate: string;
    expiryDate: string | null;
    verified: boolean;
    notes: string;
    createdAt?: string;
}

// ─── Row mappers (Postgres snake_case → camelCase) ──────────────────────────
// Small `as any`s are confined here on purpose — Neon returns Record<string, unknown>.

/* eslint-disable @typescript-eslint/no-explicit-any */

export function rowToEmployee(r: any): Employee {
    const metrics = r.metrics ?? {};
    return {
        id: String(r.id),
        firstName: String(r.first_name ?? ''),
        lastName: String(r.last_name ?? ''),
        email: r.email ?? null,
        phone: r.phone ?? null,
        role: String(r.role ?? 'Crew'),
        employmentType: (r.employment_type ?? 'Full-time') as EmploymentType,
        status: (r.status ?? 'Active') as EmployeeStatus,
        hireDate: r.hire_date ?? null,
        terminationDate: r.termination_date ?? null,
        hourlyRate: Number(r.hourly_rate ?? 0),
        overtimeRate: r.overtime_rate != null ? Number(r.overtime_rate) : null,
        salary: r.salary != null ? Number(r.salary) : null,
        address: String(r.address ?? ''),
        emergencyContact: r.emergency_contact ?? {},
        certifications: Array.isArray(r.certifications) ? r.certifications : [],
        skills: Array.isArray(r.skills) ? r.skills : [],
        notes: String(r.notes ?? ''),
        avatarUrl: r.avatar_url ?? null,
        metrics: {
            hoursThisWeek: Number(metrics.hoursThisWeek ?? 0),
            hoursYTD: Number(metrics.hoursYTD ?? 0),
            jobsCompleted: Number(metrics.jobsCompleted ?? 0),
            avgRating: Number(metrics.avgRating ?? 5.0),
        },
        createdAt: r.created_at ? String(r.created_at) : undefined,
        updatedAt: r.updated_at ? String(r.updated_at) : undefined,
    };
}

export function rowToTimeEntry(r: any): TimeEntry {
    return {
        id: String(r.id),
        employeeId: String(r.employee_id),
        projectId: r.project_id ?? null,
        phaseId: r.phase_id ?? null,
        date: String(r.date),
        clockIn: r.clock_in ?? null,
        clockOut: r.clock_out ?? null,
        hoursRegular: Number(r.hours_regular ?? 0),
        hoursOvertime: Number(r.hours_overtime ?? 0),
        costAmount: Number(r.cost_amount ?? 0),
        status: (r.status ?? 'Pending') as TimeEntryStatus,
        notes: String(r.notes ?? ''),
        approvedBy: r.approved_by ?? null,
        approvedAt: r.approved_at ? String(r.approved_at) : null,
        createdAt: r.created_at ? String(r.created_at) : undefined,
    };
}

export function rowToDocument(r: any): EmployeeDocument {
    return {
        id: String(r.id),
        employeeId: String(r.employee_id),
        docType: String(r.doc_type),
        filename: String(r.filename),
        url: r.url ?? null,
        uploadedDate: String(r.uploaded_date),
        expiryDate: r.expiry_date ?? null,
        verified: Boolean(r.verified),
        notes: String(r.notes ?? ''),
        createdAt: r.created_at ? String(r.created_at) : undefined,
    };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Compute helpers ────────────────────────────────────────────────────────

export interface WeekTotal {
    regular: number;
    overtime: number;
    total: number;
    gross: number;
}

/**
 * Compute the regular/overtime/total hours and gross pay for a list of
 * entries. Pass the employee's hourly rate; overtime is paid at
 * `overtimeRate` if provided, else 1.5× hourlyRate.
 */
export function computeWeekTotal(
    entries: Pick<TimeEntry, 'hoursRegular' | 'hoursOvertime'>[],
    hourlyRate: number,
    overtimeRate?: number | null,
): WeekTotal {
    const regular = entries.reduce((s, e) => s + (Number(e.hoursRegular) || 0), 0);
    const overtime = entries.reduce((s, e) => s + (Number(e.hoursOvertime) || 0), 0);
    const otRate = overtimeRate ?? hourlyRate * 1.5;
    const gross = regular * hourlyRate + overtime * otRate;
    return {
        regular: round1(regular),
        overtime: round1(overtime),
        total: round1(regular + overtime),
        gross: Math.round(gross * 100) / 100,
    };
}

export function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

export function fmtHours(h: number): string {
    return `${round1(h).toFixed(1)}h`;
}

export function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n || 0);
}

export function fmtMoneyCents(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n || 0);
}

export function fullName(e: Pick<Employee, 'firstName' | 'lastName'>): string {
    return `${e.firstName} ${e.lastName}`.trim();
}

// ─── Date helpers (week navigator) ──────────────────────────────────────────

/** Given a Date, return Monday of that week as YYYY-MM-DD. */
export function mondayOf(date: Date): string {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return ymd(d);
}

export function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function addDays(date: string, days: number): string {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return ymd(d);
}

/** Return the 7 YYYY-MM-DD dates Mon..Sun starting from `mondayYmd`. */
export function weekDates(mondayYmd: string): string[] {
    return Array.from({ length: 7 }, (_, i) => addDays(mondayYmd, i));
}

export function dayLabel(ymdStr: string): string {
    const d = new Date(ymdStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function shortDate(ymdStr: string): string {
    const d = new Date(ymdStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sample employees ───────────────────────────────────────────────────────

export interface SeedEmployee {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    employmentType: EmploymentType;
    status: EmployeeStatus;
    hireDate: string;
    hourlyRate: number;
    overtimeRate?: number;
    salary?: number;
    address: string;
    emergencyContact: EmergencyContact;
    certifications: string[];
    skills: string[];
    notes: string;
}

export const SAMPLE_EMPLOYEES: SeedEmployee[] = [
    {
        firstName: 'Marcus',
        lastName: 'Holloway',
        email: 'marcus.holloway@bridgepointe.dev',
        phone: '(404) 555-0181',
        role: 'Lead Painter / Crew Foreman',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2018-04-12',
        hourlyRate: 32,
        overtimeRate: 48,
        address: '1842 Briarcliff Rd NE, Atlanta, GA 30306',
        emergencyContact: { name: 'Tasha Holloway', relationship: 'Spouse', phone: '(404) 555-0148' },
        certifications: ['OSHA-30', 'Lead-Safe Renovator (EPA)', 'First Aid / CPR'],
        skills: ['Crew leadership', 'Spray finishing', 'Color matching', 'Customer relations'],
        notes: 'Crew lead since 2020. Runs the Buckhead and Brookhaven jobs.',
    },
    {
        firstName: 'Diego',
        lastName: 'Ramirez',
        email: 'diego.ramirez@bridgepointe.dev',
        phone: '(770) 555-0204',
        role: 'Painter',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2020-09-21',
        hourlyRate: 26,
        overtimeRate: 39,
        address: '512 Glenwood Ave SE, Atlanta, GA 30312',
        emergencyContact: { name: 'Maria Ramirez', relationship: 'Mother', phone: '(770) 555-0192' },
        certifications: ['OSHA-10', 'Lead-Safe Renovator (EPA)'],
        skills: ['Cutting in', 'Cabinet refinishing', 'Spray + brush'],
        notes: '',
    },
    {
        firstName: 'Aisha',
        lastName: 'Bennett',
        email: 'aisha.bennett@bridgepointe.dev',
        phone: '(678) 555-0119',
        role: 'Painter',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2021-06-14',
        hourlyRate: 25,
        overtimeRate: 37.5,
        address: '74 Oakland Ave SE, Atlanta, GA 30312',
        emergencyContact: { name: 'Renee Bennett', relationship: 'Sister', phone: '(678) 555-0146' },
        certifications: ['OSHA-10'],
        skills: ['Detail trim', 'Wallpaper removal', 'Faux finishes'],
        notes: 'Strong eye for color matching on whole-home repaints.',
    },
    {
        firstName: 'Tyler',
        lastName: 'Whitfield',
        email: 'tyler.whitfield@bridgepointe.dev',
        phone: '(404) 555-0255',
        role: 'Painter',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2022-03-07',
        hourlyRate: 24,
        overtimeRate: 36,
        address: '301 Argonne Ave NE, Atlanta, GA 30308',
        emergencyContact: { name: 'Rachel Whitfield', relationship: 'Spouse', phone: '(404) 555-0298' },
        certifications: ['OSHA-10', 'Lead-Safe Renovator (EPA)'],
        skills: ['Exterior repaints', 'Pressure prep', 'Caulking'],
        notes: '',
    },
    {
        firstName: 'Brenda',
        lastName: 'Moss',
        email: 'brenda.moss@bridgepointe.dev',
        phone: '(404) 555-0327',
        role: 'Office Manager / Bookkeeper',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2019-01-28',
        hourlyRate: 0, // salaried
        salary: 58000,
        address: '2105 Peachtree Rd NE, Atlanta, GA 30309',
        emergencyContact: { name: 'Larry Moss', relationship: 'Spouse', phone: '(404) 555-0301' },
        certifications: ['QuickBooks ProAdvisor'],
        skills: ['Bookkeeping', 'Invoicing', 'Payroll', 'Scheduling'],
        notes: 'Salaried at $58k. Handles payroll and accounts receivable.',
    },
    {
        firstName: 'Jamal',
        lastName: 'Carter',
        email: 'jamal.carter@bridgepointe.dev',
        phone: '(770) 555-0413',
        role: 'Trim Carpenter',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2019-08-19',
        hourlyRate: 31,
        overtimeRate: 46.5,
        address: '901 Highland Ave NE, Atlanta, GA 30306',
        emergencyContact: { name: 'Lena Carter', relationship: 'Spouse', phone: '(770) 555-0431' },
        certifications: ['OSHA-30', 'NWFA Sand & Finish'],
        skills: ['Crown moulding', 'Wainscoting', 'Built-ins', 'Door hanging'],
        notes: '',
    },
    {
        firstName: 'Sienna',
        lastName: 'Park',
        email: 'sienna.park@bridgepointe.dev',
        phone: '(404) 555-0577',
        role: 'Cabinet Specialist',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2023-02-06',
        hourlyRate: 29,
        overtimeRate: 43.5,
        address: '630 Boulevard NE, Atlanta, GA 30308',
        emergencyContact: { name: 'Min-Jun Park', relationship: 'Father', phone: '(404) 555-0584' },
        certifications: ['Sherwin-Williams Cabinet Coatings'],
        skills: ['Cabinet refinishing', 'Spray booth ops', 'Color matching'],
        notes: 'Runs the cabinet program out of the Smyrna shop.',
    },
    {
        firstName: 'Patrick',
        lastName: 'Doyle',
        email: 'patrick.doyle@bridgepointe.dev',
        phone: '(678) 555-0612',
        role: 'Estimator / Project Coordinator',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2020-11-02',
        hourlyRate: 0,
        salary: 72000,
        address: '1422 Lavista Rd NE, Atlanta, GA 30329',
        emergencyContact: { name: 'Caitlin Doyle', relationship: 'Spouse', phone: '(678) 555-0608' },
        certifications: ['PCA Estimator (PaintingContractors.org)'],
        skills: ['Estimating', 'Site walks', 'Client comms', 'Scope writing'],
        notes: 'Salaried at $72k. Owns intake and estimate prep.',
    },
    {
        firstName: 'Mateo',
        lastName: 'Vega',
        email: 'mateo.vega@bridgepointe.dev',
        phone: '(404) 555-0741',
        role: 'Pressure Washing Technician',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2026-03-30',
        hourlyRate: 22,
        overtimeRate: 33,
        address: '208 East Lake Dr SE, Atlanta, GA 30317',
        emergencyContact: { name: 'Lucia Vega', relationship: 'Spouse', phone: '(404) 555-0790' },
        certifications: ['OSHA-10'],
        skills: ['Soft wash', 'Surface cleaning', 'Equipment maintenance'],
        notes: 'Just hired with the launch of the pressure-washing service.',
    },
    {
        firstName: 'Owen',
        lastName: 'Sutherland',
        email: 'owen.sutherland@bridgepointe.dev',
        phone: '(770) 555-0855',
        role: 'Apprentice Painter',
        employmentType: 'Full-time',
        status: 'Active',
        hireDate: '2025-08-04',
        hourlyRate: 17,
        overtimeRate: 25.5,
        address: '1120 Dekalb Ave NE, Atlanta, GA 30307',
        emergencyContact: { name: 'Helen Sutherland', relationship: 'Mother', phone: '(770) 555-0863' },
        certifications: ['OSHA-10'],
        skills: ['Prep work', 'Masking', 'Material handling'],
        notes: 'Apprenticing under Marcus Holloway.',
    },
];
