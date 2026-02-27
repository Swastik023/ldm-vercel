import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { Assignment } from '@/models/Academic';
import '@/models/Academic';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';
import crypto from 'crypto';

async function verifyTeacherAccess(teacherId: mongoose.Types.ObjectId, requirementId: string) {
    const requirement = await DocumentRequirement.findById(requirementId);
    if (!requirement || !requirement.is_active) return null;

    // Teacher must be the creator OR be assigned to the requirement's subject
    const isCreator = requirement.created_by.toString() === teacherId.toString();
    if (isCreator) return requirement;

    if (requirement.subject) {
        const hasAssignment = await Assignment.findOne({
            teacher: teacherId,
            subject: requirement.subject
        });
        if (hasAssignment) return requirement;
    }

    return null;
}

// GET /api/teacher/documents/requirements/[id] — Get single requirement with stats
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const requirement = await verifyTeacherAccess(teacherId, id);

    if (!requirement) {
        return NextResponse.json({ success: false, message: 'Not found or access denied' }, { status: 404 });
    }

    // Get submission statistics
    const stats = await DocumentSubmission.aggregate([
        { $match: { requirement: requirement._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const populated = await DocumentRequirement.findById(id)
        .populate('scope.program', 'name code')
        .populate('scope.batch', 'name')
        .populate('subject', 'name code')
        .lean();

    return NextResponse.json({
        success: true,
        requirement: populated,
        stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
    });
}

// PUT /api/teacher/documents/requirements/[id] — Update own requirement
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const requirement = await verifyTeacherAccess(teacherId, id);

    if (!requirement) {
        return NextResponse.json({ success: false, message: 'Not found or access denied' }, { status: 404 });
    }

    // Only creator can update
    if (requirement.created_by.toString() !== teacherId.toString()) {
        return NextResponse.json({ success: false, message: 'Only the creator can edit' }, { status: 403 });
    }

    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.title) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.required_file_types) update.required_file_types = body.required_file_types;
    if (body.max_file_size_mb) update.max_file_size_mb = body.max_file_size_mb;
    if (body.is_mandatory !== undefined) update.is_mandatory = body.is_mandatory;
    if (body.due_date !== undefined) update.due_date = body.due_date || null;
    if (body.scope) update.scope = body.scope;
    if (body.requires_file_upload !== undefined) update.requires_file_upload = body.requires_file_upload;

    // Handle custom fields update
    if (body.custom_fields) {
        update.custom_fields = body.custom_fields.map((f: any, i: number) => ({
            field_id: f.field_id || crypto.randomUUID(),
            label: f.label,
            field_type: f.field_type,
            is_required: f.is_required || false,
            placeholder: f.placeholder,
            options: f.options,
            max_length: f.max_length,
            allowed_file_types: f.allowed_file_types,
            max_file_size_mb: f.max_file_size_mb,
            order: f.order ?? i
        }));
    }

    const updated = await DocumentRequirement.findByIdAndUpdate(id, update, { new: true });

    await AuditLog.create({
        action: 'UPDATE',
        entityType: 'DocumentRequirement',
        entityId: requirement._id,
        performedBy: teacherId,
        changes: Object.entries(update).map(([field, newVal]) => ({
            field, old: (requirement as any)[field], new: newVal
        }))
    });

    return NextResponse.json({ success: true, requirement: updated });
}

// DELETE /api/teacher/documents/requirements/[id] — Soft delete own requirement
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const requirement = await verifyTeacherAccess(teacherId, id);

    if (!requirement) {
        return NextResponse.json({ success: false, message: 'Not found or access denied' }, { status: 404 });
    }

    if (requirement.created_by.toString() !== teacherId.toString()) {
        return NextResponse.json({ success: false, message: 'Only the creator can delete' }, { status: 403 });
    }

    await DocumentRequirement.findByIdAndUpdate(id, { is_active: false });

    await AuditLog.create({
        action: 'SOFT_DELETE',
        entityType: 'DocumentRequirement',
        entityId: requirement._id,
        performedBy: teacherId,
        changes: [{ field: 'is_active', old: true, new: false }]
    });

    return NextResponse.json({ success: true, message: 'Requirement deactivated' });
}
