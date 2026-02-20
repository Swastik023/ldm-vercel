import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { LibraryDocument } from '@/models/LibraryDocument';
import { User } from '@/models/User';
import { Batch } from '@/models/Academic';
import '@/models/LibraryCategory'; // Register LibraryCategory for populate()

// GET /api/student/library — returns all library documents for the student's program + common docs
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // BUG FIX: User model stores `batch` not `program`.
    // We need to populate batch to get the program ID for program-specific document filtering.
    const student = await User.findById(session.user.id).select('batch').lean();
    let programId: string | null = null;

    if (student?.batch) {
        const batch = await Batch.findById(student.batch).select('program').lean();
        programId = batch?.program?.toString() ?? null;
    }

    // Fetch documents that are common OR belong to this student's program
    const orConditions: object[] = [{ is_common: true }];
    if (programId) orConditions.push({ course_id: programId });

    const documents = await LibraryDocument.find({
        is_deleted: { $ne: true },
        $or: orConditions
    })
        .populate('category_id', 'name')
        .sort({ updatedAt: -1 })
        .lean();

    return NextResponse.json({
        success: true,
        documents: documents.map(d => ({
            _id: d._id?.toString(),
            title: d.title,
            description: '',           // new model has no standalone description
            url: d.file_path || '',    // file_path maps to old 'url' field
            file_size: 0,              // new model does not track file size
            file_type: d.file_type,
            content: d.content || '',
            category: (d.category_id as any)?.name || 'General',
            is_common: d.is_common,
            current_version: d.current_version,
            createdAt: d.createdAt,
        })),
    });
}
