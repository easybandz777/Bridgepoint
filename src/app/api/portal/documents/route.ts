import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface EmployeeDocRow {
    id: string;
    doc_type: string;
    filename: string;
    url: string | null;
    uploaded_date: string;
    expiry_date: string | null;
    verified: boolean;
    notes: string | null;
}

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

export interface PortalDocumentItem {
    id: string;
    docType: string;
    filename: string;
    url: string | null;
    uploadedDate: string;
    expiryDate: string | null;
    verified: boolean;
    notes: string;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();

        if (user.userType === 'employee') {
            const rows = (await sql`
                SELECT id, doc_type, filename, url, uploaded_date, expiry_date, verified, notes
                FROM employee_documents
                WHERE employee_id = ${user.userId}
                ORDER BY uploaded_date DESC, created_at DESC
            `) as unknown as EmployeeDocRow[];

            const documents: PortalDocumentItem[] = rows.map(r => ({
                id: r.id,
                docType: r.doc_type,
                filename: r.filename,
                url: r.url,
                uploadedDate: r.uploaded_date,
                expiryDate: r.expiry_date,
                verified: Boolean(r.verified),
                notes: r.notes ?? '',
            }));

            return NextResponse.json({ userType: 'employee', documents });
        }

        if (user.userType === 'subcontractor') {
            const rows = (await sql`
                SELECT documents FROM subcontractors WHERE id = ${user.userId}
            `) as unknown as { documents: unknown }[];
            const blob = Array.isArray(rows[0]?.documents) ? (rows[0]!.documents as SubDocBlob[]) : [];
            const documents: PortalDocumentItem[] = blob.map((d, idx) => ({
                id: String(d.id ?? `sd-${idx}`),
                docType: String(d.type ?? 'Other'),
                filename: String(d.filename ?? ''),
                url: d.url ?? null,
                uploadedDate: String(d.uploadedDate ?? ''),
                expiryDate: d.expiryDate ?? null,
                verified: Boolean(d.verified),
                notes: String(d.notes ?? ''),
            }));

            return NextResponse.json({ userType: 'subcontractor', documents });
        }

        return NextResponse.json({ error: 'Unknown user type' }, { status: 500 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: {
        docType?: string;
        filename?: string;
        url?: string;
        expiryDate?: string | null;
        notes?: string;
    } = {};
    try { body = await req.json(); } catch {}

    const docType = String(body.docType ?? '').trim();
    const filename = String(body.filename ?? '').trim();
    const url = String(body.url ?? '').trim();
    const expiryDate = body.expiryDate ? String(body.expiryDate) : null;
    const notes = String(body.notes ?? '').trim();

    if (!docType) return NextResponse.json({ error: 'docType required' }, { status: 400 });
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

    try {
        await initDB();
        const today = todayISO();

        if (user.userType === 'employee') {
            const id = genId('edoc');
            await sql`
                INSERT INTO employee_documents (
                    id, employee_id, doc_type, filename, url,
                    uploaded_date, expiry_date, verified, notes
                ) VALUES (
                    ${id}, ${user.userId}, ${docType}, ${filename}, ${url || null},
                    ${today}, ${expiryDate}, false, ${notes}
                )
            `;
            await logActivity('employee', user.userId, 'document_uploaded',
                `Uploaded ${docType}: ${filename}`, `employee:${user.userId}`);
            return NextResponse.json({ ok: true, id });
        }

        if (user.userType === 'subcontractor') {
            const rows = (await sql`
                SELECT documents FROM subcontractors WHERE id = ${user.userId}
            `) as unknown as { documents: unknown }[];
            const existing = Array.isArray(rows[0]?.documents) ? (rows[0]!.documents as SubDocBlob[]) : [];
            const id = genId('sdoc');
            const next: SubDocBlob[] = [
                ...existing,
                {
                    id,
                    type: docType,
                    filename,
                    url: url || '',
                    uploadedDate: today,
                    expiryDate,
                    verified: false,
                    notes,
                },
            ];
            await sql`
                UPDATE subcontractors
                SET documents = ${JSON.stringify(next)}::jsonb,
                    updated_at = NOW()
                WHERE id = ${user.userId}
            `;
            await logActivity('subcontractor', user.userId, 'document_uploaded',
                `Uploaded ${docType}: ${filename}`, `subcontractor:${user.userId}`);
            return NextResponse.json({ ok: true, id });
        }

        return NextResponse.json({ error: 'Unknown user type' }, { status: 500 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
