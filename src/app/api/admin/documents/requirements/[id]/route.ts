import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { AuditLog } from '@/models/AuditLog';

// GET /api/admin/documents/requirements/[id] — Get single requirement with submission stats
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const requirement = await DocumentRequirement.findById(id)
        .populate('scope.program', 'name code')
        .populate('scope.batch', 'name')
        .populate('scope.students', 'fullName email')
        .populate('subject', 'name code')
        .populate('created_by', 'fullName role')
        .lean();

    if (!requirement) {
        return NextResponse.json({ success: false, message: 'Requirement not found' }, { status: 404 });
    }

    // Teachers can only view their own requirements
    if (session.user.role === 'teacher' && requirement.created_by._id?.toString() !== session.user.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Get submission stats
    const stats = await DocumentSubmission.aggregate([
        { $match: { requirement: requirement._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const submissionStats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        resubmitted: 0
    };
    stats.forEach((s: { _id: string; count: number }) => {
        submissionStats[s._id as keyof typeof submissionStats] = s.count;
        submissionStats.total += s.count;
    });

    return NextResponse.json({ success: true, requirement, submissionStats });
}

// PUT /api/admin/documents/requirements/[id] — Update requirement
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const existing = await DocumentRequirement.findById(id);
    if (!existing) {
        return NextResponse.json({ success: false, message: 'Requirement not found' }, { status: 404 });
    }

    // Teachers can only edit their own assignments
    if (session.user.role === 'teacher' && existing.created_by.toString() !== session.user.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, required_file_types, max_file_size_mb, is_mandatory, due_date, scope, subject } = body;

    // Build update object with only provided fields
    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (required_file_types !== undefined) update.required_file_types = required_file_types;
    if (max_file_size_mb !== undefined) update.max_file_size_mb = max_file_size_mb;
    if (is_mandatory !== undefined) update.is_mandatory = is_mandatory;
    if (due_date !== undefined) update.due_date = due_date;
    if (scope !== undefined) update.scope = scope;
    if (subject !== undefined) update.subject = subject;
    if (body.custom_fields !== undefined) update.custom_fields = body.custom_fields;
    if (body.requires_file_upload !== undefined) update.requires_file_upload = body.requires_file_upload;

    try {
        const updated = await DocumentRequirement.findByIdAndUpdate(id, update, { new: true });

        await AuditLog.create({
            action: 'UPDATE',
            entityType: 'DocumentRequirement',
            entityId: id,
            performedBy: session.user.id,
            changes: Object.entries(update).map(([field, newVal]) => ({
                field,
                old: (existing as any)[field],
                new: newVal
            })),
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({ success: true, requirement: updated });
    } catch (error: any) {
        console.error('Update Requirement Error:', error);
        return NextResponse.json({ success: false, message: 'Update failed',  }, { status: 500 });
    }
}

// DELETE /api/admin/documents/requirements/[id] — Soft-delete (deactivate)
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const existing = await DocumentRequirement.findById(id);
    if (!existing) {
        return NextResponse.json({ success: false, message: 'Requirement not found' }, { status: 404 });
    }

    if (session.user.role === 'teacher' && existing.created_by.toString() !== session.user.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    try {
        await DocumentRequirement.findByIdAndUpdate(id, { is_active: false });

        await AuditLog.create({
            action: 'SOFT_DELETE',
            entityType: 'DocumentRequirement',
            entityId: id,
            performedBy: session.user.id,
            changes: [{ field: 'is_active', old: true, new: false }],
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({ success: true, message: 'Requirement deactivated' });
    } catch (error: any) {
        console.error('Delete Requirement Error:', error);
        return NextResponse.json({ success: false, message: 'Delete failed',  }, { status: 500 });
    }
}
