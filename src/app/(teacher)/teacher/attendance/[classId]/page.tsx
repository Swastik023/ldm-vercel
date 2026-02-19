'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, AlertCircle, Users } from 'lucide-react';

interface Student {
    _id: string;
    fullName: string;
    username: string;
    status: 'present' | 'absent' | 'late' | 'excused' | null;
    remark: string;
}

interface AssignmentInfo {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

const STATUS_OPTIONS = [
    { type: 'present' as const, label: 'Present', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', ring: 'ring-green-500', border: 'border-green-300' },
    { type: 'absent' as const, label: 'Absent', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-500', border: 'border-red-300' },
    { type: 'late' as const, label: 'Late', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', ring: 'ring-yellow-500', border: 'border-yellow-300' },
    { type: 'excused' as const, label: 'Excused', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500', border: 'border-blue-300' },
];

export default function AttendanceSheet() {
    const params = useParams();
    const assignmentId = params?.classId as string;
    const router = useRouter();

    const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!assignmentId) return;
        setLoading(true);
        setError('');
        fetch(`/api/teacher/attendance/${assignmentId}`)
            .then(res => res.json())
            .then(d => {
                if (d.success) {
                    setAssignment(d.assignment);
                    setStudents(d.students.map((s: any) => ({
                        _id: s._id,
                        fullName: s.fullName,
                        username: s.username,
                        status: null,
                        remark: '',
                    })));
                } else {
                    setError(d.message || 'Failed to load students');
                }
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, [assignmentId]);

    const handleStatus = (id: string, status: Student['status']) => {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, status } : s));
    };

    const handleRemark = (id: string, remark: string) => {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, remark } : s));
    };

    const markAll = (status: Student['status']) => {
        setStudents(prev => prev.map(s => ({ ...s, status })));
    };

    const handleSave = async () => {
        const unmarked = students.filter(s => !s.status);
        if (unmarked.length > 0) {
            toast.error(`Please mark all students. ${unmarked.length} unmarked.`);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/teacher/attendance/${assignmentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    records: students.map(s => ({
                        studentId: s._id,
                        status: s.status,
                        remarks: s.remark,
                    })),
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Attendance saved successfully!');
                router.push('/teacher/attendance');
            } else {
                toast.error(data.message || 'Failed to save');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">{error}</div>
    );

    const stats = {
        present: students.filter(s => s.status === 'present').length,
        absent: students.filter(s => s.status === 'absent').length,
        unmarked: students.filter(s => !s.status).length,
        total: students.length,
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 flex items-center mb-3 text-sm font-medium">
                    <ArrowLeft size={15} className="mr-1" /> Back
                </button>
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{assignment?.subject_name}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {assignment?.subject_code}
                            {assignment?.batch_name && ` · ${assignment.batch_name}`}
                            {` · Section ${assignment?.section}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/teacher/attendance')}
                            className="px-4 py-2 text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm transition">
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving || students.length === 0}
                            className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm transition">
                            {saving
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                : <><Save size={16} /> Save Attendance</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Date:</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm flex items-center gap-3">
                        <span className="text-green-600 font-semibold">{stats.present} Present</span>
                        <span className="text-red-600 font-semibold">{stats.absent} Absent</span>
                        {stats.unmarked > 0 && <span className="text-gray-400">{stats.unmarked} Unmarked</span>}
                    </div>
                    <div className="h-5 w-px bg-gray-200" />
                    <div className="flex gap-2">
                        <button onClick={() => markAll('present')}
                            className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 font-medium transition">
                            All Present
                        </button>
                        <button onClick={() => markAll('absent')}
                            className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 font-medium transition">
                            All Absent
                        </button>
                    </div>
                </div>
            </div>

            {/* Student Table */}
            {students.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">No students in this batch</p>
                    <p className="text-sm mt-1">Students need to be assigned to this batch in the admin panel.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student, idx) => (
                                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-900">{student.fullName}</p>
                                            <p className="text-xs text-gray-400 font-mono">{student.username}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {STATUS_OPTIONS.map(({ type, label, icon: Icon, color, bg, ring, border }) => (
                                                    <button key={type}
                                                        onClick={() => handleStatus(student._id, type)}
                                                        title={label}
                                                        className={`p-2 rounded-lg transition-all border ${student.status === type
                                                            ? `${bg} ${color} ${border} ring-2 ${ring} ring-offset-1`
                                                            : 'bg-white text-gray-300 border-gray-200 hover:border-gray-300 hover:text-gray-500'}`}>
                                                        <Icon size={17} />
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input type="text" value={student.remark}
                                                onChange={e => handleRemark(student._id, e.target.value)}
                                                placeholder="Optional..."
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
