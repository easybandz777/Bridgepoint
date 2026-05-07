import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

interface PhotoMetaRow {
    id: string;
    project_id: string;
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

function shapePhoto(row: PhotoMetaRow) {
    return {
        id: row.id,
        projectId: row.project_id,
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

export async function GET(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        const url = new URL(req.url);
        const tag = url.searchParams.get('tag');
        const phaseId = url.searchParams.get('phaseId');
        const uploadedBy = url.searchParams.get('uploadedBy');

        let rows: PhotoMetaRow[];
        if (tag && phaseId && uploadedBy) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND tag = ${tag}
                  AND phase_id = ${phaseId}
                  AND uploaded_by_id = ${uploadedBy}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else if (tag && phaseId) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND tag = ${tag}
                  AND phase_id = ${phaseId}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else if (tag && uploadedBy) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND tag = ${tag}
                  AND uploaded_by_id = ${uploadedBy}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else if (phaseId && uploadedBy) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND phase_id = ${phaseId}
                  AND uploaded_by_id = ${uploadedBy}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else if (tag) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND tag = ${tag}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else if (phaseId) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND phase_id = ${phaseId}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else if (uploadedBy) {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                  AND uploaded_by_id = ${uploadedBy}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        } else {
            rows = (await sql`
                SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                       uploaded_by_name, filename, mime_type, width, height,
                       size_bytes, caption, tag, taken_at, created_at,
                       (thumbnail_data IS NOT NULL) AS has_thumbnail
                FROM project_photos
                WHERE project_id = ${id}
                ORDER BY created_at DESC
            `) as unknown as PhotoMetaRow[];
        }

        return NextResponse.json(rows.map(shapePhoto));
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
