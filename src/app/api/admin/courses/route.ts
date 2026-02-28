import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import { User } from '@/models/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminOnly(session: any) {
    if (!session || session?.user?.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return null;
}

// GET /api/admin/courses — list all programs with student counts
export async function GET() {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    await dbConnect();
    const programs = await Program.find({}).sort({ displayOrder: 1, name: 1 }).lean();

    // Get student counts per program
    const counts = await User.aggregate([
        { $match: { programId: { $ne: null }, role: 'student' } },
        { $group: { _id: '$programId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c: any) => [c._id.toString(), c.count]));

    const result = programs.map(p => ({
        ...p,
        studentCount: countMap[p._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, courses: result });
}

// POST /api/admin/courses — create a new course
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, message: 'Invalid body' }, { status: 400 });

    const { name, code, description, duration_years, total_semesters, course_type,
        shortDescription, image, eligibilitySummary, syllabus, careerOptions,
        displayOrder, pricing } = body;

    if (!name || !code || !duration_years) {
        return NextResponse.json({ success: false, message: 'Name, code, and duration are required.' }, { status: 400 });
    }

    // Validate pricing
    if (pricing) {
        if (pricing.offerPrice != null && pricing.totalFee != null && pricing.offerPrice > pricing.totalFee) {
            return NextResponse.json({ success: false, message: 'Offer price cannot exceed total fee.' }, { status: 400 });
        }
    }

    await dbConnect();

    // Check unique code
    const existing = await Program.findOne({ code: code.toLowerCase().trim() });
    if (existing) return NextResponse.json({ success: false, message: 'Course code already exists.' }, { status: 400 });

    const course = await Program.create({
        name, code: code.toLowerCase().trim(), description,
        duration_years: Number(duration_years),
        total_semesters: total_semesters ? Number(total_semesters) : Math.ceil(Number(duration_years) * 2),
        course_type: course_type || 'diploma',
        is_active: true,
        shortDescription: shortDescription || '',
        image: image || '',
        eligibilitySummary: eligibilitySummary || '',
        syllabus: syllabus || [],
        careerOptions: careerOptions || [],
        displayOrder: displayOrder ?? 0,
        pricing: pricing || undefined,
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
}
