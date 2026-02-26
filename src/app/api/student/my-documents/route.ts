import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentDocuments } from '@/models/StudentDocuments';

// GET /api/student/my-documents — student fetches their own documents
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const docs = await StudentDocuments.findOne({ userId: session.user.id }).lean();

    return NextResponse.json({ success: true, documents: docs ?? null });
}
