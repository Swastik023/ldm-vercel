import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Batch } from '@/models/Academic';
import { Class } from '@/models/Class';

export async function POST(req: NextRequest) {
    await dbConnect();

    const body = await req.json();
    const {
        fullName,
        email,
        mobileNumber,
        batchId,
        sessionFrom,
        sessionTo,
        rollNumber,
        password,
    } = body;

    // ── Field presence validation ─────────────────────────────────────────────
    if (!fullName || !email || !mobileNumber || !batchId || !sessionFrom || !sessionTo || !rollNumber || !password) {
        return NextResponse.json({
            success: false,
            message: 'All fields are required: Name, Email, Phone, Batch, Session From, Session To, Roll Number, Password.'
        }, { status: 400 });
    }

    // ── Format / value validation ─────────────────────────────────────────────
    if (!/^\d{10}$/.test(mobileNumber)) {
        return NextResponse.json({ success: false, message: 'Mobile number must be 10 digits.' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ success: false, message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const sfInt = parseInt(sessionFrom);
    const stInt = parseInt(sessionTo);
    if (isNaN(sfInt) || isNaN(stInt) || sfInt >= stInt) {
        return NextResponse.json({ success: false, message: 'Session From must be a year earlier than Session To.' }, { status: 400 });
    }

    const roll = String(rollNumber).trim();
    if (!roll) {
        return NextResponse.json({ success: false, message: 'Roll Number is required.' }, { status: 400 });
    }

    // ── Validate batch ────────────────────────────────────────────────────────
    const batch = await Batch.findOne({ _id: batchId, is_active: true });
    if (!batch) {
        return NextResponse.json({ success: false, message: 'Selected batch is invalid or inactive.' }, { status: 400 });
    }

    // ── Find or create Class ──────────────────────────────────────────────────
    const className = `${batch.name} (${sfInt}-${stInt})`;
    let classDoc = await Class.findOne({ batchId, sessionFrom: sfInt, sessionTo: stInt });
    if (!classDoc) {
        classDoc = await Class.create({ batchId, sessionFrom: sfInt, sessionTo: stInt, className });
    }

    // ── Duplicate roll number check ───────────────────────────────────────────
    const existingRoll = await User.findOne({ classId: classDoc._id, rollNumber: roll });
    if (existingRoll) {
        return NextResponse.json({
            success: false,
            message: `Roll Number "${roll}" is already taken in ${className}. Please check with your administrator.`
        }, { status: 409 });
    }

    // ── Duplicate email check ─────────────────────────────────────────────────
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
        return NextResponse.json({ success: false, message: 'An account with this email already exists. Please login.' }, { status: 409 });
    }

    // ── Build unique username ─────────────────────────────────────────────────
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
    let username = baseUsername;
    let suffix = 1;
    while (await User.findOne({ username })) {
        username = `${baseUsername}${suffix++}`;
    }

    // ── Hash password & create user ───────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    await (User.create as any)({
        fullName,
        email: email.toLowerCase().trim(),
        username,
        password: hashedPassword,
        mobileNumber,
        batch: batchId,
        classId: classDoc._id,
        rollNumber: roll,
        sessionFrom: sfInt,
        sessionTo: stInt,
        role: 'student',
        status: 'active',
        isProfileComplete: false,
    });

    return NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        className,
        username,
    }, { status: 201 });
}
