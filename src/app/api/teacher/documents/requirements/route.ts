import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { Assignment } from '@/models/Academic';
import { AuditLog } from '@/models/AuditLog';
import mongoose from 'mongoose';
import crypto from 'crypto';

// GET /api/teacher/documents/requirements — List requirements for teacher's assigned subjects
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const teacherId = new mongoose.Types.ObjectId(session.user.id);

    // Get teacher's assigned subject IDs
    const assignments = await Assignment.find({ teacher: teacherId }).lean();
    const subjectIds = [...new Set(assignments.map(a => a.subject.toString()))];

    // Find requirements created by this teacher OR linked to their assigned subjects
    const requirements = await DocumentRequirement.find({
        is_active: true,
        $or: [
            { created_by: teacherId },
            { subject: { $in: subjectIds } }
        ]
    })
        .populate('scope.program', 'name code')
        .populate('scope.batch', 'name')
        .populate('subject', 'name code')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, requirements });
}

// POST /api/teacher/documents/requirements — Create assignment-type requirement
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const teacherId = new mongoose.Types.ObjectId(session.user.id);
    const body = await req.json();

    // Teachers can only create assignment-type requirements
    if (body.category && body.category !== 'assignment') {
        return NextResponse.json(
            { success: false, message: 'Teachers can only create assignment-type requirements' },
            { status: 403 }
        );
    }

    // Verify teacher is assigned to this subject
    if (body.subject) {
        const hasAssignment = await Assignment.findOne({
            teacher: teacherId,
            subject: body.subject
        });
        if (!hasAssignment) {
            return NextResponse.json(
                { success: false, message: 'You are not assigned to this subject' },
                { status: 403 }
            );
        }
    }

    // Build custom_fields with UUIDs
    const customFields = (body.custom_fields || []).map((f: any, i: number) => ({
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

    try {
        const requirement = await DocumentRequirement.create({
            title: body.title,
            description: body.description,
            category: 'assignment',
            required_file_types: body.required_file_types || ['pdf', 'jpg', 'png'],
            max_file_size_mb: body.max_file_size_mb || 5,
            is_mandatory: body.is_mandatory ?? true,
            due_date: body.due_date || undefined,
            scope: body.scope || { type: 'all' },
            subject: body.subject || undefined,
            created_by: teacherId,
            custom_fields: customFields,
            requires_file_upload: body.requires_file_upload ?? true
        });

        await AuditLog.create({
            action: 'CREATE',
            entityType: 'DocumentRequirement',
            entityId: requirement._id,
            performedBy: teacherId,
            changes: [{ field: 'title', old: null, new: body.title }]
        });

        return NextResponse.json({ success: true, requirement }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create requirement' },
            { status: 500 }
        );
    }
}
