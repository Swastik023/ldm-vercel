import mongoose from 'mongoose';

/**
 * Shared input validation helpers.
 * Use across all API routes to enforce consistent data integrity.
 */

/** Basic email format check — catches the obvious garbage without over-rejecting. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
    return EMAIL_RE.test(email);
}

/** Indian 10-digit mobile number. */
const PHONE_RE = /^\d{10}$/;
export function isValidPhone(phone: string): boolean {
    return PHONE_RE.test(phone);
}

/** YYYY-MM format for salary / expense month fields. */
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export function isValidMonth(month: string): boolean {
    return MONTH_RE.test(month);
}

/** Returns true if the string is a valid Mongoose ObjectId hex string. */
export function isValidObjectId(id: unknown): boolean {
    return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Safely parse a number from user input.
 * Returns the number if valid and finite, else null.
 */
export function toSafeNumber(value: unknown): number | null {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n;
}

/**
 * Returns true if `new Date(value)` produces a valid date.
 */
export function isValidDate(value: unknown): boolean {
    if (!value) return false;
    const d = new Date(value as string | number);
    return !isNaN(d.getTime());
}

/**
 * Trim and cap a string to a max length.
 * Returns the trimmed + capped string, or null if empty after trim.
 */
export function sanitizeString(value: unknown, maxLength = 200): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLength);
}

/**
 * Escape special regex characters in user input before passing to MongoDB $regex.
 * Prevents ReDoS and NoSQL regex injection attacks.
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safe JSON body parser. Wraps req.json() in try-catch.
 * Returns [body, null] on success or [null, Response] on failure.
 */
export async function safeParseJSON(req: Request): Promise<[any, Response | null]> {
    try {
        const body = await req.json();
        return [body, null];
    } catch {
        return [
            null,
            Response.json(
                { success: false, message: 'Invalid JSON in request body.' },
                { status: 400 }
            ),
        ];
    }
}
