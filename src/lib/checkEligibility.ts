/**
 * checkEligibility.ts
 *
 * Pure function that evaluates whether a student is eligible for a job posting.
 * Uses data already available in the system:
 *   - User.programId, User.courseEndDate
 *   - StudentDocuments.documentMeta (10th %, 12th %)
 *   - User.isProfileComplete, User.status
 */

import { IJobPosting } from '@/models/JobPosting';

interface StudentData {
    isProfileComplete: boolean;
    status: string;
    programId?: string;          // ObjectId as string
    courseEndDate?: Date | string | null;
}

interface DocMeta {
    docType: string;
    docPercentage?: string;
}

export interface EligibilityResult {
    eligible: boolean;
    reasons: string[];
}

export function checkEligibility(
    job: IJobPosting,
    student: StudentData,
    documentMeta: DocMeta[] = [],
): EligibilityResult {
    const reasons: string[] = [];

    // 1. Profile & account status
    if (!student.isProfileComplete) {
        reasons.push('Profile is incomplete');
    }
    if (student.status !== 'active') {
        reasons.push('Account is not active');
    }

    // 2. Job not published or past deadline
    if (job.status !== 'published') {
        reasons.push('Job is not open for applications');
    }
    if (job.deadline && new Date(job.deadline) < new Date()) {
        reasons.push('Application deadline has passed');
    }

    // 3. Program eligibility
    const allowedPrograms = job.eligibility?.programs || [];
    if (allowedPrograms.length > 0 && student.programId) {
        const programIds = allowedPrograms.map(p => p.toString());
        if (!programIds.includes(student.programId.toString())) {
            reasons.push('Your program is not eligible for this job');
        }
    } else if (allowedPrograms.length > 0 && !student.programId) {
        reasons.push('No program assigned to your profile');
    }

    // 4. Graduation year eligibility
    const allowedYears = job.eligibility?.graduationYears || [];
    if (allowedYears.length > 0) {
        if (!student.courseEndDate) {
            reasons.push('Graduation year not available on your profile');
        } else {
            const gradYear = new Date(student.courseEndDate).getFullYear();
            if (!allowedYears.includes(gradYear)) {
                reasons.push(`Your graduation year (${gradYear}) is not among eligible years: ${allowedYears.join(', ')}`);
            }
        }
    }

    // 5. 10th percentage
    const min10th = job.eligibility?.min10thPct || 0;
    if (min10th > 0) {
        const meta10 = documentMeta.find(m => m.docType === '10th');
        const pct10 = meta10?.docPercentage ? parseFloat(meta10.docPercentage) : 0;
        if (!pct10 || pct10 < min10th) {
            reasons.push(`10th percentage (${pct10 || 'N/A'}%) is below minimum ${min10th}%`);
        }
    }

    // 6. 12th percentage
    const min12th = job.eligibility?.min12thPct || 0;
    if (min12th > 0) {
        const meta12 = documentMeta.find(m => m.docType === '12th');
        const pct12 = meta12?.docPercentage ? parseFloat(meta12.docPercentage) : 0;
        if (!pct12 || pct12 < min12th) {
            reasons.push(`12th percentage (${pct12 || 'N/A'}%) is below minimum ${min12th}%`);
        }
    }

    return {
        eligible: reasons.length === 0,
        reasons,
    };
}
