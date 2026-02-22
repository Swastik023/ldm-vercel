import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { DocumentRequirement } from '@/models/DocumentRequirement';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// GET /api/student/documents — List all requirements applicable to this student with submission status
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get student details (batch, program info)
    const student = await User.findById(session.user.id)
        .populate({
            path: 'batch',
            select: 'name program',
            populate: { path: 'program', select: 'name code' }
        })
        .lean();

    if (!student) {
        return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const studentId = new mongoose.Types.ObjectId(session.user.id);
    const batchId = student.batch?._id;
    const programId = (student.batch as any)?.program?._id;

    // Build scope query: find all active requirements that apply to this student
    const scopeConditions: Record<string, unknown>[] = [
        { 'scope.type': 'all' }
    ];

    if (programId) {
        scopeConditions.push({ 'scope.type': 'program', 'scope.program': programId });
    }
    if (batchId) {
        scopeConditions.push({ 'scope.type': 'batch', 'scope.batch': batchId });
    }
    scopeConditions.push({ 'scope.type': 'student', 'scope.students': studentId });

    const requirements = await DocumentRequirement.find({
        is_active: true,
        $or: scopeConditions
    })
        .populate('subject', 'name code')
        .populate('created_by', 'fullName')
        .sort({ category: 1, createdAt: -1 })
        .lean();

    // Get all submissions by this student
    const requirementIds = requirements.map(r => r._id);
    const submissions = await DocumentSubmission.find({
        student: studentId,
        requirement: { $in: requirementIds }
    }).lean();

    // Build a map: requirementId -> submission
    const submissionMap = new Map<string, any>();
    submissions.forEach(s => {
        submissionMap.set(s.requirement.toString(), s);
    });

    // Merge requirements with submission status
    const documentsWithStatus = requirements.map(req => {
        const submission = submissionMap.get(req._id.toString());
        return {
            ...req,
            submission: submission || null,
            submissionStatus: submission ? submission.status : 'not_submitted',
            isOverdue: req.due_date ? new Date(req.due_date) < new Date() : false
        };
    });

    // Group by category
    const grouped = {
        personal_document: documentsWithStatus.filter(d => d.category === 'personal_document'),
        academic: documentsWithStatus.filter(d => d.category === 'academic'),
        assignment: documentsWithStatus.filter(d => d.category === 'assignment'),
        certificate: documentsWithStatus.filter(d => d.category === 'certificate')
    };

    return NextResponse.json({ success: true, documents: documentsWithStatus, grouped });
}
