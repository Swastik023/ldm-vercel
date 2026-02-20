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

    // Get student's enrolled program via their batch
    const student = await User.findById(session.user.id).select('batch').lean();
    let programId: string | null = null;

    if (student?.batch) {
        const batch = await Batch.findById(student.batch).select('program').lean();
        programId = batch?.program?.toString() ?? null;
    }

    // If student has a program: show their program docs + common docs
    // If student has NO batch/program (new student): show ALL docs so the library isn't blank
    const query: Record<string, unknown> = programId
        ? {
            is_deleted: { $ne: true },
            $or: [{ is_common: true }, { course_id: programId }]
        }
        : { is_deleted: { $ne: true } }; // fallback: show everything

    const documents = await LibraryDocument.find(query)

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
