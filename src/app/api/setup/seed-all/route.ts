import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SeedResult {
    endpoint: string;
    ok: boolean;
    status: number;
    body: unknown;
    error?: string;
}

/**
 * Orchestrates per-domain seed endpoints sequentially. Each is best-effort:
 * if one isn't yet implemented, we record the error and move on rather than
 * aborting. Returns aggregate counts and a per-endpoint summary.
 */
export async function POST(req: Request) {
    try {
        await initDB();

        const url = new URL(req.url);
        const origin = url.origin;

        const endpoints = [
            '/api/subcontractors/seed',
            '/api/employees/seed',
            '/api/projects/seed',
        ];

        const results: SeedResult[] = [];

        for (const path of endpoints) {
            try {
                const res = await fetch(`${origin}${path}`, {
                    method: 'POST',
                    cache: 'no-store',
                });
                let body: unknown = null;
                try {
                    body = await res.json();
                } catch {
                    body = await res.text().catch(() => null);
                }
                results.push({
                    endpoint: path,
                    ok: res.ok,
                    status: res.status,
                    body,
                });
            } catch (err) {
                results.push({
                    endpoint: path,
                    ok: false,
                    status: 0,
                    body: null,
                    error: String(err),
                });
            }
        }

        // Aggregate counts: sum any numeric `count`/`inserted`/`seeded` fields
        const aggregate = results.reduce<Record<string, number>>((acc, r) => {
            if (!r.ok || !r.body || typeof r.body !== 'object') return acc;
            const b = r.body as Record<string, unknown>;
            for (const key of ['count', 'inserted', 'seeded', 'created']) {
                const v = b[key];
                if (typeof v === 'number') {
                    acc[r.endpoint] = (acc[r.endpoint] ?? 0) + v;
                }
            }
            return acc;
        }, {});

        const succeeded = results.filter((r) => r.ok).length;
        const failed = results.length - succeeded;

        return NextResponse.json({
            ok: failed === 0,
            summary: {
                attempted: results.length,
                succeeded,
                failed,
            },
            counts: aggregate,
            results,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function GET(req: Request) {
    return POST(req);
}
