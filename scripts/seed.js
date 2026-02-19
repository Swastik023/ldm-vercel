const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
// Load .env.local first
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
// Also try .env (does not overwrite existing keys)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], default: 'student' },
    fullName: { type: String, required: true },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const users = [
    {
        username: 'admin',
        email: 'admin@ldmcollege.com',
        password: 'adminadmin',
        role: 'admin',
        fullName: 'System Administrator',
    },
    {
        username: 'dr.sharma',
        email: 'sharma@ldmcollege.com',
        password: 'teacher123',
        role: 'teacher',
        fullName: 'Dr. Rajesh Sharma',
    },
    {
        username: 'student001',
        email: 'rahul.sharma@student.ldm.com',
        password: 'student123',
        role: 'student',
        fullName: 'Rahul Sharma',
    },
];

async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const user of users) {
            const existingUser = await User.findOne({ email: user.email });
            if (existingUser) {
                console.log(`User ${user.username} already exists`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({ ...user, password: hashedPassword });
            console.log(`Created user ${user.username}`);
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
