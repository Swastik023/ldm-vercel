/**
 * Frontend file size validation utilities.
 *
 * Import MAX_UPLOAD_MB and validateFiles in any upload form component
 * to show clear errors BEFORE the request is sent to the server.
 *
 * Two checks are enforced:
 *  1. Per-file limit: no single file may exceed MAX_UPLOAD_MB.
 *  2. Total payload limit: sum of all files in one request must not exceed
 *     MAX_TOTAL_PAYLOAD_MB (Vercel hard cap is 4.5MB; we use 4MB to leave
 *     headroom for form-field overhead).
 */

/** Must match the constant in src/lib/uploadLimits.ts */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Total payload cap for a single request (all files combined). */
export const MAX_TOTAL_PAYLOAD_MB = 4;
export const MAX_TOTAL_PAYLOAD_BYTES = MAX_TOTAL_PAYLOAD_MB * 1024 * 1024;

export interface FileEntry {
    label: string;
    file: File | null | undefined;
}

/**
 * Validates an array of files.
 *
 * Returns a user-friendly error string if:
 *  - Any individual file exceeds MAX_UPLOAD_MB, OR
 *  - The combined size of all files exceeds MAX_TOTAL_PAYLOAD_MB
 *
 * Returns null if all files are acceptable.
 */
export function validateFiles(files: FileEntry[]): string | null {
    let totalBytes = 0;

    for (const { label, file } of files) {
        if (!file) continue;

        // Per-file check
        if (file.size > MAX_UPLOAD_BYTES) {
            const actualMB = (file.size / (1024 * 1024)).toFixed(1);
            return `${label} is too large (${actualMB} MB). Maximum allowed per file is ${MAX_UPLOAD_MB} MB. Please compress or reduce the file size.`;
        }

        totalBytes += file.size;
    }

    // Total payload check — catches the case where many small files add up
    if (totalBytes > MAX_TOTAL_PAYLOAD_BYTES) {
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
        return `Total upload size (${totalMB} MB) exceeds the ${MAX_TOTAL_PAYLOAD_MB} MB limit. Please reduce file sizes or compress documents before uploading.`;
    }

    return null;
}

/**
 * Single-file convenience wrapper.
 */
export function validateFile(label: string, file: File | null | undefined): string | null {
    if (!file) return null;
    return validateFiles([{ label, file }]);
}
