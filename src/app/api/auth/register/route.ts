import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Program } from '@/models/Academic';
import '@/models/Academic';

/**
 * Compute course end date from joining month/year + program duration.
 * January intake → end month is December (duration_years later)
 * July intake    → end month is June (duration_years later)
 */
function computeCourseEndDate(joiningMonth: 'January' | 'July', joiningYear: number, durationYears: number): Date {
    if (joiningMonth === 'January') {
        // Jan start → ends in December of (joiningYear + duration - 1)
        return new Date(joiningYear + durationYears - 1, 11, 31); // Dec 31
    }
    // July start → ends in June of (joiningYear + duration)
    return new Date(joiningYear + durationYears, 5, 30); // Jun 30
}

export async function POST(req: NextRequest) {
    await dbConnect();

    const body = await req.json();
    const {
        fullName,
        email,
        mobileNumber,
        programId,
        joiningMonth,
        joiningYear,
        rollNumber,
        password,
    } = body;

    // ── Field presence validation ─────────────────────────────────────────────
    if (!fullName || !email || !mobileNumber || !programId || !joiningMonth || !joiningYear || !rollNumber || !password) {
        return NextResponse.json({
            success: false,
            message: 'All fields are required: Name, Email, Phone, Program, Joining Month, Joining Year, Roll Number, Password.'
        }, { status: 400 });
    }

    // ── Format / value validation ─────────────────────────────────────────────
    if (!/^\d{10}$/.test(mobileNumber)) {
        return NextResponse.json({ success: false, message: 'Mobile number must be 10 digits.' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ success: false, message: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!['January', 'July'].includes(joiningMonth)) {
        return NextResponse.json({ success: false, message: 'Joining month must be January or July.' }, { status: 400 });
    }
    const jyInt = parseInt(joiningYear);
    if (isNaN(jyInt) || jyInt < 2020 || jyInt > 2040) {
        return NextResponse.json({ success: false, message: 'Joining year is invalid.' }, { status: 400 });
    }

    const roll = String(rollNumber).trim();
    if (!roll) {
        return NextResponse.json({ success: false, message: 'Roll Number is required.' }, { status: 400 });
    }

    // ── Validate program ──────────────────────────────────────────────────────
    const program = await Program.findOne({ _id: programId, is_active: true });
    if (!program) {
        return NextResponse.json({ success: false, message: 'Selected program is invalid or inactive.' }, { status: 400 });
    }

    // ── Duplicate roll number check (globally unique) ─────────────────────────
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

    // ── Username = Roll Number (primary login ID) ─────────────────────────────
    const username = roll.toLowerCase();

    // Check for username collision with non-student accounts
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        return NextResponse.json({
            success: false,
            message: `Roll Number "${roll}" conflicts with an existing username. Please contact admin.`
        }, { status: 409 });
    }

    // ── Auto-calculate course end date ────────────────────────────────────────
    const courseEndDate = computeCourseEndDate(joiningMonth as 'January' | 'July', jyInt, program.duration_years);

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
        joiningYear: jyInt,
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
