'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

interface TestSubject { _id: string; name: string; code: string; }
interface TestCard {
    _id: string;
    title: string;
    description?: string;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: number;
    questionCount: number;
    subject: TestSubject;
    resultMode: 'instant' | 'manual';
    isPublished: boolean;
    createdAt: string;
    attempted: boolean;
    marksObtained: number | null;
    totalMarksForAttempt: number | null;
    percentage: number | null;
    correctCount: number | null;
    wrongCount: number | null;
    skippedCount: number | null;
    resultVisible: boolean;
}

// ── SVG Donut Ring ──────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 60 }: { pct: number; size?: number }) {
    const r = 15.9155;
    const circ = 2 * Math.PI * r;
    const fill = (pct / 100) * circ;
    const color = pct >= 75 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
    return (
        <svg width={size} height={size} viewBox="0 0 36 36" className="rotate-[-90deg]">
            <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
            <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5"
                strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
        </svg>
    );
}

type FilterType = 'all' | 'pending' | 'done';

export default function StudentTestsPage() {
    const { status } = useSession();
    const [tests, setTests] = useState<TestCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/student/tests').then(r => r.json()).then(d => {
                if (d.success) setTests(d.tests);
                setLoading(false);
            });
        }
    }, [status]);

    const doneTests = tests.filter(t => t.attempted);
    const pendingTests = tests.filter(t => !t.attempted);
    const filtered = filter === 'pending' ? pendingTests : filter === 'done' ? doneTests : tests;

    const avgPct = doneTests.length > 0
        ? Math.round(doneTests.reduce((s, t) => s + (t.percentage ?? 0), 0) / doneTests.length)
        : null;
    const marksSum = doneTests.reduce((s, t) => s + (t.marksObtained ?? 0), 0);
    const totalMarksSum = doneTests.reduce((s, t) => s + (t.totalMarksForAttempt ?? 0), 0);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            <p className="text-sm text-gray-400" style={{ fontFamily: 'Lexend, sans-serif' }}>Loading tests…</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto" style={{ fontFamily: 'Lexend, sans-serif' }}>
            {/* ─── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tests</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Online MCQ Examinations assigned to your batch</p>
                </div>
                {tests.length > 0 && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full font-semibold">
                        {tests.length} test{tests.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* ─── Quick Stats ─────────────────────────────────────────── */}
            {tests.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: tests.length, color: 'text-gray-900', bg: 'bg-gray-50' },
                        { label: 'Pending', value: pendingTests.length, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Completed', value: doneTests.length, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Avg Score', value: avgPct !== null ? `${avgPct}%` : '—', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className={`${s.bg} rounded-2xl border border-gray-100 p-4 text-center`}>
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ─── Performance banner ───────────────────────────────────── */}
            {doneTests.length > 0 && avgPct !== null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-indigo-200/50">
                    <div>
                        <p className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">Overall Performance</p>
                        <p className="text-3xl font-black mt-0.5">{marksSum} / {totalMarksSum}</p>
                        <p className="text-xs text-indigo-200 mt-0.5">across {doneTests.length} test{doneTests.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="relative shrink-0">
                        <ScoreRing pct={avgPct} size={72} />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black rotate-0">{avgPct}%</span>
                    </div>
                </motion.div>
            )}

            {/* ─── Filter tabs ─────────────────────────────────────────── */}
            {tests.length > 0 && (
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    {(['all', 'pending', 'done'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all capitalize ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                            {f === 'all' ? `All (${tests.length})` : f === 'pending' ? `Pending (${pendingTests.length})` : `Done (${doneTests.length})`}
                        </button>
                    ))}
                </div>
            )}

            {/* ─── Test Cards ──────────────────────────────────────────── */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-5xl mb-3">{filter === 'pending' ? '🎉' : '📋'}</p>
                    <p className="text-gray-500 font-medium text-sm">
                        {filter === 'pending' ? 'All tests completed! Great work.' : filter === 'done' ? 'No completed tests yet.' : 'No tests assigned to your batch yet.'}
                    </p>
                    {filter !== 'all' && <button onClick={() => setFilter('all')} className="mt-3 text-sm text-indigo-600 hover:underline">View all</button>}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((test, i) => {
                        const pct = test.percentage ?? 0;
                        const showResult = test.attempted && (test.resultMode === 'instant' || test.isPublished);
                        const statusColor = test.attempted
                            ? (showResult ? { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Completed' }
                                : { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Result Pending' })
                            : { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-100', label: 'Available' };

                        return (
                            <motion.div key={test._id}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">

                                {/* Color top strip */}
                                <div className={`h-1 w-full ${test.attempted ? (showResult ? 'bg-blue-500' : 'bg-amber-400') : 'bg-green-500'}`} />

                                <div className="p-5 flex flex-col flex-1">
                                    {/* Status badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                                            {statusColor.label}
                                        </span>
                                        {test.resultMode === 'instant'
                                            ? <span className="text-xs text-indigo-500 font-medium">⚡ Instant</span>
                                            : <span className="text-xs text-purple-500 font-medium">⏳ Manual</span>}
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">{test.title}</h3>
                                    {test.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{test.description}</p>}

                                    {/* Subject pill + meta chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                            {test.subject?.name}
                                        </span>
                                        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">⏱ {test.durationMinutes}m</span>
                                        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">❓ {test.questionCount}Q</span>
                                        {test.negativeMarking > 0 && (
                                            <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">−{test.negativeMarking} neg</span>
                                        )}
                                    </div>

                                    {/* Score section */}
                                    <div className="mt-auto">
                                        {test.attempted ? (
                                            showResult ? (
                                                <>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {/* Mini donut */}
                                                        <div className="relative shrink-0">
                                                            <ScoreRing pct={pct} size={48} />
                                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-800">{pct}%</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-black text-gray-900">{test.marksObtained}/{test.totalMarksForAttempt} marks</p>
                                                            <div className="flex gap-2 text-xs mt-0.5">
                                                                <span className="text-green-600 font-semibold">✓ {test.correctCount}</span>
                                                                <span className="text-red-500 font-semibold">✗ {test.wrongCount}</span>
                                                                <span className="text-gray-400">— {test.skippedCount}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link href={`/student/tests/${test._id}/result`}
                                                        className="block w-full text-center py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-gray-200 hover:border-indigo-200">
                                                        View Results & Review →
                                                    </Link>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                                                    <span className="text-base">⏳</span>
                                                    <span>Submitted — awaiting result publication</span>
                                                </div>
                                            )
                                        ) : (
                                            <Link href={`/student/tests/${test._id}`}
                                                className="block w-full text-center py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold hover:shadow-md hover:shadow-indigo-200 transition-all">
                                                Start Test →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
