import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';

// GET /api/admin/documents/submissions/[id]/download — Secure download
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const userId = new mongoose.Types.ObjectId(session.user.id);

    const submission = await DocumentSubmission.findById(id);
    if (!submission || !submission.file_url) {
        return NextResponse.json({ success: false, message: 'Submission not found or no file' }, { status: 404 });
    }

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
            url: submission.file_url,
            file_name: submission.file_name,
        }
    });
}
