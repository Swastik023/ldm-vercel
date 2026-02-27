import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { Assignment } from '@/models/Academic';
import '@/models/Academic';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

// PUT /api/teacher/documents/submissions/[id]/review — Approve or reject
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const body = await req.json();
    const { action, comment } = body;

    if (!['approve', 'reject'].includes(action)) {
        return NextResponse.json({ success: false, message: 'Action must be approve or reject' }, { status: 400 });
    }

    const submission = await DocumentSubmission.findById(id);
    if (!submission) {
        return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    // Verify teacher has access to this requirement
    const requirement = await DocumentRequirement.findById(submission.requirement);
    if (!requirement) {
        return NextResponse.json({ success: false, message: 'Requirement not found' }, { status: 404 });
    }

    const isCreator = requirement.created_by.toString() === teacherId.toString();
    let hasSubjectAccess = false;
    if (requirement.subject) {
        const assignment = await Assignment.findOne({
            teacher: teacherId,
            subject: requirement.subject
        });
        hasSubjectAccess = !!assignment;
    }

    if (!isCreator && !hasSubjectAccess) {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    // Archive current state to history
    submission.submission_history.push({
        file_url: submission.file_url,
        file_name: submission.file_name,
        cloudinary_public_id: submission.cloudinary_public_id,
        submitted_at: submission.submitted_at,
        status: submission.status,
        review_comment: comment,
        reviewed_by: teacherId,
        form_responses: submission.form_responses
            ? Object.fromEntries(submission.form_responses)
            : undefined
    });

    submission.status = action === 'approve' ? 'approved' : 'rejected';
    submission.review = {
        reviewed_by: teacherId,
        reviewed_at: new Date(),
        comment: comment || undefined
    };
    await submission.save();

    await AuditLog.create({
        action: action === 'approve' ? 'APPROVE' : 'REJECT',
        entityType: 'DocumentSubmission',
        entityId: submission._id,
        performedBy: teacherId,
        changes: [
            { field: 'status', old: submission.status, new: action === 'approve' ? 'approved' : 'rejected' },
            { field: 'review_comment', old: null, new: comment }
        ]
    });

    return NextResponse.json({ success: true, submission });
}
