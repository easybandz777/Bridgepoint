import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { revokeAllSessionsForUser, type PortalUserType } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface SessionListRow {
    id: string;
    credential_id: string;
    user_type: 'employee' | 'subcontractor';
    user_id: string;
    user_agent: string | null;
    ip_address: string | null;
    expires_at: string;
    revoked_at: string | null;
    created_at: string;
    last_used_at: string;
    email_lower: string | null;
    display_name: string | null;
}

export async function GET() {
    try {
        await initDB();
        const rows = (await sql`
            SELECT
                ps.id,
                ps.credential_id,
                ps.user_type,
                ps.user_id,
                ps.user_agent,
                ps.ip_address,
                ps.expires_at,
                ps.revoked_at,
                ps.created_at,
                ps.last_used_at,
                pc.email_lower,
                CASE WHEN ps.user_type = 'employee'
                    THEN (SELECT first_name || ' ' || last_name FROM employees WHERE id = ps.user_id)
                    ELSE (SELECT company_name FROM subcontractors WHERE id = ps.user_id)
                END AS display_name
            FROM portal_sessions ps
            LEFT JOIN portal_credentials pc ON pc.id = ps.credential_id
            WHERE ps.revoked_at IS NULL
              AND ps.expires_at > NOW()
            ORDER BY ps.last_used_at DESC
        `) as unknown as SessionListRow[];

        return NextResponse.json(
            rows.map((r) => ({
                sessionId: r.id,
                credentialId: r.credential_id,
                userType: r.user_type,
                userId: r.user_id,
                email: r.email_lower ?? '',
                displayName: r.display_name ?? '',
                userAgent: r.user_agent,
                ipAddress: r.ip_address,
                expiresAt: r.expires_at,
                createdAt: r.created_at,
                lastUsedAt: r.last_used_at,
            })),
        );
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const body = (await req.json()) as { revokeUserType?: string; revokeUserId?: string };
        if (!body.revokeUserType || !body.revokeUserId) {
            return NextResponse.json({ error: 'revokeUserType and revokeUserId required' }, { status: 400 });
        }
        if (body.revokeUserType !== 'employee' && body.revokeUserType !== 'subcontractor') {
            return NextResponse.json({ error: 'invalid user type' }, { status: 400 });
        }
        const ut = body.revokeUserType as PortalUserType;
        await revokeAllSessionsForUser(ut, body.revokeUserId);
        await logActivity('portal_session', body.revokeUserId, 'sessions_revoked',
            `Admin revoked all sessions for ${ut} ${body.revokeUserId}`,
            'admin',
            { userType: ut, userId: body.revokeUserId });
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
