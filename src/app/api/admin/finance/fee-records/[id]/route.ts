import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeeRecord } from '@/models/FeeRecord';
import { calcFees } from '@/lib/feeCalculator';

// PATCH /api/admin/finance/fee-records/[id] — update discount OR add payment
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    const record = await FeeRecord.findById(id);
    if (!record) return NextResponse.json({ success: false, message: 'Record not found.' }, { status: 404 });

    const body = await req.json();

    // Use-case 1: Update discount
    if (body.action === 'update-discount') {
        const { discountPercent, flatDiscount } = body;
        let calc;
        try {
            calc = calcFees({ basePrice: record.baseCoursePrice, discountPercent: Number(discountPercent ?? 0), flatDiscount: Number(flatDiscount ?? 0) });
        } catch (e: unknown) {
            return NextResponse.json({ success: false, message: e instanceof Error ? e.message : 'Invalid discount.' }, { status: 400 });
        }
        record.discountPercent = calc.discountPercent;
        record.discountAmount = calc.discountAmount;
        record.finalFees = calc.finalFees;
        record.remainingAmount = Math.max(0, calc.finalFees - record.amountPaid);
    }

    // Use-case 2: Add payment
    else if (body.action === 'add-payment') {
        const { amount, method, note } = body;
        if (!amount || amount <= 0) return NextResponse.json({ success: false, message: 'Invalid payment amount.' }, { status: 400 });
        if (!method) return NextResponse.json({ success: false, message: 'Payment method is required.' }, { status: 400 });

        const totalAfter = record.amountPaid + Number(amount);
        if (totalAfter > record.finalFees) {
            return NextResponse.json({ success: false, message: `Amount exceeds remaining balance of ₹${record.remainingAmount}.` }, { status: 400 });
        }

        record.payments.push({ amount: Number(amount), date: new Date(), method, note });
        record.amountPaid = totalAfter;
        record.remainingAmount = record.finalFees - totalAfter;
    } else {
        return NextResponse.json({ success: false, message: 'Unknown action. Use "update-discount" or "add-payment".' }, { status: 400 });
    }

    await record.save();
    return NextResponse.json({ success: true, record });
}

// GET /api/admin/finance/fee-records/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    const record = await FeeRecord.findById(id).lean();
    if (!record) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });
    return NextResponse.json({ success: true, record });
}
