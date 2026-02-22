import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { AuditLog } from '@/models/AuditLog';

// PUT /api/admin/documents/submissions/[id]/review — Approve or reject
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, comment } = await req.json();

    if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ success: false, message: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    await dbConnect();

    const submission = await DocumentSubmission.findById(id).populate('requirement');
    if (!submission) {
        return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    // Teachers can only review submissions for their own requirements
    if (session.user.role === 'teacher') {
        const requirement = await DocumentRequirement.findById(submission.requirement);
        if (!requirement || requirement.created_by.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    try {
        submission.status = newStatus;
        submission.review = {
            reviewed_by: session.user.id as any,
            reviewed_at: new Date(),
            comment: comment || undefined
        };

        // Also update the latest history entry with review info
        if (submission.submission_history.length > 0) {
            const lastEntry = submission.submission_history[submission.submission_history.length - 1];
            lastEntry.status = newStatus;
            lastEntry.review_comment = comment || undefined;
            lastEntry.reviewed_by = session.user.id as any;
        }

        await submission.save();

        await AuditLog.create({
            action: 'UPDATE',
            entityType: 'DocumentSubmission',
            entityId: submission._id,
            performedBy: session.user.id,
            changes: [{ field: 'status', old: 'pending', new: newStatus }],
            reason: comment,
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({ success: true, submission });
    } catch (error: any) {
        console.error('Review Submission Error:', error);
        return NextResponse.json({ success: false, message: 'Review failed', error: error.message }, { status: 500 });
    }
}
