import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Program, Batch, Session } from '@/models/Academic';
import '@/models/Academic';
import { Class } from '@/models/Class';
import { isValidEmail, isValidObjectId, sanitizeString, safeParseJSON } from '@/lib/validate';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Compute course end date from joining month/year + program duration.
 * January intake → end month is December (duration_years later)
 * July intake    → end month is June (duration_years later)
 */
function computeCourseEndDate(joiningMonth: 'January' | 'July', joiningYear: number, durationYears: number): Date {
    if (joiningMonth === 'January') {
        return new Date(joiningYear + durationYears - 1, 11, 31); // Dec 31
    }
    return new Date(joiningYear + durationYears, 5, 30); // Jun 30
}

export async function POST(req: NextRequest) {
    // Rate limit: 5 registrations per minute per IP
    const rateLimited = checkRateLimit(req, 'auth-register', 5);
    if (rateLimited) return rateLimited;

    await dbConnect();

    const [body, parseErr] = await safeParseJSON(req);
    if (parseErr) return parseErr;

    const {
        fullName,
        email,
        mobileNumber,
        rollNumber,
        password,
        batchId,
    } = body;

    // ── Field presence validation ─────────────────────────────────────────────
    if (!fullName || !email || !mobileNumber || !rollNumber || !password || !batchId) {
        return NextResponse.json({
            success: false,
            message: 'All fields are required.'
        }, { status: 400 });
    }

    // ── Format / value validation ─────────────────────────────────────────────
    const safeName = sanitizeString(fullName, 100);
    if (!safeName) {
        return NextResponse.json({ success: false, message: 'Full name is required (max 100 characters).' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
        return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
        return NextResponse.json({ success: false, message: 'Mobile number must be 10 digits.' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ success: false, message: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!isValidObjectId(batchId)) {
        return NextResponse.json({ success: false, message: 'Invalid batch selection.' }, { status: 400 });
    }

    const roll = String(rollNumber).trim();

    // ── Validate Batch ────────────────────────────────────────────────────────
    const batch = await Batch.findById(batchId).populate('program');
    if (!batch || !batch.is_active) {
        return NextResponse.json({ success: false, message: 'Selected batch is invalid or inactive.' }, { status: 400 });
    }
    if (!batch.program) {
        return NextResponse.json({ success: false, message: 'Batch program details are missing.' }, { status: 400 });
    }
    // M-02: Check batch capacity
    if (batch.capacity && batch.current_students >= batch.capacity) {
        return NextResponse.json({ success: false, message: 'This batch is full. Please select a different batch or contact admin.' }, { status: 400 });
    }

    const programId = batch.program._id;
    const joiningMonth = batch.intakeMonth;
    const jyInt = batch.joiningYear;
    const courseEndDate = batch.expectedEndDate;

    // ── Duplicate roll number check ───────────────────────────────────────────
    const existingRoll = await User.findOne({ rollNumber: roll });
    if (existingRoll) {
        return NextResponse.json({
            success: false,
            message: `Roll Number "${roll}" is already taken. Please check with your administrator.`
        }, { status: 409 });
    }

    // ── Duplicate email check ─────────────────────────────────────────────────
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
        return NextResponse.json({ success: false, message: 'An account with this email already exists. Please login.' }, { status: 409 });
    }

    // ── Username = Roll Number ────────────────────────────────────────────────
    const username = roll.toLowerCase();
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return NextResponse.json({
            success: false,
            message: `Roll Number "${roll}" conflicts with an existing username. Please contact admin.`
        }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await (User.create as any)({
        fullName: safeName,
        email: email.toLowerCase().trim(),
        username,
        password: hashedPassword,
        mobileNumber,
        programId,
        joiningMonth,
        joiningYear: jyInt,
        courseEndDate,
        rollNumber: roll,
        batch: batch._id,
        session: batch.session,
        role: 'student',
        status: 'pending',
        isProfileComplete: false,
    });

    // ── Auto-create Class record — so user.classId is linked from start ─────
    try {
        const dur = (batch.program as any)?.duration_years || 3;
        const endY = jyInt + dur;
        let cls = await Class.findOne({ batchId: batch._id, sessionFrom: jyInt, sessionTo: endY });
        if (!cls) {
            cls = await Class.create({
                batchId: batch._id,
                sessionFrom: jyInt,
                sessionTo: endY,
                className: `${(batch.program as any)?.name || batch.name} (${jyInt}-${endY})`,
            });
        }
        await User.findByIdAndUpdate(newUser._id, { classId: cls._id });
    } catch (e) {
        // Non-blocking — Class creation failure shouldn't prevent registration
        console.warn('[register] Class auto-create failed:', e);
    }

    return NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        username,
        programName: (batch.program as any).name,
        courseEndDate: courseEndDate.toISOString(),
    }, { status: 201 });
}
