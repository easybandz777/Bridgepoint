import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import {
    upsertCredential,
    setEnabled,
    revokeAllSessionsForUser,
    type PortalCredentialRow,
} from '@/lib/portal-auth';

type Ctx = { params: Promise<{ credId: string }> };

function randomPin(): string {
    let s = '';
    for (let i = 0; i < 6; i++) s += Math.floor(Math.random() * 10);
    return s;
}

async function loadCred(credId: string): Promise<PortalCredentialRow | null> {
    const rows = (await sql`
        SELECT * FROM portal_credentials WHERE id = ${credId} LIMIT 1
    `) as unknown as PortalCredentialRow[];
    return rows[0] ?? null;
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { credId } = await ctx.params;
        const body = (await req.json()) as {
            enabled?: boolean;
            mustChangePin?: boolean;
            resetPin?: boolean;
            newPin?: string;
            revokeSessions?: boolean;
        };

        const cred = await loadCred(credId);
        if (!cred) {
            return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
        }

        let issuedPin: string | null = null;

        if (body.resetPin) {
            const cleanCustom = body.newPin != null ? String(body.newPin).trim() : '';
            const pin = cleanCustom.length >= 4 ? cleanCustom : randomPin();
            await upsertCredential({
                userType: cred.user_type,
                userId: cred.user_id,
                email: cred.email_lower,
                pin,
                enabled: body.enabled ?? cred.enabled,
                mustChangePin: body.mustChangePin ?? true,
            });
            await revokeAllSessionsForUser(cred.user_type, cred.user_id);
            await logActivity('portal_credential', credId, 'pin_reset',
                `Admin reset PIN for ${cred.user_type} ${cred.user_id}`,
                'admin',
                { userType: cred.user_type, userId: cred.user_id });
            issuedPin = pin;
        } else {
            // Plain enable/disable + must_change_pin toggle without rotating PIN.
            if (typeof body.enabled === 'boolean') {
                await setEnabled(cred.user_type, cred.user_id, body.enabled);
                await logActivity('portal_credential', credId,
                    body.enabled ? 'enabled' : 'disabled',
                    `Admin ${body.enabled ? 'enabled' : 'disabled'} portal access for ${cred.user_type} ${cred.user_id}`,
                    'admin',
                    { userType: cred.user_type, userId: cred.user_id });
            }
            if (typeof body.mustChangePin === 'boolean') {
                await sql`
                    UPDATE portal_credentials
                    SET must_change_pin = ${body.mustChangePin}, updated_at = NOW()
                    WHERE id = ${credId}
                `;
                await logActivity('portal_credential', credId, 'must_change_pin_set',
                    `Admin set must_change_pin=${body.mustChangePin} for ${cred.user_type} ${cred.user_id}`,
                    'admin',
                    { userType: cred.user_type, userId: cred.user_id, mustChangePin: body.mustChangePin });
            }
        }

        if (body.revokeSessions) {
            await revokeAllSessionsForUser(cred.user_type, cred.user_id);
            await logActivity('portal_credential', credId, 'sessions_revoked',
                `Admin revoked all active sessions for ${cred.user_type} ${cred.user_id}`,
                'admin',
                { userType: cred.user_type, userId: cred.user_id });
        }

        const fresh = await loadCred(credId);
        return NextResponse.json({
            ok: true,
            issuedPin,
            credential: fresh
                ? {
                    credentialId: fresh.id,
                    enabled: fresh.enabled,
                    mustChangePin: fresh.must_change_pin,
                    lastLoginAt: fresh.last_login_at,
                    updatedAt: fresh.updated_at,
                }
                : null,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
