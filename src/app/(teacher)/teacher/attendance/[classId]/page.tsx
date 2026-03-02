'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, AlertCircle, Users, Zap, Lock, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Student {
    _id: string;
    fullName: string;
    username: string;
    status: 'present' | 'absent' | 'late' | 'excused' | null;
    remark: string;
    marked_by?: string;
}

interface AssignmentInfo {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

interface SessionState {
    _id: string | null;
    status: 'open' | 'reviewing' | 'finalized';
    self_mark_open: boolean;
    self_mark_deadline: string | null;
    records: Array<{ student_id: string; student_name: string; username: string; status: string; marked_by: string; remarks: string }>;
    marked_count: number;
    self_marked_count: number;
}

const STATUS_OPTIONS = [
    { type: 'present' as const, label: 'P', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-500', border: 'border-emerald-300' },
    { type: 'absent' as const, label: 'A', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-500', border: 'border-red-300' },
    { type: 'late' as const, label: 'L', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-500', border: 'border-amber-300' },
    { type: 'excused' as const, label: 'E', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500', border: 'border-blue-300' },
];

// ── Countdown Timer ────────────────────────────────────────────────────────────
function Countdown({ deadline }: { deadline: string }) {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
        const tick = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) { setRemaining('Expired'); return; }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    return <span className="font-mono font-bold">{remaining}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────────
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

    // Session lifecycle
    const [sessionState, setSessionState] = useState<SessionState | null>(null);
    const [selfMarkDuration, setSelfMarkDuration] = useState(30);
    const [actionLoading, setActionLoading] = useState(false);
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

    // ── Load assignment + students ─────────────────────────────────────
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

    // ── Load session state ─────────────────────────────────────────────
    const loadSession = useCallback(async () => {
        if (!assignmentId) return;
        try {
            const res = await fetch(`/api/teacher/attendance/${assignmentId}/session?date=${date}`);
            const d = await res.json();
            if (d.success && d.attendance) {
                setSessionState(d.attendance);
                // Merge self-marked records into student list
                const recordMap = new Map(d.attendance.records.map((r: any) => [r.student_id, r]));
                setStudents(prev => prev.map(s => {
                    const rec: any = recordMap.get(s._id);
                    if (rec) {
                        return { ...s, status: rec.status, remark: rec.remarks || '', marked_by: rec.marked_by };
                    }
                    return s;
                }));
            } else {
                setSessionState(null);
            }
        } catch { /* silent */ }
    }, [assignmentId, date]);

    useEffect(() => { loadSession(); }, [loadSession]);

    // Refresh session status every 10 seconds if self-mark is open
    useEffect(() => {
        if (!sessionState?.self_mark_open) return;
        const id = setInterval(loadSession, 10000);
        return () => clearInterval(id);
    }, [sessionState?.self_mark_open, loadSession]);

    // ── Handlers ───────────────────────────────────────────────────────
    const handleStatus = (id: string, status: Student['status']) => {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, status, marked_by: 'teacher' } : s));
    };

    const handleRemark = (id: string, remark: string) => {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, remark } : s));
    };

    const markAll = (status: Student['status']) => {
        setStudents(prev => prev.map(s => s.marked_by === 'self' ? s : { ...s, status, marked_by: 'teacher' }));
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
                toast.success('Attendance saved!');
                loadSession();
            } else {
                toast.error(data.message || 'Failed to save');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSaving(false);
        }
    };

    // ── Session actions ────────────────────────────────────────────────
    const sessionAction = async (action: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/teacher/attendance/${assignmentId}/session`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, date, durationMinutes: selfMarkDuration }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success(
                    action === 'open_self_mark' ? 'Self-marking enabled!' :
                        action === 'close_self_mark' ? 'Self-marking closed' :
                            action === 'review' ? 'Moved to reviewing' :
                                action === 'finalize' ? 'Attendance finalized & locked!' : 'Done'
                );
                loadSession();
            } else {
                toast.error(d.message || 'Action failed');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setActionLoading(false);
            setShowFinalizeConfirm(false);
        }
    };

    // ── Loading / Error ────────────────────────────────────────────────
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
        late: students.filter(s => s.status === 'late').length,
        unmarked: students.filter(s => !s.status).length,
        selfMarked: students.filter(s => s.marked_by === 'self').length,
        total: students.length,
    };

    const isFinalized = sessionState?.status === 'finalized';

    return (
        <div className="space-y-5">
            {/* ── Header ─────────────────────────────────────────────────── */}
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
                        {/* Session status badge */}
                        {sessionState && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border
                                ${sessionState.status === 'open' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                    sessionState.status === 'reviewing' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                        'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                {sessionState.status === 'open' && <CheckCircle className="w-3 h-3" />}
                                {sessionState.status === 'reviewing' && <Eye className="w-3 h-3" />}
                                {sessionState.status === 'finalized' && <Lock className="w-3 h-3" />}
                                {sessionState.status.charAt(0).toUpperCase() + sessionState.status.slice(1)}
                            </span>
                        )}
                        {!isFinalized && (
                            <>
                                <button onClick={() => router.push('/teacher/attendance')}
                                    className="px-4 py-2 text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm transition">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving || students.length === 0}
                                    className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm transition">
                                    {saving
                                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                        : <><Save size={16} /> Save</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Session Controls ────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    {/* Date & Live Stats */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Date:</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isFinalized}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50" />
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-sm">
                            <span className="text-emerald-600 font-semibold">{stats.present} P</span>
                            <span className="text-red-600 font-semibold">{stats.absent} A</span>
                            <span className="text-amber-600 font-semibold">{stats.late} L</span>
                            {stats.selfMarked > 0 && (
                                <span className="text-violet-600 font-semibold flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> {stats.selfMarked} Self
                                </span>
                            )}
                            {stats.unmarked > 0 && <span className="text-gray-400">{stats.unmarked} unmarked</span>}
                        </div>
                    </div>

                    {/* Self-mark + Quick actions */}
                    <div className="flex items-center gap-3">
                        {/* Self-Mark Toggle */}
                        {!isFinalized && (
                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
                                <button
                                    className="flex items-center gap-1.5 text-xs font-semibold"
                                    disabled={actionLoading}
                                    onClick={() => sessionAction(sessionState?.self_mark_open ? 'close_self_mark' : 'open_self_mark')}
                                >
                                    {sessionState?.self_mark_open ? (
                                        <><ToggleRight className="w-5 h-5 text-violet-600" /> <span className="text-violet-600">Self-Mark ON</span></>
                                    ) : (
                                        <><ToggleLeft className="w-5 h-5 text-gray-400" /> <span className="text-gray-500">Self-Mark</span></>
                                    )}
                                </button>
                                {sessionState?.self_mark_open && sessionState.self_mark_deadline && (
                                    <span className="text-violet-600 text-xs">
                                        <Countdown deadline={sessionState.self_mark_deadline} />
                                    </span>
                                )}
                                {!sessionState?.self_mark_open && (
                                    <select value={selfMarkDuration} onChange={e => setSelfMarkDuration(Number(e.target.value))}
                                        className="text-xs border-none bg-transparent text-gray-400 outline-none w-16">
                                        <option value={15}>15m</option>
                                        <option value={30}>30m</option>
                                        <option value={45}>45m</option>
                                        <option value={60}>60m</option>
                                    </select>
                                )}
                            </div>
                        )}

                        {!isFinalized && (
                            <div className="flex gap-2">
                                <button onClick={() => markAll('present')}
                                    className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 font-medium transition">
                                    All P
                                </button>
                                <button onClick={() => markAll('absent')}
                                    className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 font-medium transition">
                                    All A
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile stats */}
                <div className="flex sm:hidden items-center gap-3 text-xs mt-3 flex-wrap">
                    <span className="text-emerald-600 font-semibold">{stats.present} Present</span>
                    <span className="text-red-600 font-semibold">{stats.absent} Absent</span>
                    {stats.selfMarked > 0 && <span className="text-violet-600 font-semibold">{stats.selfMarked} Self-marked</span>}
                    {stats.unmarked > 0 && <span className="text-gray-400">{stats.unmarked} Unmarked</span>}
                </div>
            </div>

            {/* ── Student Table ───────────────────────────────────────────── */}
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
                                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Remark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student, idx) => (
                                    <tr key={student._id} className={`hover:bg-gray-50 transition-colors ${student.marked_by === 'self' ? 'bg-violet-50/30' : ''}`}>
                                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{student.fullName}</p>
                                                    <p className="text-xs text-gray-400 font-mono">{student.username}</p>
                                                </div>
                                                {student.marked_by === 'self' && (
                                                    <span className="text-[9px] font-bold uppercase bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full">Self</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {STATUS_OPTIONS.map(({ type, label, icon: Icon, color, bg, ring, border }) => (
                                                    <button key={type}
                                                        onClick={() => !isFinalized && handleStatus(student._id, type)}
                                                        title={type}
                                                        disabled={isFinalized}
                                                        className={`p-2 rounded-lg transition-all border ${student.status === type
                                                            ? `${bg} ${color} ${border} ring-2 ${ring} ring-offset-1`
                                                            : 'bg-white text-gray-300 border-gray-200 hover:border-gray-300 hover:text-gray-500'}
                                                            ${isFinalized ? 'cursor-default opacity-75' : ''}`}>
                                                        <Icon size={17} />
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <input type="text" value={student.remark}
                                                onChange={e => handleRemark(student._id, e.target.value)}
                                                placeholder="Optional..."
                                                disabled={isFinalized}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-gray-50" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Finalize Bar ────────────────────────────────────────────── */}
            {!isFinalized && sessionState && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Ready to finalize?</p>
                        <p className="text-xs text-gray-400">
                            {stats.unmarked > 0 ? `${stats.unmarked} unmarked students will be set to Absent.` : 'All students marked.'}
                        </p>
                    </div>
                    <button
                        onClick={() => stats.unmarked > 0 ? setShowFinalizeConfirm(true) : sessionAction('finalize')}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                    >
                        <Lock size={14} /> Finalize & Lock
                    </button>
                </div>
            )}

            {/* ── Finalized state ─────────────────────────────────────────── */}
            {isFinalized && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                    <Lock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-gray-500">Attendance Finalized & Locked</p>
                    <p className="text-xs text-gray-400 mt-0.5">Contact admin to make changes.</p>
                </div>
            )}

            {/* ── Finalize Confirm Modal ──────────────────────────────────── */}
            {showFinalizeConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFinalizeConfirm(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Finalize Attendance?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                <strong className="text-red-600">{stats.unmarked} student{stats.unmarked > 1 ? 's' : ''}</strong> not marked.
                                They will be recorded as <strong>Absent</strong>.
                            </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowFinalizeConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                                Go Back
                            </button>
                            <button onClick={() => sessionAction('finalize')} disabled={actionLoading}
                                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={14} />}
                                Finalize
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
