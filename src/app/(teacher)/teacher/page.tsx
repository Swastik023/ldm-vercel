'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BookOpen, Users, Bell, CheckCircle, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

interface Class {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

interface DashboardData {
    profile: { name: string; email: string };
    subjectCount: number;
    classes: Class[];
    todayStats: { markedToday: number; presentToday: number; sessionsMarked: number };
    notices: Array<{ id: string; message: string; createdAt: string }>;
}

export default function TeacherDashboard() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/teacher/dashboard')
            .then(res => res.json())
            .then(d => {
                if (d.success) setData(d);
                else setError(d.message || 'Failed to load');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">{error}</div>;

    const { profile, subjectCount, classes, todayStats, notices } = data!;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 rounded-2xl shadow-xl text-white">
                <h1 className="text-3xl font-bold mb-1">Hello, {profile.name}!</h1>
                <p className="text-amber-100 text-sm">Faculty Portal</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Subjects</h3>
                            <p className="text-4xl font-bold text-gray-900 mt-2">{subjectCount}</p>
                            <p className="text-sm text-gray-400 mt-1">{classes.length} course assignment{classes.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-full">
                            <BookOpen size={22} className="text-amber-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marked Today</h3>
                            <p className="text-4xl font-bold text-gray-900 mt-2">{todayStats.markedToday}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {todayStats.sessionsMarked > 0
                                    ? `${todayStats.presentToday} present · ${todayStats.sessionsMarked} session${todayStats.sessionsMarked !== 1 ? 's' : ''}`
                                    : 'No attendance marked today'}
                            </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 p-3 rounded-full">
                            <CheckCircle size={22} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 flex flex-col justify-between">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/teacher/attendance"
                            className="p-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition text-center font-medium border border-amber-100">
                            <ClipboardCheck size={14} className="inline mr-1" />Take Attendance
                        </Link>
                        <Link href="/teacher/marks"
                            className="p-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-center font-medium border border-blue-100">
                            <BookOpen size={14} className="inline mr-1" />Marks Entry
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Classes */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users size={18} className="text-amber-500" /> My Assigned Courses
                    </h2>
                    {classes.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No courses assigned yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {classes.map(cls => (
                                <Link key={cls.id} href={`/teacher/attendance/${cls.id}`}
                                    className="flex items-center p-3.5 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition group">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">{cls.subject_name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {cls.subject_code}{cls.batch_name ? ` · ${cls.batch_name}` : ''} · Section {cls.section}
                                        </p>
                                    </div>
                                    <span className="text-amber-500 text-sm group-hover:translate-x-1 transition-transform">→</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notices */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Bell size={18} className="text-blue-500" /> Recent Notices
                    </h2>
                    {notices.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No active notices.</p>
                    ) : (
                        <div className="space-y-3">
                            {notices.map(n => (
                                <div key={n.id} className="p-3.5 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                    <p className="text-gray-800 text-sm font-medium">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
