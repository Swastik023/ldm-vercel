import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import CoursePricing from '@/models/CoursePricing';

// GET /api/admin/courses/sync-pricing?secret=ldm2025sync
// One-shot endpoint to copy CoursePricing → Program.pricing
// No session needed — secured by secret token
export async function GET(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== 'ldm2025sync') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const pricings = await CoursePricing.find({}).lean();
    const results: string[] = [];
    let synced = 0;
    let skipped = 0;

    for (const cp of pricings) {
        if (!cp.originalPrice || cp.originalPrice <= 0) {
            skipped++;
            results.push(`SKIP ${cp.courseId} — no price data`);
            continue;
        }

        const updated = await Program.findOneAndUpdate(
            { code: cp.courseId },
            {
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
            },
            { new: true }
        );

        if (updated) {
            synced++;
            results.push(`OK ${cp.courseId} → ₹${cp.originalPrice}${cp.offerPrice ? ` (offer ₹${cp.offerPrice})` : ''}`);
        } else {
            skipped++;
            results.push(`SKIP ${cp.courseId} — no matching program`);
        }
    }

    return NextResponse.json({
        success: true,
        message: `Done: ${synced} fees synced, ${skipped} skipped.`,
        synced,
        skipped,
        results,
    });
}
