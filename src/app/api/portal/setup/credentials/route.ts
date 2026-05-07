import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie, isLeadOrManager } from '@/lib/portal-auth';

/**
 * GET /api/portal/setup/credentials
 *
 * Used by the admin-only /portal/setup page to display "who has an
 * account and what is their default PIN." Returns one row per portal
 * credential, including the computed default PIN derived from the
 * underlying employee/subcontractor's phone number.
 *
 * The actual stored PIN is NEVER returned — it's a one-way salted
 * hash and intentionally not retrievable. The "default_pin" is what
 * the seed endpoint *would* set if you ran it (or did run); on a
 * freshly seeded portal, the user's PIN equals this value until they
 * change it.
 */
export const dynamic = 'force-dynamic';

interface CredRow {
    user_type: 'employee' | 'subcontractor';
    user_id: string;
    email_lower: string;
    must_change_pin: boolean;
    enabled: boolean;
}

export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isLeadOrManager(user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
        await initDB();

        const creds = (await sql`
            SELECT user_type, user_id, email_lower, must_change_pin, enabled
            FROM portal_credentials
            ORDER BY user_type ASC, email_lower ASC
        `) as unknown as CredRow[];

        if (creds.length === 0) {
            return NextResponse.json({ credentials: [] });
        }

        const empIds = creds.filter((c) => c.user_type === 'employee').map((c) => c.user_id);
        const subIds = creds.filter((c) => c.user_type === 'subcontractor').map((c) => c.user_id);

        const empMap = new Map<string, { name: string; phone: string | null }>();
        const subMap = new Map<string, { name: string; phone: string | null }>();

        if (empIds.length > 0) {
            const empRows = (await sql`
                SELECT id, first_name, last_name, phone
                FROM employees
                WHERE id = ANY(${empIds})
            `) as unknown as { id: string; first_name: string; last_name: string; phone: string | null }[];
            for (const e of empRows) {
                empMap.set(e.id, {
                    name: `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim(),
                    phone: e.phone,
                });
            }
        }

        if (subIds.length > 0) {
            const subRows = (await sql`
                SELECT id, company_name, contact_person, phone
                FROM subcontractors
                WHERE id = ANY(${subIds})
            `) as unknown as { id: string; company_name: string; contact_person: string; phone: string | null }[];
            for (const s of subRows) {
                subMap.set(s.id, {
                    name: s.company_name || s.contact_person || '',
                    phone: s.phone,
                });
            }
        }

        const credentials = creds.map((c) => {
            const meta =
                c.user_type === 'employee'
                    ? empMap.get(c.user_id)
                    : subMap.get(c.user_id);
            return {
                user_type: c.user_type,
                user_id: c.user_id,
                email: c.email_lower,
                name: meta?.name ?? '',
                phone: meta?.phone ?? null,
                default_pin: pinFromPhone(meta?.phone ?? null),
                must_change_pin: c.must_change_pin,
                enabled: c.enabled,
            };
        });

        return NextResponse.json({ credentials });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

function pinFromPhone(phone: string | null): string {
    if (!phone) return '1234';
    const digits = phone.replace(/\D+/g, '');
    if (digits.length >= 4) return digits.slice(-4);
    return digits.padStart(4, '0').slice(-4) || '1234';
}
