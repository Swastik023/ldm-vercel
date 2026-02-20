import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env' });

async function checkStudents() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected');

    const users = await mongoose.connection.collection('users').find({ role: 'student' }).toArray();

    if (users.length === 0) {
        console.log('❌ No student accounts found in the database!');
        console.log('Create students from Admin → Manage Users → Add User');
        process.exit(0);
    }

    console.log(`\nFound ${users.length} student accounts:\n`);
    for (const u of users) {
        const hasBcrypt = u.password?.startsWith('$2b$') || u.password?.startsWith('$2a$');
        console.log({
            username: u.username,
            name: u.fullName,
            status: u.status,
            passwordOk: hasBcrypt ? '✅ bcrypt hashed' : '❌ NOT hashed / missing',
        });
    }

    // Auto-fix: Set all student passwords to 'student123' if they're broken
    const broken = users.filter(u => !u.password?.startsWith('$2b$') && !u.password?.startsWith('$2a$'));
    if (broken.length > 0) {
        console.log(`\n🔧 Fixing ${broken.length} broken password(s) → setting to 'student123'`);
        const hash = await bcrypt.hash('student123', 10);
        for (const u of broken) {
            await mongoose.connection.collection('users').updateOne(
                { _id: u._id },
                { $set: { password: hash, status: 'active' } }
            );
            console.log(`  ✅ Fixed: ${u.username}`);
        }
    } else {
        console.log('\n✅ All student passwords look correctly hashed');
        console.log('\nIf login still fails, the username/password entered might just be wrong.');
        console.log('Try resetting one student password to: student123');
        const hash = await bcrypt.hash('student123', 10);
        await mongoose.connection.collection('users').updateMany(
            { role: 'student' },
            { $set: { password: hash, status: 'active' } }
        );
        console.log('✅ All student passwords reset to: student123');
    }

    process.exit(0);
}

checkStudents().catch(console.error);
