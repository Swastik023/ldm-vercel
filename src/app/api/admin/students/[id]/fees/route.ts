import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentFee } from '@/models/StudentFee';
import { User } from '@/models/User';

// GET /api/admin/students/[id]/fees — get student's fee records
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const fees = await StudentFee.find({ studentId: id }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, fees });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// POST /api/admin/students/[id]/fees — create a new fee record
// Body: { totalFee, feeLabel, academicYear, notes? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const { totalFee, feeLabel, academicYear, notes } = body;

        if (!totalFee || !feeLabel || !academicYear)
            return NextResponse.json({ success: false, message: 'totalFee, feeLabel and academicYear are required' }, { status: 400 });

        const fee = await StudentFee.create({
            studentId: id,
            totalFee: Number(totalFee),
            amountPaid: 0,
            feeLabel,
            academicYear,
            notes,
        });

        return NextResponse.json({ success: true, fee }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// PATCH /api/admin/students/[id]/fees — add a payment OR update totalFee
// Body: { feeId, action: 'add_payment', amount, note? }
//    or { feeId, action: 'update_total', totalFee }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const { feeId, action, amount, note, totalFee, notes, feeLabel, academicYear } = body;

        const feeDoc = await StudentFee.findOne({ _id: feeId, studentId: id });
        if (!feeDoc) return NextResponse.json({ success: false, message: 'Fee record not found' }, { status: 404 });

        if (action === 'add_payment') {
            if (!amount || Number(amount) <= 0)
                return NextResponse.json({ success: false, message: 'Payment amount must be positive' }, { status: 400 });
            feeDoc.payments.push({
                amount: Number(amount),
                date: new Date(),
                note: note || '',
                addedBy: new (require('mongoose').Types.ObjectId)(session.user.id),
            });
            feeDoc.amountPaid = feeDoc.payments.reduce((sum, p) => sum + p.amount, 0);
        } else if (action === 'update_total') {
            if (totalFee !== undefined) feeDoc.totalFee = Number(totalFee);
            if (notes !== undefined) feeDoc.notes = notes;
            if (feeLabel !== undefined) feeDoc.feeLabel = feeLabel;
            if (academicYear !== undefined) feeDoc.academicYear = academicYear;
        } else {
            return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
        }

        await feeDoc.save();
        return NextResponse.json({ success: true, fee: feeDoc.toJSON() });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// DELETE /api/admin/students/[id]/fees?feeId=xxx — delete a fee record
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const feeId = searchParams.get('feeId');
        if (!feeId) return NextResponse.json({ success: false, message: 'feeId required' }, { status: 400 });

        await StudentFee.deleteOne({ _id: feeId, studentId: id });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}
