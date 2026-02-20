import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { LibraryDocument } from '@/models/LibraryDocument';
import { DocumentVersion } from '@/models/DocumentVersion';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// PUT /api/admin/library/documents/[id]
// Updates the file or rich-text and generates a version control history
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { file_path, content, title } = await req.json();

    await dbConnect();

    const doc = await LibraryDocument.findById(id);
    if (!doc) return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    if (doc.is_deleted) return NextResponse.json({ success: false, message: 'Document is soft-deleted' }, { status: 400 });

    const sessionObj = await mongoose.startSession();
    sessionObj.startTransaction();

    try {
        // Find previous version reference
        const currentVersionNumber = doc.current_version;
        const newVersionNumber = currentVersionNumber + 1;

        const oldVersionRecord = await DocumentVersion.findOne({ document_id: doc._id, version_number: currentVersionNumber });

        // Update base document
        if (title) doc.title = title;
        if (file_path !== undefined) doc.file_path = file_path;
        if (content !== undefined) doc.content = content;

        doc.current_version = newVersionNumber;
        await doc.save({ session: sessionObj });

        // Create new Version record mapping back
        await DocumentVersion.create([{
            document_id: doc._id,
            file_path: file_path !== undefined ? file_path : doc.file_path,
            content: content !== undefined ? content : doc.content,
            version_number: newVersionNumber,
            updated_by: session.user.id,
            previous_version_reference: oldVersionRecord ? oldVersionRecord._id as any : undefined
        }], { session: sessionObj });

        // Audit Log Update
        await AuditLog.create([{
            action: 'UPDATE',
            entityType: 'LibraryDocument',
            entityId: doc._id,
            performedBy: session.user.id,
            changes: [{
                field: 'Version Bump',
                old: `V${currentVersionNumber}`,
                new: `V${newVersionNumber}`
            }],
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        }], { session: sessionObj });

        await sessionObj.commitTransaction();
        sessionObj.endSession();

        return NextResponse.json({ success: true, document: doc });
    } catch (error: any) {
        await sessionObj.abortTransaction();
        sessionObj.endSession();
        return NextResponse.json({ success: false, message: 'Failed to update document version', error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/library/documents/[id]
// Soft deletes document. Root Admin can bypass if permanently deleted.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(req.url);
    const forceDelete = url.searchParams.get('force') === 'true'; // Used for testing or Root Admin hard wipes

    await dbConnect();
    const doc = await LibraryDocument.findById(id);
    if (!doc) return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });

    const currentUser = await User.findById(session.user.id);

    // Hard deletes ONLY allowed by Root Admin via 'force' param
    if (forceDelete) {
        if (!currentUser || !currentUser.is_root) {
            return NextResponse.json({ success: false, message: 'Only Root Administrators can permanently delete library documents.' }, { status: 403 });
        }
        await DocumentVersion.deleteMany({ document_id: doc._id });
        await LibraryDocument.findByIdAndDelete(doc._id);

        await AuditLog.create({
            action: 'DELETE',
            entityType: 'LibraryDocument',
            entityId: doc._id,
            performedBy: session.user.id,
            changes: [{ field: 'Hard Delete', old: doc.toObject(), new: null }],
            reason: 'Permanent Library Wipe by Root',
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({ success: true, message: 'Document permanently deleted from database and versions wiped.' });
    }

    // Default Soft Delete (Available to Power Admins)
    if (doc.is_deleted) {
        return NextResponse.json({ success: false, message: 'Document is already soft-deleted' }, { status: 400 });
    }

    doc.is_deleted = true;
    doc.deleted_by = session.user.id as any;
    doc.deleted_at = new Date();
    await doc.save();

    await AuditLog.create({
        action: 'SOFT_DELETE',
        entityType: 'LibraryDocument',
        entityId: doc._id,
        performedBy: session.user.id,
        changes: [{ field: 'is_deleted', old: false, new: true }],
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, message: 'Document successfully softly deleted from Library.' });
}
