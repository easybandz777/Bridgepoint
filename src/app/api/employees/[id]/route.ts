import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`SELECT * FROM employees WHERE id = ${id}`;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        const certsJson = body.certifications != null ? JSON.stringify(body.certifications) : null;
        const skillsJson = body.skills != null ? JSON.stringify(body.skills) : null;
        const ecJson = body.emergencyContact != null ? JSON.stringify(body.emergencyContact) : null;
        const metricsJson = body.metrics != null ? JSON.stringify(body.metrics) : null;

        await sql`
            UPDATE employees SET
                first_name        = COALESCE(${body.firstName ?? null}, first_name),
                last_name         = COALESCE(${body.lastName ?? null}, last_name),
                email             = COALESCE(${body.email ?? null}, email),
                phone             = COALESCE(${body.phone ?? null}, phone),
                role              = COALESCE(${body.role ?? null}, role),
                employment_type   = COALESCE(${body.employmentType ?? null}, employment_type),
                status            = COALESCE(${body.status ?? null}, status),
                hire_date         = COALESCE(${body.hireDate ?? null}, hire_date),
                termination_date  = COALESCE(${body.terminationDate ?? null}, termination_date),
                hourly_rate       = COALESCE(${body.hourlyRate != null ? Number(body.hourlyRate) : null}, hourly_rate),
                overtime_rate     = COALESCE(${body.overtimeRate != null ? Number(body.overtimeRate) : null}, overtime_rate),
                salary            = COALESCE(${body.salary != null ? Number(body.salary) : null}, salary),
                address           = COALESCE(${body.address ?? null}, address),
                emergency_contact = COALESCE(${ecJson}::jsonb, emergency_contact),
                certifications    = COALESCE(${certsJson}::jsonb, certifications),
                skills            = COALESCE(${skillsJson}::jsonb, skills),
                notes             = COALESCE(${body.notes ?? null}, notes),
                avatar_url        = COALESCE(${body.avatarUrl ?? null}, avatar_url),
                metrics           = COALESCE(${metricsJson}::jsonb, metrics),
                updated_at        = NOW()
            WHERE id = ${id}
        `;

        await logActivity('employee', id, 'updated', 'Updated employee record');

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        await sql`DELETE FROM employee_documents WHERE employee_id = ${id}`;
        await sql`DELETE FROM employee_time_entries WHERE employee_id = ${id}`;
        await sql`DELETE FROM employees WHERE id = ${id}`;
        await logActivity('employee', id, 'deleted', 'Deleted employee and all related records');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
