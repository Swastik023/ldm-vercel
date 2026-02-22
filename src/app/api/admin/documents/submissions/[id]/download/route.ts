import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { AuditLog } from '@/models/AuditLog';
import cloudinary from '@/lib/cloudinary';
import mongoose from 'mongoose';

// GET /api/admin/documents/submissions/[id]/download — Secure signed download
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const submission = await DocumentSubmission.findById(params.id);
    if (!submission || !submission.cloudinary_public_id) {
        return NextResponse.json({ success: false, message: 'Submission not found or no file' }, { status: 404 });
    }

    // Generate signed URL with 15-minute expiry
    const signedUrl = cloudinary.url(submission.cloudinary_public_id, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 900
    });

    // Audit log the download
    await AuditLog.create({
        action: 'DOWNLOAD',
        entityType: 'DocumentSubmission',
        entityId: submission._id,
        performedBy: userId,
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
