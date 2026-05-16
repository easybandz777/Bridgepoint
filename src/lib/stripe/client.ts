/**
 * Server-side Stripe client. Lazily instantiated so build-time prerender
 * doesn't choke when the env var is missing in CI.
 *
 * NEVER import this from a 'use client' file — it leaks the secret key.
 */
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (_stripe) return _stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith('sk_test_REPLACE') || key === '') {
        throw new Error(
            'STRIPE_SECRET_KEY is not set. Add it to .env.local (test mode) or Vercel env (production). ' +
            'See https://dashboard.stripe.com/test/apikeys',
        );
    }
    _stripe = new Stripe(key, {
        // Pin a stable API version so Stripe doesn't break us with a default bump.
        // The TS type tracks the SDK's default; cast to satisfy strict checking.
        apiVersion: '2026-04-22.dahlia',
        typescript: true,
        appInfo: {
            name: 'Bridgepointe CRM',
            version: '1.0.0',
        },
    });
    return _stripe;
}

/** Public-mode key for the browser. Safe to expose. */
export function getPublishableKey(): string {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
    return key;
}

export function isStripeConfigured(): boolean {
    const sk = process.env.STRIPE_SECRET_KEY ?? '';
    return sk.length > 0 && !sk.startsWith('sk_test_REPLACE') && !sk.startsWith('sk_live_REPLACE');
}

/** Base URL used for redirect URLs (Checkout success/cancel, return_url). */
export function getAppUrl(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    );
}
