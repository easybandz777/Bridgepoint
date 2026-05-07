import { NextResponse } from 'next/server';
import { loginWithEmailPin, setPortalCookie } from '@/lib/portal-auth';
import { logActivity } from '@/lib/db';

export async function POST(req: Request) {
    let body: { email?: string; pin?: string } = {};
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const email = (body.email ?? '').trim();
    const pin = (body.pin ?? '').toString();
    if (!email || !pin) {
        return NextResponse.json({ error: 'Email and PIN are required.' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent');
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip');

    const result = await loginWithEmailPin(email, pin, { userAgent: ua, ipAddress: ip });

    if (!result.ok || !result.user || !result.token || !result.expiresAt) {
        return NextResponse.json(
            { error: result.message ?? 'Login failed.' },
            { status: result.reason === 'system' ? 500 : 401 },
        );
    }

    await setPortalCookie(result.token, result.expiresAt);

    await logActivity(
        'portal_session',
        result.user.sessionId,
        'login',
        `${result.user.userType} ${result.user.displayName} logged in to portal`,
        `${result.user.userType}:${result.user.userId}`,
    );

    return NextResponse.json({
        ok: true,
        user: {
            userType: result.user.userType,
            userId: result.user.userId,
            displayName: result.user.displayName,
            email: result.user.email,
            role: result.user.role,
            avatarUrl: result.user.avatarUrl,
            mustChangePin: result.user.mustChangePin,
        },
    });
}
