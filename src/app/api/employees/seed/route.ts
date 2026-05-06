import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { SAMPLE_EMPLOYEES, SeedEmployee } from '@/lib/employees';

/**
 * POST /api/employees/seed
 *
 * Idempotent. If the employees table already has rows, it does nothing.
 * Otherwise it inserts the canonical SAMPLE_EMPLOYEES + 2 weeks of sample
 * time entries per employee + a couple of starter documents per employee.
 */
export async function POST() {
    try {
        await initDB();

        const existing = await sql`SELECT COUNT(*)::int AS n FROM employees`;
        const count = Number(existing[0]?.n ?? 0);
        if (count > 0) {
            return NextResponse.json({
                employees: 0,
                timeEntries: 0,
                documents: 0,
                skipped: true,
                message: 'Employees already present; seed is a no-op.',
            });
        }

        let employeesInserted = 0;
        let entriesInserted = 0;
        let docsInserted = 0;

        // Reference dates: this Monday + the previous Monday.
        const today = new Date();
        const day = today.getDay();
        const offsetToMonday = day === 0 ? -6 : 1 - day;
        const thisMonday = new Date(today);
        thisMonday.setDate(today.getDate() + offsetToMonday);
        thisMonday.setHours(0, 0, 0, 0);
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(thisMonday.getDate() - 7);

        for (const seed of SAMPLE_EMPLOYEES) {
            const empId = genId('emp');
            const otRate = seed.overtimeRate ?? (seed.hourlyRate > 0 ? seed.hourlyRate * 1.5 : null);

            await sql`
                INSERT INTO employees (
                    id, first_name, last_name, email, phone, role,
                    employment_type, status, hire_date,
                    hourly_rate, overtime_rate, salary,
                    address, emergency_contact, certifications, skills,
                    notes, metrics
                ) VALUES (
                    ${empId},
                    ${seed.firstName},
                    ${seed.lastName},
                    ${seed.email},
                    ${seed.phone},
                    ${seed.role},
                    ${seed.employmentType},
                    ${seed.status},
                    ${seed.hireDate},
                    ${seed.hourlyRate},
                    ${otRate},
                    ${seed.salary ?? null},
                    ${seed.address},
                    ${JSON.stringify(seed.emergencyContact)}::jsonb,
                    ${JSON.stringify(seed.certifications)}::jsonb,
                    ${JSON.stringify(seed.skills)}::jsonb,
                    ${seed.notes},
                    ${JSON.stringify({ hoursThisWeek: 0, hoursYTD: 0, jobsCompleted: 0, avgRating: 5.0 })}::jsonb
                )
            `;
            employeesInserted++;

            // Time entries — 2 weeks Mon-Fri, 8h regular, occasional 1-2h OT.
            // Skip if the role is salaried-only (Office Manager / Estimator) to keep volume realistic.
            const isSalaried = seed.salary != null && seed.hourlyRate === 0;
            entriesInserted += await seedTwoWeeks(empId, seed, lastMonday, thisMonday, isSalaried);

            // Documents — universally W-4, I-9, Direct Deposit. Add role-specific certs.
            docsInserted += await seedDocuments(empId, seed);
        }

        await logActivity(
            'employee',
            'seed',
            'seeded',
            `Seeded ${employeesInserted} employees, ${entriesInserted} time entries, ${docsInserted} documents`,
            'admin',
            { employees: employeesInserted, timeEntries: entriesInserted, documents: docsInserted },
        );

        return NextResponse.json({
            employees: employeesInserted,
            timeEntries: entriesInserted,
            documents: docsInserted,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

async function seedTwoWeeks(
    empId: string,
    seed: SeedEmployee,
    lastMonday: Date,
    thisMonday: Date,
    isSalaried: boolean,
): Promise<number> {
    let count = 0;
    const hourly = seed.hourlyRate;
    const otRate = seed.overtimeRate ?? hourly * 1.5;

    // Salaried staff: log 5 days × 8h Mon-Fri last week only, no OT, no project.
    // Hourly staff: 2 weeks Mon-Fri 8h, +1.5-2h OT on Wed/Thu of last week to make charts interesting.
    const weeks = isSalaried ? [lastMonday] : [lastMonday, thisMonday];

    for (let w = 0; w < weeks.length; w++) {
        for (let d = 0; d < 5; d++) {
            const date = new Date(weeks[w]);
            date.setDate(date.getDate() + d);
            const ymd = formatYmd(date);

            // For "this week" we only log entries on past or current weekdays so
            // future days remain empty. Compare via UTC-naive Date.
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const ref = new Date(date);
            ref.setHours(0, 0, 0, 0);
            if (ref > now) continue;

            const reg = isSalaried ? 8 : 8;
            // OT only on past week, only Wed (d=2) and Thu (d=3) for hourly staff
            const ot = !isSalaried && w === 0 && (d === 2 || d === 3) ? 1.5 : 0;
            const cost = isSalaried ? 0 : Math.round((reg * hourly + ot * otRate) * 100) / 100;
            const status = w === 0 ? 'Approved' : 'Pending';

            await sql`
                INSERT INTO employee_time_entries (
                    id, employee_id, project_id, phase_id, date,
                    clock_in, clock_out, hours_regular, hours_overtime,
                    cost_amount, status, notes,
                    approved_by, approved_at
                ) VALUES (
                    ${genId('te')},
                    ${empId},
                    ${null},
                    ${null},
                    ${ymd},
                    ${'07:00'},
                    ${ot > 0 ? '17:30' : '15:30'},
                    ${reg},
                    ${ot},
                    ${cost},
                    ${status},
                    ${''},
                    ${status === 'Approved' ? 'admin' : null},
                    ${status === 'Approved' ? new Date().toISOString() : null}
                )
            `;
            count++;
        }
    }
    return count;
}

async function seedDocuments(empId: string, seed: SeedEmployee): Promise<number> {
    let count = 0;
    const today = new Date().toISOString().slice(0, 10);
    const inOneYear = new Date();
    inOneYear.setFullYear(inOneYear.getFullYear() + 1);
    const expYr = inOneYear.toISOString().slice(0, 10);

    type DocSeed = {
        type: string;
        filename: string;
        verified: boolean;
        expiry: string | null;
    };

    const base: DocSeed[] = [
        { type: 'W-4', filename: 'w4.pdf', verified: true, expiry: null },
        { type: 'I-9', filename: 'i9.pdf', verified: true, expiry: null },
        { type: 'Direct Deposit', filename: 'direct-deposit.pdf', verified: true, expiry: null },
    ];

    for (const cert of seed.certifications) {
        const upper = cert.toUpperCase();
        if (upper.includes('OSHA-30')) {
            base.push({ type: 'OSHA-30', filename: 'osha-30-cert.pdf', verified: true, expiry: expYr });
        } else if (upper.includes('OSHA-10')) {
            base.push({ type: 'OSHA-10', filename: 'osha-10-cert.pdf', verified: true, expiry: expYr });
        }
        if (upper.includes('LEAD-SAFE') || upper.includes('EPA')) {
            base.push({ type: 'Lead-Safe', filename: 'lead-safe-rrp.pdf', verified: true, expiry: expYr });
        }
    }

    for (const d of base) {
        await sql`
            INSERT INTO employee_documents (
                id, employee_id, doc_type, filename, url,
                uploaded_date, expiry_date, verified, notes
            ) VALUES (
                ${genId('edoc')},
                ${empId},
                ${d.type},
                ${d.filename},
                ${null},
                ${today},
                ${d.expiry},
                ${d.verified},
                ${''}
            )
        `;
        count++;
    }
    return count;
}

function formatYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
