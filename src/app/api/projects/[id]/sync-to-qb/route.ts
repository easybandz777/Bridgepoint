import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { resolveOrCreateCustomerForProject } from '@/lib/quickbooks/customers';
import { getActiveConnection } from '@/lib/quickbooks/connection';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/projects/:id/sync-to-qb
 *
 * Convenience endpoint the project detail page calls. Resolves-or-creates a
 * QB Customer for this project and stamps `qb_id` + `qb_synced_at` on the row.
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const projects = await sql`SELECT id FROM projects WHERE id = ${id}`;
        if (projects.length === 0) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const body = await req.json().catch(() => ({})) as { actor?: string };
        const actor = body.actor ?? 'admin';

        const result = await resolveOrCreateCustomerForProject(id, actor);

        await sql`
            UPDATE projects
            SET qb_id = ${result.qbCustomerId},
                qb_sync_token = ${result.customer.SyncToken ?? null},
                qb_synced_at = NOW(),
                updated_at = NOW()
            WHERE id = ${id}
        `;

        await logActivity('project', id, 'qb_customer_synced',
            `Project synced to QB Customer ${result.customer.DisplayName}`, actor,
            { qbCustomerId: result.qbCustomerId });

        return NextResponse.json({
            ok: true,
            qbCustomerId: result.qbCustomerId,
            qbId: result.qbCustomerId,
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
