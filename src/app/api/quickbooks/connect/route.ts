import { NextResponse } from 'next/server';
import { generateState, getAuthorizationUrl } from '@/lib/quickbooks/oauth';
import { saveOauthState } from '@/lib/quickbooks/connection';

/**
 * GET /api/quickbooks/connect
 *
 * Redirects the admin to Intuit's OAuth consent page. The CSRF state is
 * persisted server-side in qb_oauth_states so the callback can verify and
 * pull the original "redirect after" path.
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const redirectAfter = url.searchParams.get('redirect') ?? '/admin/integrations/quickbooks';
        const state = generateState();
        await saveOauthState(state, 'admin', redirectAfter);
        const authUrl = getAuthorizationUrl(state);
        return NextResponse.redirect(authUrl);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
