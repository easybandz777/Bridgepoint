import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { rowToCustomer, type CustomerRow } from '@/lib/customers';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const rows = (await sql`SELECT * FROM customers WHERE id = ${id}`) as unknown as CustomerRow[];
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const customer = rowToCustomer(rows[0]);

        // Linked entities
        const projects = await sql`
            SELECT id, project_number, name, status, start_date, end_date, estimated_revenue
            FROM projects WHERE customer_id = ${id} ORDER BY created_at DESC
        `;
        const invoices = await sql`
            SELECT id, invoice_number, status, issued_date, due_date, total, amount_paid, amount_due
            FROM invoices WHERE customer_id = ${id} ORDER BY issued_date DESC
        `;
        const estimates = await sql`
            SELECT id, estimate_number, status, created_date, total
            FROM estimates WHERE customer_id = ${id} ORDER BY created_date DESC
        `;

        return NextResponse.json({ customer, projects, invoices, estimates });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const b = await req.json();

        const billJson = b.billAddress != null ? JSON.stringify(b.billAddress) : null;
        const shipJson = b.shipAddress != null ? JSON.stringify(b.shipAddress) : null;
        const tagsJson = b.tags != null ? JSON.stringify(b.tags) : null;

        await sql`
            UPDATE customers SET
                display_name              = COALESCE(${b.displayName ?? null}, display_name),
                customer_type             = COALESCE(${b.customerType ?? null}, customer_type),
                company_name              = COALESCE(${b.companyName ?? null}, company_name),
                first_name                = COALESCE(${b.firstName ?? null}, first_name),
                last_name                 = COALESCE(${b.lastName ?? null}, last_name),
                email                     = COALESCE(${b.email ?? null}, email),
                phone                     = COALESCE(${b.phone ?? null}, phone),
                mobile                    = COALESCE(${b.mobile ?? null}, mobile),
                fax                       = COALESCE(${b.fax ?? null}, fax),
                website                   = COALESCE(${b.website ?? null}, website),
                bill_address              = COALESCE(${billJson}::jsonb, bill_address),
                ship_address              = COALESCE(${shipJson}::jsonb, ship_address),
                notes                     = COALESCE(${b.notes ?? null}, notes),
                tags                      = COALESCE(${tagsJson}::jsonb, tags),
                active                    = COALESCE(${b.active ?? null}::boolean, active),
                payment_method            = COALESCE(${b.paymentMethod ?? null}, payment_method),
                payment_terms             = COALESCE(${b.paymentTerms ?? null}, payment_terms),
                preferred_delivery_method = COALESCE(${b.preferredDeliveryMethod ?? null}, preferred_delivery_method),
                tax_exempt                = COALESCE(${b.taxExempt ?? null}::boolean, tax_exempt),
                parent_customer_id        = COALESCE(${b.parentCustomerId ?? null}, parent_customer_id),
                is_job                    = COALESCE(${b.isJob ?? null}::boolean, is_job),
                updated_at                = NOW()
            WHERE id = ${id}
        `;

        await logActivity('customer', id, 'updated', 'Updated customer record');

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        // Soft delete — keep historical references intact.
        await sql`UPDATE customers SET active = false, updated_at = NOW() WHERE id = ${id}`;
        await logActivity('customer', id, 'deactivated', 'Customer deactivated');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
