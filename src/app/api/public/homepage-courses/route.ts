import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';

// GET /api/public/homepage-courses — courses marked showOnHomepage, sorted by displayOrder
export async function GET() {
    try {
        await dbConnect();
        const programs = await Program.find({ is_active: true, showOnHomepage: true })
            .sort({ displayOrder: 1, name: 1 })
            .limit(8)
            .lean();

        const result = programs.map(p => ({
            id: (p as any).code,
            _id: String((p as any)._id),
            title: (p as any).name,
            duration: `${(p as any).duration_years} Year${(p as any).duration_years !== 1 ? 's' : ''}`,
            eligibility: (p as any).eligibilitySummary || '',
            image: (p as any).image || '',
            description: (p as any).description || (p as any).shortDescription || '',
            course_type: (p as any).course_type || 'diploma',
            displayOrder: (p as any).displayOrder || 0,
        }));

        return NextResponse.json({ success: true, courses: result });
    } catch (err) {
        console.error('[Homepage Courses GET]', err);
        return NextResponse.json({ success: false, courses: [] }, { status: 500 });
    }
}
