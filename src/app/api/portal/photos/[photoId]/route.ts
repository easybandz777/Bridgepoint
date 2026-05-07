import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import {
    getPortalUserFromCookie,
    isLeadOrManager,
    userHasProjectAccess,
} from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface PhotoFullRow {
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

export async function GET(_req: Request, ctx: { params: Promise<{ photoId: string }> }) {
    const { photoId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await initDB();

    const rows = (await sql`
        SELECT id, project_id, phase_id, uploaded_by_type, uploaded_by_id,
               uploaded_by_name, filename, mime_type, width, height,
               size_bytes, caption, tag, taken_at, created_at
        FROM project_photos WHERE id = ${photoId}
    `) as unknown as PhotoFullRow[];
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const r = rows[0];

    if (!(await userHasProjectAccess(user, r.project_id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
        id: r.id,
        projectId: r.project_id,
        phaseId: r.phase_id,
        uploadedByType: r.uploaded_by_type,
        uploadedById: r.uploaded_by_id,
        uploadedByName: r.uploaded_by_name,
        filename: r.filename,
        mimeType: r.mime_type,
        width: r.width,
        height: r.height,
        sizeBytes: r.size_bytes,
        caption: r.caption,
        tag: r.tag,
        takenAt: r.taken_at,
        createdAt: r.created_at,
    });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ photoId: string }> }) {
    const { photoId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await initDB();

    const rows = (await sql`
        SELECT id, project_id, uploaded_by_type, uploaded_by_id, filename
        FROM project_photos WHERE id = ${photoId}
    `) as unknown as {
        id: string;
        project_id: string;
        uploaded_by_type: string;
        uploaded_by_id: string;
        filename: string;
    }[];
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const photo = rows[0];

    if (!(await userHasProjectAccess(user, photo.project_id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isUploader =
        photo.uploaded_by_type === user.userType && photo.uploaded_by_id === user.userId;
    const isLead = await isLeadOrManager(user);
    if (!isUploader && !isLead) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM project_photos WHERE id = ${photoId}`;

    await logActivity(
        'project',
        photo.project_id,
        'photo_deleted',
        `Photo "${photo.filename}" deleted by ${user.displayName}`,
        `${user.userType}:${user.userId}`,
        { photoId },
    );

    return NextResponse.json({ ok: true });
}
