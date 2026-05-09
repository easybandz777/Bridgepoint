/**
 * One-shot token injection endpoint for bootstrapping a real-realm connection
 * when Intuit's standard OAuth flow won't authorize against our production
 * realm under the Builder developer tier. The tokens were obtained manually
 * via the OAuth Playground.
 *
 * Guarded by an INJECT_TOKEN_SECRET env var. Remove this file after use.
 */

import { NextResponse } from 'next/server';
import { saveConnection } from '@/lib/quickbooks/connection';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const secret = req.headers.get('x-inject-secret');
  if (!secret || secret !== process.env.INJECT_TOKEN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    realmId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    environment: 'production' | 'sandbox';
    companyName?: string;
  };

  if (!body.realmId || !body.accessToken || !body.refreshToken) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const conn = await saveConnection({
    realmId: body.realmId,
    environment: body.environment,
    tokens: {
      access_token: body.accessToken,
      refresh_token: body.refreshToken,
      expires_in: body.expiresIn,
      x_refresh_token_expires_in: body.refreshExpiresIn,
      token_type: 'Bearer',
      scope: 'com.intuit.quickbooks.accounting',
    },
    actor: 'manual_playground_injection',
    companyName: body.companyName ?? null,
  });

  return NextResponse.json({ ok: true, id: conn.id, realmId: conn.realm_id });
}
