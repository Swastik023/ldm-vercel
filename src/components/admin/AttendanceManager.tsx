'use client';

import { useState, useEffect } from 'react';
import { getAttendance, lockAttendance, updateStudentAttendance } from '@/actions/attendance';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Lock, Unlock, Search, Filter, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/Badge'; // Use if created, otherwise span

export default function AttendanceManager({
    subjects,
    // batches, // might need if filtering by batch
}: any) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectId, setSubjectId] = useState('');
    const [section, setSection] = useState('A'); // Default to A for now

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editRemarks, setEditRemarks] = useState('');

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const result = await getAttendance({ date, subject: subjectId, section });
            if (result.success) {
                setRecords(result.data);
            } else {
                toast.error(result.error);
                setRecords([]);
            }
        } catch (error) {
            toast.error('Failed to fetch records');
        } finally {
            setLoading(false);
        }
    };

    // Auto fetch when filters change if valid
    useEffect(() => {
        // Only fetch if at least date is present. 
        // If subject is not selected, maybe fetch all for that date? 
        // Our action supports fetching all for a date.
        fetchRecords();
    }, [date, subjectId, section]);

    const handleBulkLock = async (action: 'lock' | 'unlock') => {
        if (selectedIds.length === 0) return;
        try {
            // We need the Attendance Document IDs, not the individual student record IDs
            // records have `attendance_id`. We need unique attendance IDs.
            const uniqueAttIds = Array.from(new Set(
                records.filter(r => selectedIds.includes(r.unique_id)).map(r => r.attendance_id)
            ));

            const result = await lockAttendance(uniqueAttIds, action);
            if (result.success) {
                toast.success(`Records ${action}ed`);
                fetchRecords();
                setSelectedIds([]);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to update lock status');
        }
    };

    const handleUpdateSingle = async () => {
        if (!editingId) return;
        // editingId is likely the unique_id (attId_studId)
        // We need attendanceId and studentId.
        const record = records.find(r => r.unique_id === editingId);
        if (!record) return;

        try {
            const result = await updateStudentAttendance(
                record.attendance_id,
                record.student_obj_id,
                editStatus,
                editRemarks
            );

            if (result.success) {
                toast.success('Updated');
                setEditingId(null);
                fetchRecords();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-green-100 text-green-800';
            case 'absent': return 'bg-red-100 text-red-800';
            case 'late': return 'bg-yellow-100 text-yellow-800';
            case 'excused': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border grid gap-4 md:grid-cols-4 items-end">
                <div>
                    <label className="text-sm font-medium">Date</label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Subject</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((s: any) => (
                            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Section</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                    >
                        <option value="">All Sections</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleBulkLock('lock')}
                        variant="destructive"
                        disabled={selectedIds.length === 0}
                        className="flex-1"
                    >
                        <Lock className="h-4 w-4 mr-1" /> Lock
                    </Button>
                    <Button
                        onClick={() => handleBulkLock('unlock')}
                        variant="default" // green?
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        disabled={selectedIds.length === 0}
                    >
                        <Unlock className="h-4 w-4 mr-1" /> Unlock
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                            <tr>
                                <th className="px-4 py-3 w-4">
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(records.map(r => r.unique_id));
                                            else setSelectedIds([]);
                                        }}
                                        checked={records.length > 0 && selectedIds.length === records.length}
                                    />
                                </th>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Teacher</th>
                                <th className="px-4 py-3">Lock</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No records found.</td></tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.unique_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(record.unique_id)}
                                                onChange={() => toggleSelect(record.unique_id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{record.student_name}</div>
                                            <div className="text-xs text-gray-500">{record.student_id}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {record.subject_name}
                                            <span className="ml-1 text-xs text-gray-400">({record.subject_code})</span>
                                        </td>
                                        <td className="px-4 py-3">{record.attendance_date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{record.teacher_name}</td>
                                        <td className="px-4 py-3">
                                            {record.is_locked ? (
                                                <span className="flex items-center text-red-600 font-bold text-xs"><Lock className="h-3 w-3 mr-1" /> Locked</span>
                                            ) : (
                                                <span className="flex items-center text-green-600 text-xs"><Unlock className="h-3 w-3 mr-1" /> Open</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    setEditingId(record.unique_id);
                                                    setEditStatus(record.status);
                                                    setEditRemarks(record.remarks || '');
                                                }}
                                                className="text-blue-600 hover:underline text-xs font-medium"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal / Dialog */}
            {editingId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4">
                        <h3 className="text-lg font-bold">Edit Attendance</h3>
                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <select
                                className="w-full mt-1 p-2 border rounded"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                            >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Remarks</label>
                            <Input
                                value={editRemarks}
                                onChange={(e) => setEditRemarks(e.target.value)}
                                placeholder="Reason for change..."
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
                            <Button onClick={handleUpdateSingle} className="flex-1">Update</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
