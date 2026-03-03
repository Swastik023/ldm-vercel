/**
 * Global upload limits — single source of truth.
 *
 * Vercel enforces a hard 4.5MB request body limit on all Serverless Functions.
 * We keep our own cap at 4MB to leave headroom for form field overhead.
 *
 * ALL upload routes (API + frontend) must reference this constant.
 */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** User-facing error message — keeps message format consistent everywhere. */
export function fileSizeErrorMessage(label: string, actualMB: number): string {
    return `${label} is too large (${actualMB.toFixed(1)} MB). Maximum allowed is ${MAX_UPLOAD_MB} MB.`;
}

/** Returns true if the file is within the global limit */
export function isWithinLimit(file: File): boolean {
    return file.size <= MAX_UPLOAD_BYTES;
}

/**
 * Backend guard — checks a File object and returns a ready-made 413 Response
 * if the file exceeds the limit, or null if the file is acceptable.
 *
 * Usage inside any API route:
 *   const guard = checkFileSizeBackend('Resume', resume);
 *   if (guard) return guard;
 */
export function checkFileSizeBackend(label: string, file: File | null): Response | null {
    if (!file) return null;
    if (!isWithinLimit(file)) {
        const actualMB = file.size / (1024 * 1024);
        return Response.json(
            { success: false, message: fileSizeErrorMessage(label, actualMB) },
            { status: 413 }
        );
    }
    return null;
}
