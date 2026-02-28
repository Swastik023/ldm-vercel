import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Program, Batch } from '@/models/Academic';
import '@/models/Academic';

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
    await dbConnect();

    const body = await req.json();
    const {
        fullName,
        email,
        mobileNumber,
        rollNumber,
        password,
        // Form sends batchId + sessionFrom/To
        batchId,
        sessionFrom,
        sessionTo,
        // Direct API fallback (programId + joiningMonth + joiningYear)
        programId: directProgramId,
        joiningMonth: directJoiningMonth,
        joiningYear: directJoiningYear,
    } = body;

    // ── Field presence validation ─────────────────────────────────────────────
    if (!fullName || !email || !mobileNumber || !rollNumber || !password) {
        return NextResponse.json({
            success: false,
            message: 'All fields are required: Name, Email, Phone, Roll Number, Password.'
        }, { status: 400 });
    }

    // Must have either batchId+sessionFrom OR programId+joiningMonth+joiningYear
    const hasBatchForm = !!(batchId && sessionFrom);
    const hasDirectForm = !!(directProgramId && directJoiningMonth && directJoiningYear);
    if (!hasBatchForm && !hasDirectForm) {
        return NextResponse.json({
            success: false,
            message: 'Please select a Batch and Session.'
        }, { status: 400 });
    }

    // ── Format / value validation ─────────────────────────────────────────────
    if (!/^\d{10}$/.test(mobileNumber)) {
        return NextResponse.json({ success: false, message: 'Mobile number must be 10 digits.' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ success: false, message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const roll = String(rollNumber).trim();

    // ── Resolve programId and joiningMonth/Year ───────────────────────────────
    let programId: string;
    let joiningMonth: 'January' | 'July';
    let joiningYear: number;

    if (hasBatchForm) {
        const batch = await Batch.findOne({ _id: batchId, is_active: true }).populate('program');
        if (!batch) {
            return NextResponse.json({ success: false, message: 'Selected batch is invalid or inactive.' }, { status: 400 });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prog = batch.program as any;
        if (!prog) {
            return NextResponse.json({ success: false, message: 'Batch has no associated program.' }, { status: 400 });
        }
        programId = prog._id.toString();
        joiningYear = parseInt(String(sessionFrom));

        // Validate sessionTo
        const sessionToInt = parseInt(String(sessionTo));
        if (sessionTo && sessionToInt <= joiningYear) {
            return NextResponse.json({ success: false, message: 'Session "From" year must be before Session "To" year.' }, { status: 400 });
        }

        // Default intake month to January (form doesn't capture it explicitly)
        joiningMonth = 'January';
    } else {
        programId = directProgramId;
        joiningMonth = directJoiningMonth;
        joiningYear = parseInt(String(directJoiningYear));

        if (!['January', 'July'].includes(joiningMonth)) {
            return NextResponse.json({ success: false, message: 'Joining month must be January or July.' }, { status: 400 });
        }
    }

    if (isNaN(joiningYear) || joiningYear < 2020 || joiningYear > 2040) {
        return NextResponse.json({ success: false, message: 'Joining year is invalid.' }, { status: 400 });
    }

    // ── Validate program ──────────────────────────────────────────────────────
    const program = await Program.findOne({ _id: programId, is_active: true });
    if (!program) {
        return NextResponse.json({ success: false, message: 'Selected program is invalid or inactive.' }, { status: 400 });
    }

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

    // ── Auto-calculate course end date ────────────────────────────────────────
    const courseEndDate = computeCourseEndDate(joiningMonth, joiningYear, program.duration_years);

    // ── Hash password & create user ───────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    await (User.create as any)({
        fullName,
        email: email.toLowerCase().trim(),
        username,
        password: hashedPassword,
        mobileNumber,
        programId,
        joiningMonth,
        joiningYear,
        courseEndDate,
        rollNumber: roll,
        role: 'student',
        status: 'pending',
        isProfileComplete: false,
    });

    return NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        username,
        programName: program.name,
        courseEndDate: courseEndDate.toISOString(),
    }, { status: 201 });
}
