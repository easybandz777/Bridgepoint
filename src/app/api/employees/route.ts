import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

export async function GET() {
    try {
        await initDB();
        const rows = await sql`
            SELECT * FROM employees
            ORDER BY last_name ASC, first_name ASC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();
        const id = genId('emp');

        await sql`
            INSERT INTO employees (
                id, first_name, last_name, email, phone, role,
                employment_type, status, hire_date, termination_date,
                hourly_rate, overtime_rate, salary,
                address, emergency_contact, certifications, skills,
                notes, avatar_url, metrics
            ) VALUES (
                ${id},
                ${body.firstName ?? ''},
                ${body.lastName ?? ''},
                ${body.email ?? null},
                ${body.phone ?? null},
                ${body.role ?? 'Crew'},
                ${body.employmentType ?? 'Full-time'},
                ${body.status ?? 'Active'},
                ${body.hireDate ?? null},
                ${body.terminationDate ?? null},
                ${Number(body.hourlyRate ?? 0)},
                ${body.overtimeRate != null ? Number(body.overtimeRate) : null},
                ${body.salary != null ? Number(body.salary) : null},
                ${body.address ?? ''},
                ${JSON.stringify(body.emergencyContact ?? {})}::jsonb,
                ${JSON.stringify(body.certifications ?? [])}::jsonb,
                ${JSON.stringify(body.skills ?? [])}::jsonb,
                ${body.notes ?? ''},
                ${body.avatarUrl ?? null},
                ${JSON.stringify(body.metrics ?? { hoursThisWeek: 0, hoursYTD: 0, jobsCompleted: 0, avgRating: 5.0 })}::jsonb
            )
        `;

        await logActivity(
            'employee',
            id,
            'created',
            `Created employee ${body.firstName ?? ''} ${body.lastName ?? ''}`.trim(),
        );

        return NextResponse.json({ id });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
