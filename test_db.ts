import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import dbConnect from './src/lib/db';
import { User } from './src/models/User';
import './src/models/Class';
import { Batch } from './src/models/Academic';

async function run() {
    await dbConnect();
    try {
        const docs = await User.find({ role: 'student' })
            .populate('batch', 'name')
            .populate('classId', 'className sessionFrom sessionTo')
            .select('fullName email mobileNumber username rollNumber sessionFrom sessionTo isProfileComplete status createdAt batch classId provider rejectionReasons')
            .sort({ sessionFrom: -1, rollNumber: 1 })
            .limit(1)
            .lean();
        console.log("Success:", docs.length);
    } catch (e) {
        console.error("Error!!!", e);
    }
    process.exit(0);
}
run();
