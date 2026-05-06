import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import {
    dbRowToSub,
    dbRowToAssignment,
    computeMetrics,
    type RowSubcontractor,
    type RowAssignment,
} from '@/lib/subcontractors';

/**
 * GET /api/subcontractors
 *
 * Returns every sub with **live-computed metrics** by joining `subcontractor_assignments`
 * and re-deriving compliance from the documents JSONB blob server-side.
 */
export async function GET() {
    try {
        await initDB();

        const subRows = (await sql`
            SELECT * FROM subcontractors ORDER BY company_name ASC
        `) as unknown as RowSubcontractor[];

        if (subRows.length === 0) {
            return NextResponse.json([]);
        }

        const ids = subRows.map((r) => r.id);
        const assignmentRows = (await sql`
            SELECT * FROM subcontractor_assignments WHERE subcontractor_id = ANY(${ids})
        `) as unknown as RowAssignment[];

        const byId = new Map<string, RowAssignment[]>();
        for (const a of assignmentRows) {
            const list = byId.get(a.subcontractor_id) ?? [];
            list.push(a);
            byId.set(a.subcontractor_id, list);
        }

        const subs = subRows.map((r) => {
            const sub = dbRowToSub(r);
            const assignments = (byId.get(r.id) ?? []).map(dbRowToAssignment);
            sub.metrics = computeMetrics(assignments);
            return sub;
        });

        return NextResponse.json(subs);
    } catch (e) {
        console.error('[GET /api/subcontractors]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * POST /api/subcontractors
 *
 * Create a new subcontractor. Required: companyName, contactPerson, phone, email.
 */
export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();

        if (!body.companyName || !body.contactPerson || !body.phone || !body.email) {
            return NextResponse.json(
                { error: 'companyName, contactPerson, phone, and email are required' },
                { status: 400 }
            );
        }

        const id = genId('sub');
        const trades = Array.isArray(body.trades) ? body.trades : [];
        const tags = Array.isArray(body.tags) ? body.tags : [];
        const documents = Array.isArray(body.documents) ? body.documents : [];

        await sql`
            INSERT INTO subcontractors (
                id, company_name, contact_person, phone, email, address,
                trades, status, rating, tags, payment_terms, default_rate,
                notes, insurance_expiry, documents, metrics
            ) VALUES (
                ${id},
                ${body.companyName},
                ${body.contactPerson},
                ${body.phone},
                ${body.email},
                ${body.address ?? ''},
                ${JSON.stringify(trades)}::jsonb,
                ${body.status ?? 'Active'},
                ${Number(body.rating ?? 4.0)},
                ${JSON.stringify(tags)}::jsonb,
                ${body.paymentTerms ?? 'Net 30'},
                ${body.defaultRate ?? null},
                ${body.notes ?? ''},
                ${body.insuranceExpiry ?? null},
                ${JSON.stringify(documents)}::jsonb,
                ${JSON.stringify({ averageRating: 4.0, totalJobsCompleted: 0, reliabilityScore: 100 })}::jsonb
            )
        `;

        await logActivity('subcontractor', id, 'created', `Created sub: ${body.companyName}`, 'admin', {
            trades,
        });

        return NextResponse.json({ id }, { status: 201 });
    } catch (e) {
        console.error('[POST /api/subcontractors]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
