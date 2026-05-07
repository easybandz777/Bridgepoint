import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { upsertCredential } from '@/lib/portal-auth';

/**
 * POST /api/portal/seed
 *
 * For every employee and subcontractor that has an email but no portal
 * credential yet, create one with a default PIN derived from the last 4
 * digits of their phone number (or "1234" if no phone). The credential
 * is created with must_change_pin=true so the user is prompted to set
 * their own PIN on first login.
 *
 * Safe to call repeatedly — existing credentials are not overwritten.
 *
 * Pass ?force=true to RESET PINs back to defaults for everyone.
 */
export async function POST(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const force = url.searchParams.get('force') === 'true';

        const employees = (await sql`
            SELECT id, first_name, last_name, email, phone FROM employees
            WHERE email IS NOT NULL AND email <> ''
        `) as unknown as { id: string; first_name: string; last_name: string; email: string; phone: string | null }[];

        const subs = (await sql`
            SELECT id, company_name, contact_person, email, phone FROM subcontractors
            WHERE email IS NOT NULL AND email <> ''
        `) as unknown as { id: string; company_name: string; contact_person: string; email: string; phone: string | null }[];

        let created = 0;
        let skipped = 0;
        const errors: { user: string; error: string }[] = [];

        for (const e of employees) {
            const existing = await sql`
                SELECT id FROM portal_credentials WHERE user_type = 'employee' AND user_id = ${e.id}
            `;
            if (existing.length > 0 && !force) { skipped++; continue; }

            const pin = pinFromPhone(e.phone);
            try {
                await upsertCredential({
                    userType: 'employee',
                    userId: e.id,
                    email: e.email,
                    pin,
                    enabled: true,
                    mustChangePin: true,
                });
                created++;
            } catch (err) {
                errors.push({ user: `employee:${e.id} (${e.email})`, error: String(err) });
            }
        }

        for (const s of subs) {
            const existing = await sql`
                SELECT id FROM portal_credentials WHERE user_type = 'subcontractor' AND user_id = ${s.id}
            `;
            if (existing.length > 0 && !force) { skipped++; continue; }

            const pin = pinFromPhone(s.phone);
            try {
                await upsertCredential({
                    userType: 'subcontractor',
                    userId: s.id,
                    email: s.email,
                    pin,
                    enabled: true,
                    mustChangePin: true,
                });
                created++;
            } catch (err) {
                errors.push({ user: `subcontractor:${s.id} (${s.email})`, error: String(err) });
            }
        }

        await logActivity('portal', 'seed', 'credentials_seeded',
            `Seeded ${created} portal credentials (${skipped} skipped, ${errors.length} errors)`,
            'admin', { created, skipped, errorCount: errors.length });

        return NextResponse.json({ ok: true, created, skipped, errors });
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
