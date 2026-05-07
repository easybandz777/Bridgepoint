import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

/**
 * GET /api/portal/me
 *
 * Returns rich profile data for the currently authenticated portal user.
 * Returns 401 if no valid session.
 */
export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await initDB();

    if (user.userType === 'employee') {
        const rows = await sql`
            SELECT id, first_name, last_name, email, phone, role,
                   employment_type, status, hire_date, hourly_rate,
                   overtime_rate, salary, address, emergency_contact,
                   certifications, skills, avatar_url, metrics
            FROM employees WHERE id = ${user.userId}
        `;
        if (rows.length === 0) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        return NextResponse.json({
            session: {
                userType: user.userType,
                userId: user.userId,
                displayName: user.displayName,
                role: user.role,
                mustChangePin: user.mustChangePin,
                expiresAt: user.sessionExpiresAt,
            },
            employee: rows[0],
        });
    }

    if (user.userType === 'subcontractor') {
        const rows = await sql`
            SELECT id, company_name, contact_person, phone, email, address,
                   trades, status, rating, payment_terms, default_rate,
                   insurance_expiry, documents
            FROM subcontractors WHERE id = ${user.userId}
        `;
        if (rows.length === 0) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
        return NextResponse.json({
            session: {
                userType: user.userType,
                userId: user.userId,
                displayName: user.displayName,
                role: user.role,
                mustChangePin: user.mustChangePin,
                expiresAt: user.sessionExpiresAt,
            },
            subcontractor: rows[0],
        });
    }

    return NextResponse.json({ error: 'Unknown user type' }, { status: 500 });
}

/**
 * PATCH /api/portal/me
 *
 * Self-service update of mutable profile fields. Employees can change
 * phone, address, emergency contact. Subcontractors can change phone,
 * contact_person, address.
 */
export async function PATCH(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await initDB();

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    if (user.userType === 'employee') {
        const ec = body.emergencyContact != null ? JSON.stringify(body.emergencyContact) : null;
        await sql`
            UPDATE employees SET
                phone             = COALESCE(${(body.phone as string) ?? null}, phone),
                address           = COALESCE(${(body.address as string) ?? null}, address),
                emergency_contact = COALESCE(${ec}::jsonb, emergency_contact),
                updated_at        = NOW()
            WHERE id = ${user.userId}
        `;
        await logActivity('employee', user.userId, 'profile_updated', 'Self-service profile update', `employee:${user.userId}`);
        return NextResponse.json({ ok: true });
    }

    if (user.userType === 'subcontractor') {
        await sql`
            UPDATE subcontractors SET
                contact_person = COALESCE(${(body.contactPerson as string) ?? null}, contact_person),
                phone          = COALESCE(${(body.phone as string) ?? null}, phone),
                address        = COALESCE(${(body.address as string) ?? null}, address),
                updated_at     = NOW()
            WHERE id = ${user.userId}
        `;
        await logActivity('subcontractor', user.userId, 'profile_updated', 'Self-service profile update', `subcontractor:${user.userId}`);
        return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown user type' }, { status: 500 });
}
