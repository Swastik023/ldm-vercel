'use server';

import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { Assignment } from '@/models/Academic';
import { revalidatePath } from 'next/cache';

export async function getAttendance(filters: any) {
    await dbConnect();
    try {
        const { date, subject, section, batch } = filters;
        const query: any = { date: new Date(date) };
        if (subject) query.subject = subject;
        if (section) query.section = section;
        if (batch) query.batch = batch;

        // We typically want to find one record per class session
        // But if we want list of records:
        const records = await Attendance.find(query)
            .populate('subject', 'name code')
            .populate('teacher', 'fullName')
            .populate('records.student', 'fullName username email'); // Populate student details in records array

        // Flatten for the table view if needed, or return grouped
        // The legacy frontend expects a flat list of student records status, but grouped by "Attendance Record" entry
        // Wait, typical attendance UI shows list of students for a specific date/subject.
        // The "AttendanceManagement.tsx" in legacy seems to fetch "reviews" which implies seeing all marked attendances.

        // If query is for a specific class instance
        if (subject && section) {
            return { success: true, data: JSON.parse(JSON.stringify(records)) };
        }

        // If admin reviewing all attendance for a date
        // We might need to transform data to match legacy "AttendanceRecord" interface which seems to be per-student-record?
        // Legacy interface: id, student_name, subject_name, status...
        // This implies flattening the `records` array from multiple `Attendance` documents.

        let flatRecords: any[] = [];
        records.forEach(att => {
            att.records.forEach((stuRec: any) => {
                flatRecords.push({
                    id: att._id, // Use Attendance Doc ID or generate a composite? 
                    // Legacy used a single ID. If we want to edit specific student status, we need to know:
                    // AttendanceDocID + StudentID
                    unique_id: `${att._id}_${stuRec.student._id}`,
                    attendance_id: att._id,
                    student_id: (stuRec.student as any).username || (stuRec.student as any)._id,
                    student_name: (stuRec.student as any).fullName,
                    student_obj_id: (stuRec.student as any)._id,
                    subject_name: (att.subject as any).name,
                    subject_code: (att.subject as any).code,
                    attendance_date: att.date.toISOString().split('T')[0],
                    status: stuRec.status,
                    is_locked: att.is_locked,
                    teacher_name: (att.teacher as any).fullName,
                    remarks: stuRec.remarks
                });
            });
        });

        return { success: true, data: JSON.parse(JSON.stringify(flatRecords)) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function markAttendance(data: any) {
    await dbConnect();
    try {
        // data: { date, subject, teacher, session, section, batch, students: [{student_id, status}] }

        // Check if locked
        const existing = await Attendance.findOne({
            date: new Date(data.date),
            subject: data.subject,
            section: data.section
        });

        if (existing && existing.is_locked) {
            return { success: false, error: "Attendance is locked" };
        }

        if (existing) {
            // Update
            existing.records = data.students.map((s: any) => ({
                student: s.student_id,
                status: s.status,
                remarks: s.remarks
            }));
            await existing.save();
            return { success: true, message: "Attendance updated" };
        } else {
            // Create
            await Attendance.create({
                date: new Date(data.date),
                subject: data.subject,
                teacher: data.teacher,
                session: data.session,
                section: data.section,
                batch: data.batch,
                records: data.students.map((s: any) => ({
                    student: s.student_id,
                    status: s.status,
                    remarks: s.remarks
                }))
            });
            return { success: true, message: "Attendance marked" };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateStudentAttendance(attendanceId: string, studentId: string, status: string, remarks?: string) {
    await dbConnect();
    try {
        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) return { success: false, error: "Record not found" };
        if (attendance.is_locked) return { success: false, error: "Record is locked" };

        const studentRecord = attendance.records.find((r: any) => r.student.toString() === studentId);
        if (studentRecord) {
            studentRecord.status = status as any;
            if (remarks) studentRecord.remarks = remarks;
        }

        await attendance.save();
        revalidatePath('/admin/attendance');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function lockAttendance(attendanceIds: string[], action: 'lock' | 'unlock') {
    await dbConnect();
    try {
        await Attendance.updateMany(
            { _id: { $in: attendanceIds } },
            { $set: { is_locked: action === 'lock' } }
        );
        revalidatePath('/admin/attendance');
        return { success: true, message: `Records ${action}ed` };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
