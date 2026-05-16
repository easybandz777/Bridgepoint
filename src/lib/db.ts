import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/**
 * Lazy singleton wrapper around `neon()`. The Neon SDK throws if
 * DATABASE_URL is missing the moment `neon()` is called, which would
 * crash module load (and therefore the production build's page-data
 * collection) on any environment that doesn't have the env var set.
 *
 * By deferring the call until the first SQL invocation, builds run
 * cleanly even without a DB connection string while runtime requests
 * still get a clear error if the env var is genuinely missing.
 */
let _client: NeonQueryFunction<false, false> | null = null;
function getClient(): NeonQueryFunction<false, false> {
    if (_client) return _client;
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error('DATABASE_URL is not set');
    }
    _client = neon(url);
    return _client;
}

// Tagged-template proxy that defers client creation until invocation.
// Forwards both call signatures Neon supports: tag(strings, ...values)
// and the unsafe(query, params?) form returned via `.query`.
const sql = ((strings: TemplateStringsArray, ...values: unknown[]) => {
    return getClient()(strings, ...values);
}) as NeonQueryFunction<false, false>;

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

    // ─── Portal Credentials (login for employees + subcontractors) ──────────
    // user_type ∈ {'employee','subcontractor'}; user_id references the
    // appropriate row in employees(id) or subcontractors(id). PIN is stored
    // as a salted SHA-256 hex digest. We never store plaintext.
    await sql`
        CREATE TABLE IF NOT EXISTS portal_credentials (
            id TEXT PRIMARY KEY,
            user_type TEXT NOT NULL,
            user_id TEXT NOT NULL,
            email_lower TEXT NOT NULL,
            pin_hash TEXT NOT NULL,
            pin_salt TEXT NOT NULL,
            enabled BOOLEAN NOT NULL DEFAULT true,
            must_change_pin BOOLEAN NOT NULL DEFAULT false,
            last_login_at TIMESTAMPTZ,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_creds_email ON portal_credentials(email_lower)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_creds_user ON portal_credentials(user_type, user_id)`;

    // ─── Portal Sessions (server-issued tokens) ─────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS portal_sessions (
            id TEXT PRIMARY KEY,
            credential_id TEXT NOT NULL,
            user_type TEXT NOT NULL,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            user_agent TEXT,
            ip_address TEXT,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_used_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON portal_sessions(token_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_portal_sessions_user ON portal_sessions(user_type, user_id)`;

    // ─── Project Photos (crew uploads, served via API) ──────────────────────
    // Stores binary directly in BYTEA so deployment is portable across Vercel
    // serverless without object storage. Caller is expected to compress
    // client-side. mime_type is the original MIME (image/jpeg, etc).
    await sql`
        CREATE TABLE IF NOT EXISTS project_photos (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            phase_id TEXT,
            uploaded_by_type TEXT NOT NULL,
            uploaded_by_id TEXT NOT NULL,
            uploaded_by_name TEXT NOT NULL DEFAULT '',
            filename TEXT NOT NULL,
            mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
            width INTEGER,
            height INTEGER,
            size_bytes INTEGER NOT NULL DEFAULT 0,
            caption TEXT NOT NULL DEFAULT '',
            tag TEXT,
            taken_at TIMESTAMPTZ,
            image_data BYTEA NOT NULL,
            thumbnail_data BYTEA,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_project ON project_photos(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_phase ON project_photos(phase_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_uploader ON project_photos(uploaded_by_type, uploaded_by_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_created ON project_photos(created_at DESC)`;

    // ─── Project Updates (crew-authored timeline entries) ───────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS project_updates (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            phase_id TEXT,
            author_type TEXT NOT NULL,
            author_id TEXT NOT NULL,
            author_name TEXT NOT NULL DEFAULT '',
            kind TEXT NOT NULL DEFAULT 'note',
            body TEXT NOT NULL,
            status_change TEXT,
            completion_pct NUMERIC,
            attachments JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_updates_project ON project_updates(project_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_updates_phase ON project_updates(phase_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_updates_created ON project_updates(created_at DESC)`;

    // ─── Crew Messages (broadcast announcements + per-user messages) ────────
    await sql`
        CREATE TABLE IF NOT EXISTS crew_messages (
            id TEXT PRIMARY KEY,
            audience TEXT NOT NULL DEFAULT 'all',
            recipient_type TEXT,
            recipient_id TEXT,
            subject TEXT NOT NULL DEFAULT '',
            body TEXT NOT NULL,
            level TEXT NOT NULL DEFAULT 'info',
            sender TEXT NOT NULL DEFAULT 'admin',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_audience ON crew_messages(audience)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_recipient ON crew_messages(recipient_type, recipient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_created ON crew_messages(created_at DESC)`;

    // ─── Message Reads (which users have seen which messages) ───────────────
    await sql`
        CREATE TABLE IF NOT EXISTS crew_message_reads (
            message_id TEXT NOT NULL,
            user_type TEXT NOT NULL,
            user_id TEXT NOT NULL,
            read_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (message_id, user_type, user_id)
        )
    `;

    // ─── Backfill: ensure pre-existing photo/document buckets exist ─────────
    // Make sure project_files and employee_documents have the columns we
    // expect — if any earlier deploy missed them, ALTER will be a no-op.
    await sql`ALTER TABLE project_files ADD COLUMN IF NOT EXISTS uploaded_by_type TEXT`;
    await sql`ALTER TABLE project_files ADD COLUMN IF NOT EXISTS uploaded_by_id TEXT`;

    // ─── QuickBooks Connection (one row per workspace) ──────────────────────
    // Stores OAuth tokens for the QB Online integration. The "realm_id" is
    // the QuickBooks company file the tokens authorize. We keep one active
    // connection at a time (admins disconnect / reconnect to switch).
    await sql`
        CREATE TABLE IF NOT EXISTS qb_connections (
            id TEXT PRIMARY KEY,
            realm_id TEXT NOT NULL,
            company_name TEXT,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            token_type TEXT DEFAULT 'Bearer',
            access_expires_at TIMESTAMPTZ NOT NULL,
            refresh_expires_at TIMESTAMPTZ NOT NULL,
            environment TEXT NOT NULL DEFAULT 'sandbox',
            scopes TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'active',
            connected_by TEXT,
            connected_at TIMESTAMPTZ DEFAULT NOW(),
            last_refreshed_at TIMESTAMPTZ,
            disconnected_at TIMESTAMPTZ,
            metadata JSONB NOT NULL DEFAULT '{}'
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_conn_status ON qb_connections(status)`;

    // ─── OAuth state tokens (CSRF for the connect flow) ─────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS qb_oauth_states (
            state TEXT PRIMARY KEY,
            actor TEXT NOT NULL DEFAULT 'admin',
            redirect_after TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_oauth_states_exp ON qb_oauth_states(expires_at)`;

    // ─── Sync log (every push, pull, refresh, error) ────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS qb_sync_log (
            id TEXT PRIMARY KEY,
            connection_id TEXT,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            qb_entity_id TEXT,
            direction TEXT NOT NULL,
            action TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'success',
            error TEXT,
            request JSONB,
            response JSONB,
            duration_ms INTEGER,
            actor TEXT DEFAULT 'admin',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_sync_log_entity ON qb_sync_log(entity_type, entity_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_sync_log_created ON qb_sync_log(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_sync_log_status ON qb_sync_log(status)`;

    // ─── Webhook events (Intuit pings us; we fan out workers) ───────────────
    await sql`
        CREATE TABLE IF NOT EXISTS qb_webhook_events (
            id TEXT PRIMARY KEY,
            realm_id TEXT NOT NULL,
            entity_name TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            last_updated TIMESTAMPTZ NOT NULL,
            payload JSONB NOT NULL,
            processed_at TIMESTAMPTZ,
            error TEXT,
            received_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_webhook_unprocessed ON qb_webhook_events(processed_at) WHERE processed_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_qb_webhook_entity ON qb_webhook_events(entity_name, entity_id)`;

    // ─── Sync columns on existing CRM entities ──────────────────────────────
    // We add `qb_id` (the QB API resource id) and `qb_sync_token` (QB requires
    // sending the latest SyncToken on update) to every entity we sync. Plus
    // `qb_synced_at` for diagnostics. ALTER ... IF NOT EXISTS is idempotent.
    await sql`ALTER TABLE estimates           ADD COLUMN IF NOT EXISTS qb_id TEXT`;
    await sql`ALTER TABLE estimates           ADD COLUMN IF NOT EXISTS qb_sync_token TEXT`;
    await sql`ALTER TABLE estimates           ADD COLUMN IF NOT EXISTS qb_synced_at TIMESTAMPTZ`;
    await sql`ALTER TABLE invoices            ADD COLUMN IF NOT EXISTS qb_id TEXT`;
    await sql`ALTER TABLE invoices            ADD COLUMN IF NOT EXISTS qb_sync_token TEXT`;
    await sql`ALTER TABLE invoices            ADD COLUMN IF NOT EXISTS qb_synced_at TIMESTAMPTZ`;
    await sql`ALTER TABLE subcontractors      ADD COLUMN IF NOT EXISTS qb_id TEXT`;
    await sql`ALTER TABLE subcontractors      ADD COLUMN IF NOT EXISTS qb_sync_token TEXT`;
    await sql`ALTER TABLE subcontractors      ADD COLUMN IF NOT EXISTS qb_synced_at TIMESTAMPTZ`;
    await sql`ALTER TABLE project_bills       ADD COLUMN IF NOT EXISTS qb_id TEXT`;
    await sql`ALTER TABLE project_bills       ADD COLUMN IF NOT EXISTS qb_sync_token TEXT`;
    await sql`ALTER TABLE project_bills       ADD COLUMN IF NOT EXISTS qb_synced_at TIMESTAMPTZ`;
    await sql`ALTER TABLE projects            ADD COLUMN IF NOT EXISTS qb_id TEXT`;
    await sql`ALTER TABLE projects            ADD COLUMN IF NOT EXISTS qb_sync_token TEXT`;
    await sql`ALTER TABLE projects            ADD COLUMN IF NOT EXISTS qb_synced_at TIMESTAMPTZ`;

    // Customers in QB are derived from invoices/estimates' clientName + email.
    // We track the resolved QB Customer id per project so we don't create
    // duplicates: every project resolves to one QB Customer.
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS qb_customer_id TEXT`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS qb_customer_id TEXT`;
    await sql`ALTER TABLE estimates ADD COLUMN IF NOT EXISTS qb_customer_id TEXT`;

    // ─── Customers (CRM-side, eventual system of record) ────────────────────
    // Mirror of QB Customer entity, but the CRM is the source of truth going
    // forward. Pulled from QB on connect; pushed back on edit.
    await sql`
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            customer_type TEXT NOT NULL DEFAULT 'Individual',
            company_name TEXT,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            mobile TEXT,
            fax TEXT,
            website TEXT,
            bill_address JSONB NOT NULL DEFAULT '{}',
            ship_address JSONB NOT NULL DEFAULT '{}',
            notes TEXT NOT NULL DEFAULT '',
            tags JSONB NOT NULL DEFAULT '[]',
            active BOOLEAN NOT NULL DEFAULT true,
            balance NUMERIC NOT NULL DEFAULT 0,
            payment_method TEXT,
            payment_terms TEXT,
            preferred_delivery_method TEXT,
            tax_exempt BOOLEAN NOT NULL DEFAULT false,
            parent_customer_id TEXT,
            is_job BOOLEAN NOT NULL DEFAULT false,
            source TEXT NOT NULL DEFAULT 'crm',
            qb_id TEXT,
            qb_sync_token TEXT,
            qb_synced_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_qb_id ON customers(qb_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(LOWER(email))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_display ON customers(display_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(active)`;

    // ─── Vendors (broader than subcontractors — anyone we pay) ──────────────
    await sql`
        CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            company_name TEXT,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            mobile TEXT,
            bill_address JSONB NOT NULL DEFAULT '{}',
            notes TEXT NOT NULL DEFAULT '',
            tags JSONB NOT NULL DEFAULT '[]',
            active BOOLEAN NOT NULL DEFAULT true,
            balance NUMERIC NOT NULL DEFAULT 0,
            is_1099 BOOLEAN NOT NULL DEFAULT false,
            tax_identifier TEXT,
            account_number TEXT,
            subcontractor_id TEXT,
            source TEXT NOT NULL DEFAULT 'qb_import',
            qb_id TEXT,
            qb_sync_token TEXT,
            qb_synced_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_vendors_qb_id ON vendors(qb_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(LOWER(email))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vendors_display ON vendors(display_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vendors_sub ON vendors(subcontractor_id)`;

    // Optional link: subcontractor → vendor row.
    await sql`ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS vendor_id TEXT`;

    // ─── Items (chart of services/products) ─────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT 'Service',
            sku TEXT,
            unit_price NUMERIC,
            purchase_cost NUMERIC,
            income_account_id TEXT,
            expense_account_id TEXT,
            active BOOLEAN NOT NULL DEFAULT true,
            taxable BOOLEAN NOT NULL DEFAULT false,
            qty_on_hand NUMERIC,
            source TEXT NOT NULL DEFAULT 'qb_import',
            qb_id TEXT,
            qb_sync_token TEXT,
            qb_synced_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_items_qb_id ON items(qb_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_items_name ON items(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_items_type ON items(type)`;

    // ─── Accounts (chart of accounts) ───────────────────────────────────────
    await sql`
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            full_name TEXT,
            account_type TEXT NOT NULL,
            account_subtype TEXT,
            classification TEXT,
            description TEXT NOT NULL DEFAULT '',
            parent_account_id TEXT,
            active BOOLEAN NOT NULL DEFAULT true,
            current_balance NUMERIC NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'USD',
            source TEXT NOT NULL DEFAULT 'qb_import',
            qb_id TEXT,
            qb_sync_token TEXT,
            qb_synced_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_qb_id ON accounts(qb_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(account_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_account_id)`;

    // ─── Customer linkage on existing CRM entities ──────────────────────────
    // Nullable, additive. Existing rows keep working with their free-form
    // client_name/client_email/client JSONB. New rows can link to a customer
    // record; the CRM picker writes both customer_id AND a denormalized
    // copy of the name/email for backwards compat.
    await sql`ALTER TABLE projects  ADD COLUMN IF NOT EXISTS customer_id TEXT`;
    await sql`ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS customer_id TEXT`;
    await sql`ALTER TABLE estimates ADD COLUMN IF NOT EXISTS customer_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_estimates_customer ON estimates(customer_id)`;

    // ─── Payments (PLANNED — Phase 3) ───────────────────────────────────────
    // Forward-looking schema stub for the CRM-side payments foundation.
    // Nothing reads or writes this table today; it ships now so future
    // iterations (Stripe Connect for cards, ACH via Financial Connections,
    // manual check entries) can build against it without an awkward
    // migration. See PAYMENTS.md for the planned architecture.
    await sql`
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            payment_number TEXT,
            direction TEXT NOT NULL DEFAULT 'incoming',  -- incoming | outgoing
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            method TEXT NOT NULL DEFAULT 'card',  -- card | ach | check | cash | other
            status TEXT NOT NULL DEFAULT 'pending',  -- pending | succeeded | failed | refunded | disputed
            customer_id TEXT,
            vendor_id TEXT,
            invoice_id TEXT,
            bill_id TEXT,
            received_date TEXT,
            deposited_date TEXT,
            processor TEXT,  -- stripe | manual | qb
            processor_charge_id TEXT,
            processor_fee NUMERIC NOT NULL DEFAULT 0,
            notes TEXT NOT NULL DEFAULT '',
            metadata JSONB NOT NULL DEFAULT '{}',
            qb_id TEXT,
            qb_sync_token TEXT,
            qb_synced_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_charge ON payments(processor_charge_id)`;

    // ─── Stripe webhook idempotency ─────────────────────────────────────────
    // Stripe will retry webhook deliveries on non-2xx response. Persist the
    // raw envelope keyed by event id so we can return 200 immediately and
    // drain on a separate cron — the same receiver/processor split as QB.
    await sql`
        CREATE TABLE IF NOT EXISTS payments_webhook_events (
            id TEXT PRIMARY KEY,                  -- Stripe event id (evt_...)
            type TEXT NOT NULL,                   -- e.g. checkout.session.completed
            livemode BOOLEAN NOT NULL DEFAULT false,
            api_version TEXT,
            payload JSONB NOT NULL,
            received_at TIMESTAMPTZ DEFAULT NOW(),
            processed_at TIMESTAMPTZ,
            process_error TEXT,
            attempts INTEGER NOT NULL DEFAULT 0
        )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_unprocessed ON payments_webhook_events(received_at) WHERE processed_at IS NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_type ON payments_webhook_events(type)`;

    // ─── Customer-level Stripe identity ─────────────────────────────────────
    // Created lazily on first Checkout session so we can save card / bank
    // details against a stable Stripe Customer across multiple invoices.
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_stripe ON customers(stripe_customer_id)`;
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
