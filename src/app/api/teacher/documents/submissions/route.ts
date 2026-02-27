import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { Assignment } from '@/models/Academic';
import '@/models/Academic';
import mongoose from 'mongoose';

// GET /api/teacher/documents/submissions — List submissions for teacher's requirements
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const requirementId = searchParams.get('requirement');

    // Get teacher's assigned subject IDs
    const assignments = await Assignment.find({ teacher: teacherId }).lean();
    const subjectIds = [...new Set(assignments.map(a => a.subject.toString()))];

    // Find requirements this teacher can access
    const requirementIds = await DocumentRequirement.find({
        is_active: true,
        $or: [
            { created_by: teacherId },
            { subject: { $in: subjectIds } }
        ]
    }).distinct('_id');

    // Build submission filter
    const filter: Record<string, unknown> = {
        requirement: requirementId
            ? new mongoose.Types.ObjectId(requirementId)
            : { $in: requirementIds }
    };
    if (status) filter.status = status;

    const total = await DocumentSubmission.countDocuments(filter);
    const submissions = await DocumentSubmission.find(filter)
        .populate('requirement', 'title category due_date custom_fields')
        .populate('student', 'fullName email username')
        .sort({ submitted_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return NextResponse.json({
        success: true,
        submissions,
        pagination: { total, page, totalPages: Math.ceil(total / limit) }
    });
}
