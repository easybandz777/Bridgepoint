import { NextResponse } from 'next/server';
import sql, { initDB, logActivity, genId } from '@/lib/db';
import { getPortalUserFromCookie, userHasProjectAccess, isLeadOrManager } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'Skipped';

const VALID_STATUSES: Status[] = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'Skipped'];

interface PhaseUpdateBody {
    status?: Status;
    completionPct?: number;
    notes?: string;
    issueText?: string;
}

interface PhaseRow {
    id: string;
    project_id: string;
    name: string;
    status: string;
    completion_pct: number | string;
    actual_start_date: string | null;
    actual_end_date: string | null;
    assigned_sub_ids: string[] | string | null;
    issues: unknown[] | string | null;
    notes: string;
}

interface TimeEntryCountRow {
    n: number | string;
}

function parseStringArray(v: unknown): string[] {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
    if (typeof v === 'string') {
        try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
        } catch {
            return [];
        }
    }
    return [];
}

function parseIssues(v: unknown): unknown[] {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
        try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ projectId: string; phaseId: string }> },
) {
    const { projectId, phaseId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await userHasProjectAccess(user, projectId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await initDB();

        let body: PhaseUpdateBody = {};
        try { body = (await req.json()) as PhaseUpdateBody; } catch { /* empty body ok */ }

        // ─── Load existing phase ───────────────────────────────────────────────
        const rows = (await sql`
            SELECT id, project_id, name, status, completion_pct,
                   actual_start_date, actual_end_date, assigned_sub_ids,
                   issues, notes
            FROM project_phases
            WHERE project_id = ${projectId} AND id = ${phaseId}
            LIMIT 1
        `) as unknown as PhaseRow[];
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
        }
        const phase = rows[0];

        // ─── Authorization check ───────────────────────────────────────────────
        const lead = await isLeadOrManager(user);
        const assignedSubIds = parseStringArray(phase.assigned_sub_ids);
        const isAssigned = assignedSubIds.includes(user.userId);

        let hasTime = false;
        if (!lead && !isAssigned && user.userType === 'employee') {
            const r = (await sql`
                SELECT COUNT(*)::int AS n
                FROM employee_time_entries
                WHERE employee_id = ${user.userId}
                  AND project_id = ${projectId}
                  AND phase_id = ${phaseId}
            `) as unknown as TimeEntryCountRow[];
            hasTime = Number(r[0]?.n ?? 0) > 0;
        }

        if (!lead && !isAssigned && !hasTime) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ─── Validate inputs ───────────────────────────────────────────────────
        let nextStatus: Status | null = null;
        if (body.status !== undefined) {
            if (!VALID_STATUSES.includes(body.status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            nextStatus = body.status;
        }

        let nextPct: number | null = null;
        if (body.completionPct !== undefined) {
            const v = Number(body.completionPct);
            if (!Number.isFinite(v) || v < 0 || v > 100) {
                return NextResponse.json({ error: 'completionPct must be 0-100' }, { status: 400 });
            }
            nextPct = Math.round(v);
        }

        let nextNotes: string | null = null;
        if (body.notes !== undefined) {
            nextNotes = String(body.notes ?? '');
        }

        const issueText = typeof body.issueText === 'string' ? body.issueText.trim() : '';

        // ─── Auto-rules ────────────────────────────────────────────────────────
        const previousStatus = phase.status;
        const previousPct = Math.round(Number(phase.completion_pct ?? 0));

        let nextActualStart = phase.actual_start_date;
        let nextActualEnd = phase.actual_end_date;

        // If completion hits 100, force status=Completed and set actual_end_date if missing.
        if (nextPct === 100) {
            if (!nextStatus || nextStatus !== 'Completed') nextStatus = 'Completed';
            if (!nextActualEnd) nextActualEnd = todayDate();
        }

        // If status moves from Not Started -> In Progress, set actual_start_date.
        if (
            nextStatus === 'In Progress' &&
            (previousStatus === 'Not Started' || previousStatus === '' || !previousStatus) &&
            !nextActualStart
        ) {
            nextActualStart = todayDate();
        }

        // If status moves to Completed and actual_end_date is null, fill it.
        if (nextStatus === 'Completed' && !nextActualEnd) {
            nextActualEnd = todayDate();
        }

        // ─── Issues append ────────────────────────────────────────────────────
        let nextIssuesJson: string | null = null;
        if (issueText) {
            const issues = parseIssues(phase.issues);
            issues.push({
                id: genId('iss'),
                text: issueText,
                created_at: new Date().toISOString(),
                author_type: user.userType,
                author_id: user.userId,
                author_name: user.displayName,
                resolved: false,
            });
            nextIssuesJson = JSON.stringify(issues);
        }

        // ─── Persist ───────────────────────────────────────────────────────────
        const statusParam = nextStatus;
        const pctParam = nextPct;
        const notesParam = nextNotes;
        const actualStartParam = nextActualStart;
        const actualEndParam = nextActualEnd;
        const issuesParam = nextIssuesJson;

        await sql`
            UPDATE project_phases SET
                status            = COALESCE(${statusParam}, status),
                completion_pct    = COALESCE(${pctParam}, completion_pct),
                notes             = COALESCE(${notesParam}, notes),
                actual_start_date = COALESCE(${actualStartParam}, actual_start_date),
                actual_end_date   = COALESCE(${actualEndParam}, actual_end_date),
                issues            = COALESCE(${issuesParam}::jsonb, issues),
                updated_at        = NOW()
            WHERE project_id = ${projectId} AND id = ${phaseId}
        `;

        // ─── Project updates timeline rows ────────────────────────────────────
        const authorTypeStr = user.userType;
        const authorIdStr = user.userId;
        const authorNameStr = user.displayName;
        const phaseName = phase.name;

        const insertProjectUpdate = async (kind: string, bodyText: string, statusChange: string | null, pct: number | null) => {
            await sql`
                INSERT INTO project_updates (
                    id, project_id, phase_id, author_type, author_id, author_name,
                    kind, body, status_change, completion_pct
                ) VALUES (
                    ${genId('pu')},
                    ${projectId},
                    ${phaseId},
                    ${authorTypeStr},
                    ${authorIdStr},
                    ${authorNameStr},
                    ${kind},
                    ${bodyText},
                    ${statusChange},
                    ${pct}
                )
            `;
        };

        if (nextStatus && nextStatus !== previousStatus) {
            await insertProjectUpdate(
                'status_change',
                `${phaseName}: ${previousStatus} → ${nextStatus}`,
                `${previousStatus}|${nextStatus}`,
                nextPct,
            );
            await logActivity(
                'project',
                projectId,
                'phase_status_changed',
                `Phase "${phaseName}" status: ${previousStatus} → ${nextStatus}`,
                `${user.userType}:${user.userId}`,
                { phaseId, from: previousStatus, to: nextStatus },
            );
        } else if (nextPct !== null && nextPct !== previousPct) {
            await insertProjectUpdate(
                'progress',
                `${phaseName}: ${previousPct}% → ${nextPct}%`,
                null,
                nextPct,
            );
            await logActivity(
                'project',
                projectId,
                'phase_progress',
                `Phase "${phaseName}" progress: ${previousPct}% → ${nextPct}%`,
                `${user.userType}:${user.userId}`,
                { phaseId, from: previousPct, to: nextPct },
            );
        } else {
            await logActivity(
                'project',
                projectId,
                'phase_updated',
                `Phase "${phaseName}" updated`,
                `${user.userType}:${user.userId}`,
                { phaseId },
            );
        }

        if (issueText) {
            await insertProjectUpdate(
                'issue',
                `${phaseName}: ${issueText}`,
                null,
                null,
            );
            await logActivity(
                'project',
                projectId,
                'phase_issue_flagged',
                `Issue flagged on "${phaseName}"`,
                `${user.userType}:${user.userId}`,
                { phaseId, issue: issueText },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
