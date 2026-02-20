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

    // For now, we allow students to see ALL documents in the library to match the public portal,
    // but we fetch their program info so the UI can auto-filter/highlight for them.
    const student = await User.findById(session.user.id).select('batch').lean();
    let studentProgramCode: string | null = null;
    let studentProgramName: string | null = null;

    if (student?.batch) {
        const batch = await Batch.findById(student.batch).populate('program', 'name code').lean();
        studentProgramCode = (batch?.program as any)?.code ?? null;
        studentProgramName = (batch?.program as any)?.name ?? null;
    }

    const documents = await LibraryDocument.find({ is_deleted: { $ne: true } })
        .populate('category_id', 'name')
        .populate('course_id', 'name code')
        .sort({ updatedAt: -1 })
        .lean();

    return NextResponse.json({
        success: true,
        student_program: studentProgramCode ? { code: studentProgramCode, name: studentProgramName } : null,
        documents: documents.map(d => ({
            _id: d._id?.toString(),
            title: d.title,
            description: '',
            url: d.file_path || '',
            file_type: d.file_type,
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
}
