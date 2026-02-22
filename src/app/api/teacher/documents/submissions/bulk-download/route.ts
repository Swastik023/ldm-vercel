import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { Assignment } from '@/models/Academic';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';
import archiver from 'archiver';

const MAX_BULK_FILES = 200;

// POST /api/teacher/documents/submissions/bulk-download — Teacher-scoped ZIP export
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const body = await req.json();
    const { requirementId, status: statusFilter } = body;

    if (!requirementId) {
        return NextResponse.json({ success: false, message: 'requirementId is required' }, { status: 400 });
    }

    // Verify teacher has access to this requirement
    const requirement = await DocumentRequirement.findById(requirementId);
    if (!requirement || !requirement.is_active) {
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

    // Build filter
    const filter: Record<string, unknown> = {
        requirement: new mongoose.Types.ObjectId(requirementId)
    };
    if (statusFilter) filter.status = statusFilter;

    const submissions = await DocumentSubmission.find(filter)
        .populate('student', 'fullName username')
        .limit(MAX_BULK_FILES)
        .lean();

    if (submissions.length === 0) {
        return NextResponse.json({ success: false, message: 'No submissions found' }, { status: 404 });
    }

    const zipName = `${(requirement.title || 'documents').replace(/[^a-zA-Z0-9]/g, '_')}_submissions.zip`;

    // Create ZIP
    const archive = archiver('zip', { zlib: { level: 5 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
    });

    for (const sub of submissions) {
        if (!sub.file_url) continue;
        const studentName = (sub.student as any)?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
        const fileName = `${studentName}_${sub.file_name || 'document'}`;

        try {
            const response = await fetch(sub.file_url);
            if (response.ok && response.body) {
                const buffer = Buffer.from(await response.arrayBuffer());
                archive.append(buffer, { name: fileName });
            }
        } catch {
            // Skip files that fail to download
        }
    }

    archive.finalize();
    const zipBuffer = await archivePromise;

    // Audit log
    await AuditLog.create({
        action: 'BULK_DOWNLOAD',
        entityType: 'DocumentRequirement',
        entityId: requirement._id,
        performedBy: teacherId,
        changes: [{
            field: 'bulk_download',
            old: null,
            new: `${submissions.length} files downloaded by teacher`
        }]
    });

    return new Response(new Uint8Array(zipBuffer), {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${zipName}"`,
            'Content-Length': String(zipBuffer.length)
        }
    });
}
