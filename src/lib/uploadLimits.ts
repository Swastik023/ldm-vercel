/**
 * Global upload limits — single source of truth.
 *
 * Vercel enforces a hard 4.5MB request body limit on all Serverless Functions.
 * We keep our own cap at 4MB to leave headroom for form field overhead.
 *
 * ALL upload routes (API + frontend) must reference these constants.
 */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Max TOTAL payload in a single request (all files combined). */
export const MAX_TOTAL_PAYLOAD_MB = 4;
export const MAX_TOTAL_PAYLOAD_BYTES = MAX_TOTAL_PAYLOAD_MB * 1024 * 1024;

/** User-facing error message — keeps format consistent everywhere. */
export function fileSizeErrorMessage(label: string, actualMB: number): string {
    return `${label} is too large (${actualMB.toFixed(1)} MB). Maximum allowed is ${MAX_UPLOAD_MB} MB.`;
}

/** Returns true if the file is within the per-file limit */
export function isWithinLimit(file: File): boolean {
    return file.size <= MAX_UPLOAD_BYTES;
}

/**
 * Backend guard — checks a single File and returns a 413 Response
 * if it exceeds the per-file limit, or null if acceptable.
 *
 * Usage:
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

/**
 * Backend total payload guard — checks the combined size of multiple files.
 * Use this in routes that accept several files in a single request (e.g. complete-profile).
 *
 * Returns a 413 Response if total exceeds MAX_TOTAL_PAYLOAD_BYTES, otherwise null.
 *
 * Usage:
 *   const guard = checkTotalPayload([passportPhoto, marksheet10, marksheet12, aadhaarFront, aadhaarBack]);
 *   if (guard) return guard;
 */
export function checkTotalPayload(files: (File | null | undefined)[]): Response | null {
    const total = files.reduce((sum, f) => sum + (f?.size ?? 0), 0);
    if (total > MAX_TOTAL_PAYLOAD_BYTES) {
        const totalMB = total / (1024 * 1024);
        return Response.json(
            {
                success: false,
                message: `Total upload size (${totalMB.toFixed(1)} MB) exceeds the ${MAX_TOTAL_PAYLOAD_MB} MB limit. Please reduce file sizes or compress documents before uploading.`
            },
            { status: 413 }
        );
    }
    return null;
}
