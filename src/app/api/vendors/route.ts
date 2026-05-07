import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { rowToVendor, type VendorRow } from '@/lib/vendors';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const q = (url.searchParams.get('q') ?? '').trim();
        const active = url.searchParams.get('active');
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 500);
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const like = `%${q.toLowerCase().replace(/[%_]/g, m => '\\' + m)}%`;

        const rows = (await sql`
            SELECT * FROM vendors
            WHERE
                (${q === ''}::boolean OR LOWER(display_name) LIKE ${like}
                    OR LOWER(company_name) LIKE ${like}
                    OR LOWER(email) LIKE ${like})
                AND (${active === null}::boolean OR active = ${active === 'true'})
            ORDER BY display_name ASC
            LIMIT ${limit} OFFSET ${offset}
        `) as unknown as VendorRow[];

        const totalRows = (await sql`SELECT COUNT(*)::int AS n FROM vendors`) as unknown as { n: number }[];
        return NextResponse.json({ rows: rows.map(rowToVendor), total: totalRows[0]?.n ?? 0, limit, offset });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const b = await req.json();
        const id = genId('vend');
        const displayName = (b.displayName ?? b.companyName ?? '').trim() || 'Vendor';
        await sql`
            INSERT INTO vendors (
                id, display_name, company_name, first_name, last_name,
                email, phone, mobile, bill_address, notes, tags,
                active, balance, is_1099, tax_identifier, account_number,
                subcontractor_id, source
            ) VALUES (
                ${id},
                ${displayName},
                ${b.companyName ?? null},
                ${b.firstName ?? null},
                ${b.lastName ?? null},
                ${b.email ?? null},
                ${b.phone ?? null},
                ${b.mobile ?? null},
                ${JSON.stringify(b.billAddress ?? {})}::jsonb,
                ${b.notes ?? ''},
                ${JSON.stringify(b.tags ?? [])}::jsonb,
                ${b.active ?? true},
                ${Number(b.balance ?? 0)},
                ${Boolean(b.is1099 ?? false)},
                ${b.taxIdentifier ?? null},
                ${b.accountNumber ?? null},
                ${b.subcontractorId ?? null},
                ${b.source ?? 'crm'}
            )
        `;
        await logActivity('vendor', id, 'created', `Created vendor ${displayName}`);
        return NextResponse.json({ id, displayName }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
