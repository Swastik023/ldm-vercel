import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    indexesFixed: boolean;
}

declare global {
    // eslint-disable-next-line no-var
    var _mongooseCache: MongooseCache | undefined;
}

let cached = global._mongooseCache;

if (!cached) {
    cached = global._mongooseCache = { conn: null, promise: null, indexesFixed: false };
}

/**
 * One-time repair: drop non-sparse unique indexes on the users collection
 * and recreate them as sparse so Google users with null rollNumber don't collide.
 * Runs silently in background after first connection.
 */
async function repairUserIndexes(conn: typeof mongoose) {
    try {
        const col = conn.connection.db?.collection('users');
        if (!col) return;

        const badIndexes = ['classId_1_rollNumber_1', 'rollNumber_1', 'batch_1_rollNumber_1'];
        for (const name of badIndexes) {
            try { await col.dropIndex(name); } catch { /* already dropped or doesn't exist */ }
        }

        // Recreate as sparse — null values won't be indexed, so multiple nulls are fine
        await col.createIndex({ classId: 1, rollNumber: 1 }, { unique: true, sparse: true, background: true }).catch(() => { });
        await col.createIndex({ rollNumber: 1 }, { unique: true, sparse: true, background: true }).catch(() => { });
        await col.createIndex({ batch: 1, rollNumber: 1 }, { unique: true, sparse: true, background: true }).catch(() => { });

        console.log('[dbConnect] User indexes repaired: sparse indexes in place.');
    } catch (e) {
        console.warn('[dbConnect] Index repair skipped:', (e as Error).message);
    }
}

async function dbConnect() {
    if (cached!.conn) {
        return cached!.conn;
    }

    if (!cached!.promise) {
        const opts = { bufferCommands: false };
        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        throw e;
    }

    // Run index repair once per server restart — AWAITED so indexes are ready before first write
    if (!cached!.indexesFixed) {
        cached!.indexesFixed = true;
        await repairUserIndexes(cached!.conn);
    }

    return cached!.conn;
}

export default dbConnect;
