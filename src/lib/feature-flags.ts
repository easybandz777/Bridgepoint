/**
 * Feature flags read from process.env at runtime.
 *
 * Server-side flags live in plain env vars (e.g. QB_DISABLED). Client-side
 * mirrors live in NEXT_PUBLIC_* vars so React components can read them without
 * an extra API round-trip.
 */

/**
 * Returns true when the QuickBooks integration is shut off.
 *
 * When true:
 *   - All QB OAuth / sync / webhook API routes return 410 Gone (with two
 *     intentional exceptions: `/api/quickbooks/status` returns a disabled
 *     payload so the admin UI can render correctly, and
 *     `/api/quickbooks/import-all` stays live so an admin can run one final
 *     reconciling import while disabled).
 *   - The auto-sync cron + library entry points are no-ops.
 *   - Admin UI hides every "Sync to QB" button and renders a disabled banner
 *     on the integrations page.
 *
 * Existing rows (qb_id columns, qb_sync_log, qb_connections) are untouched,
 * so flipping QB_DISABLED back to false is a complete rollback.
 */
export function isQbDisabled(): boolean {
    const flag = (process.env.QB_DISABLED ?? '').toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes';
}
