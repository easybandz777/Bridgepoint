import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import {
    upsertCredential,
    setEnabled,
    revokeAllSessionsForUser,
    findCredentialForUser,
    type PortalUserType,
} from '@/lib/portal-auth';

type Ctx = { params: Promise<{ userType: string; userId: string }> };

function asUserType(value: string): PortalUserType | null {
    return value === 'employee' || value === 'subcontractor' ? value : null;
}

async function lookupEmail(userType: PortalUserType, userId: string): Promise<string | null> {
    if (userType === 'employee') {
        const r = await sql`SELECT email FROM employees WHERE id = ${userId}` as unknown as { email: string | null }[];
        return r[0]?.email ?? null;
    }
    const r = await sql`SELECT email FROM subcontractors WHERE id = ${userId}` as unknown as { email: string | null }[];
    return r[0]?.email ?? null;
}

export async function GET(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { userType, userId } = await ctx.params;
        const ut = asUserType(userType);
        if (!ut) return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });

        const cred = await findCredentialForUser(ut, userId);
        const email = await lookupEmail(ut, userId);

        if (!cred) {
            return NextResponse.json({
                exists: false,
                userType: ut,
                userId,
                email: email ?? '',
            });
        }

        return NextResponse.json({
            exists: true,
            credentialId: cred.id,
            userType: cred.user_type,
            userId: cred.user_id,
            email: cred.email_lower,
            recordEmail: email ?? '',
            enabled: cred.enabled,
            mustChangePin: cred.must_change_pin,
            lastLoginAt: cred.last_login_at,
            failedAttempts: cred.failed_attempts,
            lockedUntil: cred.locked_until,
            createdAt: cred.created_at,
            updatedAt: cred.updated_at,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PUT(req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { userType, userId } = await ctx.params;
        const ut = asUserType(userType);
        if (!ut) return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });

        const body = (await req.json()) as {
            pin?: string;
            enabled?: boolean;
            mustChangePin?: boolean;
            email?: string;
        };

        const recordEmail = body.email && body.email.trim().length > 0
            ? body.email.trim()
            : await lookupEmail(ut, userId);

        if (!recordEmail) {
            return NextResponse.json(
                { error: 'No email on the underlying record. Add an email before issuing portal credentials.' },
                { status: 400 },
            );
        }

        if (!body.pin || String(body.pin).trim().length < 4) {
            return NextResponse.json({ error: 'PIN must be 4-12 characters' }, { status: 400 });
        }

        const cred = await upsertCredential({
            userType: ut,
            userId,
            email: recordEmail,
            pin: String(body.pin),
            enabled: body.enabled ?? true,
            mustChangePin: body.mustChangePin ?? false,
        });

        await logActivity('portal_credential', cred.id, 'upserted',
            `Admin upserted portal credential for ${ut} ${userId}`,
            'admin',
            { userType: ut, userId, enabled: cred.enabled });

        return NextResponse.json({ ok: true, credentialId: cred.id });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { userType, userId } = await ctx.params;
        const ut = asUserType(userType);
        if (!ut) return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });

        await setEnabled(ut, userId, false);
        await revokeAllSessionsForUser(ut, userId);
        await logActivity('portal_credential', userId, 'disabled',
            `Admin disabled portal access for ${ut} ${userId}`,
            'admin',
            { userType: ut, userId });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
