import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM employee_documents
            WHERE employee_id = ${id}
            ORDER BY uploaded_date DESC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();
        const docId = genId('edoc');

        await sql`
            INSERT INTO employee_documents (
                id, employee_id, doc_type, filename, url,
                uploaded_date, expiry_date, verified, notes
            ) VALUES (
                ${docId},
                ${id},
                ${body.docType ?? 'Other'},
                ${body.filename ?? 'document.pdf'},
                ${body.url ?? null},
                ${body.uploadedDate ?? new Date().toISOString().slice(0, 10)},
                ${body.expiryDate ?? null},
                ${Boolean(body.verified ?? false)},
                ${body.notes ?? ''}
            )
        `;

        await logActivity(
            'employee_document',
            docId,
            'uploaded',
            `Uploaded ${body.docType ?? 'document'} for employee ${id}`,
            'admin',
            { employeeId: id, docType: body.docType ?? 'Other' },
        );

        return NextResponse.json({ id: docId });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
