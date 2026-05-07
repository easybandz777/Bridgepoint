import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { getPortalUserFromCookie, userHasProjectAccess } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface UpdateRow {
    id: string;
    project_id: string;
    phase_id: string | null;
    author_type: string;
    author_id: string;
    author_name: string;
    kind: string;
    body: string;
    status_change: string | null;
    completion_pct: string | number | null;
    attachments: unknown;
    created_at: string;
    phase_name: string | null;
}

interface PhotoLite {
    id: string;
    filename: string;
    mime_type: string;
}

interface AttachmentInput {
    type?: string;
    id?: string;
    [k: string]: unknown;
}

const VALID_KINDS = new Set(['note', 'progress', 'issue', 'completion', 'status_change']);

function num(v: string | number | null | undefined): number | null {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
}

function parseAttachments(v: unknown): AttachmentInput[] {
    if (Array.isArray(v)) return v.filter((x): x is AttachmentInput => typeof x === 'object' && x !== null);
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

function shapeUpdate(row: UpdateRow, photoMap: Map<string, PhotoLite>) {
    const rawAttachments = parseAttachments(row.attachments);
    const attachments = rawAttachments.map((a) => {
        if (a.type === 'photo' && typeof a.id === 'string') {
            const p = photoMap.get(a.id);
            return {
                type: 'photo' as const,
                id: a.id,
                filename: p?.filename ?? '',
                mimeType: p?.mime_type ?? 'image/jpeg',
                thumbnailUrl: `/api/portal/photos/${a.id}/thumbnail`,
            };
        }
        return a;
    });
    return {
        id: row.id,
        projectId: row.project_id,
        phaseId: row.phase_id,
        phaseName: row.phase_name ?? null,
        authorType: row.author_type,
        authorId: row.author_id,
        authorName: row.author_name,
        kind: row.kind,
        body: row.body,
        statusChange: row.status_change,
        completionPct: num(row.completion_pct),
        attachments,
        createdAt: row.created_at,
    };
}

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await userHasProjectAccess(user, projectId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await initDB();
        const url = new URL(req.url);
        const phaseId = url.searchParams.get('phaseId');
        const kind = url.searchParams.get('kind');

        const rows = phaseId && kind
            ? (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${projectId}
                  AND u.phase_id = ${phaseId}
                  AND u.kind = ${kind}
                ORDER BY u.created_at DESC LIMIT 100
            `) as unknown as UpdateRow[]
            : phaseId
            ? (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${projectId}
                  AND u.phase_id = ${phaseId}
                ORDER BY u.created_at DESC LIMIT 100
            `) as unknown as UpdateRow[]
            : kind
            ? (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${projectId}
                  AND u.kind = ${kind}
                ORDER BY u.created_at DESC LIMIT 100
            `) as unknown as UpdateRow[]
            : (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${projectId}
                ORDER BY u.created_at DESC LIMIT 100
            `) as unknown as UpdateRow[];

        const photoIds = new Set<string>();
        for (const r of rows) {
            for (const att of parseAttachments(r.attachments)) {
                if (att.type === 'photo' && typeof att.id === 'string') {
                    photoIds.add(att.id);
                }
            }
        }

        const photoMap = new Map<string, PhotoLite>();
        if (photoIds.size > 0) {
            const ids = Array.from(photoIds);
            const photoRows = (await sql`
                SELECT id, filename, mime_type
                FROM project_photos
                WHERE id = ANY(${ids}::text[])
            `) as unknown as PhotoLite[];
            for (const p of photoRows) photoMap.set(p.id, p);
        }

        return NextResponse.json(rows.map((r) => shapeUpdate(r, photoMap)));
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await userHasProjectAccess(user, projectId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await initDB();

        let payload: Record<string, unknown>;
        try {
            payload = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const body = String(payload.body ?? '').trim();
        if (!body) {
            return NextResponse.json({ error: 'Body required' }, { status: 400 });
        }

        const rawKind = String(payload.kind ?? 'note');
        const kind = VALID_KINDS.has(rawKind) ? rawKind : 'note';
        const phaseId = typeof payload.phaseId === 'string' && payload.phaseId ? payload.phaseId : null;
        const statusChange = typeof payload.statusChange === 'string' && payload.statusChange
            ? payload.statusChange
            : null;
        const completionPctRaw = payload.completionPct;
        let completionPct: number | null = null;
        if (typeof completionPctRaw === 'number' && Number.isFinite(completionPctRaw)) {
            completionPct = Math.max(0, Math.min(100, completionPctRaw));
        } else if (typeof completionPctRaw === 'string' && completionPctRaw.trim() !== '') {
            const n = parseFloat(completionPctRaw);
            if (Number.isFinite(n)) completionPct = Math.max(0, Math.min(100, n));
        }

        const rawAttachments = Array.isArray(payload.attachments) ? payload.attachments : [];
        const attachments = rawAttachments
            .filter((a): a is AttachmentInput => typeof a === 'object' && a !== null)
            .map((a) => ({
                type: typeof a.type === 'string' ? a.type : 'photo',
                id: typeof a.id === 'string' ? a.id : '',
            }))
            .filter((a) => a.id);

        const id = genId('upd');
        const authorType = user.userType === 'employee' || user.userType === 'subcontractor'
            ? user.userType
            : 'employee';

        await sql`
            INSERT INTO project_updates (
                id, project_id, phase_id, author_type, author_id, author_name,
                kind, body, status_change, completion_pct, attachments
            ) VALUES (
                ${id}, ${projectId}, ${phaseId}, ${authorType}, ${user.userId}, ${user.displayName},
                ${kind}, ${body}, ${statusChange}, ${completionPct},
                ${JSON.stringify(attachments)}::jsonb
            )
        `;

        const summary = body.length > 100 ? `${body.slice(0, 97)}…` : body;
        await logActivity(
            'project',
            projectId,
            'update_posted',
            `${user.displayName} posted: ${summary}`,
            `${user.userType}:${user.userId}`,
            { updateId: id, kind, phaseId },
        );

        const rows = (await sql`
            SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                   u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                   u.attachments, u.created_at, p.name AS phase_name
            FROM project_updates u
            LEFT JOIN project_phases p ON p.id = u.phase_id
            WHERE u.id = ${id}
            LIMIT 1
        `) as unknown as UpdateRow[];

        const photoMap = new Map<string, PhotoLite>();
        const attachmentIds = attachments.map((a) => a.id);
        if (attachmentIds.length > 0) {
            const photoRows = (await sql`
                SELECT id, filename, mime_type
                FROM project_photos
                WHERE id = ANY(${attachmentIds}::text[])
            `) as unknown as PhotoLite[];
            for (const p of photoRows) photoMap.set(p.id, p);
        }

        return NextResponse.json(shapeUpdate(rows[0], photoMap), { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
