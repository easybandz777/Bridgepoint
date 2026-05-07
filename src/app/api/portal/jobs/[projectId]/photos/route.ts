import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { getPortalUserFromCookie, userHasProjectAccess } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

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
    };
}

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await userHasProjectAccess(user, projectId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await initDB();

    const url = new URL(req.url);
    const phaseId = url.searchParams.get('phaseId');
    const tag = url.searchParams.get('tag');

    let rows: PhotoMetaRow[];
    if (phaseId && tag) {
        rows = (await sql`
            SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                   uploaded_by_name, filename, mime_type, width, height,
                   size_bytes, caption, tag, taken_at, created_at
            FROM project_photos
            WHERE project_id = ${projectId}
              AND phase_id = ${phaseId}
              AND tag = ${tag}
            ORDER BY created_at DESC
        `) as unknown as PhotoMetaRow[];
    } else if (phaseId) {
        rows = (await sql`
            SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                   uploaded_by_name, filename, mime_type, width, height,
                   size_bytes, caption, tag, taken_at, created_at
            FROM project_photos
            WHERE project_id = ${projectId}
              AND phase_id = ${phaseId}
            ORDER BY created_at DESC
        `) as unknown as PhotoMetaRow[];
    } else if (tag) {
        rows = (await sql`
            SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                   uploaded_by_name, filename, mime_type, width, height,
                   size_bytes, caption, tag, taken_at, created_at
            FROM project_photos
            WHERE project_id = ${projectId}
              AND tag = ${tag}
            ORDER BY created_at DESC
        `) as unknown as PhotoMetaRow[];
    } else {
        rows = (await sql`
            SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
                   uploaded_by_name, filename, mime_type, width, height,
                   size_bytes, caption, tag, taken_at, created_at
            FROM project_photos
            WHERE project_id = ${projectId}
            ORDER BY created_at DESC
        `) as unknown as PhotoMetaRow[];
    }

    return NextResponse.json(rows.map(shapePhoto));
}

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await userHasProjectAccess(user, projectId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await initDB();

    let form: FormData;
    try {
        form = await req.formData();
    } catch {
        return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 });
    }

    const file = form.get('file');
    if (!(file instanceof Blob)) {
        return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            { error: 'File too large (max 8MB after compression)' },
            { status: 413 },
        );
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const thumb = form.get('thumbnail');
    let thumbBuf: Buffer | null = null;
    if (thumb instanceof Blob) {
        if (thumb.size > MAX_BYTES) {
            return NextResponse.json(
                { error: 'Thumbnail too large' },
                { status: 413 },
            );
        }
        thumbBuf = Buffer.from(await thumb.arrayBuffer());
    }

    const id = genId('photo');
    const phaseId = (form.get('phaseId') as string) || null;
    const caption = (form.get('caption') as string) || '';
    const rawTag = (form.get('tag') as string) || '';
    const validTags = new Set(['before', 'during', 'after', 'issue', 'other']);
    const tag = rawTag && validTags.has(rawTag) ? rawTag : null;
    const filename = (form.get('filename') as string) || 'photo.jpg';
    const mimeType = (form.get('mimeType') as string) || 'image/jpeg';
    const width = parseInt((form.get('width') as string) || '0', 10) || null;
    const height = parseInt((form.get('height') as string) || '0', 10) || null;

    await sql`
        INSERT INTO project_photos (
            id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
            uploaded_by_name, filename, mime_type, width, height,
            size_bytes, caption, tag, taken_at, image_data, thumbnail_data
        ) VALUES (
            ${id}, ${projectId}, ${phaseId}, ${user.userType}, ${user.userId},
            ${user.displayName}, ${filename}, ${mimeType}, ${width}, ${height},
            ${buf.length}, ${caption}, ${tag}, NOW(), ${buf}, ${thumbBuf}
        )
    `;

    await logActivity(
        'project',
        projectId,
        'photo_uploaded',
        `Photo "${filename}" uploaded by ${user.displayName}`,
        `${user.userType}:${user.userId}`,
        { photoId: id, tag, phaseId },
    );

    return NextResponse.json(
        {
            id,
            projectId,
            phaseId,
            uploadedByType: user.userType,
            uploadedById: user.userId,
            uploadedByName: user.displayName,
            filename,
            mimeType,
            width,
            height,
            sizeBytes: buf.length,
            caption,
            tag,
            takenAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
        },
        { status: 201 },
    );
}
