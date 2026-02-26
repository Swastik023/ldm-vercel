import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { Assignment } from '@/models/Academic';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

// GET /api/teacher/documents/submissions/[id]/download — Secure download link
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const teacherId = new mongoose.Types.ObjectId(session.user.id);

    const submission = await DocumentSubmission.findById(id);
    if (!submission || !submission.cloudinary_public_id) {
        return NextResponse.json({ success: false, message: 'Submission not found or no file' }, { status: 404 });
    }

    // Verify teacher access
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

    // Return file URL directly — security is enforced above (teacher session + access check)
    await AuditLog.create({
        action: 'DOWNLOAD',
        entityType: 'DocumentSubmission',
        entityId: submission._id,
        performedBy: teacherId,
        changes: [{ field: 'file_name', old: null, new: submission.file_name }]
    });

    return NextResponse.json({
        success: true,
        download: {
            url: submission.file_url,
            file_name: submission.file_name,
        }
    });
}
