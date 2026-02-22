import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { StudentProfile } from '@/models/StudentProfile';

export async function POST(req: Request) {
    await dbConnect();

    const body = await req.json();
    const {
        fullName,
        email,
        mobileNumber,
        gender,
        dateOfBirth,
        highestQualification,
        yearOfPassing,
        englishComfortLevel,
        password,
    } = body;

    // Basic required-field check
    if (!fullName || !email || !mobileNumber || !gender || !dateOfBirth || !highestQualification || !yearOfPassing || !englishComfortLevel || !password) {
        return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }

    // Prevent duplicate accounts — check by email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
        // Return same message to prevent enumeration attacks
        return NextResponse.json({ success: false, message: 'An account with this email already exists. Please login.' }, { status: 409 });
    }

    // Build a username from email prefix, ensure uniqueness
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let suffix = 1;
    while (await User.findOne({ username })) {
        username = `${baseUsername}${suffix++}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User
    const user = await User.create({
        fullName,
        email: email.toLowerCase().trim(),
        username,
        password: hashedPassword,
        role: 'student',
        status: 'active',
    });

    // Create StudentProfile
    await StudentProfile.create({
        userId: user._id,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        mobileNumber,
        highestQualification,
        yearOfPassing: Number(yearOfPassing),
        englishComfortLevel,
        emailVerified: false,
    });

    return NextResponse.json({ success: true, message: 'Account created! Please verify your email.' }, { status: 201 });
}
