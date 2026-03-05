'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GradedAnswer {
    questionId: string;
    questionText: string;
    studentAnswer: string | null;
    correctAnswer: string;
    reason: string;
    marksAwarded: number;
    isCorrect: boolean;
}

interface ResultData {
    resultMode: 'instant' | 'manual';
    published: boolean;
    message?: string;
    marksObtained: number;
    totalMarks: number;
    negativeMarks: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    submittedAt?: string;
    gradedAnswers: GradedAnswer[];
}

// ── Large Donut Chart (from Stitch design) ─────────────────────────────────
function DonutChart({ pct, size = 160 }: { pct: number; size?: number }) {
    const r = 15.9155;
    const circ = 2 * Math.PI * r;
    const fill = (pct / 100) * circ;
    const color = pct >= 75 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
    const grade = pct >= 90 ? '🏆 Excellent' : pct >= 75 ? '🎉 Great Job' : pct >= 60 ? '✅ Passed' : '💪 Keep Going';
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox="0 0 36 36" className="rotate-[-90deg]">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3.2" />
                    <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.2"
                        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
                        className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                    <span className="text-3xl font-black text-gray-900">{pct}%</span>
                    <span className="text-xs text-gray-400 font-medium mt-0.5">Score</span>
                </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 mt-1">{grade}</span>
        </div>
    );
}

export default function TestResultPage({ params }: { params: Promise<{ id: string }> }) {
    const [result, setResult] = useState<ResultData | null>(null);
    const [testId, setTestId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReview, setShowReview] = useState(false);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        params.then(p => {
            setTestId(p.id);
            const cached = sessionStorage.getItem(`test_result_${p.id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.resultMode === 'manual') { setPending(true); }
                else { setResult(parsed); }
                setLoading(false);
            } else {
                fetch(`/api/student/tests/${p.id}/result`)
                    .then(r => r.json())
                    .then(d => {
                        if (!d.success) { setError(d.message || 'Could not load result.'); }
                        else if (!d.published) { setPending(true); }
                        else { setResult(d); }
                        setLoading(false);
                    })
                    .catch(() => { setError('Network error.'); setLoading(false); });
            }
        });
    }, [params]);

    if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;

    if (pending) return (
        <div className="max-w-lg mx-auto text-center py-20 space-y-5" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <div className="text-6xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-900">Result Pending</h2>
            <p className="text-gray-500 text-sm">Your test has been submitted. Your teacher will publish results soon.</p>
            <Link href="/student/tests" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">← Back to Tests</Link>
        </div>
    );

    if (error || !result) return (
        <div className="max-w-lg mx-auto text-center py-20 space-y-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
            <div className="text-5xl">😕</div>
            <p className="text-gray-500">{error || 'Result not found.'}</p>
            <Link href="/student/tests" className="text-indigo-600 hover:underline text-sm">← Back to Tests</Link>
        </div>
    );

    const { marksObtained, totalMarks, negativeMarks, percentage, correctCount, wrongCount, skippedCount, submittedAt, gradedAnswers } = result;

    return (
        <div className="max-w-2xl mx-auto space-y-5 pb-12" style={{ fontFamily: 'Lexend, sans-serif' }}>
            {/* ─── Header ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <Link href="/student/tests" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-sm">←</Link>
                <div>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight">Test Results</h1>
                    {submittedAt && (
                        <p className="text-xs text-gray-400">Submitted on {new Date(submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    )}
                </div>
            </div>

            {/* ─── Donut Score Card (Stitch design) ──────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <div className="flex flex-col items-center gap-5">
                    <DonutChart pct={percentage} size={160} />

                    {/* Marks headline */}
                    <div className="text-center">
                        <p className="text-2xl font-black text-gray-900">{marksObtained} / {totalMarks}</p>
                        <p className="text-sm text-gray-400">Marks Achieved</p>
                    </div>

                    {/* 4 Metric Cards */}
                    <div className="grid grid-cols-4 gap-3 w-full">
                        {[
                            { label: 'Correct', value: correctCount, icon: '✓', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
                            { label: 'Wrong', value: wrongCount, icon: '✗', color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
                            { label: 'Skipped', value: skippedCount, icon: '—', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-100' },
                            { label: 'Negative', value: negativeMarks > 0 ? `-${negativeMarks}` : '0', icon: '⚠', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                        ].map(m => (
                            <div key={m.label} className={`${m.bg} border rounded-xl py-3 px-2 text-center`}>
                                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Review Toggle ──────────────────────────────────────── */}
            <button onClick={() => setShowReview(v => !v)}
                className="w-full py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                📋 {showReview ? 'Hide Answer Breakdown' : 'Show Answer Breakdown'}
                <span className="ml-1 text-xs text-gray-400">({gradedAnswers.length} questions)</span>
            </button>

            {/* ─── Answer Breakdown (Stitch design) ──────────────────── */}
            {showReview && (
                <div className="space-y-3">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        📋 Answer Breakdown
                        <span className="text-xs font-normal text-gray-400">{correctCount} correct · {wrongCount} wrong · {skippedCount} skipped</span>
                    </h2>
                    {gradedAnswers.map((q, i) => {
                        const state = q.isCorrect ? 'correct' : q.studentAnswer === null ? 'skipped' : 'wrong';
                        const borderMap = { correct: 'border-green-200 bg-green-50/30', wrong: 'border-red-200 bg-red-50/20', skipped: 'border-gray-200 bg-gray-50/30' };
                        const badgeMap = { correct: 'bg-green-100 text-green-700', wrong: 'bg-red-100 text-red-600', skipped: 'bg-gray-100 text-gray-500' };
                        const iconMap = { correct: '✓', wrong: '✗', skipped: '—' };
                        return (
                            <div key={q.questionId} className={`rounded-2xl border-2 p-5 ${borderMap[state]}`}>
                                {/* Question */}
                                <p className="text-sm font-semibold text-gray-900 mb-3 leading-snug">
                                    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mr-2 shrink-0 ${badgeMap[state]}`}>
                                        {iconMap[state]}
                                    </span>
                                    <span className="text-xs text-gray-400 mr-2 font-medium">Q{i + 1}.</span>
                                    {q.questionText}
                                    <span className={`ml-2 text-xs font-bold ${q.marksAwarded > 0 ? 'text-green-600' : q.marksAwarded < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                        [{q.marksAwarded > 0 ? '+' : ''}{q.marksAwarded}]
                                    </span>
                                </p>

                                {/* Your answer vs correct */}
                                <div className="grid sm:grid-cols-2 gap-2 mb-3">
                                    <div className={`px-3 py-2.5 rounded-xl text-xs font-medium border ${state === 'correct' ? 'bg-green-50 text-green-800 border-green-200' :
                                            state === 'skipped' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        <span className="block text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Your Answer</span>
                                        <span className="font-bold">{q.studentAnswer ? `${q.studentAnswer}` : 'Not answered'}</span>
                                        {state === 'correct' && ' ✓'}
                                        {state === 'wrong' && ' ✗'}
                                    </div>
                                    <div className="px-3 py-2.5 rounded-xl text-xs font-medium border bg-green-50 text-green-800 border-green-200">
                                        <span className="block text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide">Correct Answer</span>
                                        <span className="font-bold">{q.correctAnswer} ✓</span>
                                    </div>
                                </div>

                                {/* Explanation */}
                                {q.reason && (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">💡 Explanation</p>
                                        <p className="text-xs text-indigo-900 leading-relaxed">{q.reason}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Link href="/student/tests" className="block text-center py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                ← Back to My Tests
            </Link>
        </div>
    );
}
