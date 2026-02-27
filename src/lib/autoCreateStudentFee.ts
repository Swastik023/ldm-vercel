/**
 * autoCreateStudentFee.ts
 *
 * Utility to auto-create a default StudentFee record for a newly created/approved student
 * based on their batch's program → CoursePricing.
 *
 * Chain: batchId → Batch.program → Program.code → CoursePricing.courseId
 *
 * Only creates a fee if:
 *   1. The student has a batchId
 *   2. CoursePricing exists for that program code
 *   3. No StudentFee record already exists for this student in the current academic year
 */

import mongoose from 'mongoose';
import { Batch } from '@/models/Academic';
import { Program } from '@/models/Academic';
import CoursePricing from '@/models/CoursePricing';
import { StudentFee } from '@/models/StudentFee';

export async function autoCreateStudentFee(
    studentId: string | mongoose.Types.ObjectId,
    batchId?: string | mongoose.Types.ObjectId | null,
): Promise<{ created: boolean; reason: string }> {
    if (!batchId) return { created: false, reason: 'No batchId provided' };

    // Resolve the currently active academic year (e.g. "2024-25")
    const now = new Date();
    const yearStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // Apr = new session
    const academicYear = `${yearStart}-${String(yearStart + 1).slice(2)}`;

    // Check if a fee record already exists for this student this year
    const existing = await StudentFee.findOne({
        studentId,
        academicYear,
    });
    if (existing) return { created: false, reason: 'Fee record already exists for this academic year' };

    // Load batch → program
    const batch = await Batch.findById(batchId).populate<{ program: { _id: mongoose.Types.ObjectId; code: string; name: string } }>('program', 'code name').lean();
    if (!batch) return { created: false, reason: 'Batch not found' };

    const program = batch.program as { _id: mongoose.Types.ObjectId; code: string; name: string } | null;
    if (!program?.code) return { created: false, reason: 'Batch has no program' };

    // Look up CoursePricing by program code (case-insensitive fallback)
    let pricing = await CoursePricing.findOne({ courseId: program.code }).lean();
    if (!pricing) {
        // Try lowercase / uppercase variants
        pricing = await CoursePricing.findOne({
            courseId: { $regex: `^${program.code}$`, $options: 'i' },
        }).lean();
    }
    if (!pricing) return { created: false, reason: `No CoursePricing found for courseId "${program.code}"` };

    // Determine effective base fee
    const useOffer =
        pricing.isOfferActive &&
        (!pricing.offerValidUntil || new Date() <= new Date(pricing.offerValidUntil));
    const baseFee = useOffer ? pricing.offerPrice : pricing.originalPrice;

    if (!baseFee || baseFee <= 0) return { created: false, reason: 'CoursePricing has zero/invalid price' };

    // Create the default fee record
    await StudentFee.create({
        studentId,
        batchId,
        courseId: pricing.courseId,
        feeLabel: 'Course Fee',
        academicYear,
        baseFee,
        discountPct: 0,
        finalFee: baseFee,
        amountPaid: 0,
        notes: `Auto-populated from ${program.name} course pricing (${pricing.courseId})`,
    });

    return { created: true, reason: `Created fee ₹${baseFee} from ${program.name} pricing` };
}
