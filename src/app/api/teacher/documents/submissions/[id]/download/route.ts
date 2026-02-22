import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { Assignment } from '@/models/Academic';
import { AuditLog } from '@/models/AuditLog';
import cloudinary from '@/lib/cloudinary';
import mongoose from 'mongoose';

// GET /api/teacher/documents/submissions/[id]/download — Secure temp download link
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

    // Generate signed URL with 15-minute expiry
    const signedUrl = cloudinary.url(submission.cloudinary_public_id, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 900 // 15 min
    });

    // Audit log the download
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
            url: signedUrl,
            file_name: submission.file_name,
            expires_in: '15 minutes'
        }
    });
}
