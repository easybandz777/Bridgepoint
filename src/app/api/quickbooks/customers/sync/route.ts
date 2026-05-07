import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { resolveOrCreateCustomerForProject } from '@/lib/quickbooks/customers';
import { getActiveConnection } from '@/lib/quickbooks/connection';

/**
 * POST /api/quickbooks/customers/sync
 * Body: { projectId: string, actor?: string }
 *
 * Resolves-or-creates a QB Customer for the given project. Idempotent — calling
 * it twice returns the same Customer Id. Returns 412 when QB is not connected
 * so the admin UI can prompt to connect.
 */
export async function POST(req: Request) {
    try {
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const body = await req.json().catch(() => ({})) as { projectId?: string; actor?: string };
        if (!body.projectId) {
            return NextResponse.json({ error: 'projectId required' }, { status: 400 });
        }

        const result = await resolveOrCreateCustomerForProject(body.projectId, body.actor ?? 'admin');
        return NextResponse.json({
            ok: true,
            qbCustomerId: result.qbCustomerId,
            customer: result.customer,
        });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('QuickBooks is not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
