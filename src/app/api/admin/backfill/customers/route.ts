import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { deriveDisplayName } from '@/lib/customers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/backfill/customers
 *
 * Backfills customer_id on all existing projects/invoices/estimates.
 *
 * Strategy:
 *   1. For each entity batch (size 100), find rows where customer_id IS NULL.
 *   2. For each row, look up an existing customer first by email
 *      (case-insensitive), then by display_name (case-insensitive).
 *   3. If no match exists, INSERT a new customer record using whatever
 *      contact data the source row carries.
 *   4. UPDATE the source row to set customer_id.
 *   5. Log activity per source row + per newly-created customer.
 *
 * Idempotent: a second run finds no NULL customer_id rows and exits cleanly.
 * Safe to interrupt: each row is independent; partial progress is preserved.
 */

interface CustomerLookupRow {
    id: string;
    display_name: string;
    email: string | null;
}

interface ProjectRow {
    id: string;
    client_name: string;
    client_email: string | null;
    client_phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
}

interface ClientBlobRow {
    id: string;
    client: unknown;
}

interface ClientBlob {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
}

const BATCH_SIZE = 100;

function asClientBlob(v: unknown): ClientBlob {
    if (!v || typeof v !== 'object') return {};
    return v as ClientBlob;
}

function normalizeEmail(s: string | null | undefined): string | null {
    const t = (s ?? '').trim().toLowerCase();
    return t.length > 0 ? t : null;
}

function normalizeName(s: string | null | undefined): string | null {
    const t = (s ?? '').trim().toLowerCase();
    return t.length > 0 ? t : null;
}

/**
 * Find an existing customer matching email (case-insensitive) first,
 * falling back to display_name (case-insensitive). Returns null when
 * no match is found.
 */
async function findCustomer(
    email: string | null,
    displayName: string | null,
): Promise<CustomerLookupRow | null> {
    if (email) {
        const byEmail = (await sql`
            SELECT id, display_name, email
            FROM customers
            WHERE LOWER(email) = ${email}
            LIMIT 1
        `) as unknown as CustomerLookupRow[];
        if (byEmail.length > 0) return byEmail[0];
    }
    if (displayName) {
        const byName = (await sql`
            SELECT id, display_name, email
            FROM customers
            WHERE LOWER(display_name) = ${displayName}
            LIMIT 1
        `) as unknown as CustomerLookupRow[];
        if (byName.length > 0) return byName[0];
    }
    return null;
}

interface CreateCustomerInput {
    displayName: string;
    email: string | null;
    phone: string | null;
    address?: {
        line1?: string;
        city?: string;
        state?: string;
        zip?: string;
    };
}

async function createCustomer(input: CreateCustomerInput): Promise<string> {
    const id = genId('cust');
    const billAddress = input.address
        ? {
              line1: input.address.line1 ?? '',
              city: input.address.city ?? '',
              state: input.address.state ?? '',
              zip: input.address.zip ?? '',
          }
        : {};
    await sql`
        INSERT INTO customers (
            id, display_name, customer_type, company_name, first_name, last_name,
            email, phone, mobile, fax, website,
            bill_address, ship_address, notes, tags,
            active, balance, payment_method, payment_terms, preferred_delivery_method,
            tax_exempt, parent_customer_id, is_job, source
        ) VALUES (
            ${id},
            ${input.displayName},
            ${'Individual'},
            ${null},
            ${null},
            ${null},
            ${input.email},
            ${input.phone},
            ${null},
            ${null},
            ${null},
            ${JSON.stringify(billAddress)}::jsonb,
            ${JSON.stringify({})}::jsonb,
            ${''},
            ${JSON.stringify([])}::jsonb,
            ${true},
            ${0},
            ${null},
            ${null},
            ${null},
            ${false},
            ${null},
            ${false},
            ${'crm'}
        )
    `;
    await logActivity(
        'customer',
        id,
        'created',
        `Created customer ${input.displayName} via backfill`,
        'system',
        { source: 'backfill' },
    );
    return id;
}

async function backfillProjects(): Promise<{ linked: number; created: number }> {
    let linked = 0;
    let created = 0;

    while (true) {
        const batch = (await sql`
            SELECT id, client_name, client_email, client_phone, address, city, state, zip
            FROM projects
            WHERE customer_id IS NULL
              AND COALESCE(client_name, '') <> ''
            ORDER BY created_at ASC
            LIMIT ${BATCH_SIZE}
        `) as unknown as ProjectRow[];

        if (batch.length === 0) break;

        for (const row of batch) {
            const email = normalizeEmail(row.client_email);
            const displayNameRaw = (row.client_name ?? '').trim();
            const displayName = normalizeName(displayNameRaw);

            if (!email && !displayName) continue;

            const existing = await findCustomer(email, displayName);
            let customerId: string;

            if (existing) {
                customerId = existing.id;
            } else {
                const finalName = deriveDisplayName({
                    displayName: displayNameRaw,
                    email: row.client_email,
                });
                customerId = await createCustomer({
                    displayName: finalName,
                    email: row.client_email && row.client_email.trim() ? row.client_email.trim() : null,
                    phone: row.client_phone && row.client_phone.trim() ? row.client_phone.trim() : null,
                    address: {
                        line1: row.address ?? '',
                        city: row.city ?? '',
                        state: row.state ?? '',
                        zip: row.zip ?? '',
                    },
                });
                created += 1;
            }

            await sql`
                UPDATE projects
                SET customer_id = ${customerId}, updated_at = NOW()
                WHERE id = ${row.id} AND customer_id IS NULL
            `;
            await logActivity(
                'project',
                row.id,
                'backfilled',
                `Linked project to customer ${customerId}`,
                'system',
                { customerId, source: 'backfill' },
            );
            linked += 1;
        }

        if (batch.length < BATCH_SIZE) break;
    }

    return { linked, created };
}

async function backfillClientBlob(
    table: 'invoices' | 'estimates',
    entityType: 'invoice' | 'estimate',
): Promise<{ linked: number; created: number }> {
    let linked = 0;
    let created = 0;

    while (true) {
        const batch = (table === 'invoices'
            ? ((await sql`
                  SELECT id, client
                  FROM invoices
                  WHERE customer_id IS NULL
                  ORDER BY created_at ASC
                  LIMIT ${BATCH_SIZE}
              `) as unknown as ClientBlobRow[])
            : ((await sql`
                  SELECT id, client
                  FROM estimates
                  WHERE customer_id IS NULL
                  ORDER BY created_at ASC
                  LIMIT ${BATCH_SIZE}
              `) as unknown as ClientBlobRow[]));

        if (batch.length === 0) break;

        for (const row of batch) {
            const blob = asClientBlob(row.client);
            const rawName = (blob.name ?? '').trim();
            const rawEmail = (blob.email ?? '').trim();
            const rawPhone = (blob.phone ?? '').trim();

            if (!rawName && !rawEmail) continue;

            const email = normalizeEmail(rawEmail);
            const displayName = normalizeName(rawName);

            const existing = await findCustomer(email, displayName);
            let customerId: string;

            if (existing) {
                customerId = existing.id;
            } else {
                const finalName = deriveDisplayName({
                    displayName: rawName,
                    email: rawEmail,
                });
                customerId = await createCustomer({
                    displayName: finalName,
                    email: rawEmail || null,
                    phone: rawPhone || null,
                    address: {
                        line1: blob.address ?? '',
                        city: blob.city ?? '',
                        state: blob.state ?? '',
                        zip: blob.zip ?? '',
                    },
                });
                created += 1;
            }

            if (table === 'invoices') {
                await sql`
                    UPDATE invoices
                    SET customer_id = ${customerId}, updated_at = NOW()
                    WHERE id = ${row.id} AND customer_id IS NULL
                `;
            } else {
                await sql`
                    UPDATE estimates
                    SET customer_id = ${customerId}, updated_at = NOW()
                    WHERE id = ${row.id} AND customer_id IS NULL
                `;
            }
            await logActivity(
                entityType,
                row.id,
                'backfilled',
                `Linked ${entityType} to customer ${customerId}`,
                'system',
                { customerId, source: 'backfill' },
            );
            linked += 1;
        }

        if (batch.length < BATCH_SIZE) break;
    }

    return { linked, created };
}

export async function POST() {
    try {
        await initDB();
        const startedAt = Date.now();

        const projects = await backfillProjects();
        const invoices = await backfillClientBlob('invoices', 'invoice');
        const estimates = await backfillClientBlob('estimates', 'estimate');

        const customersCreated =
            projects.created + invoices.created + estimates.created;
        const durationMs = Date.now() - startedAt;

        return NextResponse.json({
            ok: true,
            projectsBackfilled: projects.linked,
            invoicesBackfilled: invoices.linked,
            estimatesBackfilled: estimates.linked,
            customersCreated,
            durationMs,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
