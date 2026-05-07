import { NextResponse } from 'next/server';
import { clearPortalCookie, readPortalCookie, revokeSession } from '@/lib/portal-auth';

export async function POST() {
    const token = await readPortalCookie();
    if (token) {
        await revokeSession(token);
    }
    await clearPortalCookie();
    return NextResponse.json({ ok: true });
}
