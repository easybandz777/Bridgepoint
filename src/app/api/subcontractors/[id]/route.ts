import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import {
    dbRowToSub,
    dbRowToAssignment,
    computeMetrics,
    type RowSubcontractor,
    type RowAssignment,
} from '@/lib/subcontractors';
import { autoSyncSubcontractorIfEnabled } from '@/lib/quickbooks/auto-sync';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/subcontractors/[id]
 *
 * Returns the sub with live-computed metrics + compliance.
 */
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        const rows = (await sql`SELECT * FROM subcontractors WHERE id = ${id}`) as unknown as RowSubcontractor[];
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const assignmentRows = (await sql`
            SELECT * FROM subcontractor_assignments WHERE subcontractor_id = ${id}
        `) as unknown as RowAssignment[];

        const sub = dbRowToSub(rows[0]);
        sub.metrics = computeMetrics(assignmentRows.map(dbRowToAssignment));

        return NextResponse.json(sub);
    } catch (e) {
        console.error('[GET /api/subcontractors/:id]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * PATCH /api/subcontractors/[id]
 */
export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        const tradesJson = body.trades != null ? JSON.stringify(body.trades) : null;
        const tagsJson = body.tags != null ? JSON.stringify(body.tags) : null;
        const docsJson = body.documents != null ? JSON.stringify(body.documents) : null;
        const metricsJson = body.metrics != null ? JSON.stringify(body.metrics) : null;

        await sql`
            UPDATE subcontractors SET
                company_name = COALESCE(${body.companyName ?? null}, company_name),
                contact_person = COALESCE(${body.contactPerson ?? null}, contact_person),
                phone = COALESCE(${body.phone ?? null}, phone),
                email = COALESCE(${body.email ?? null}, email),
                address = COALESCE(${body.address ?? null}, address),
                trades = COALESCE(${tradesJson}::jsonb, trades),
                status = COALESCE(${body.status ?? null}, status),
                rating = COALESCE(${body.rating != null ? Number(body.rating) : null}, rating),
                tags = COALESCE(${tagsJson}::jsonb, tags),
                payment_terms = COALESCE(${body.paymentTerms ?? null}, payment_terms),
                default_rate = COALESCE(${body.defaultRate ?? null}, default_rate),
                notes = COALESCE(${body.notes ?? null}, notes),
                insurance_expiry = COALESCE(${body.insuranceExpiry ?? null}, insurance_expiry),
                documents = COALESCE(${docsJson}::jsonb, documents),
                metrics = COALESCE(${metricsJson}::jsonb, metrics),
                updated_at = NOW()
            WHERE id = ${id}
        `;

        await logActivity('subcontractor', id, 'updated', 'Sub profile updated', 'admin', { fields: Object.keys(body) });

        if (body.status === 'Active') {
            void autoSyncSubcontractorIfEnabled(id, { reason: 'sub activated' });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[PATCH /api/subcontractors/:id]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * DELETE /api/subcontractors/[id]
 *
 * Cascading cleanup: also drops sub_notes and assignments for this sub.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        await sql`DELETE FROM subcontractor_notes WHERE subcontractor_id = ${id}`;
        await sql`DELETE FROM subcontractor_assignments WHERE subcontractor_id = ${id}`;
        await sql`DELETE FROM subcontractors WHERE id = ${id}`;

        await logActivity('subcontractor', id, 'deleted', 'Sub deleted', 'admin');

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[DELETE /api/subcontractors/:id]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
