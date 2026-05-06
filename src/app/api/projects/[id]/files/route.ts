import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM project_files WHERE project_id = ${id}
            ORDER BY created_at DESC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * POST /api/projects/:id/files
 * Metadata-only file registration. Real upload to object storage is out of scope.
 * Body: { filename, url, fileType?, sizeBytes?, category?, uploadedBy?, description? }
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        if (!body.filename || !body.url) {
            return NextResponse.json({ error: 'filename and url are required' }, { status: 400 });
        }

        const fileId = genId('file');

        await sql`
            INSERT INTO project_files (
                id, project_id, filename, file_type, url, size_bytes,
                category, uploaded_by, description
            ) VALUES (
                ${fileId},
                ${id},
                ${body.filename},
                ${body.fileType ?? null},
                ${body.url},
                ${body.sizeBytes ?? null},
                ${body.category ?? 'General'},
                ${body.uploadedBy ?? body.actor ?? null},
                ${body.description ?? ''}
            )
        `;

        await logActivity('project', id, 'file_uploaded', `File "${body.filename}" registered (${body.category ?? 'General'})`, body.actor, { fileId });

        return NextResponse.json({ id: fileId }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
