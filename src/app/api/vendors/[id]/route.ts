import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { rowToVendor, type VendorRow } from '@/lib/vendors';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const rows = (await sql`SELECT * FROM vendors WHERE id = ${id}`) as unknown as VendorRow[];
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rowToVendor(rows[0]));
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const b = await req.json();
        const billJson = b.billAddress != null ? JSON.stringify(b.billAddress) : null;
        const tagsJson = b.tags != null ? JSON.stringify(b.tags) : null;
        await sql`
            UPDATE vendors SET
                display_name      = COALESCE(${b.displayName ?? null}, display_name),
                company_name      = COALESCE(${b.companyName ?? null}, company_name),
                first_name        = COALESCE(${b.firstName ?? null}, first_name),
                last_name         = COALESCE(${b.lastName ?? null}, last_name),
                email             = COALESCE(${b.email ?? null}, email),
                phone             = COALESCE(${b.phone ?? null}, phone),
                mobile            = COALESCE(${b.mobile ?? null}, mobile),
                bill_address      = COALESCE(${billJson}::jsonb, bill_address),
                notes             = COALESCE(${b.notes ?? null}, notes),
                tags              = COALESCE(${tagsJson}::jsonb, tags),
                active            = COALESCE(${b.active ?? null}::boolean, active),
                is_1099           = COALESCE(${b.is1099 ?? null}::boolean, is_1099),
                tax_identifier    = COALESCE(${b.taxIdentifier ?? null}, tax_identifier),
                account_number    = COALESCE(${b.accountNumber ?? null}, account_number),
                subcontractor_id  = COALESCE(${b.subcontractorId ?? null}, subcontractor_id),
                updated_at        = NOW()
            WHERE id = ${id}
        `;
        await logActivity('vendor', id, 'updated', 'Updated vendor record');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
