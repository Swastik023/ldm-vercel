/**
 * autoCreateStudentFee.ts
 *
 * Utility to auto-create a default StudentFee record for a newly created/approved student
 * based on their batch's program → Program.pricing.
 *
 * Chain: batchId → Batch.program → Program.pricing
 *
 * Only creates a fee if:
 *   1. The student has a batchId
 *   2. Program.pricing has a totalFee > 0
 *   3. No StudentFee record already exists for this student in the current academic year
 */

import mongoose from 'mongoose';
import { Batch, Program } from '@/models/Academic';
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
    const existing = await StudentFee.findOne({ studentId, academicYear });
    if (existing) return { created: false, reason: 'Fee record already exists for this academic year' };

    // Load batch → program
    const batch = await Batch.findById(batchId).populate<{ program: { _id: mongoose.Types.ObjectId; code: string; name: string } }>('program', 'code name').lean();
    if (!batch) return { created: false, reason: 'Batch not found' };

    const batchProgram = batch.program as { _id: mongoose.Types.ObjectId; code: string; name: string } | null;
    if (!batchProgram?.code) return { created: false, reason: 'Batch has no program' };

    // Look up pricing from Program model directly
    const program = await Program.findById(batchProgram._id).lean() as any;
    if (!program?.pricing) return { created: false, reason: `No pricing found for program "${batchProgram.name}"` };

    const pr = program.pricing;
    // Determine effective base fee
    const offerActive = pr.isOfferActive &&
        (!pr.offerValidUntil || new Date() <= new Date(pr.offerValidUntil));
    const baseFee = offerActive && pr.offerPrice ? pr.offerPrice : pr.totalFee;

    if (!baseFee || baseFee <= 0) return { created: false, reason: 'Program has zero/invalid price' };

    // Create the default fee record
    await StudentFee.create({
        studentId,
        batchId,
        courseId: program.code,
        feeLabel: 'Course Fee',
        academicYear,
        baseFee,
        discountPct: 0,
        finalFee: baseFee,
        amountPaid: 0,
        notes: `Auto-populated from ${program.name} pricing`,
    });

    return { created: true, reason: `Created fee ₹${baseFee} from ${program.name} pricing` };
}
