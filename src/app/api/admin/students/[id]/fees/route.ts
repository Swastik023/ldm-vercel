import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentFee } from '@/models/StudentFee';
import mongoose from 'mongoose';
import CoursePricing from '@/models/CoursePricing';
import { Batch } from '@/models/Academic';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Round to 2 decimal places */
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Given baseFee + one of { finalFee | discountPct }, derive the other.
 * Returns { finalFee, discountPct } — both resolved.
 */
function resolveDiscount(
    baseFee: number,
    opts: { finalFee?: number; discountPct?: number }
): { finalFee: number; discountPct: number } {
    if (opts.discountPct !== undefined) {
        const pct = Math.min(100, Math.max(0, opts.discountPct));
        return {
            discountPct: round2(pct),
            finalFee: round2(baseFee - (baseFee * pct) / 100),
        };
    }
    if (opts.finalFee !== undefined) {
        const ff = Math.min(baseFee, Math.max(0, opts.finalFee));
        const pct = baseFee > 0 ? round2(((baseFee - ff) / baseFee) * 100) : 0;
        return { finalFee: round2(ff), discountPct: pct };
    }
    // No discount
    return { finalFee: round2(baseFee), discountPct: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students/[id]/fees — list all fee records for a student
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const fees = await StudentFee.find({ studentId: id }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, fees: fees.map(f => ({ ...f, amountRemaining: Math.max(0, f.finalFee - f.amountPaid) })) });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/students/[id]/fees — create a new fee record
// Body: { baseFee, feeLabel, academicYear, notes?, finalFee?, discountPct?, batchId?, courseId? }
// If batchId is provided and CoursePricing exists, auto-fill baseFee from there.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        let { baseFee, feeLabel, academicYear, notes, finalFee, discountPct, batchId, courseId } = body;

        if (!feeLabel || !academicYear)
            return NextResponse.json({ success: false, message: 'feeLabel and academicYear are required' }, { status: 400 });

        // Auto-populate baseFee from CoursePricing if courseId provided
        if (!baseFee && courseId) {
            const pricing = await CoursePricing.findOne({ courseId });
            if (pricing) baseFee = pricing.isOfferActive ? pricing.offerPrice : pricing.originalPrice;
        }

        if (!baseFee || Number(baseFee) <= 0)
            return NextResponse.json({ success: false, message: 'baseFee is required and must be > 0' }, { status: 400 });

        baseFee = round2(Number(baseFee));
        const resolved = resolveDiscount(baseFee, {
            finalFee: finalFee !== undefined ? Number(finalFee) : undefined,
            discountPct: discountPct !== undefined ? Number(discountPct) : undefined,
        });

        const fee = await StudentFee.create({
            studentId: id,
            batchId: batchId || undefined,
            courseId: courseId || undefined,
            feeLabel,
            academicYear,
            baseFee,
            ...resolved,
            amountPaid: 0,
            notes,
        });

        const feeObj = fee.toJSON();
        return NextResponse.json({ success: true, fee: { ...feeObj, amountRemaining: Math.max(0, feeObj.finalFee - feeObj.amountPaid) } }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/students/[id]/fees
//
// action: 'add_payment'   → { feeId, amount, note? }
// action: 'update_fee'    → { feeId, baseFee?, finalFee?, discountPct?, feeLabel?, academicYear?, notes? }
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const { feeId, action } = body;

        const feeDoc = await StudentFee.findOne({ _id: feeId, studentId: id });
        if (!feeDoc) return NextResponse.json({ success: false, message: 'Fee record not found' }, { status: 404 });

        if (action === 'add_payment') {
            // ── Add a payment entry, recalc amountPaid ────────────────────────
            const amount = Number(body.amount);
            if (!amount || amount <= 0)
                return NextResponse.json({ success: false, message: 'Payment amount must be > 0' }, { status: 400 });

            feeDoc.payments.push({
                amount: round2(amount),
                date: new Date(),
                note: body.note || '',
                addedBy: new mongoose.Types.ObjectId(session.user.id),
            });
            feeDoc.amountPaid = round2(feeDoc.payments.reduce((s, p) => s + p.amount, 0));

        } else if (action === 'update_fee') {
            // ── Update fee figures with auto-recalculation ────────────────────
            const { baseFee, finalFee, discountPct, feeLabel, academicYear, notes } = body;

            // Update metadata
            if (feeLabel !== undefined) feeDoc.feeLabel = feeLabel;
            if (academicYear !== undefined) feeDoc.academicYear = academicYear;
            if (notes !== undefined) feeDoc.notes = notes;

            // Update fee values — priority: new baseFee → then finalFee or discountPct
            const newBase = baseFee !== undefined ? round2(Number(baseFee)) : feeDoc.baseFee;
            feeDoc.baseFee = newBase;

            const resolved = resolveDiscount(newBase, {
                finalFee: finalFee !== undefined ? Number(finalFee) : undefined,
                discountPct: discountPct !== undefined ? Number(discountPct) : undefined,
            });
            feeDoc.discountPct = resolved.discountPct;
            feeDoc.finalFee = resolved.finalFee;

        } else if (action === 'delete_payment') {
            // ── Remove a single payment from history ──────────────────────────
            const { paymentId } = body;
            feeDoc.payments = feeDoc.payments.filter(p => p._id?.toString() !== paymentId) as any;
            feeDoc.amountPaid = round2(feeDoc.payments.reduce((s, p) => s + p.amount, 0));

        } else {
            return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
        }

        await feeDoc.save();
        const updated = feeDoc.toJSON();
        return NextResponse.json({ success: true, fee: { ...updated, amountRemaining: Math.max(0, updated.finalFee - updated.amountPaid) } });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/students/[id]/fees?feeId=xxx
// ─────────────────────────────────────────────────────────────────────────────
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
