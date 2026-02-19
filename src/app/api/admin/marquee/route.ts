import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MarqueeMessage from '@/models/MarqueeMessage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/marquee
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const messages = await MarqueeMessage.find({}).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, messages });
}

// POST /api/admin/marquee
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { message, isActive, order } = await request.json();
    if (!message?.trim()) return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    const msg = await MarqueeMessage.create({ message: message.trim(), isActive: isActive ?? true, order: order ?? 0 });
    return NextResponse.json({ success: true, message: msg }, { status: 201 });
}

// PATCH /api/admin/marquee — toggle active
export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id, isActive } = await request.json();
    const msg = await MarqueeMessage.findByIdAndUpdate(id, { isActive }, { new: true });
    return NextResponse.json({ success: true, message: msg });
}

// DELETE /api/admin/marquee?id=xxx
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    await dbConnect();
    await MarqueeMessage.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
}
