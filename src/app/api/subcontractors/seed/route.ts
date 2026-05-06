import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { SAMPLE_SUBCONTRACTORS, SAMPLE_ASSIGNMENTS } from '@/lib/subcontractors';

/**
 * POST /api/subcontractors/seed
 *
 * Idempotent: only seeds if `subcontractors` is empty.
 * Inserts SAMPLE_SUBCONTRACTORS + SAMPLE_ASSIGNMENTS.
 *
 * Returns { inserted: N, assignments: M } or { inserted: 0, skipped: true }.
 */
export async function POST() {
    try {
        await initDB();

        const existing = (await sql`SELECT COUNT(*)::int AS count FROM subcontractors`) as unknown as Array<{ count: number }>;
        if (existing[0]?.count > 0) {
            return NextResponse.json({ inserted: 0, assignments: 0, skipped: true });
        }

        let insertedSubs = 0;
        for (const s of SAMPLE_SUBCONTRACTORS) {
            await sql`
                INSERT INTO subcontractors (
                    id, company_name, contact_person, phone, email, address,
                    trades, status, rating, tags, payment_terms, default_rate,
                    notes, insurance_expiry, documents, metrics
                ) VALUES (
                    ${s.id},
                    ${s.companyName},
                    ${s.contactPerson},
                    ${s.phone},
                    ${s.email},
                    ${s.address},
                    ${JSON.stringify(s.trades)}::jsonb,
                    ${s.status},
                    ${s.rating},
                    ${JSON.stringify(s.tags)}::jsonb,
                    ${s.paymentTerms},
                    ${s.defaultRate},
                    ${s.notes},
                    ${s.insuranceExpiry},
                    ${JSON.stringify(s.documents)}::jsonb,
                    ${JSON.stringify({ averageRating: s.rating, totalJobsCompleted: 0, reliabilityScore: 100 })}::jsonb
                )
            `;
            insertedSubs += 1;
        }

        let insertedAssignments = 0;
        for (const a of SAMPLE_ASSIGNMENTS) {
            await sql`
                INSERT INTO subcontractor_assignments (
                    id, subcontractor_id, project_id, phase_id, scope_of_work,
                    assignment_status, agreed_amount, billed_amount, approved_amount, paid_amount,
                    start_date, end_date, completion_pct, rating, notes
                ) VALUES (
                    ${a.id},
                    ${a.subcontractorId},
                    ${a.projectId},
                    ${a.phaseId},
                    ${a.scopeOfWork},
                    ${a.assignmentStatus},
                    ${a.agreedAmount},
                    ${a.billedAmount},
                    ${a.approvedAmount},
                    ${a.paidAmount},
                    ${a.startDate},
                    ${a.endDate},
                    ${a.completionPct},
                    ${a.rating},
                    ${''}
                )
            `;
            insertedAssignments += 1;
        }

        await logActivity('subcontractor', 'seed', 'seed_loaded', 'Loaded sample subcontractors', 'admin', {
            subs: insertedSubs,
            assignments: insertedAssignments,
        });

        return NextResponse.json({ inserted: insertedSubs, assignments: insertedAssignments });
    } catch (e) {
        console.error('[POST /api/subcontractors/seed]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
