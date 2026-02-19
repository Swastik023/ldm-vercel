import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeePayment } from '@/models/FeePayment';
import { FeeStructure } from '@/models/FeeStructure';
import '@/models/Academic'; // registers Program & Session for populate()


// GET /api/admin/finance/payments/[studentId] — student's full payment history
export async function GET(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    await dbConnect();

    const payments = await FeePayment.find({ student: studentId })
        .populate({
            path: 'fee_structure',
            select: 'total_amount semester description due_date program session',
            populate: [
                { path: 'program', select: 'name code' },
                { path: 'session', select: 'name' },
            ],
        })
        .lean();

    // Add remaining balance to each payment
    const enriched = payments.map((p) => {
        const fs = (p.fee_structure as unknown) as { total_amount: number } | null;
        const total = fs?.total_amount ?? 0;
        const remaining = total - p.amount_paid;
        return { ...p, remaining };
    });

    return NextResponse.json({ success: true, payments: enriched });
}

// POST /api/admin/finance/payments/[studentId] — add a payment entry
export async function POST(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const body = await req.json();
    const { fee_structure_id, amount, mode, receipt_no, paid_on, remarks } = body;

    if (!fee_structure_id || !amount || !mode || !receipt_no || !paid_on) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
        return NextResponse.json({ success: false, message: 'Amount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();

    const feeStructure = await FeeStructure.findById(fee_structure_id);
    if (!feeStructure) {
        return NextResponse.json({ success: false, message: 'Fee structure not found' }, { status: 404 });
    }

    // Get or create FeePayment document
    let feePayment = await FeePayment.findOne({ student: studentId, fee_structure: fee_structure_id });
    if (!feePayment) {
        feePayment = await FeePayment.create({
            student: studentId,
            fee_structure: fee_structure_id,
            amount_paid: 0,
            payments: [],
            status: 'unpaid',
        });
    }

    // Validate overpayment
    const remaining = feeStructure.total_amount - feePayment.amount_paid;
    if (amount > remaining) {
        return NextResponse.json({
            success: false,
            message: `Amount exceeds remaining balance (₹${remaining})`
        }, { status: 400 });
    }

    // Add payment transaction
    const newAmountPaid = feePayment.amount_paid + amount;
    let newStatus: 'unpaid' | 'partial' | 'paid' = 'partial';
    if (newAmountPaid === 0) newStatus = 'unpaid';
    else if (newAmountPaid >= feeStructure.total_amount) newStatus = 'paid';

    const updated = await FeePayment.findByIdAndUpdate(
        feePayment._id,
        {
            $push: {
                payments: {
                    amount,
                    paid_on: new Date(paid_on),
                    mode,
                    receipt_no,
                    remarks: remarks || '',
                    recorded_by: session.user.id,
                }
            },
            $set: {
                amount_paid: newAmountPaid,
                status: newStatus,
            }
        },
        { new: true }
    );

    return NextResponse.json({ success: true, payment: updated }, { status: 201 });
}
