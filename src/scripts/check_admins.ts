import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function main() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const admins = await mongoose.connection.collection('users')
        .find({ role: { $in: ['admin'] } })
        .project({ username: 1, fullName: 1, is_root: 1, status: 1, password: 1 })
        .toArray();
    console.log('ADMIN ACCOUNTS:');
    admins.forEach(u => console.log({
        username: u.username,
        name: u.fullName,
        is_root: u.is_root,
        status: u.status,
        bcrypt: u.password?.substring(0, 7)
    }));
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
