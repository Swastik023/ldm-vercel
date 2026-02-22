import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';

// GET /api/admin/documents/submissions — List all submissions
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requirementId = searchParams.get('requirementId');
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (requirementId) query.requirement = requirementId;
    if (status) query.status = status;
    if (studentId) query.student = studentId;

    // Teachers: only see submissions for their own requirements
    if (session.user.role === 'teacher') {
        const teacherRequirements = await DocumentRequirement.find({
            created_by: session.user.id,
            category: 'assignment'
        }).select('_id').lean();

        const requirementIds = teacherRequirements.map(r => r._id);
        query.requirement = requirementId
            ? { $in: requirementIds.filter(id => id.toString() === requirementId) }
            : { $in: requirementIds };
    }

    const total = await DocumentSubmission.countDocuments(query);
    const submissions = await DocumentSubmission.find(query)
        .populate('requirement', 'title category due_date')
        .populate('student', 'fullName email username')
        .populate('review.reviewed_by', 'fullName role')
        .sort({ submitted_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return NextResponse.json({
        success: true,
        submissions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
}
