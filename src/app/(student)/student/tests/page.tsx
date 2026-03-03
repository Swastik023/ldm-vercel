'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

export default function StudentTestsPage() {
    const { status } = useSession();
    const [tests, setTests] = useState<TestCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

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

    const totalMarksSum = doneTests.reduce((s, t) => s + (t.totalMarksForAttempt ?? 0), 0);
    const marksSum = doneTests.reduce((s, t) => s + (t.marksObtained ?? 0), 0);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400">Loading tests…</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">📝 My Tests</h1>
                <p className="text-sm text-gray-500 mt-1">Tests assigned to your batch by your teachers.</p>
            </div>

            {/* Stats */}
            {tests.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: tests.length, color: 'text-gray-900' },
                        { label: 'Pending', value: pendingTests.length, color: 'text-yellow-600' },
                        { label: 'Completed', value: doneTests.length, color: 'text-green-600' },
                        { label: 'Avg Score', value: avgPct !== null ? `${avgPct}%` : '—', color: 'text-blue-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5 font-semibold uppercase">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Total marks summary */}
            {doneTests.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs text-blue-200 uppercase font-semibold">Overall Performance</p>
                        <p className="text-2xl font-black mt-0.5">{marksSum} / {totalMarksSum}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-blue-200 uppercase font-semibold">Aggregate %</p>
                        <p className="text-2xl font-black">{avgPct}%</p>
                    </div>
                    <div className="hidden sm:block w-20 h-20">
                        <svg viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${avgPct ?? 0}, 100`} strokeLinecap="round" />
                            <text x="18" y="20.5" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">{avgPct}%</text>
                        </svg>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            {tests.length > 0 && (
                <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
                    {(['all', 'pending', 'done'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all capitalize ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                            {f === 'all' ? `All (${tests.length})` : f === 'pending' ? `Pending (${pendingTests.length})` : `Done (${doneTests.length})`}
                        </button>
                    ))}
                </div>
            )}

            {/* Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-4xl mb-3">{filter === 'pending' ? '🎉' : '📋'}</p>
                    <p className="text-gray-500 font-medium">
                        {filter === 'pending' ? 'All tests completed!' : filter === 'done' ? 'No tests completed yet.' : 'No tests assigned to your batch yet.'}
                    </p>
                    {filter !== 'all' && <button onClick={() => setFilter('all')} className="mt-3 text-sm text-blue-600 hover:underline">View all</button>}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {filtered.map(test => {
                        const pct = test.percentage ?? 0;
                        const barColor = pct >= 75 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500';
                        const pctColor = pct >= 75 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500';
                        const showResult = test.attempted && (test.resultMode === 'instant' || test.isPublished);
                        return (
                            <div key={test._id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all ${test.attempted ? 'border-green-100' : 'border-gray-100 hover:border-blue-200'}`}>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-gray-900 flex-1 mr-2 leading-tight">{test.title}</h3>
                                        {test.attempted && <span className="shrink-0 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Done ✓</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mb-4">
                                        <span>📚 {test.subject?.name}</span>
                                        <span>⏱ {test.durationMinutes} min</span>
                                        <span>❓ {test.questionCount} Qs</span>
                                        <span>📊 {test.totalMarks} marks</span>
                                        {test.negativeMarking > 0 && <span className="text-red-400">−{test.negativeMarking} neg</span>}
                                        <span className={test.resultMode === 'instant' ? 'text-blue-500' : 'text-purple-500'}>
                                            {test.resultMode === 'instant' ? '⚡ Instant result' : '⏳ Manual result'}
                                        </span>
                                    </div>

                                    {test.attempted ? (
                                        <>
                                            {showResult ? (
                                                <>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-500">{test.marksObtained}/{test.totalMarksForAttempt} marks</span>
                                                        <span className={`font-bold ${pctColor}`}>{pct}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                                                        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <div className="flex gap-3 text-xs text-gray-500 mb-3">
                                                        <span className="text-green-600 font-semibold">✓ {test.correctCount}</span>
                                                        <span className="text-red-500 font-semibold">✗ {test.wrongCount}</span>
                                                        <span className="text-gray-400 font-semibold">— {test.skippedCount}</span>
                                                    </div>
                                                    <Link href={`/student/tests/${test._id}/result`}
                                                        className="block w-full text-center py-2.5 bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-xl text-xs font-bold transition-colors border border-gray-200 hover:border-green-200">
                                                        View Result & Review →
                                                    </Link>
                                                </>
                                            ) : (
                                                <div className="py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700 font-medium text-center">
                                                    ⏳ Submitted — awaiting result publication
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link href={`/student/tests/${test._id}`}
                                            className="block w-full text-center py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-blue-200 transition-all">
                                            Start Test →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
