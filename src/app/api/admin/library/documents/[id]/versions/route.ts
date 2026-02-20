import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentVersion } from '@/models/DocumentVersion';

// GET /api/admin/library/documents/[id]/versions
// Fetches the version history of a specific document
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = params;

    await dbConnect();

    const versions = await DocumentVersion.find({ document_id: documentId })
        .populate('updated_by', 'fullName username')
        .sort({ version_number: -1 })
        .lean();

    if (!versions.length) {
        return NextResponse.json({ success: false, message: 'No versions found for this document' }, { status: 404 });
    }

    return NextResponse.json({ success: true, versions });
}
