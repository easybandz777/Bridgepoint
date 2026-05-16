import { NextResponse } from 'next/server';
import { disconnect } from '@/lib/quickbooks/connection';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

export async function POST() {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        await disconnect('admin');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
