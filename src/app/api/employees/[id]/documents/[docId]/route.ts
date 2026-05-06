import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id, docId } = await ctx.params;
        await initDB();
        const body = await req.json();

        await sql`
            UPDATE employee_documents SET
                doc_type      = COALESCE(${body.docType ?? null}, doc_type),
                filename      = COALESCE(${body.filename ?? null}, filename),
                url           = COALESCE(${body.url ?? null}, url),
                uploaded_date = COALESCE(${body.uploadedDate ?? null}, uploaded_date),
                expiry_date   = COALESCE(${body.expiryDate ?? null}, expiry_date),
                verified      = COALESCE(${body.verified != null ? Boolean(body.verified) : null}, verified),
                notes         = COALESCE(${body.notes ?? null}, notes)
            WHERE id = ${docId} AND employee_id = ${id}
        `;

        if (body.verified === true) {
            await logActivity('employee_document', docId, 'verified', 'Document marked verified', 'admin', { employeeId: id });
        } else {
            await logActivity('employee_document', docId, 'updated', 'Document updated', 'admin', { employeeId: id });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, docId } = await ctx.params;
        await initDB();
        await sql`DELETE FROM employee_documents WHERE id = ${docId} AND employee_id = ${id}`;
        await logActivity('employee_document', docId, 'deleted', 'Document deleted', 'admin', { employeeId: id });
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
