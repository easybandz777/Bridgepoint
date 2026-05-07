/**
 * Portal authentication core.
 *
 * Two distinct user populations share one login surface:
 *   - employees       (W-2 crew: foreman, painters, office staff)
 *   - subcontractors  (1099 trade partners)
 *
 * Both authenticate with email + 4–8 digit PIN. PIN is stored as
 * sha256(salt + pin) hex. Sessions are server-side rows in
 * portal_sessions; the cookie carries an opaque random token whose
 * sha256 matches portal_sessions.token_hash.
 *
 * Schema for portal_credentials and portal_sessions lives in db.ts.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import sql, { initDB, genId } from '@/lib/db';

export const PORTAL_COOKIE = 'bp_portal_session';
export const SESSION_TTL_DAYS = 30;
export const MAX_FAILED_ATTEMPTS = 8;
export const LOCKOUT_MINUTES = 15;

export type PortalUserType = 'employee' | 'subcontractor';

export interface PortalCredentialRow {
    id: string;
    user_type: PortalUserType;
    user_id: string;
    email_lower: string;
    pin_hash: string;
    pin_salt: string;
    enabled: boolean;
    must_change_pin: boolean;
    last_login_at: string | null;
    failed_attempts: number;
    locked_until: string | null;
    created_at: string;
    updated_at: string;
}

export interface PortalSessionRow {
    id: string;
    credential_id: string;
    user_type: PortalUserType;
    user_id: string;
    token_hash: string;
    user_agent: string | null;
    ip_address: string | null;
    expires_at: string;
    revoked_at: string | null;
    created_at: string;
    last_used_at: string;
}

/** Information about the currently authenticated portal user. */
export interface PortalUser {
    credentialId: string;
    userType: PortalUserType;
    userId: string;
    email: string;
    displayName: string;
    role: string;
    avatarUrl: string | null;
    mustChangePin: boolean;
    sessionId: string;
    sessionExpiresAt: string;
}

// ─── PIN hashing ────────────────────────────────────────────────────────────

export function generateSalt(): string {
    return randomBytes(16).toString('hex');
}

export function hashPin(pin: string, salt: string): string {
    const normalized = String(pin).trim();
    return createHash('sha256').update(`${salt}::${normalized}`).digest('hex');
}

export function verifyPin(pin: string, salt: string, expectedHash: string): boolean {
    const actual = hashPin(pin, salt);
    if (actual.length !== expectedHash.length) return false;
    return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expectedHash, 'hex'));
}

// ─── Token + session ────────────────────────────────────────────────────────

export function generateToken(): string {
    return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export interface CreateSessionInput {
    credentialId: string;
    userType: PortalUserType;
    userId: string;
    userAgent?: string | null;
    ipAddress?: string | null;
}

export interface CreatedSession {
    sessionId: string;
    token: string;
    expiresAt: Date;
}

export async function createSession(input: CreateSessionInput): Promise<CreatedSession> {
    await initDB();
    const sessionId = genId('psess');
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await sql`
        INSERT INTO portal_sessions (
            id, credential_id, user_type, user_id, token_hash,
            user_agent, ip_address, expires_at
        ) VALUES (
            ${sessionId},
            ${input.credentialId},
            ${input.userType},
            ${input.userId},
            ${tokenHash},
            ${input.userAgent ?? null},
            ${input.ipAddress ?? null},
            ${expiresAt.toISOString()}
        )
    `;

    return { sessionId, token, expiresAt };
}

export async function revokeSession(token: string): Promise<void> {
    await initDB();
    const tokenHash = hashToken(token);
    await sql`
        UPDATE portal_sessions
        SET revoked_at = NOW()
        WHERE token_hash = ${tokenHash} AND revoked_at IS NULL
    `;
}

export async function revokeAllSessionsForUser(
    userType: PortalUserType,
    userId: string,
): Promise<void> {
    await initDB();
    await sql`
        UPDATE portal_sessions
        SET revoked_at = NOW()
        WHERE user_type = ${userType} AND user_id = ${userId} AND revoked_at IS NULL
    `;
}

// ─── Cookie helpers ─────────────────────────────────────────────────────────

export interface CookieOptions {
    secure?: boolean;
}

export async function setPortalCookie(token: string, expires: Date, opts: CookieOptions = {}) {
    const jar = await cookies();
    jar.set({
        name: PORTAL_COOKIE,
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure: opts.secure ?? process.env.NODE_ENV === 'production',
        path: '/',
        expires,
    });
}

export async function clearPortalCookie() {
    const jar = await cookies();
    jar.set({
        name: PORTAL_COOKIE,
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(0),
    });
}

export async function readPortalCookie(): Promise<string | null> {
    const jar = await cookies();
    return jar.get(PORTAL_COOKIE)?.value ?? null;
}

// ─── Resolve current portal user ────────────────────────────────────────────

/**
 * Resolves the current portal user from the session cookie.
 * Returns null if there is no valid session.
 */
export async function getPortalUserFromCookie(): Promise<PortalUser | null> {
    const token = await readPortalCookie();
    if (!token) return null;
    return getPortalUserFromToken(token);
}

export async function getPortalUserFromToken(token: string): Promise<PortalUser | null> {
    await initDB();
    const tokenHash = hashToken(token);

    const sessRows = (await sql`
        SELECT * FROM portal_sessions
        WHERE token_hash = ${tokenHash}
          AND revoked_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
    `) as unknown as PortalSessionRow[];

    if (sessRows.length === 0) return null;
    const session = sessRows[0];

    // Touch last_used_at — best effort, fire-and-forget.
    sql`UPDATE portal_sessions SET last_used_at = NOW() WHERE id = ${session.id}`.catch(() => {});

    if (session.user_type === 'employee') {
        const rows = await sql`
            SELECT id, first_name, last_name, email, role, avatar_url
            FROM employees WHERE id = ${session.user_id}
        `;
        if (rows.length === 0) return null;
        const r = rows[0] as Record<string, unknown>;
        const credRows = (await sql`
            SELECT must_change_pin FROM portal_credentials WHERE id = ${session.credential_id}
        `) as unknown as { must_change_pin: boolean }[];
        return {
            credentialId: session.credential_id,
            userType: 'employee',
            userId: String(r.id),
            email: String(r.email ?? ''),
            displayName: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || 'Crew Member',
            role: String(r.role ?? 'Crew'),
            avatarUrl: (r.avatar_url as string | null) ?? null,
            mustChangePin: Boolean(credRows[0]?.must_change_pin),
            sessionId: session.id,
            sessionExpiresAt: session.expires_at,
        };
    }

    if (session.user_type === 'subcontractor') {
        const rows = await sql`
            SELECT id, company_name, contact_person, email
            FROM subcontractors WHERE id = ${session.user_id}
        `;
        if (rows.length === 0) return null;
        const r = rows[0] as Record<string, unknown>;
        const credRows = (await sql`
            SELECT must_change_pin FROM portal_credentials WHERE id = ${session.credential_id}
        `) as unknown as { must_change_pin: boolean }[];
        return {
            credentialId: session.credential_id,
            userType: 'subcontractor',
            userId: String(r.id),
            email: String(r.email ?? ''),
            displayName: String(r.company_name ?? r.contact_person ?? 'Subcontractor'),
            role: 'Subcontractor',
            avatarUrl: null,
            mustChangePin: Boolean(credRows[0]?.must_change_pin),
            sessionId: session.id,
            sessionExpiresAt: session.expires_at,
        };
    }

    return null;
}

/**
 * Throws a Response 401 if the request is unauthenticated. Use inside
 * route handlers like:
 *   const user = await requirePortalUser();
 */
export async function requirePortalUser(): Promise<PortalUser> {
    const user = await getPortalUserFromCookie();
    if (!user) {
        throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return user;
}

// ─── Credential management ─────────────────────────────────────────────────

export async function findCredentialByEmail(email: string): Promise<PortalCredentialRow | null> {
    await initDB();
    const lower = String(email).trim().toLowerCase();
    if (!lower) return null;
    const rows = (await sql`
        SELECT * FROM portal_credentials WHERE email_lower = ${lower} LIMIT 1
    `) as unknown as PortalCredentialRow[];
    return rows[0] ?? null;
}

export async function findCredentialForUser(
    userType: PortalUserType,
    userId: string,
): Promise<PortalCredentialRow | null> {
    await initDB();
    const rows = (await sql`
        SELECT * FROM portal_credentials
        WHERE user_type = ${userType} AND user_id = ${userId} LIMIT 1
    `) as unknown as PortalCredentialRow[];
    return rows[0] ?? null;
}

export interface UpsertCredentialInput {
    userType: PortalUserType;
    userId: string;
    email: string;
    pin: string;
    enabled?: boolean;
    mustChangePin?: boolean;
}

export async function upsertCredential(input: UpsertCredentialInput): Promise<PortalCredentialRow> {
    await initDB();
    const lower = String(input.email).trim().toLowerCase();
    if (!lower) throw new Error('email required');
    const cleanPin = String(input.pin).trim();
    if (cleanPin.length < 4 || cleanPin.length > 12) {
        throw new Error('PIN must be 4-12 characters');
    }

    const salt = generateSalt();
    const hash = hashPin(cleanPin, salt);
    const enabled = input.enabled ?? true;
    const mustChange = input.mustChangePin ?? false;

    const existing = await findCredentialForUser(input.userType, input.userId);
    if (existing) {
        await sql`
            UPDATE portal_credentials SET
                email_lower      = ${lower},
                pin_hash         = ${hash},
                pin_salt         = ${salt},
                enabled          = ${enabled},
                must_change_pin  = ${mustChange},
                failed_attempts  = 0,
                locked_until     = NULL,
                updated_at       = NOW()
            WHERE id = ${existing.id}
        `;
        const rows = (await sql`
            SELECT * FROM portal_credentials WHERE id = ${existing.id}
        `) as unknown as PortalCredentialRow[];
        return rows[0];
    }

    // Email-uniqueness: if another user owns that email_lower, fail.
    const conflict = await findCredentialByEmail(lower);
    if (conflict) {
        throw new Error(`Email ${lower} is already used by another portal account`);
    }

    const id = genId('cred');
    await sql`
        INSERT INTO portal_credentials (
            id, user_type, user_id, email_lower, pin_hash, pin_salt,
            enabled, must_change_pin
        ) VALUES (
            ${id}, ${input.userType}, ${input.userId}, ${lower},
            ${hash}, ${salt}, ${enabled}, ${mustChange}
        )
    `;
    const rows = (await sql`SELECT * FROM portal_credentials WHERE id = ${id}`) as unknown as PortalCredentialRow[];
    return rows[0];
}

export async function setEnabled(userType: PortalUserType, userId: string, enabled: boolean) {
    await initDB();
    await sql`
        UPDATE portal_credentials SET enabled = ${enabled}, updated_at = NOW()
        WHERE user_type = ${userType} AND user_id = ${userId}
    `;
    if (!enabled) {
        await revokeAllSessionsForUser(userType, userId);
    }
}

// ─── Login flow ─────────────────────────────────────────────────────────────

export interface LoginResult {
    ok: boolean;
    user?: PortalUser;
    token?: string;
    expiresAt?: Date;
    reason?: 'invalid' | 'disabled' | 'locked' | 'system';
    message?: string;
}

export async function loginWithEmailPin(
    email: string,
    pin: string,
    meta: { userAgent?: string | null; ipAddress?: string | null } = {},
): Promise<LoginResult> {
    try {
        await initDB();
        const cred = await findCredentialByEmail(email);
        if (!cred) return { ok: false, reason: 'invalid', message: 'Email or PIN is incorrect.' };
        if (!cred.enabled) return { ok: false, reason: 'disabled', message: 'Portal access disabled. Contact your manager.' };
        if (cred.locked_until && new Date(cred.locked_until) > new Date()) {
            return { ok: false, reason: 'locked', message: 'Too many failed attempts. Try again later.' };
        }

        if (!verifyPin(pin, cred.pin_salt, cred.pin_hash)) {
            const attempts = cred.failed_attempts + 1;
            const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
                : null;
            await sql`
                UPDATE portal_credentials SET
                    failed_attempts = ${attempts},
                    locked_until    = ${lockedUntil},
                    updated_at      = NOW()
                WHERE id = ${cred.id}
            `;
            return { ok: false, reason: 'invalid', message: 'Email or PIN is incorrect.' };
        }

        await sql`
            UPDATE portal_credentials SET
                failed_attempts = 0,
                locked_until    = NULL,
                last_login_at   = NOW(),
                updated_at      = NOW()
            WHERE id = ${cred.id}
        `;

        const sess = await createSession({
            credentialId: cred.id,
            userType: cred.user_type,
            userId: cred.user_id,
            userAgent: meta.userAgent ?? null,
            ipAddress: meta.ipAddress ?? null,
        });

        const user = await getPortalUserFromToken(sess.token);
        if (!user) return { ok: false, reason: 'system', message: 'Could not load user record.' };

        return { ok: true, user, token: sess.token, expiresAt: sess.expiresAt };
    } catch (e) {
        return { ok: false, reason: 'system', message: String(e) };
    }
}

// ─── Self-service: change PIN ───────────────────────────────────────────────

export async function changeOwnPin(
    userType: PortalUserType,
    userId: string,
    currentPin: string,
    newPin: string,
): Promise<LoginResult> {
    await initDB();
    const cred = await findCredentialForUser(userType, userId);
    if (!cred) return { ok: false, reason: 'invalid', message: 'No credential on file.' };
    if (!verifyPin(currentPin, cred.pin_salt, cred.pin_hash)) {
        return { ok: false, reason: 'invalid', message: 'Current PIN is incorrect.' };
    }
    const clean = String(newPin).trim();
    if (clean.length < 4 || clean.length > 12) {
        return { ok: false, reason: 'invalid', message: 'New PIN must be 4-12 characters.' };
    }
    const salt = generateSalt();
    const hash = hashPin(clean, salt);
    await sql`
        UPDATE portal_credentials SET
            pin_hash         = ${hash},
            pin_salt         = ${salt},
            must_change_pin  = false,
            failed_attempts  = 0,
            locked_until     = NULL,
            updated_at       = NOW()
        WHERE id = ${cred.id}
    `;
    return { ok: true };
}

// ─── Authorization helpers ──────────────────────────────────────────────────

/**
 * Returns true if `user` is associated with the given project. For
 * employees, association = at least one time entry on the project OR
 * being assigned via a phase (assigned_sub_ids includes employee id —
 * unusual, mostly for subs). For subcontractors, association = active
 * row in subcontractor_assignments OR appearing in project_phases
 * assigned_sub_ids.
 */
export async function userHasProjectAccess(user: PortalUser, projectId: string): Promise<boolean> {
    await initDB();
    if (user.userType === 'subcontractor') {
        const a = await sql`
            SELECT 1 FROM subcontractor_assignments
            WHERE subcontractor_id = ${user.userId} AND project_id = ${projectId}
            LIMIT 1
        `;
        if (a.length > 0) return true;
        // Also check project_phases.assigned_sub_ids JSONB array
        const p = await sql`
            SELECT 1 FROM project_phases
            WHERE project_id = ${projectId}
              AND assigned_sub_ids @> ${JSON.stringify([user.userId])}::jsonb
            LIMIT 1
        `;
        return p.length > 0;
    }
    if (user.userType === 'employee') {
        // Employee membership is loose: foreman / lead role gets all,
        // others only see projects where they have time entries.
        const lead = await isLeadOrManager(user);
        if (lead) return projectExists(projectId);
        const r = await sql`
            SELECT 1 FROM employee_time_entries
            WHERE employee_id = ${user.userId} AND project_id = ${projectId}
            LIMIT 1
        `;
        if (r.length > 0) return true;
        // Fall back: also let employees see projects assigned to them via phases
        const p = await sql`
            SELECT 1 FROM project_phases
            WHERE project_id = ${projectId}
              AND assigned_sub_ids @> ${JSON.stringify([user.userId])}::jsonb
            LIMIT 1
        `;
        return p.length > 0;
    }
    return false;
}

async function projectExists(projectId: string): Promise<boolean> {
    const r = await sql`SELECT 1 FROM projects WHERE id = ${projectId} LIMIT 1`;
    return r.length > 0;
}

const LEAD_ROLES = new Set([
    'Lead Painter / Crew Foreman',
    'Project Manager',
    'Estimator / Project Coordinator',
    'Office Manager / Bookkeeper',
]);

export async function isLeadOrManager(user: PortalUser): Promise<boolean> {
    if (user.userType !== 'employee') return false;
    return LEAD_ROLES.has(user.role);
}
