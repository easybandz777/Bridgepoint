import { NextResponse } from 'next/server';
import { generateState, getAuthorizationUrl } from '@/lib/quickbooks/oauth';
import { saveOauthState } from '@/lib/quickbooks/connection';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quickbooks/connect
 *
 * Redirects the admin to Intuit's OAuth consent page. The CSRF state is
 * persisted server-side in qb_oauth_states so the callback can verify and
 * pull the original "redirect after" path.
 */
export async function GET(req: Request) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
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
        // Optional realm hint passed through to Intuit so it pre-selects
        // a specific QBO company on the consent screen. Only digits to
        // avoid forwarding arbitrary strings into the OAuth URL.
        const rawRealm = url.searchParams.get('realm_id') ?? '';
        const realmHint = /^\d{8,}$/.test(rawRealm) ? rawRealm : undefined;
        const state = generateState();
        await saveOauthState(state, 'admin', redirectAfter);
        const authUrl = getAuthorizationUrl(state, undefined, realmHint);
        return NextResponse.redirect(authUrl);
    } catch (e) {
        console.warn('[qb] connect failed:', e);
        return NextResponse.json({ error: 'connect_failed' }, { status: 500 });
    }
}
