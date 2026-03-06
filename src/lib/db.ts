import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export async function initDB() {
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
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
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
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
}
