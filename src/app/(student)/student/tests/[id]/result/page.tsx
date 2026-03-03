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
            // Try sessionStorage first (just submitted)
            const cached = sessionStorage.getItem(`test_result_${p.id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.resultMode === 'manual') {
                    setPending(true);
                } else {
                    setResult(parsed);
                }
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

    if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

    // Manual mode — result not yet published
    if (pending) return (
        <div className="max-w-lg mx-auto text-center py-20 space-y-5">
            <div className="text-6xl">⏳</div>
            <h2 className="text-xl font-bold text-gray-900">Result Pending</h2>
            <p className="text-gray-500 text-sm">Your test has been submitted successfully. Your teacher will publish the results soon. Please check back later.</p>
            <Link href="/student/tests" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">← Back to Tests</Link>
        </div>
    );

    if (error || !result) return (
        <div className="max-w-lg mx-auto text-center py-20 space-y-4">
            <div className="text-5xl">😕</div>
            <p className="text-gray-500">{error || 'Result not found.'}</p>
            <Link href="/student/tests" className="text-blue-600 hover:underline text-sm">← Back to Tests</Link>
        </div>
    );

    const { marksObtained, totalMarks, negativeMarks, percentage, correctCount, wrongCount, skippedCount, submittedAt, gradedAnswers } = result;
    const grade = percentage >= 90 ? '🏆 Excellent!' : percentage >= 75 ? '🎉 Good Job!' : percentage >= 60 ? '✅ Passed' : '💪 Keep Trying';
    const gradientClass = percentage >= 75 ? 'from-emerald-500 to-green-600' : percentage >= 60 ? 'from-yellow-400 to-amber-500' : 'from-red-500 to-rose-600';

    return (
        <div className="max-w-2xl mx-auto space-y-5 pb-10">
            {/* ─── Scorecard ────────────────────────────── */}
            <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-8 text-white text-center shadow-xl`}>
                <p className="text-white/70 text-sm font-medium mb-1">Your Score</p>
                <div className="text-7xl font-black mb-1 tabular-nums">{percentage}%</div>
                <p className="text-xl font-bold text-white/90">{grade}</p>
                {submittedAt && (
                    <p className="text-white/50 text-xs mt-1">Submitted {new Date(submittedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                )}

                {/* Score bar */}
                <div className="mt-5 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-white rounded-full" style={{ width: `${percentage}%`, transition: 'width 1s ease' }} />
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-4 gap-1">
                    {[
                        { label: 'Marks', value: `${marksObtained}/${totalMarks}` },
                        { label: 'Correct', value: correctCount },
                        { label: 'Wrong', value: wrongCount },
                        { label: 'Skipped', value: skippedCount },
                    ].map(s => (
                        <div key={s.label} className="bg-white/10 rounded-xl py-3 px-2">
                            <p className="text-lg font-black">{s.value}</p>
                            <p className="text-white/60 text-xs">{s.label}</p>
                        </div>
                    ))}
                </div>
                {negativeMarks > 0 && (
                    <p className="mt-3 text-xs text-white/60">−{negativeMarks} marks deducted (negative marking)</p>
                )}
            </div>

            {/* ─── Review Toggle ─────────────────────────── */}
            <button onClick={() => setShowReview(v => !v)}
                className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                {showReview ? '▲ Hide Answer Review' : '▼ Show Full Answer Review'}
            </button>

            {/* ─── Answer Review ─────────────────────────── */}
            {showReview && (
                <div className="space-y-4">
                    <h2 className="font-bold text-gray-900 text-lg">Answer Review</h2>
                    {gradedAnswers.map((q, i) => (
                        <div key={q.questionId} className={`bg-white rounded-2xl border-2 p-5 ${q.isCorrect ? 'border-green-200' : q.studentAnswer === null ? 'border-gray-200' : 'border-red-200'}`}>
                            {/* Question */}
                            <p className="text-sm font-semibold text-gray-900 mb-4">
                                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mr-2 ${q.isCorrect ? 'bg-green-100 text-green-700' : q.studentAnswer === null ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-600'}`}>{i + 1}</span>
                                {q.questionText}
                                <span className={`ml-2 text-xs font-bold ${q.marksAwarded > 0 ? 'text-green-600' : q.marksAwarded < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    [{q.marksAwarded > 0 ? '+' : ''}{q.marksAwarded} marks]
                                </span>
                            </p>

                            {/* Answer summary */}
                            <div className="grid sm:grid-cols-2 gap-3 mb-4">
                                <div className={`px-3 py-2 rounded-lg text-xs font-medium ${q.isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : q.studentAnswer === null ? 'bg-gray-50 text-gray-500 border border-gray-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    <span className="block text-xs text-gray-400 mb-0.5">Your Answer</span>
                                    {q.studentAnswer ?? <em>Not answered</em>}
                                    {q.isCorrect ? ' ✓' : q.studentAnswer ? ' ✗' : ''}
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-800 border border-green-200`}>
                                    <span className="block text-xs text-gray-400 mb-0.5">Correct Answer</span>
                                    {q.correctAnswer} ✓
                                </div>
                            </div>

                            {/* Reason */}
                            {q.reason && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                                    <p className="text-xs font-semibold text-blue-600 mb-0.5">💡 Explanation</p>
                                    <p className="text-xs text-blue-800">{q.reason}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Link href="/student/tests" className="block text-center py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors">← Back to Tests</Link>
        </div>
    );
}
