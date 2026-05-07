import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

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
                thumbnailUrl: `/api/admin/photos/${a.id}/thumbnail`,
                imageUrl: `/api/admin/photos/${a.id}/image`,
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

export async function GET(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
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
                WHERE u.project_id = ${id}
                  AND u.phase_id = ${phaseId}
                  AND u.kind = ${kind}
                ORDER BY u.created_at DESC LIMIT 200
            `) as unknown as UpdateRow[]
            : phaseId
            ? (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${id}
                  AND u.phase_id = ${phaseId}
                ORDER BY u.created_at DESC LIMIT 200
            `) as unknown as UpdateRow[]
            : kind
            ? (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${id}
                  AND u.kind = ${kind}
                ORDER BY u.created_at DESC LIMIT 200
            `) as unknown as UpdateRow[]
            : (await sql`
                SELECT u.id, u.project_id, u.phase_id, u.author_type, u.author_id,
                       u.author_name, u.kind, u.body, u.status_change, u.completion_pct,
                       u.attachments, u.created_at, p.name AS phase_name
                FROM project_updates u
                LEFT JOIN project_phases p ON p.id = u.phase_id
                WHERE u.project_id = ${id}
                ORDER BY u.created_at DESC LIMIT 200
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
