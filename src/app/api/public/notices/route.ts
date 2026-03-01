import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notice from '@/models/Notice';

// GET /api/public/notices - returns active notices respecting startDate / endDate
export async function GET() {
    try {
        await dbConnect();
        const now = new Date();
        const notices = await Notice.find({
            isActive: true,
            // Respect scheduled startDate
            $and: [
                {
                    $or: [
                        { startDate: { $exists: false } },
                        { startDate: null },
                        { startDate: { $lte: now } },
                    ],
                },
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gte: now } },
                    ],
                },
            ],
        })
            .select('title content category priority startDate endDate attachmentUrl attachmentName file_type createdAt')
            .sort({ priority: -1, createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, notices });
    } catch (error) {
        console.error('Notices API error:', error);
        return NextResponse.json({ success: false, notices: [], message: 'Failed to fetch notices' }, { status: 500 });
    }
}
