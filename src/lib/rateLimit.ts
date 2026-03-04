/**
 * In-memory rate limiter for serverless environments (Vercel).
 *
 * Each serverless function instance gets its own memory, so this won't
 * perfectly share state across cold starts. But it catches 95%+ of abuse
 * (bots hammering the same instance) without needing Redis.
 *
 * For ~100 users this is the right trade-off: zero infrastructure cost.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number; // epoch ms
}

/** action → ip → entry */
const store = new Map<string, Map<string, RateLimitEntry>>();

/** Clean up expired entries every 60 seconds */
let lastCleanup = Date.now();
function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;

    for (const [action, ipMap] of store) {
        for (const [ip, entry] of ipMap) {
            if (now > entry.resetAt) ipMap.delete(ip);
        }
        if (ipMap.size === 0) store.delete(action);
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

/**
 * Check and increment a rate-limit counter.
 *
 * @param ip         Client IP address
 * @param action     Namespace (e.g. 'auth-register', 'otp-send')
 * @param maxAttempts Max requests allowed in the window
 * @param windowMs   Window duration in ms (default 60 000 = 1 minute)
 */
export function rateLimit(
    ip: string,
    action: string,
    maxAttempts: number,
    windowMs = 60_000,
): RateLimitResult {
    cleanup();

    if (!store.has(action)) store.set(action, new Map());
    const ipMap = store.get(action)!;

    const now = Date.now();
    let entry = ipMap.get(ip);

    // First request or window expired → reset
    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        ipMap.set(ip, entry);
    }

    entry.count++;

    if (entry.count > maxAttempts) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    return { allowed: true, remaining: maxAttempts - entry.count, retryAfterSeconds: 0 };
}

/**
 * Extract client IP from request headers (works on Vercel).
 */
export function getClientIp(req: Request): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1'
    );
}

/**
 * Helper: check rate limit and return a 429 Response if exceeded, otherwise null.
 *
 * Usage:
 *   const blocked = checkRateLimit(req, 'auth-register', 5);
 *   if (blocked) return blocked;
 */
export function checkRateLimit(
    req: Request,
    action: string,
    maxAttempts: number,
    windowMs = 60_000,
): Response | null {
    const ip = getClientIp(req);
    const result = rateLimit(ip, action, maxAttempts, windowMs);

    if (!result.allowed) {
        return Response.json(
            {
                success: false,
                message: `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(result.retryAfterSeconds),
                },
            },
        );
    }
    return null;
}
