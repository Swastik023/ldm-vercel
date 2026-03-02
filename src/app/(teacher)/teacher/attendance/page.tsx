'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Users, BookOpen, CheckCircle, Clock, Lock } from 'lucide-react';

interface AssignedClass {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

interface TodaySession {
    assignmentId: string;
    subject_name: string;
    subject_code: string;
    section: string;
    batch_name: string | null;
    status: 'open' | 'reviewing' | 'finalized' | null;
    marked_count: number;
    total_students: number;
    self_mark_open: boolean;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Open', bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
    reviewing: { label: 'Reviewing', bg: 'bg-amber-50 border-amber-200', color: 'text-amber-700', icon: <Clock className="w-3 h-3" /> },
    finalized: { label: 'Finalized', bg: 'bg-gray-100 border-gray-200', color: 'text-gray-500', icon: <Lock className="w-3 h-3" /> },
};

export default function AttendanceList() {
    const router = useRouter();
    const [classes, setClasses] = useState<AssignedClass[]>([]);
    const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/teacher/dashboard').then(r => r.json()),
        ]).then(([dashData]) => {
            if (dashData.success) {
                setClasses(dashData.classes || []);
                // Fetch today's session status for each class
                const cls = dashData.classes || [];
                if (cls.length > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    Promise.all(
                        cls.map((c: AssignedClass) =>
                            fetch(`/api/teacher/attendance/${c.id}/session?date=${today}`)
                                .then(r => r.json())
                                .then(d => ({
                                    assignmentId: c.id,
                                    subject_name: c.subject_name,
                                    subject_code: c.subject_code,
                                    section: c.section,
                                    batch_name: c.batch_name,
                                    status: d.attendance?.status || null,
                                    marked_count: d.attendance?.marked_count || 0,
                                    total_students: d.total_students || 0,
                                    self_mark_open: d.attendance?.self_mark_open || false,
                                }))
                                .catch(() => null)
                        )
                    ).then(results => {
                        setTodaySessions(results.filter(Boolean) as TodaySession[]);
                    });
                }
            } else {
                setError('Failed to load courses');
            }
        }).catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
        </div>
    );

    const activeSessions = todaySessions.filter(s => s.status && s.status !== 'finalized');
    const finalizedCount = todaySessions.filter(s => s.status === 'finalized').length;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 mb-1">
                    Take Attendance
                </h1>
                <p className="text-gray-500 text-sm">Manage today&apos;s attendance for your courses.</p>
            </div>

            {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm">{error}</div>}

            {/* ── Today's Sessions Summary ────────────────────────────────── */}
            {todaySessions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-sm font-bold text-gray-800">Today&apos;s Sessions</h2>
                        </div>
                        <div className="flex gap-2 text-xs">
                            {activeSessions.length > 0 && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                                    {activeSessions.length} active
                                </span>
                            )}
                            {finalizedCount > 0 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold">
                                    {finalizedCount} done
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {todaySessions.map(sess => {
                            const badge = sess.status ? STATUS_BADGE[sess.status] : null;
                            const pct = sess.total_students > 0 ? Math.round((sess.marked_count / sess.total_students) * 100) : 0;
                            return (
                                <div
                                    key={sess.assignmentId}
                                    onClick={() => router.push(`/teacher/attendance/${sess.assignmentId}`)}
                                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{sess.subject_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {sess.subject_code} · Section {sess.section}
                                            {sess.batch_name && ` · ${sess.batch_name}`}
                                        </p>
                                    </div>
                                    {/* Live counter */}
                                    {sess.status && (
                                        <div className="text-right shrink-0">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3 h-3 text-gray-400" />
                                                <span className="text-sm font-bold text-gray-700">{sess.marked_count}/{sess.total_students}</span>
                                                <span className="text-[10px] text-gray-400">({pct}%)</span>
                                            </div>
                                            {sess.self_mark_open && (
                                                <span className="text-[9px] text-violet-600 font-semibold">Self-mark ON</span>
                                            )}
                                        </div>
                                    )}
                                    {/* Status badge */}
                                    {badge ? (
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.color}`}>
                                            {badge.icon} {badge.label}
                                        </span>
                                    ) : (
                                        <span className="shrink-0 text-[10px] text-gray-300 font-semibold">Not started</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── All Classes ─────────────────────────────────────────────── */}
            {classes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-16 text-center text-gray-400">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">No courses assigned to you</p>
                    <p className="text-sm mt-1">Contact admin to get courses assigned.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => router.push(`/teacher/attendance/${cls.id}`)}
                            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition border-l-4 border-amber-500 group"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                                {cls.subject_name}
                            </h2>
                            <p className="text-sm text-gray-500 font-mono mt-0.5">{cls.subject_code}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                {cls.batch_name && (
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                        {cls.batch_name}
                                    </span>
                                )}
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    Section {cls.section}
                                </span>
                                {cls.session_name && (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                        {cls.session_name}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-amber-600 mt-4 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <ClipboardCheck size={15} /> Click to take attendance →
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
