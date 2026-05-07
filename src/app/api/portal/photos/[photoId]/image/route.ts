import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie, userHasProjectAccess } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface ImageRow {
    project_id: string;
    mime_type: string;
    image_data: Buffer | Uint8Array;
}

export async function GET(_req: Request, ctx: { params: Promise<{ photoId: string }> }) {
    const { photoId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await initDB();

    const rows = (await sql`
        SELECT project_id, mime_type, image_data
        FROM project_photos WHERE id = ${photoId}
    `) as unknown as ImageRow[];
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = rows[0];

    if (!(await userHasProjectAccess(user, row.project_id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = Buffer.isBuffer(row.image_data) ? row.image_data : Buffer.from(row.image_data);

    return new Response(new Uint8Array(data), {
        status: 200,
        headers: {
            'Content-Type': row.mime_type || 'image/jpeg',
            'Cache-Control': 'private, max-age=86400',
            'Content-Length': String(data.length),
        },
    });
}
