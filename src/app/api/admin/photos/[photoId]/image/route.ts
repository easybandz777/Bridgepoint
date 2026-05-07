import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ photoId: string }> };

interface ImageRow {
    mime_type: string;
    image_data: Buffer | Uint8Array;
}

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { photoId } = await ctx.params;
        await initDB();

        const rows = (await sql`
            SELECT mime_type, image_data
            FROM project_photos WHERE id = ${photoId}
        `) as unknown as ImageRow[];
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const row = rows[0];

        const data = Buffer.isBuffer(row.image_data) ? row.image_data : Buffer.from(row.image_data);

        return new Response(new Uint8Array(data), {
            status: 200,
            headers: {
                'Content-Type': row.mime_type || 'image/jpeg',
                'Cache-Control': 'private, max-age=86400',
                'Content-Length': String(data.length),
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
