import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { LibraryDocument } from '@/models/LibraryDocument';
import '@/models/LibraryCategory'; // Register for populate()

// GET /api/public/library — returns all non-deleted library documents (no auth required)
export async function GET() {
    try {
        await dbConnect();

        const documents = await LibraryDocument.find({ is_deleted: { $ne: true } })
            .populate('category_id', 'name')
            .populate('course_id', 'name code')
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            documents: documents.map(d => ({
                _id: d._id?.toString(),
                title: d.title,
                file_type: d.file_type,
                url: d.file_path || '',
                content: d.content || '',
                category: (d.category_id as any)?.name || 'General',
                program: (d.course_id as any) ? {
                    code: (d.course_id as any).code,
                    name: (d.course_id as any).name
                } : null,
                is_common: d.is_common,
                current_version: d.current_version,
                createdAt: d.createdAt,
            })),
        });
    } catch (err) {
        console.error('Public library error:', err);
        return NextResponse.json({ success: false, documents: [], message: 'Failed to load library' }, { status: 500 });
    }
}
