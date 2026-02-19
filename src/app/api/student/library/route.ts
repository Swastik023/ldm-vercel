import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Library } from '@/models/Library';

// GET /api/student/library — returns all library documents from DB
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const documents = await Library.find({})
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({
        success: true,
        documents: documents.map(d => ({
            _id: d._id?.toString(),
            title: d.title,
            description: d.description || '',
            url: d.url,
            file_size: d.file_size,
            file_type: d.file_type,
            category: d.category,
            createdAt: d.createdAt,
        })),
    });
}
