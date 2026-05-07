import { NextResponse } from 'next/server';
import { generateState, getAuthorizationUrl } from '@/lib/quickbooks/oauth';
import { saveOauthState } from '@/lib/quickbooks/connection';

export const dynamic = 'force-dynamic';

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
        const rawRedirect = url.searchParams.get('redirect') ?? '/admin/integrations/quickbooks';
        // SECURITY: only same-origin relative paths are accepted. This
        // prevents the connect → callback flow from being abused as an
        // open-redirect (an attacker would otherwise be able to send a
        // user through OAuth and bounce them to an external site).
        const redirectAfter = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
            ? rawRedirect
            : '/admin/integrations/quickbooks';
        const state = generateState();
        await saveOauthState(state, 'admin', redirectAfter);
        const authUrl = getAuthorizationUrl(state);
        return NextResponse.redirect(authUrl);
    } catch (e) {
        console.warn('[qb] connect failed:', e);
        return NextResponse.json({ error: 'connect_failed' }, { status: 500 });
    }
}
