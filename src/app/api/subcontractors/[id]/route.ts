import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`SELECT * FROM subcontractors WHERE id = ${id}`;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();
        await sql`
            UPDATE subcontractors SET
                company_name = COALESCE(${body.companyName}, company_name),
                contact_person = COALESCE(${body.contactPerson}, contact_person),
                phone = COALESCE(${body.phone}, phone),
                email = COALESCE(${body.email}, email),
                address = COALESCE(${body.address}, address),
                trades = COALESCE(${body.trades != null ? JSON.stringify(body.trades) : null}::jsonb, trades),
                status = COALESCE(${body.status}, status),
                rating = COALESCE(${body.rating}, rating),
                tags = COALESCE(${body.tags != null ? JSON.stringify(body.tags) : null}::jsonb, tags),
                payment_terms = COALESCE(${body.paymentTerms}, payment_terms),
                default_rate = COALESCE(${body.defaultRate}, default_rate),
                notes = COALESCE(${body.notes}, notes),
                insurance_expiry = COALESCE(${body.insuranceExpiry}, insurance_expiry),
                documents = COALESCE(${body.documents != null ? JSON.stringify(body.documents) : null}::jsonb, documents),
                metrics = COALESCE(${body.metrics != null ? JSON.stringify(body.metrics) : null}::jsonb, metrics),
                updated_at = NOW()
            WHERE id = ${id}
        `;
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        await sql`DELETE FROM subcontractors WHERE id = ${id}`;
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
