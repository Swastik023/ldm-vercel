import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { LibraryDocument } from '@/models/LibraryDocument';
import '@/models/LibraryCategory';

// GET /api/public/library/[id] — fetch a single document WITH its content
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        const doc = await LibraryDocument.findOne({ _id: id, is_deleted: { $ne: true } })
            .populate('category_id', 'name')
            .populate('course_id', 'name code')
            .lean();

        if (!doc) {
            return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            document: {
                _id: doc._id?.toString(),
                title: doc.title,
                file_type: doc.file_type,
                url: doc.file_path || '',
                content: doc.content || '',
                category: (doc.category_id as any)?.name || 'General',
                program: (doc.course_id as any) ? {
                    code: (doc.course_id as any).code,
                    name: (doc.course_id as any).name
                } : null,
                is_common: doc.is_common,
                current_version: doc.current_version,
                createdAt: doc.createdAt,
            },
        });
    } catch (err) {
        console.error('Public library single doc error:', err);
        return NextResponse.json({ success: false, message: 'Failed to load document' }, { status: 500 });
    }
}
