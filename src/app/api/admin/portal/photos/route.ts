import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CrossPhotoRow {
    id: string;
    project_id: string;
    project_name: string | null;
    project_number: string | null;
    phase_id: string | null;
    uploaded_by_type: string;
    uploaded_by_id: string;
    uploaded_by_name: string;
    filename: string;
    mime_type: string;
    width: number | null;
    height: number | null;
    size_bytes: number;
    caption: string;
    tag: string | null;
    taken_at: string | null;
    created_at: string;
    has_thumbnail: boolean;
}

interface CountRow {
    total: string | number;
}

function shape(row: CrossPhotoRow) {
    return {
        id: row.id,
        projectId: row.project_id,
        projectName: row.project_name,
        projectNumber: row.project_number,
        phaseId: row.phase_id,
        uploadedByType: row.uploaded_by_type,
        uploadedById: row.uploaded_by_id,
        uploadedByName: row.uploaded_by_name,
        filename: row.filename,
        mimeType: row.mime_type,
        width: row.width,
        height: row.height,
        sizeBytes: row.size_bytes,
        caption: row.caption,
        tag: row.tag,
        takenAt: row.taken_at,
        createdAt: row.created_at,
        hasThumbnail: row.has_thumbnail,
    };
}

function clampInt(v: string | null, def: number, min: number, max: number): number {
    if (!v) return def;
    const parsed = parseInt(v, 10);
    if (!Number.isFinite(parsed)) return def;
    return Math.max(min, Math.min(max, parsed));
}

export async function GET(req: Request) {
    try {
        await initDB();

        const url = new URL(req.url);
        const tag = url.searchParams.get('tag');
        const projectId = url.searchParams.get('projectId');
        const uploadedByType = url.searchParams.get('uploadedByType');
        const uploadedById = url.searchParams.get('uploadedById');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const limit = clampInt(url.searchParams.get('limit'), 60, 1, 200);
        const offset = clampInt(url.searchParams.get('offset'), 0, 0, 100000);

        const tagF = tag ?? null;
        const projectIdF = projectId ?? null;
        const uploadedByTypeF = uploadedByType ?? null;
        const uploadedByIdF = uploadedById ?? null;
        const fromF = from ?? null;
        const toF = to ?? null;

        const rows = (await sql`
            SELECT
                ph.id, ph.project_id, p.name AS project_name, p.project_number,
                ph.phase_id, ph.uploaded_by_type, ph.uploaded_by_id, ph.uploaded_by_name,
                ph.filename, ph.mime_type, ph.width, ph.height, ph.size_bytes,
                ph.caption, ph.tag, ph.taken_at, ph.created_at,
                (ph.thumbnail_data IS NOT NULL) AS has_thumbnail
            FROM project_photos ph
            LEFT JOIN projects p ON p.id = ph.project_id
            WHERE
                (${tagF}::text IS NULL OR ph.tag = ${tagF})
                AND (${projectIdF}::text IS NULL OR ph.project_id = ${projectIdF})
                AND (${uploadedByTypeF}::text IS NULL OR ph.uploaded_by_type = ${uploadedByTypeF})
                AND (${uploadedByIdF}::text IS NULL OR ph.uploaded_by_id = ${uploadedByIdF})
                AND (${fromF}::timestamptz IS NULL OR ph.created_at >= ${fromF}::timestamptz)
                AND (${toF}::timestamptz IS NULL OR ph.created_at <= ${toF}::timestamptz)
            ORDER BY ph.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `) as unknown as CrossPhotoRow[];

        const totalRows = (await sql`
            SELECT COUNT(*)::text AS total
            FROM project_photos ph
            WHERE
                (${tagF}::text IS NULL OR ph.tag = ${tagF})
                AND (${projectIdF}::text IS NULL OR ph.project_id = ${projectIdF})
                AND (${uploadedByTypeF}::text IS NULL OR ph.uploaded_by_type = ${uploadedByTypeF})
                AND (${uploadedByIdF}::text IS NULL OR ph.uploaded_by_id = ${uploadedByIdF})
                AND (${fromF}::timestamptz IS NULL OR ph.created_at >= ${fromF}::timestamptz)
                AND (${toF}::timestamptz IS NULL OR ph.created_at <= ${toF}::timestamptz)
        `) as unknown as CountRow[];

        const total = totalRows.length > 0 ? parseInt(String(totalRows[0].total), 10) || 0 : 0;

        return NextResponse.json({
            photos: rows.map(shape),
            total,
            limit,
            offset,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
