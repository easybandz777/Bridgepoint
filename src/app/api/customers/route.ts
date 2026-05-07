import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { rowToCustomer, deriveDisplayName, type CustomerRow } from '@/lib/customers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customers?q=&active=&source=&hasBalance=&limit=&offset=
 */
export async function GET(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const q = (url.searchParams.get('q') ?? '').trim();
        const active = url.searchParams.get('active');
        const source = url.searchParams.get('source');
        const hasBalance = url.searchParams.get('hasBalance') === 'true';
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 500);
        const offset = Number(url.searchParams.get('offset') ?? 0);

        const like = `%${q.toLowerCase().replace(/[%_]/g, m => '\\' + m)}%`;
        const rows = (await sql`
            SELECT * FROM customers
            WHERE
                (${q === ''}::boolean OR
                    LOWER(display_name) LIKE ${like} OR
                    LOWER(company_name) LIKE ${like} OR
                    LOWER(email) LIKE ${like} OR
                    phone LIKE ${like})
                AND (${active === null}::boolean OR active = ${active === 'true'})
                AND (${!source}::boolean OR source = ${source})
                AND (${!hasBalance}::boolean OR balance > 0)
            ORDER BY display_name ASC
            LIMIT ${limit} OFFSET ${offset}
        `) as unknown as CustomerRow[];

        const totalRows = (await sql`SELECT COUNT(*)::int AS n FROM customers`) as unknown as { n: number }[];

        return NextResponse.json({
            rows: rows.map(rowToCustomer),
            total: totalRows[0]?.n ?? 0,
            limit,
            offset,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * POST /api/customers
 * Body: full or partial customer record. display_name is derived if absent.
 */
export async function POST(req: Request) {
    try {
        await initDB();
        const b = await req.json();

        const displayName = deriveDisplayName({
            displayName: b.displayName,
            companyName: b.companyName,
            firstName: b.firstName,
            lastName: b.lastName,
            email: b.email,
        });

        const id = genId('cust');
        await sql`
            INSERT INTO customers (
                id, display_name, customer_type, company_name, first_name, last_name,
                email, phone, mobile, fax, website,
                bill_address, ship_address, notes, tags,
                active, balance, payment_method, payment_terms, preferred_delivery_method,
                tax_exempt, parent_customer_id, is_job, source
            ) VALUES (
                ${id},
                ${displayName},
                ${b.customerType ?? 'Individual'},
                ${b.companyName ?? null},
                ${b.firstName ?? null},
                ${b.lastName ?? null},
                ${b.email ?? null},
                ${b.phone ?? null},
                ${b.mobile ?? null},
                ${b.fax ?? null},
                ${b.website ?? null},
                ${JSON.stringify(b.billAddress ?? {})}::jsonb,
                ${JSON.stringify(b.shipAddress ?? {})}::jsonb,
                ${b.notes ?? ''},
                ${JSON.stringify(b.tags ?? [])}::jsonb,
                ${b.active ?? true},
                ${Number(b.balance ?? 0)},
                ${b.paymentMethod ?? null},
                ${b.paymentTerms ?? null},
                ${b.preferredDeliveryMethod ?? null},
                ${Boolean(b.taxExempt ?? false)},
                ${b.parentCustomerId ?? null},
                ${Boolean(b.isJob ?? false)},
                ${b.source ?? 'crm'}
            )
        `;

        await logActivity('customer', id, 'created', `Created customer ${displayName}`);

        return NextResponse.json({ id, displayName }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
