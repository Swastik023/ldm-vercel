'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Lock, Unlock, Search, Edit2, X, CheckCircle, XCircle, Clock, AlertCircle, Users, Filter, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AttendanceRow {
    unique_id: string;
    attendance_id: string;
    student_id: string;
    student_name: string;
    student_obj_id: string;
    subject_name: string;
    subject_code: string;
    attendance_date: string;
    status: string;
    is_locked: boolean;
    teacher_name: string;
    remarks: string;
    marked_by?: string;
}

interface SubjectOption { _id: string; name: string; code: string; }

const STATUS_COLORS: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-amber-100 text-amber-800',
    excused: 'bg-blue-100 text-blue-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    present: <CheckCircle className="w-3 h-3" />,
    absent: <XCircle className="w-3 h-3" />,
    late: <Clock className="w-3 h-3" />,
    excused: <AlertCircle className="w-3 h-3" />,
};

export default function AdminAttendancePage() {
    const [records, setRecords] = useState<AttendanceRow[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectId, setSubjectId] = useState('');
    const [section, setSection] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk select
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Edit modal
    const [editingRecord, setEditingRecord] = useState<AttendanceRow | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editRemarks, setEditRemarks] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    // Load subjects on mount
    useEffect(() => {
        fetch('/api/admin/tests')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.subjects) {
                    setSubjects(d.subjects);
                }
            })
            .catch(() => { });
    }, []);

    // Fetch attendance records
    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            // Use the server action via API
            const params = new URLSearchParams({ date });
            if (subjectId) params.set('subject', subjectId);
            if (section) params.set('section', section);

            const res = await fetch(`/api/admin/attendance?${params.toString()}`);
            const d = await res.json();
            if (d.success) {
                setRecords(d.data || []);
            } else {
                toast.error(d.message || 'Failed to load');
                setRecords([]);
            }
        } catch {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    }, [date, subjectId, section]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    // Filtered by search
    const filtered = records.filter(r =>
        !searchQuery || r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.student_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const presentCount = filtered.filter(r => r.status === 'present').length;
    const absentCount = filtered.filter(r => r.status === 'absent').length;
    const lateCount = filtered.filter(r => r.status === 'late').length;
    const lockedCount = filtered.filter(r => r.is_locked).length;

    // Toggle select
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const toggleAll = () => {
        setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(r => r.unique_id));
    };

    // Bulk lock/unlock
    const handleBulkLock = async (action: 'lock' | 'unlock') => {
        if (selectedIds.length === 0) return;
        const uniqueAttIds = Array.from(new Set(
            records.filter(r => selectedIds.includes(r.unique_id)).map(r => r.attendance_id)
        ));

        try {
            const res = await fetch('/api/admin/attendance', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, attendanceIds: uniqueAttIds }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success(`Records ${action}ed`);
                setSelectedIds([]);
                fetchRecords();
            } else {
                toast.error(d.message || 'Failed');
            }
        } catch {
            toast.error('Network error');
        }
    };

    // Edit single record
    const openEdit = (record: AttendanceRow) => {
        setEditingRecord(record);
        setEditStatus(record.status);
        setEditRemarks(record.remarks || '');
    };

    const handleEdit = async () => {
        if (!editingRecord) return;
        if (!editRemarks.trim()) {
            toast.error('Please provide a reason for the change');
            return;
        }

        setEditSaving(true);
        try {
            const res = await fetch('/api/admin/attendance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendanceId: editingRecord.attendance_id,
                    studentId: editingRecord.student_obj_id,
                    status: editStatus,
                    remarks: editRemarks,
                }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success('Updated');
                setEditingRecord(null);
                fetchRecords();
            } else {
                toast.error(d.message || 'Failed');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setEditSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
                    Attendance Management
                </h1>
                <p className="text-gray-500 text-sm">Review, edit, and audit attendance records.</p>
            </div>

            {/* ── Filters ────────────────────────────────────────────────── */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="grid gap-3 md:grid-cols-5 items-end">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</label>
                        <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">All Subjects</option>
                            {subjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</label>
                        <select value={section} onChange={e => setSection(e.target.value)}
                            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">All Sections</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
                        <div className="mt-1 relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Student name..." value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleBulkLock('lock')} disabled={selectedIds.length === 0}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-40 transition">
                            <Lock className="w-3 h-3" /> Lock
                        </button>
                        <button onClick={() => handleBulkLock('unlock')} disabled={selectedIds.length === 0}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 transition">
                            <Unlock className="w-3 h-3" /> Unlock
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats Strip ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                    <p className="text-xl font-bold text-gray-800">{filtered.length}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Total</p>
                </div>
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 text-center">
                    <p className="text-xl font-bold text-emerald-700">{presentCount}</p>
                    <p className="text-[10px] text-emerald-500 font-semibold uppercase">Present</p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-100 p-3 text-center">
                    <p className="text-xl font-bold text-red-600">{absentCount}</p>
                    <p className="text-[10px] text-red-400 font-semibold uppercase">Absent</p>
                </div>
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-3 text-center">
                    <p className="text-xl font-bold text-amber-600">{lateCount}</p>
                    <p className="text-[10px] text-amber-400 font-semibold uppercase">Late</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-center">
                    <p className="text-xl font-bold text-gray-600">{lockedCount}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Locked</p>
                </div>
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3 w-4">
                                    <input type="checkbox" onChange={toggleAll}
                                        checked={filtered.length > 0 && selectedIds.length === filtered.length} />
                                </th>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Marked By</th>
                                <th className="px-4 py-3">Teacher</th>
                                <th className="px-4 py-3">Lock</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">No records found</p>
                                </td></tr>
                            ) : (
                                filtered.map(record => (
                                    <tr key={record.unique_id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-4 py-3">
                                            <input type="checkbox"
                                                checked={selectedIds.includes(record.unique_id)}
                                                onChange={() => toggleSelect(record.unique_id)} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{record.student_name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{record.student_id}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-gray-700">{record.subject_name}</p>
                                            <p className="text-[10px] text-gray-400">{record.subject_code}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS_ICONS[record.status]} {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {record.marked_by === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                                    <Shield className="w-2.5 h-2.5" /> Admin
                                                </span>
                                            ) : record.marked_by === 'self' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
                                                    Self
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400">Teacher</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{record.teacher_name}</td>
                                        <td className="px-4 py-3">
                                            {record.is_locked ? (
                                                <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold">
                                                    <Lock className="w-3 h-3" /> Locked
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-emerald-600 text-[10px]">
                                                    <Unlock className="w-3 h-3" /> Open
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => openEdit(record)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 ml-auto transition">
                                                <Edit2 className="w-3 h-3" /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Edit Modal ──────────────────────────────────────────────── */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingRecord(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Edit Attendance</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{editingRecord.student_name} · {editingRecord.subject_name}</p>
                            </div>
                            <button onClick={() => setEditingRecord(null)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                                <div className="flex gap-2 mt-2">
                                    {['present', 'absent', 'late', 'excused'].map(s => (
                                        <button key={s} onClick={() => setEditStatus(s)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition border ${editStatus === s
                                                ? STATUS_COLORS[s] + ' border-current ring-2 ring-offset-1'
                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Reason for change <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={editRemarks}
                                    onChange={e => setEditRemarks(e.target.value)}
                                    placeholder="e.g. Medical certificate submitted..."
                                    rows={3}
                                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
                            <button onClick={() => setEditingRecord(null)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleEdit} disabled={editSaving || !editRemarks.trim()}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                                {editSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
