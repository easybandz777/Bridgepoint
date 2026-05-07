import { NextResponse } from 'next/server';
import { disconnect } from '@/lib/quickbooks/connection';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        await disconnect('admin');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
