import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { mondayOf, weekDates } from '@/lib/employees';

/**
 * POST /api/portal/sample-data
 *
 * Idempotently populates the portal with rich demo data so the UI does
 * not feel empty during first-run / testing:
 *   - 2-3 project_updates per project (varying kind: note/progress/issue/completion).
 *   - A few crew_messages (announcement to all + an urgent + an info).
 *   - Up to 5 employee_time_entries per employee (for the first 3 employees)
 *     across the past 7 days, each with reasonable clock_in/clock_out hours.
 *
 * Each step checks for existing data and skips creation if any rows are
 * already present, so calling this endpoint repeatedly is safe.
 */
export async function POST() {
    try {
        await initDB();

        const summary = {
            updatesCreated: 0,
            messagesCreated: 0,
            timeEntriesCreated: 0,
            projectsTouched: 0,
            employeesTouched: 0,
            skipped: [] as string[],
        };

        // ── Project updates ─────────────────────────────────────────────────
        const projects = (await sql`
            SELECT id, name FROM projects ORDER BY created_at DESC LIMIT 50
        `) as unknown as { id: string; name: string }[];

        const employees = (await sql`
            SELECT id, first_name, last_name
            FROM employees
            WHERE status = 'Active'
            ORDER BY created_at ASC
        `) as unknown as { id: string; first_name: string; last_name: string }[];

        if (projects.length > 0 && employees.length > 0) {
            for (const proj of projects) {
                const existing = (await sql`
                    SELECT COUNT(*)::int AS n FROM project_updates WHERE project_id = ${proj.id}
                `) as unknown as { n: number }[];

                if ((existing[0]?.n ?? 0) > 0) {
                    summary.skipped.push(`updates for project ${proj.id}`);
                    continue;
                }

                const sample = sampleUpdatesFor(proj.name, employees);
                for (const u of sample) {
                    const id = genId('upd');
                    await sql`
                        INSERT INTO project_updates (
                            id, project_id, phase_id, author_type, author_id, author_name,
                            kind, body, status_change, completion_pct, attachments, created_at
                        ) VALUES (
                            ${id},
                            ${proj.id},
                            ${null},
                            'employee',
                            ${u.authorId},
                            ${u.authorName},
                            ${u.kind},
                            ${u.body},
                            ${null},
                            ${u.completionPct ?? null},
                            '[]'::jsonb,
                            ${u.createdAt}
                        )
                    `;
                    summary.updatesCreated++;
                }
                summary.projectsTouched++;
            }
        }

        // ── Crew messages ───────────────────────────────────────────────────
        const existingMsgs = (await sql`
            SELECT COUNT(*)::int AS n FROM crew_messages
        `) as unknown as { n: number }[];

        if ((existingMsgs[0]?.n ?? 0) === 0) {
            const messages: { subject: string; body: string; level: string; audience: string }[] = [
                {
                    subject: 'Welcome to the crew portal',
                    body: 'You can now post updates, upload site photos, and track your hours from your phone. Reach out to Mark with any questions.',
                    level: 'announcement',
                    audience: 'all',
                },
                {
                    subject: 'Safety reminder — ladder check',
                    body: 'Inspect ladders and harnesses at the start of every shift. Pull anything damaged from the trucks and tag it for replacement.',
                    level: 'urgent',
                    audience: 'all',
                },
                {
                    subject: 'Payroll cutoff Friday at noon',
                    body: 'Submit timesheets by Friday at 12:00pm so payroll can run for next Tuesday. Late entries roll to the following pay period.',
                    level: 'info',
                    audience: 'all',
                },
            ];

            for (const m of messages) {
                const id = genId('msg');
                await sql`
                    INSERT INTO crew_messages (
                        id, audience, recipient_type, recipient_id,
                        subject, body, level, sender, created_at
                    ) VALUES (
                        ${id},
                        ${m.audience},
                        ${null},
                        ${null},
                        ${m.subject},
                        ${m.body},
                        ${m.level},
                        'admin',
                        NOW()
                    )
                `;
                summary.messagesCreated++;
            }
        } else {
            summary.skipped.push('crew_messages already populated');
        }

        // ── Time entries (first 3 employees, past 7 days) ───────────────────
        const targetEmployees = employees.slice(0, 3);
        const monday = mondayOf(new Date());
        const week = weekDates(monday); // 7 ymd strings, Mon..Sun

        for (const e of targetEmployees) {
            const existing = (await sql`
                SELECT COUNT(*)::int AS n FROM employee_time_entries
                WHERE employee_id = ${e.id}
            `) as unknown as { n: number }[];

            if ((existing[0]?.n ?? 0) >= 5) {
                summary.skipped.push(`time entries for employee ${e.id}`);
                continue;
            }

            // Build 5 weekday entries (Mon-Fri), 8h shift each
            for (let i = 0; i < 5; i++) {
                const date = week[i];
                const projectId = projects[i % Math.max(projects.length, 1)]?.id ?? null;
                const id = genId('time');
                const clockIn = `${date}T08:00:00.000Z`;
                const clockOut = `${date}T16:30:00.000Z`;
                const hoursRegular = 8;
                const hoursOvertime = 0;
                await sql`
                    INSERT INTO employee_time_entries (
                        id, employee_id, project_id, phase_id, date,
                        clock_in, clock_out, hours_regular, hours_overtime,
                        cost_amount, status, notes
                    ) VALUES (
                        ${id},
                        ${e.id},
                        ${projectId},
                        ${null},
                        ${date},
                        ${clockIn},
                        ${clockOut},
                        ${hoursRegular},
                        ${hoursOvertime},
                        ${0},
                        'Approved',
                        ${''}
                    )
                `;
                summary.timeEntriesCreated++;
            }
            summary.employeesTouched++;
        }

        await logActivity(
            'portal',
            'sample-data',
            'sample_data_seeded',
            `Seeded ${summary.updatesCreated} updates, ${summary.messagesCreated} messages, ${summary.timeEntriesCreated} time entries`,
            'admin',
            summary as unknown as Record<string, unknown>,
        );

        return NextResponse.json({ ok: true, ...summary });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

interface SampleUpdate {
    authorId: string;
    authorName: string;
    kind: 'note' | 'progress' | 'issue' | 'completion';
    body: string;
    completionPct?: number;
    createdAt: string;
}

function sampleUpdatesFor(
    projectName: string,
    employees: { id: string; first_name: string; last_name: string }[],
): SampleUpdate[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const pick = (i: number) => employees[i % employees.length];

    const a0 = pick(0);
    const a1 = pick(1);
    const a2 = pick(2);

    const author = (e: { id: string; first_name: string; last_name: string }) => ({
        authorId: e.id,
        authorName: `${e.first_name} ${e.last_name}`.trim(),
    });

    return [
        {
            ...author(a0),
            kind: 'progress',
            body: `Crew on site at ${projectName}. Prep work knocked out — masking, drop cloths, and surface scuff are done. Starting first coat tomorrow morning.`,
            completionPct: 25,
            createdAt: new Date(now - 3 * day).toISOString(),
        },
        {
            ...author(a1),
            kind: 'issue',
            body: `Spotted some drywall damage behind the master bedroom dresser at ${projectName}. Will patch and prime before paint goes on. Adding 2 hours to the timeline.`,
            createdAt: new Date(now - 2 * day).toISOString(),
        },
        {
            ...author(a2),
            kind: 'note',
            body: `Client requested a slightly warmer trim color than originally specified. Confirmed in writing — switching to SW Alabaster from Pure White. Updated the change order.`,
            createdAt: new Date(now - 1 * day).toISOString(),
        },
    ];
}
