'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, BookOpen, TrendingUp } from 'lucide-react';

interface AttendanceRecord {
    date: string;
    subject: { name: string; code: string } | null;
    teacher: { fullName: string } | null;
    section: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks: string;
}

interface Summary {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    percentage: number;
}

const statusConfig = {
    present: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Present' },
    absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Absent' },
    late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Late' },
    excused: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Excused' },
};

export default function StudentAttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetch('/api/student/attendance')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setRecords(d.records);
                    setSummary(d.summary);
                } else {
                    setError(d.message || 'Failed to load attendance');
                }
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

    const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);
    const pct = summary?.percentage ?? 0;
    const pctColor = pct >= 90 ? 'text-green-600' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-2xl shadow-xl text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-7 h-7" />
                    <h1 className="text-2xl font-bold">My Attendance</h1>
                </div>
                <p className="text-blue-100 text-sm">View your detailed attendance records for all subjects</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className={`p-4 rounded-xl border-2 ${pct >= 75 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} text-center`}>
                        <TrendingUp className={`w-6 h-6 mx-auto mb-1 ${pctColor}`} />
                        <p className={`text-2xl font-bold ${pctColor}`}>{pct}%</p>
                        <p className="text-xs text-gray-500">Overall</p>
                    </div>
                    {(['present', 'absent', 'late', 'excused'] as const).map(status => {
                        const cfg = statusConfig[status];
                        const Icon = cfg.icon;
                        return (
                            <div key={status} className={`p-4 rounded-xl border ${cfg.bg} text-center cursor-pointer transition-all hover:shadow-md ${filter === status ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                                onClick={() => setFilter(filter === status ? 'all' : status)}>
                                <Icon className={`w-6 h-6 mx-auto mb-1 ${cfg.color}`} />
                                <p className={`text-2xl font-bold ${cfg.color}`}>{summary[status]}</p>
                                <p className="text-xs text-gray-500">{cfg.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Low Attendance Warning */}
            {pct > 0 && pct < 75 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">
                        <strong>Warning:</strong> Your attendance is below 75%. This may affect your eligibility for exams. Please attend classes regularly.
                    </p>
                </div>
            )}

            {/* Records Table */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-gray-600" />
                        <h2 className="font-semibold text-gray-800">
                            Attendance Records {filter !== 'all' && <span className="text-sm font-normal text-gray-500">— Showing: {statusConfig[filter as keyof typeof statusConfig]?.label}</span>}
                        </h2>
                    </div>
                    {filter !== 'all' && (
                        <button onClick={() => setFilter('all')} className="text-xs text-blue-600 hover:underline">Show All</button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No attendance records found</p>
                        <p className="text-sm mt-1">Records will appear here once your teachers mark attendance</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-left">Teacher</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map((r, i) => {
                                    const cfg = statusConfig[r.status];
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-700">
                                                {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">{r.subject?.name || 'N/A'}</p>
                                                {r.subject?.code && <p className="text-xs text-gray-400">{r.subject.code}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{r.teacher?.fullName || 'N/A'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{r.remarks || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
