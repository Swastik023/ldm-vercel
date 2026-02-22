import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { AuditLog } from '@/models/AuditLog';
import crypto from 'crypto';

// GET /api/admin/documents/requirements — List all requirements
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const scopeType = searchParams.get('scopeType');
    const programId = searchParams.get('programId');
    const batchId = searchParams.get('batchId');
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (activeOnly) query.is_active = true;
    if (category) query.category = category;
    if (scopeType) query['scope.type'] = scopeType;
    if (programId) query['scope.program'] = programId;
    if (batchId) query['scope.batch'] = batchId;

    // Teachers can only see their own assignment requirements
    if (session.user.role === 'teacher') {
        query.created_by = session.user.id;
        query.category = 'assignment';
    }

    const requirements = await DocumentRequirement.find(query)
        .populate('scope.program', 'name code')
        .populate('scope.batch', 'name')
        .populate('scope.students', 'fullName email')
        .populate('subject', 'name code')
        .populate('created_by', 'fullName role')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, requirements });
}

// POST /api/admin/documents/requirements — Create a new requirement
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, required_file_types, max_file_size_mb, is_mandatory, due_date, scope, subject } = body;

    // Validation
    if (!title || !category || !scope?.type) {
        return NextResponse.json({ success: false, message: 'Title, category, and scope type are required' }, { status: 400 });
    }

    // Teachers can only create assignment-type requirements
    if (session.user.role === 'teacher' && category !== 'assignment') {
        return NextResponse.json({ success: false, message: 'Teachers can only create assignment requirements' }, { status: 403 });
    }

    // Scope validation
    if (scope.type === 'program' && !scope.program) {
        return NextResponse.json({ success: false, message: 'Program ID required for program scope' }, { status: 400 });
    }
    if (scope.type === 'batch' && !scope.batch) {
        return NextResponse.json({ success: false, message: 'Batch ID required for batch scope' }, { status: 400 });
    }
    if (scope.type === 'student' && (!scope.students || scope.students.length === 0)) {
        return NextResponse.json({ success: false, message: 'At least one student required for student scope' }, { status: 400 });
    }

    // Build custom fields with UUIDs
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

    await dbConnect();

    try {
        const requirement = await DocumentRequirement.create({
            title,
            description,
            category,
            required_file_types: required_file_types || ['pdf', 'jpg', 'png'],
            max_file_size_mb: max_file_size_mb || 5,
            is_mandatory: is_mandatory !== false,
            due_date: due_date || undefined,
            scope,
            subject: subject || undefined,
            created_by: session.user.id,
            is_active: true,
            custom_fields: customFields,
            requires_file_upload: body.requires_file_upload ?? true
        });

        // Audit log
        await AuditLog.create({
            action: 'CREATE',
            entityType: 'DocumentRequirement',
            entityId: requirement._id,
            performedBy: session.user.id,
            changes: [{ field: 'Created', old: null, new: { title, category, scope: scope.type } }],
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({ success: true, requirement }, { status: 201 });
    } catch (error: any) {
        console.error('Create Requirement Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to create requirement', error: error.message }, { status: 500 });
    }
}
