import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { LibraryDocument } from '@/models/LibraryDocument';
import { DocumentVersion } from '@/models/DocumentVersion';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// GET /api/admin/library/documents
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const isCommon = searchParams.get('isCommon') === 'true';

    await dbConnect();

    // Default: never fetch soft-deleted documents
    const query: Record<string, unknown> = { is_deleted: { $ne: true } };

    if (courseId) query.course_id = courseId;
    if (isCommon) query.is_common = true;

    const documents = await LibraryDocument.find(query)
        .populate('course_id', 'name code course_type')
        .populate('category_id', 'name')
        .sort({ updatedAt: -1 })
        .lean();

    return NextResponse.json({ success: true, documents });
}

// POST /api/admin/library/documents
// Uploads a new document and creates its first V1 Version
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { course_id, category_id, title, file_type, content, file_path, is_common } = await req.json();

    if (!title || !category_id || !file_type) {
        return NextResponse.json({ success: false, message: 'Missing required configuration fields' }, { status: 400 });
    }

    if (!is_common && !course_id) {
        return NextResponse.json({ success: false, message: 'Must supply course_id unless document is common' }, { status: 400 });
    }

    const sessionObj = await mongoose.startSession();
    sessionObj.startTransaction();

    try {
        await dbConnect();

        // 1. Create Base Document
        const doc = await LibraryDocument.create([{
            course_id: is_common ? undefined : course_id,
            category_id,
            title,
            file_type,
            content,
            file_path,
            is_common: is_common || false,
            current_version: 1
        }], { session: sessionObj });

        // 2. Create Initial V1 Version
        await DocumentVersion.create([{
            document_id: doc[0]._id,
            file_path: file_path,
            content: content,
            version_number: 1,
            updated_by: session.user.id
        }], { session: sessionObj });

        // 3. Create Audit Log
        await AuditLog.create([{
            action: 'CREATE',
            entityType: 'LibraryDocument',
            entityId: doc[0]._id,
            performedBy: session.user.id,
            changes: [{ field: 'Base Upload', old: null, new: { file_type, version: 1 } }],
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        }], { session: sessionObj });

        await sessionObj.commitTransaction();
        sessionObj.endSession();

        return NextResponse.json({ success: true, document: doc[0] }, { status: 201 });

    } catch (error: any) {
        await sessionObj.abortTransaction();
        sessionObj.endSession();
        console.error('Document Upload Failed:', error);
        return NextResponse.json({ success: false, message: 'Failed to create document', error: error.message }, { status: 500 });
    }
}
