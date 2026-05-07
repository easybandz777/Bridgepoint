import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CredentialListRow {
    credential_id: string;
    user_type: 'employee' | 'subcontractor';
    user_id: string;
    email_lower: string;
    enabled: boolean;
    must_change_pin: boolean;
    last_login_at: string | null;
    created_at: string;
    display_name: string | null;
    role: string | null;
}

export async function GET() {
    try {
        await initDB();
        const rows = (await sql`
            SELECT
                pc.id              AS credential_id,
                pc.user_type,
                pc.user_id,
                pc.email_lower,
                pc.enabled,
                pc.must_change_pin,
                pc.last_login_at,
                pc.created_at,
                CASE WHEN pc.user_type = 'employee'
                    THEN (SELECT first_name || ' ' || last_name FROM employees WHERE id = pc.user_id)
                    ELSE (SELECT company_name FROM subcontractors WHERE id = pc.user_id)
                END AS display_name,
                CASE WHEN pc.user_type = 'employee'
                    THEN (SELECT role FROM employees WHERE id = pc.user_id)
                    ELSE 'Subcontractor'
                END AS role
            FROM portal_credentials pc
            ORDER BY pc.last_login_at DESC NULLS LAST, pc.created_at DESC
        `) as unknown as CredentialListRow[];

        const result = rows.map((r) => ({
            credentialId: r.credential_id,
            userType: r.user_type,
            userId: r.user_id,
            displayName: r.display_name ?? '',
            email: r.email_lower,
            enabled: r.enabled,
            mustChangePin: r.must_change_pin,
            lastLoginAt: r.last_login_at,
            createdAt: r.created_at,
            role: r.role ?? '',
        }));

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
