'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Book, Clock, Bell, User, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface DashboardData {
    profile: { id: string; name: string; email: string; username: string; session: string | null; batch: string | null };
    attendance: { present: number; absent: number; late: number; total: number; percentage: number };
    notices: Array<{ id: string; message: string; createdAt: string }>;
}

export default function StudentDashboard() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/student/dashboard')
            .then(res => res.json())
            .then(d => {
                if (d.success) setData(d);
                else setError(d.message || 'Failed to load dashboard');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
    );

    if (error) return (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">{error}</div>
    );

    const { profile, attendance, notices } = data!;
    const pct = attendance.percentage;
    const pctColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';
    const pctBg = pct >= 90 ? 'bg-green-50 border-green-200' : pct >= 75 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-2xl shadow-xl text-white">
                <h1 className="text-3xl font-bold mb-1">Welcome, {profile.name}!</h1>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                    <User size={15} />
                    {profile.batch ? `Batch: ${profile.batch}` : 'Student Portal'}
                    {profile.session && ` • Session: ${profile.session}`}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance */}
                <div className={`bg-white p-6 rounded-xl shadow-md border-l-4 ${pct >= 90 ? 'border-green-500' : pct >= 75 ? 'border-yellow-500' : 'border-red-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attendance</h3>
                            <p className={`text-4xl font-bold mt-2 ${pctColor}`}>{pct}%</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {attendance.total > 0
                                    ? `${attendance.present} present · ${attendance.absent} absent${attendance.late > 0 ? ` · ${attendance.late} late` : ''}`
                                    : 'No records yet'}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${pctBg} border`}>
                            <Clock size={22} className={pctColor} />
                        </div>
                    </div>
                </div>

                {/* Classes */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Classes</h3>
                            <p className="text-4xl font-bold text-gray-900 mt-2">{attendance.total}</p>
                            <p className="text-sm text-gray-500 mt-1">Recorded so far</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-full">
                            <Book size={22} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Notices */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notices</h3>
                            <p className="text-4xl font-bold text-gray-900 mt-2">{notices.length}</p>
                            <p className="text-sm text-gray-500 mt-1">Active announcements</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 p-3 rounded-full">
                            <Bell size={22} className="text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance breakdown */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" /> Attendance Breakdown
                    </h2>
                    {attendance.total === 0 ? (
                        <p className="text-gray-400 text-center py-6">No attendance records yet.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle size={15} className="text-green-500" /> Present</span>
                                <span className="font-bold text-green-600">{attendance.present}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-gray-700"><XCircle size={15} className="text-red-500" /> Absent</span>
                                <span className="font-bold text-red-600">{attendance.absent}</span>
                            </div>
                            {attendance.late > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm text-gray-700"><Clock size={15} className="text-yellow-500" /> Late</span>
                                    <span className="font-bold text-yellow-600">{attendance.late}</span>
                                </div>
                            )}
                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Attendance Rate</span>
                                    <span className={pctColor + ' font-semibold'}>{pct}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                {pct < 75 && (
                                    <p className="text-xs text-red-600 mt-1.5">⚠️ Below minimum required attendance (75%)</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notices */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                        <Bell size={18} className="text-purple-500" /> Recent Notices
                    </h2>
                    {notices.length === 0 ? (
                        <p className="text-gray-400 text-center py-6">No active notices.</p>
                    ) : (
                        <div className="space-y-3">
                            {notices.map(n => (
                                <div key={n.id} className="p-3.5 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                                    <p className="text-gray-800 text-sm font-medium">{n.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
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
