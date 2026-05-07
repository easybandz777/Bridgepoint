import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface SubDocBlob {
    id?: string;
    type?: string;
    filename?: string;
    url?: string;
    uploadedDate?: string;
    expiryDate?: string | null;
    verified?: boolean;
    notes?: string;
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ docId: string }> },
) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { docId } = await params;
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    try {
        await initDB();

        if (user.userType === 'employee') {
            const rows = (await sql`
                SELECT id, employee_id, verified, doc_type, filename
                FROM employee_documents WHERE id = ${docId}
            `) as unknown as { id: string; employee_id: string; verified: boolean; doc_type: string; filename: string }[];
            const row = rows[0];
            if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            if (row.employee_id !== user.userId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (row.verified) {
                return NextResponse.json({ error: 'Cannot delete verified documents' }, { status: 400 });
            }
            await sql`DELETE FROM employee_documents WHERE id = ${docId}`;
            await logActivity('employee', user.userId, 'document_deleted',
                `Deleted ${row.doc_type}: ${row.filename}`, `employee:${user.userId}`);
            return NextResponse.json({ ok: true });
        }

        if (user.userType === 'subcontractor') {
            const rows = (await sql`
                SELECT documents FROM subcontractors WHERE id = ${user.userId}
            `) as unknown as { documents: unknown }[];
            const existing = Array.isArray(rows[0]?.documents) ? (rows[0]!.documents as SubDocBlob[]) : [];
            const target = existing.find(d => String(d.id ?? '') === docId);
            if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            if (target.verified) {
                return NextResponse.json({ error: 'Cannot delete verified documents' }, { status: 400 });
            }
            const next = existing.filter(d => String(d.id ?? '') !== docId);
            await sql`
                UPDATE subcontractors
                SET documents = ${JSON.stringify(next)}::jsonb,
                    updated_at = NOW()
                WHERE id = ${user.userId}
            `;
            await logActivity('subcontractor', user.userId, 'document_deleted',
                `Deleted ${target.type ?? 'doc'}: ${target.filename ?? ''}`, `subcontractor:${user.userId}`);
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: 'Unknown user type' }, { status: 500 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
