import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import CoursePricing from '@/models/CoursePricing';

// GET /api/admin/courses/sync-pricing?secret=ldm2025sync
// One-shot endpoint to copy CoursePricing → Program.pricing
// Matches by: exact code → case-insensitive code → course title substring
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== 'ldm2025sync') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Load all programs once (for name matching)
    const allPrograms = await Program.find({}).lean() as any[];
    const pricings = await CoursePricing.find({}).lean() as any[];

    const results: string[] = [];
    let synced = 0;
    let skipped = 0;

    for (const cp of pricings) {
        if (!cp.originalPrice || cp.originalPrice <= 0) {
            skipped++;
            results.push(`SKIP ${cp.courseId} — price is 0`);
            continue;
        }

        // 1. Exact code match (case-insensitive, trimmed)
        let program = allPrograms.find(
            p => p.code?.trim().toLowerCase() === cp.courseId?.trim().toLowerCase()
        );

        // 2. Title match using courseTitle field in CoursePricing
        if (!program && cp.courseTitle) {
            const titleLower = cp.courseTitle.toLowerCase();
            program = allPrograms.find(p =>
                p.name?.toLowerCase().includes(titleLower) ||
                titleLower.includes(p.name?.toLowerCase())
            );
        }

        if (!program) {
            skipped++;
            results.push(`SKIP ${cp.courseId} (${cp.courseTitle || 'no title'}) — no matching program found`);
            continue;
        }

        await Program.findByIdAndUpdate(program._id, {
            $set: {
                'pricing.totalFee': cp.originalPrice,
                'pricing.offerPrice': cp.offerPrice ?? null,
                'pricing.isOfferActive': cp.isOfferActive ?? false,
                'pricing.offerValidUntil': cp.offerValidUntil ?? null,
                'pricing.offerLabel': cp.offerLabel || 'Limited Time Offer',
                'pricing.seatLimit': cp.seatLimit ?? null,
                'pricing.paymentType': 'one-time',
                'pricing.currency': 'INR',
                'pricing.scholarshipAvailable': false,
            }
        });

        synced++;
        results.push(`OK  ${cp.courseId} → "${program.name}" → ₹${cp.originalPrice}${cp.offerPrice ? ` (offer ₹${cp.offerPrice})` : ''}`);
    }

    // Also expose what programs exist vs what's in CoursePricing (debug)
    const programCodes = allPrograms.map(p => p.code);
    const pricingIds = pricings.map(p => p.courseId);

    return NextResponse.json({
        success: true,
        message: `Done: ${synced} fees synced, ${skipped} skipped.`,
        synced,
        skipped,
        results,
        debug: {
            totalPrograms: allPrograms.length,
            totalCoursePricingRecords: pricings.length,
            programCodes,
            pricingCourseIds: pricingIds,
        }
    });
}
