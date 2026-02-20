import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { LibraryCategory } from '@/models/LibraryCategory';
import { AuditLog } from '@/models/AuditLog';

// GET /api/admin/library/categories
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const categories = await LibraryCategory.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, categories });
}

// POST /api/admin/library/categories
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name, semester_or_module } = await req.json();

    if (!name) {
        return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    await dbConnect();

    const category = await LibraryCategory.create({
        name,
        semester_or_module: semester_or_module || null
    });

    await AuditLog.create({
        action: 'CREATE',
        entityType: 'LibraryCategory',
        entityId: category._id,
        performedBy: session.user.id,
        changes: [{ field: 'all', old: null, new: category.toObject() }],
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
}
