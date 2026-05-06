import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

/**
 * Idempotent schema initializer. Safe to call from any API route on entry.
 * Every table is CREATE TABLE IF NOT EXISTS so production data is never touched.
 *
 * Schema covers the full Bridgepointe back-office CRM:
 *   - estimates, invoices         (financial documents)
 *   - subcontractors              (trade partners)
 *   - subcontractor_assignments   (subs assigned to projects/phases)
 *   - subcontractor_notes         (timeline / communication log)
 *   - employees                   (in-house team)
 *   - employee_time_entries       (timesheets)
 *   - employee_documents          (W-4, I-9, certs, drug test, etc.)
 *   - projects, project_phases    (job tracking + scheduling)
 *   - project_change_orders       (scope/price additions after estimate signed)
 *   - project_bills               (subcontractor invoices billed to project)
 *   - project_files               (uploaded documents — references object storage)
 *   - expenses                    (general operating + project-attributable)
 *   - activity_log                (audit trail across all entities)
 */
export async function initDB() {
    // ─── Estimates ──────────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS estimates (
            id TEXT PRIMARY KEY,
            estimate_number TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Draft',
            created_date TEXT NOT NULL,
            sent_date TEXT,
            valid_until TEXT NOT NULL,
            client JSONB NOT NULL DEFAULT '{}',
            project JSONB NOT NULL DEFAULT '{}',
            line_items JSONB NOT NULL DEFAULT '[]',
            subtotal NUMERIC NOT NULL DEFAULT 0,
            tax_rate NUMERIC NOT NULL DEFAULT 0,
            tax_amount NUMERIC NOT NULL DEFAULT 0,
            total NUMERIC NOT NULL DEFAULT 0,
            payment_schedule JSONB NOT NULL DEFAULT '[]',
            terms JSONB NOT NULL DEFAULT '[]',
            notes TEXT DEFAULT '',
            prepared_by TEXT DEFAULT 'Bridgepointe',
            project_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    // ─── Invoices ───────────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            invoice_number TEXT NOT NULL,
            estimate_ref TEXT,
            status TEXT NOT NULL DEFAULT 'Outstanding',
            issued_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            paid_date TEXT,
            client JSONB NOT NULL DEFAULT '{}',
            project JSONB NOT NULL DEFAULT '{}',
            line_items JSONB NOT NULL DEFAULT '[]',
            subtotal NUMERIC NOT NULL DEFAULT 0,
            tax_rate NUMERIC NOT NULL DEFAULT 0,
            tax_amount NUMERIC NOT NULL DEFAULT 0,
            total NUMERIC NOT NULL DEFAULT 0,
            amount_paid NUMERIC NOT NULL DEFAULT 0,
            amount_due NUMERIC NOT NULL DEFAULT 0,
            payment_instructions JSONB NOT NULL DEFAULT '{}',
            notes TEXT DEFAULT '',
            project_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    // ─── Subcontractors ─────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS subcontractors (
            id TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            contact_person TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            address TEXT DEFAULT '',
            trades JSONB NOT NULL DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'Active',
            rating NUMERIC NOT NULL DEFAULT 4.0,
            tags JSONB NOT NULL DEFAULT '[]',
            payment_terms TEXT DEFAULT 'Net 30',
            default_rate TEXT,
            notes TEXT DEFAULT '',
            insurance_expiry TEXT,
            documents JSONB NOT NULL DEFAULT '[]',
            metrics JSONB NOT NULL DEFAULT '{"averageRating":4.0,"totalJobsCompleted":0,"reliabilityScore":100}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_subs_status ON subcontractors(status)`;

    // ─── Subcontractor Assignments (sub × project × phase) ──────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS subcontractor_assignments (
            id TEXT PRIMARY KEY,
            subcontractor_id TEXT NOT NULL,
            project_id TEXT,
            phase_id TEXT,
            scope_of_work TEXT NOT NULL DEFAULT '',
            assignment_status TEXT NOT NULL DEFAULT 'Assigned',
            agreed_amount NUMERIC NOT NULL DEFAULT 0,
            billed_amount NUMERIC NOT NULL DEFAULT 0,
            approved_amount NUMERIC NOT NULL DEFAULT 0,
            paid_amount NUMERIC NOT NULL DEFAULT 0,
            start_date TEXT,
            end_date TEXT,
            completion_pct NUMERIC NOT NULL DEFAULT 0,
            rating NUMERIC,
            notes TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_subassign_sub ON subcontractor_assignments(subcontractor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subassign_project ON subcontractor_assignments(project_id)`;

    // ─── Subcontractor Notes (timeline) ─────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS subcontractor_notes (
            id TEXT PRIMARY KEY,
            subcontractor_id TEXT NOT NULL,
            author TEXT DEFAULT 'Bridgepointe',
            note TEXT NOT NULL,
            tag TEXT,
            project_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_subnotes_sub ON subcontractor_notes(subcontractor_id)`;

    // ─── Employees ──────────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS employees (
            id TEXT PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'Crew',
            employment_type TEXT NOT NULL DEFAULT 'Full-time',
            status TEXT NOT NULL DEFAULT 'Active',
            hire_date TEXT,
            termination_date TEXT,
            hourly_rate NUMERIC NOT NULL DEFAULT 0,
            overtime_rate NUMERIC,
            salary NUMERIC,
            address TEXT DEFAULT '',
            emergency_contact JSONB DEFAULT '{}',
            certifications JSONB DEFAULT '[]',
            skills JSONB DEFAULT '[]',
            notes TEXT DEFAULT '',
            avatar_url TEXT,
            metrics JSONB NOT NULL DEFAULT '{"hoursThisWeek":0,"hoursYTD":0,"jobsCompleted":0,"avgRating":5.0}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)`;

    // ─── Employee Time Entries ──────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS employee_time_entries (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            project_id TEXT,
            phase_id TEXT,
            date TEXT NOT NULL,
            clock_in TEXT,
            clock_out TEXT,
            hours_regular NUMERIC NOT NULL DEFAULT 0,
            hours_overtime NUMERIC NOT NULL DEFAULT 0,
            cost_amount NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Pending',
            notes TEXT DEFAULT '',
            approved_by TEXT,
            approved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_time_employee ON employee_time_entries(employee_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_time_project ON employee_time_entries(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_time_date ON employee_time_entries(date)`;

    // ─── Employee Documents ─────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS employee_documents (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            doc_type TEXT NOT NULL,
            filename TEXT NOT NULL,
            url TEXT,
            uploaded_date TEXT NOT NULL,
            expiry_date TEXT,
            verified BOOLEAN NOT NULL DEFAULT false,
            notes TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_empdocs_employee ON employee_documents(employee_id)`;

    // ─── Projects ───────────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            project_number TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Planning',
            client_name TEXT NOT NULL DEFAULT '',
            client_email TEXT DEFAULT '',
            client_phone TEXT DEFAULT '',
            address TEXT DEFAULT '',
            city TEXT DEFAULT '',
            state TEXT DEFAULT '',
            zip TEXT DEFAULT '',
            description TEXT DEFAULT '',
            start_date TEXT,
            end_date TEXT,
            estimate_id TEXT,
            estimate_number TEXT,
            estimated_revenue NUMERIC NOT NULL DEFAULT 0,
            estimated_cost NUMERIC NOT NULL DEFAULT 0,
            actual_cost NUMERIC NOT NULL DEFAULT 0,
            actual_revenue NUMERIC NOT NULL DEFAULT 0,
            invoiced_amount NUMERIC NOT NULL DEFAULT 0,
            collected_amount NUMERIC NOT NULL DEFAULT 0,
            project_manager TEXT DEFAULT '',
            tags JSONB NOT NULL DEFAULT '[]',
            metadata JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`;

    // ─── Project Phases ─────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS project_phases (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Not Started',
            phase_order INTEGER NOT NULL DEFAULT 0,
            estimated_budget NUMERIC NOT NULL DEFAULT 0,
            actual_cost NUMERIC NOT NULL DEFAULT 0,
            completion_pct NUMERIC NOT NULL DEFAULT 0,
            start_date TEXT,
            end_date TEXT,
            actual_start_date TEXT,
            actual_end_date TEXT,
            assigned_sub_ids JSONB NOT NULL DEFAULT '[]',
            notes TEXT DEFAULT '',
            dependencies JSONB NOT NULL DEFAULT '[]',
            issues JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_phases_project ON project_phases(project_id)`;

    // ─── Project Change Orders ──────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS project_change_orders (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            change_number TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Draft',
            amount NUMERIC NOT NULL DEFAULT 0,
            cost_impact NUMERIC NOT NULL DEFAULT 0,
            time_impact_days INTEGER NOT NULL DEFAULT 0,
            requested_date TEXT,
            approved_date TEXT,
            requested_by TEXT,
            approved_by TEXT,
            line_items JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_co_project ON project_change_orders(project_id)`;

    // ─── Project Bills (subcontractor invoices to the project) ──────────────
    await sql`
        CREATE TABLE IF NOT EXISTS project_bills (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            phase_id TEXT,
            subcontractor_id TEXT,
            assignment_id TEXT,
            bill_number TEXT,
            amount NUMERIC NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Pending',
            received_date TEXT,
            due_date TEXT,
            paid_date TEXT,
            description TEXT DEFAULT '',
            file_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_project ON project_bills(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_sub ON project_bills(subcontractor_id)`;

    // ─── Project Files ──────────────────────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS project_files (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT,
            url TEXT NOT NULL,
            size_bytes BIGINT,
            category TEXT DEFAULT 'General',
            uploaded_by TEXT,
            description TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_files_project ON project_files(project_id)`;

    // ─── Expenses (general or project-attributable) ─────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            phase_id TEXT,
            employee_id TEXT,
            category TEXT NOT NULL DEFAULT 'Materials',
            vendor TEXT DEFAULT '',
            description TEXT DEFAULT '',
            amount NUMERIC NOT NULL DEFAULT 0,
            date TEXT NOT NULL,
            payment_method TEXT,
            receipt_url TEXT,
            reimbursable BOOLEAN NOT NULL DEFAULT false,
            reimbursed BOOLEAN NOT NULL DEFAULT false,
            tax_deductible BOOLEAN NOT NULL DEFAULT true,
            notes TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`;

    // ─── Activity Log (audit trail across all entities) ─────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS activity_log (
            id TEXT PRIMARY KEY,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            actor TEXT DEFAULT 'system',
            description TEXT DEFAULT '',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC)`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a prefixed ID like "sub-1714234234234-x4f9a". */
export function genId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Append a row to activity_log. Fire-and-forget on failure. */
export async function logActivity(
    entityType: string,
    entityId: string,
    action: string,
    description = '',
    actor = 'admin',
    metadata: Record<string, unknown> = {}
): Promise<void> {
    try {
        await sql`
            INSERT INTO activity_log (id, entity_type, entity_id, action, actor, description, metadata)
            VALUES (
                ${genId('act')},
                ${entityType},
                ${entityId},
                ${action},
                ${actor},
                ${description},
                ${JSON.stringify(metadata)}::jsonb
            )
        `;
    } catch {
        // best-effort logging; never throw on audit failures
    }
}
