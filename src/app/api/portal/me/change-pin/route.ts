import { NextResponse } from 'next/server';
import { changeOwnPin, getPortalUserFromCookie } from '@/lib/portal-auth';
import { logActivity } from '@/lib/db';

export async function POST(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { currentPin?: string; newPin?: string } = {};
    try { body = await req.json(); } catch {}

    const cur = String(body.currentPin ?? '');
    const next = String(body.newPin ?? '');
    if (!cur || !next) return NextResponse.json({ error: 'Both currentPin and newPin are required.' }, { status: 400 });

    const result = await changeOwnPin(user.userType, user.userId, cur, next);
    if (!result.ok) {
        return NextResponse.json({ error: result.message ?? 'Could not change PIN.' }, { status: 400 });
    }

    await logActivity(
        user.userType === 'employee' ? 'employee' : 'subcontractor',
        user.userId,
        'pin_changed',
        'Self-service PIN change',
        `${user.userType}:${user.userId}`,
    );

    return NextResponse.json({ ok: true });
}
