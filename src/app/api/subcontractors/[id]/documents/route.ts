import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { mapDocuments, type RequiredDocument, type DocumentType } from '@/lib/subcontractors';

type Ctx = { params: Promise<{ id: string }> };

const VALID_TYPES: DocumentType[] = ['W-9', 'COI', 'License', 'Agreement', 'Other'];

/**
 * POST /api/subcontractors/[id]/documents
 *
 * Add a document metadata record. File storage is out of scope; the body provides
 * { type, filename, url?, uploadedDate?, expiryDate?, verified?, notes? }.
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        if (!body.type || !VALID_TYPES.includes(body.type)) {
            return NextResponse.json(
                { error: `type is required and must be one of: ${VALID_TYPES.join(', ')}` },
                { status: 400 }
            );
        }
        if (!body.filename || typeof body.filename !== 'string') {
            return NextResponse.json({ error: 'filename is required' }, { status: 400 });
        }

        const subRows = (await sql`SELECT documents, insurance_expiry FROM subcontractors WHERE id = ${id}`) as unknown as Array<{
            documents: unknown;
            insurance_expiry: string | null;
        }>;
        if (subRows.length === 0) {
            return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
        }

        const docs = mapDocuments(subRows[0].documents);
        const newDoc: RequiredDocument = {
            id: genId('subdoc'),
            type: body.type,
            filename: body.filename,
            url: body.url ?? '#',
            uploadedDate: body.uploadedDate ?? new Date().toISOString().split('T')[0],
            expiryDate: body.expiryDate ?? null,
            verified: Boolean(body.verified),
            notes: body.notes ?? undefined,
        };

        const updated = [...docs, newDoc];

        // Mirror COI expiry to the column for fast index queries on compliance dashboards
        let nextInsuranceExpiry = subRows[0].insurance_expiry;
        if (newDoc.type === 'COI' && newDoc.expiryDate) {
            nextInsuranceExpiry = newDoc.expiryDate;
        }

        await sql`
            UPDATE subcontractors
            SET documents = ${JSON.stringify(updated)}::jsonb,
                insurance_expiry = ${nextInsuranceExpiry},
                updated_at = NOW()
            WHERE id = ${id}
        `;

        await logActivity('subcontractor', id, 'document_added', `Added ${newDoc.type}: ${newDoc.filename}`, 'admin', {
            docId: newDoc.id,
            type: newDoc.type,
        });

        return NextResponse.json({ document: newDoc }, { status: 201 });
    } catch (e) {
        console.error('[POST /api/subcontractors/:id/documents]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
