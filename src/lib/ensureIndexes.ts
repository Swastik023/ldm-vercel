/**
 * MED-10 + LOW-03 + LOW-07: Database indexes for performance and data integrity.
 *
 * Call ensureAllIndexes() once during application startup or in a migration script.
 * Mongoose creates indexes declared in schemas automatically, but for indexes on
 * fields queried across routes, we define them here to be explicit.
 */
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export async function ensureAllIndexes() {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return;

    // ── MED-10: Performance indexes ──────────────────────────────────────

    // Attendance: student dashboard queries
    await db.collection('attendances').createIndex(
        { 'records.student': 1, batch: 1 },
        { background: true }
    );

    // Attendance: teacher session lookup
    await db.collection('attendances').createIndex(
        { date: 1, subject: 1, section: 1 },
        { background: true }
    );

    // StudentFee: student fees page
    await db.collection('studentfees').createIndex(
        { studentId: 1 },
        { background: true }
    );

    // StudentFee: admin fee course listing
    await db.collection('studentfees').createIndex(
        { courseId: 1 },
        { background: true }
    );

    // ProTestAttempt: admin test detail
    await db.collection('protestattempts').createIndex(
        { testId: 1 },
        { background: true }
    );

    // FeePayment: cascade delete + listing
    await db.collection('feepayments').createIndex(
        { student: 1 },
        { background: true }
    );

    // DocumentSubmission: upload duplicate check
    await db.collection('documentsubmissions').createIndex(
        { requirement: 1, student: 1 },
        { background: true }
    );

    // ── LOW-07: Salary unique compound index ─────────────────────────────
    await db.collection('salaries').createIndex(
        { employee: 1, month: 1 },
        { unique: true, background: true }
    );

    // ── LOW-03: EmailOTP TTL index — auto-delete after 10 minutes ────────
    await db.collection('emailotps').createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 300, background: true } // 5 min after expiry
    );

    console.log('[ensureIndexes] All database indexes created/verified.');
}
