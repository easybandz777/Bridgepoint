import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export async function GET() {
    try {
        await initDB();
        const rows = await sql`SELECT * FROM subcontractors ORDER BY company_name ASC`;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();
        const id = `sub-${Date.now()}`;

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
                ${JSON.stringify(body.trades ?? [])},
                ${body.status ?? 'Active'},
                ${body.rating ?? 4.0},
                ${JSON.stringify(body.tags ?? [])},
                ${body.paymentTerms ?? 'Net 30'},
                ${body.defaultRate ?? null},
                ${body.notes ?? ''},
                ${body.insuranceExpiry ?? null},
                ${JSON.stringify(body.documents ?? [])},
                ${JSON.stringify(body.metrics ?? { averageRating: 4.0, totalJobsCompleted: 0, reliabilityScore: 100 })}
            )
        `;
        return NextResponse.json({ id });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
