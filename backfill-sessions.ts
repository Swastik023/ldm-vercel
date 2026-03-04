/**
 * One-time script: Backfill sessions for existing batches that have session=null.
 *
 * Run with: npx tsx backfill-sessions.ts
 *
 * Safe to re-run — uses findOneAndUpdate to avoid duplicates.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Dynamic imports to avoid model conflicts
    const { Batch, Session } = await import('./src/models/Academic');

    const batchesWithoutSession = await Batch.find({ $or: [{ session: null }, { session: { $exists: false } }] }).populate('program', 'duration_years').lean();
    console.log(`Found ${batchesWithoutSession.length} batches without session`);

    let created = 0, linked = 0;
    for (const batch of batchesWithoutSession) {
        const dur = (batch.program as any)?.duration_years || 3;
        const endYear = batch.joiningYear + dur;
        const sessionName = `${batch.joiningYear}-${endYear}`;

        let session = await Session.findOne({ name: sessionName });
        if (!session) {
            session = await Session.create({
                name: sessionName,
                start_date: batch.startDate,
                end_date: batch.expectedEndDate,
                is_active: batch.status === 'active',
            });
            created++;
            console.log(`  Created session: ${sessionName}`);
        }

        await Batch.findByIdAndUpdate(batch._id, { session: session._id });
        linked++;
        console.log(`  Linked batch ${batch.name} → session ${sessionName}`);
    }

    // Also backfill User.session for students whose batch now has a session
    const { User } = await import('./src/models/User');
    const studentsWithoutSession = await User.find({ role: 'student', $or: [{ session: null }, { session: { $exists: false } }], batch: { $ne: null } }).select('batch').lean();
    console.log(`\nFound ${studentsWithoutSession.length} students without session`);

    let studentUpdated = 0;
    for (const stu of studentsWithoutSession) {
        if (!stu.batch) continue;
        const batch = await Batch.findById(stu.batch).select('session').lean();
        if (batch?.session) {
            await User.findByIdAndUpdate(stu._id, { session: batch.session });
            studentUpdated++;
        }
    }

    console.log(`\nDone! Sessions created: ${created}, Batches linked: ${linked}, Students updated: ${studentUpdated}`);
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
