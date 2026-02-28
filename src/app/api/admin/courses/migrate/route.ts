import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import CoursePricing from '@/models/CoursePricing';
import { courseData } from '@/data/courseData';

// POST /api/admin/courses/migrate — one-time migration from courseData + CoursePricing → Program
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || (session as any).user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get existing pricing data
    const pricings = await CoursePricing.find({}).lean();
    const pricingMap = Object.fromEntries(pricings.map(p => [p.courseId, p]));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const c of courseData) {
        const pricing = pricingMap[c.id];

        // Parse duration_years from string like "1 Year", "2.5 Years", "2 Years"
        const durMatch = c.duration.match(/([\d.]+)/);
        const durationYears = durMatch ? parseFloat(durMatch[1]) : 1;
        const totalSemesters = Math.ceil(durationYears * 2);

        // Determine course_type from title
        const courseType = c.title.toLowerCase().includes('certificate') ? 'certificate' : 'diploma';

        // Check if program with this code already exists
        const existing = await Program.findOne({ code: c.id });

        if (existing) {
            // Update website fields if they're empty (don't overwrite existing data)
            const updates: any = {};
            if (!existing.shortDescription && c.description) updates.shortDescription = c.description.slice(0, 200);
            if (!existing.image && c.image) updates.image = c.image;
            if (!existing.eligibilitySummary && c.eligibility) updates.eligibilitySummary = c.eligibility;
            if ((!existing.syllabus || existing.syllabus.length === 0) && c.syllabus) updates.syllabus = c.syllabus;
            if ((!existing.careerOptions || existing.careerOptions.length === 0) && c.career) updates.careerOptions = c.career;
            if (!existing.description && c.description) updates.description = c.description;

            // Merge pricing if not already set
            if (pricing && (!existing.pricing || !existing.pricing.totalFee)) {
                updates.pricing = {
                    totalFee: pricing.originalPrice || 0,
                    paymentType: 'one-time',
                    offerPrice: pricing.offerPrice || null,
                    isOfferActive: pricing.isOfferActive || false,
                    offerValidUntil: pricing.offerValidUntil || null,
                    offerLabel: pricing.offerLabel || 'Limited Time Offer',
                    seatLimit: pricing.seatLimit || null,
                    currency: 'INR',
                    scholarshipAvailable: false,
                };
            }

            if (Object.keys(updates).length > 0) {
                await Program.updateOne({ _id: existing._id }, { $set: updates });
                updated++;
            } else {
                skipped++;
            }
        } else {
            // Create new program
            await Program.create({
                name: c.title,
                code: c.id,
                description: c.description,
                duration_years: durationYears,
                total_semesters: totalSemesters,
                course_type: courseType,
                is_active: true,
                shortDescription: c.description?.slice(0, 200) || '',
                image: c.image || '',
                eligibilitySummary: c.eligibility || '',
                syllabus: c.syllabus || [],
                careerOptions: c.career || [],
                displayOrder: created,
                pricing: pricing ? {
                    totalFee: pricing.originalPrice || 0,
                    paymentType: 'one-time',
                    offerPrice: pricing.offerPrice || null,
                    isOfferActive: pricing.isOfferActive || false,
                    offerValidUntil: pricing.offerValidUntil || null,
                    offerLabel: pricing.offerLabel || 'Limited Time Offer',
                    seatLimit: pricing.seatLimit || null,
                    currency: 'INR',
                    scholarshipAvailable: false,
                } : undefined,
            });
            created++;
        }
    }

    return NextResponse.json({
        success: true,
        message: `Migration complete: ${created} created, ${updated} updated, ${skipped} skipped.`,
    });
}
