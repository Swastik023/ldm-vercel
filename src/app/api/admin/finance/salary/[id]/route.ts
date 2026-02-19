import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Salary } from '@/models/Salary';

// PUT /api/admin/finance/salary/[id] — mark paid or update remarks
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, remarks } = body;

    await dbConnect();

    const record = await Salary.findById(id);
    if (!record) {
        return NextResponse.json({ success: false, message: 'Salary record not found' }, { status: 404 });
    }

    if (action === 'mark_paid') {
        if (record.status === 'paid') {
            return NextResponse.json({ success: false, message: 'Salary already marked as paid' }, { status: 400 });
        }
        record.status = 'paid';
        record.paid_on = new Date();
        record.paid_by = session.user.id as unknown as import('mongoose').Types.ObjectId;
    }

    if (remarks !== undefined) {
        record.remarks = remarks;
    }

    await record.save();
    return NextResponse.json({ success: true, record });
}
