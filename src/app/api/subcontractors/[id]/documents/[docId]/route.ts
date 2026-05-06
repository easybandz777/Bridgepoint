import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { mapDocuments } from '@/lib/subcontractors';

type Ctx = { params: Promise<{ id: string; docId: string }> };

/**
 * PATCH /api/subcontractors/[id]/documents/[docId]
 *
 * Body: { verified?: boolean, expiryDate?: string|null, filename?: string, notes?: string }
 */
export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id, docId } = await ctx.params;
        await initDB();
        const body = await req.json();

        const subRows = (await sql`SELECT documents, insurance_expiry FROM subcontractors WHERE id = ${id}`) as unknown as Array<{
            documents: unknown;
            insurance_expiry: string | null;
        }>;
        if (subRows.length === 0) {
            return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
        }

        const docs = mapDocuments(subRows[0].documents);
        const idx = docs.findIndex((d) => d.id === docId);
        if (idx === -1) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const current = docs[idx];
        const updated = {
            ...current,
            ...(body.verified !== undefined ? { verified: Boolean(body.verified) } : {}),
            ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate } : {}),
            ...(body.filename !== undefined ? { filename: String(body.filename) } : {}),
            ...(body.notes !== undefined ? { notes: String(body.notes) } : {}),
        };
        docs[idx] = updated;

        // If COI expiry changed, mirror to column
        let nextInsuranceExpiry = subRows[0].insurance_expiry;
        if (updated.type === 'COI' && body.expiryDate !== undefined) {
            nextInsuranceExpiry = body.expiryDate;
        }

        await sql`
            UPDATE subcontractors
            SET documents = ${JSON.stringify(docs)}::jsonb,
                insurance_expiry = ${nextInsuranceExpiry},
                updated_at = NOW()
            WHERE id = ${id}
        `;

        await logActivity('subcontractor', id, 'document_updated', `Updated doc ${docId}`, 'admin', {
            docId,
            verified: updated.verified,
        });

        return NextResponse.json({ document: updated });
    } catch (e) {
        console.error('[PATCH /api/subcontractors/:id/documents/:docId]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * DELETE /api/subcontractors/[id]/documents/[docId]
 */
export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, docId } = await ctx.params;
        await initDB();

        const subRows = (await sql`SELECT documents FROM subcontractors WHERE id = ${id}`) as unknown as Array<{
            documents: unknown;
        }>;
        if (subRows.length === 0) {
            return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
        }

        const docs = mapDocuments(subRows[0].documents);
        const remaining = docs.filter((d) => d.id !== docId);

        if (remaining.length === docs.length) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        await sql`
            UPDATE subcontractors
            SET documents = ${JSON.stringify(remaining)}::jsonb,
                updated_at = NOW()
            WHERE id = ${id}
        `;

        await logActivity('subcontractor', id, 'document_deleted', `Deleted doc ${docId}`, 'admin', { docId });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[DELETE /api/subcontractors/:id/documents/:docId]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
