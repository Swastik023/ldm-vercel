import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeeStructure } from '@/models/FeeStructure';
import { FeePayment } from '@/models/FeePayment';

// PUT /api/admin/finance/fee-structures/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { total_amount, due_date, description, is_active } = body;

    if (total_amount !== undefined && total_amount <= 0) {
        return NextResponse.json({ success: false, message: 'Total amount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();
    const updated = await FeeStructure.findByIdAndUpdate(
        id,
        { total_amount, due_date, description, is_active },
        { new: true, runValidators: true }
    );

    if (!updated) {
        return NextResponse.json({ success: false, message: 'Fee structure not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, structure: updated });
}

// DELETE /api/admin/finance/fee-structures/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const hasPayments = await FeePayment.exists({ fee_structure: id });
    if (hasPayments) {
        // Soft-delete instead of hard delete to preserve payment references
        await FeeStructure.findByIdAndUpdate(id, { is_active: false });
        return NextResponse.json({
            success: true,
            message: 'Fee structure deactivated (payments exist, cannot hard delete)'
        });
    }

    await FeeStructure.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Fee structure deleted' });
}
