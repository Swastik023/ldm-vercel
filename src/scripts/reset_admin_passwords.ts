import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config({ path: '.env' });

async function main() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected');

    const col = mongoose.connection.collection('users');
    const admins = await col.find({ role: 'admin' }).toArray();

    console.log(`Found ${admins.length} admin account(s):\n`);
    for (const u of admins) {
        console.log(`  username: ${u.username}  |  name: ${u.fullName}  |  is_root: ${u.is_root}`);
    }

    // Reset all admin passwords
    const adminHash = await bcrypt.hash('admin123', 10);
    await col.updateMany({ role: 'admin', is_root: { $ne: true } }, { $set: { password: adminHash, status: 'active' } });

    const rootHash = await bcrypt.hash('root123', 10);
    await col.updateMany({ role: 'admin', is_root: true }, { $set: { password: rootHash, status: 'active' } });

    console.log('\n✅ Passwords reset:');
    console.log('  Regular admin → admin123');
    console.log('  Root admin    → root123');
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
