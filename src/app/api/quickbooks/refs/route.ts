import { NextResponse } from 'next/server';
import { getCachedDefaults, refreshDefaults } from '@/lib/quickbooks/refs';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/quickbooks/refs   — return the currently cached default refs (or null).
 * POST /api/quickbooks/refs   — force a re-resolve and return the new values.
 *
 * Used by the admin integrations page so the user can see + manually
 * re-resolve the cached QuickBooks default Item / Expense / Income refs.
 */
export async function GET() {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const defaults = await getCachedDefaults();
        return NextResponse.json({ defaults });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST() {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const defaults = await refreshDefaults();
        return NextResponse.json({ ok: true, defaults });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
