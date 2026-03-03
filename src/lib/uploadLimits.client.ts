/**
 * Frontend file size validation utilities.
 *
 * Import MAX_UPLOAD_MB and validateFiles in any upload form component
 * to show clear errors BEFORE the request is sent to the server.
 *
 * Usage:
 *   import { MAX_UPLOAD_MB, validateFiles } from '@/lib/uploadLimits.client';
 *
 *   const error = validateFiles([
 *     { label: 'Passport Photo', file: passportPhotoFile },
 *     { label: 'Marksheet', file: marksheetFile },
 *   ]);
 *   if (error) { setError(error); return; }
 */

/** Must match the constant in src/lib/uploadLimits.ts */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export interface FileEntry {
    label: string;
    file: File | null | undefined;
}

/**
 * Validates an array of files.
 * Returns a user-friendly error string for the first oversized file,
 * or null if all files are within the allowed limit.
 */
export function validateFiles(files: FileEntry[]): string | null {
    for (const { label, file } of files) {
        if (!file) continue;
        if (file.size > MAX_UPLOAD_BYTES) {
            const actualMB = (file.size / (1024 * 1024)).toFixed(1);
            return `${label} is too large (${actualMB} MB). Maximum allowed is ${MAX_UPLOAD_MB} MB. Please compress or reduce the file size before uploading.`;
        }
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
