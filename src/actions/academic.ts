'use server';

import dbConnect from '@/lib/db';
import { Program, Batch, Session, Subject, Assignment } from '@/models/Academic';
// import { User } from '@/models/User'; // Ensure User model is imported if needed for validation
import { revalidatePath } from 'next/cache';

// --- Programs ---

export async function getPrograms() {
    await dbConnect();
    try {
        const programs = await Program.find({}).sort({ createdAt: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(programs)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createProgram(data: any) {
    await dbConnect();
    try {
        const program = await Program.create(data);
        revalidatePath('/admin/academic');
        return { success: true, data: JSON.parse(JSON.stringify(program)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteProgram(id: string) {
    await dbConnect();
    try {
        await Program.findByIdAndDelete(id);
        revalidatePath('/admin/academic');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Sessions ---

export async function getSessions() {
    await dbConnect();
    try {
        const sessions = await Session.find({}).sort({ start_date: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(sessions)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createSession(data: any) {
    await dbConnect();
    try {
        // Default is_active to true so sessions show up immediately in student creation
        const session = await Session.create({ ...data, is_active: true });
        revalidatePath('/admin/academic');
        return { success: true, data: JSON.parse(JSON.stringify(session)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteSession(id: string) {
    await dbConnect();
    try {
        await Session.findByIdAndDelete(id);
        revalidatePath('/admin/academic');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Batches ---

export async function getBatches(filters: any = {}) {
    await dbConnect();
    try {
        const query: any = {};
        if (filters.program_id) query.program = filters.program_id;
        if (filters.session_id) query.session = filters.session_id;

        const batches = await Batch.find(query)
            .populate('program', 'name code')
            .populate('session', 'name')
            .sort({ name: 1 });

        return { success: true, data: JSON.parse(JSON.stringify(batches)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createBatch(data: any) {
    await dbConnect();
    try {
        const batch = await Batch.create(data);
        revalidatePath('/admin/batches');
        return { success: true, data: JSON.parse(JSON.stringify(batch)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBatch(id: string) {
    await dbConnect();
    try {
        await Batch.findByIdAndDelete(id);
        revalidatePath('/admin/batches');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Subjects ---

export async function getSubjects(programId?: string, semester?: number) {
    await dbConnect();
    try {
        const query: any = {};
        if (programId) query.program = programId;
        if (semester) query.semester = semester;

        const subjects = await Subject.find(query).populate('program', 'name code');
        return { success: true, data: JSON.parse(JSON.stringify(subjects)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createSubject(data: any) {
    await dbConnect();
    try {
        const subject = await Subject.create(data);
        revalidatePath('/admin/academic');
        return { success: true, data: JSON.parse(JSON.stringify(subject)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteSubject(id: string) {
    await dbConnect();
    try {
        await Subject.findByIdAndDelete(id);
        revalidatePath('/admin/academic');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// --- Assignments ---

export async function getAssignments(filters: any = {}) {
    await dbConnect();
    try {
        const query: any = {};
        if (filters.session) query.session = filters.session;
        if (filters.program) {
            // Find subjects for this program first? or populate
            // Assignments filter by subject -> program
            // This is tricky if assignment doesn't directly store program. 
            // Our Assignment model relies on Subject ref.
            // We might need to filter after populate or finding subjects first.
            const subjects = await Subject.find({ program: filters.program }).select('_id');
            query.subject = { $in: subjects.map(s => s._id) };
        }
        if (filters.batch) query.batch = filters.batch;
        if (filters.teacher) query.teacher = filters.teacher;

        const assignments = await Assignment.find(query)
            .populate({
                path: 'subject',
                populate: { path: 'program' }
            })
            .populate('teacher', 'fullName username') // Assuming User model has fullName
            .populate('batch', 'name')
            .populate('session', 'name');

        return { success: true, data: JSON.parse(JSON.stringify(assignments)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createAssignment(data: any) {
    await dbConnect();
    try {
        // Check if assignment exists?
        const existing = await Assignment.findOne({
            subject: data.subject,
            session: data.session,
            section: data.section,
            batch: data.batch // if batch-specific
        });

        if (existing) {
            return { success: false, error: "Assignment already exists for this subject/section" };
        }

        const assignment = await Assignment.create(data);
        revalidatePath('/admin/academic/assignments');
        return { success: true, data: JSON.parse(JSON.stringify(assignment)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateAssignment(id: string, data: any) {
    await dbConnect();
    try {
        const assignment = await Assignment.findByIdAndUpdate(id, data, { new: true });
        revalidatePath('/admin/academic/assignments');
        return { success: true, data: JSON.parse(JSON.stringify(assignment)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteAssignment(id: string) {
    await dbConnect();
    try {
        await Assignment.findByIdAndDelete(id);
        revalidatePath('/admin/academic/assignments');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
