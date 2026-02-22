'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReviewQuestion { index: number; questionText: string; options: { label: string; text: string }[]; correctAnswer: string; studentAnswer: string | null; isCorrect: boolean; }
interface Result { score: number; totalQuestions: number; percentage: number; review: ReviewQuestion[]; }

export default function TestResultPage({ params }: { params: Promise<{ id: string }> }) {
    const [result, setResult] = useState<Result | null>(null);
    const [testId, setTestId] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(p => {
            setTestId(p.id);
            // Try sessionStorage first (just submitted)
            const cached = sessionStorage.getItem(`test_result_${p.id}`);
            if (cached) {
                setResult(JSON.parse(cached));
                setLoading(false);
            } else {
                // Refetch from API (returning visitor)
                fetch(`/api/student/tests/${p.id}/result`)
                    .then(r => r.json())
                    .then(d => { if (d.success) setResult(d); setLoading(false); })
                    .catch(() => setLoading(false));
            }
        });
    }, [params]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
    if (!result) return <div className="text-center py-20 text-gray-500">Result not found. <Link href="/student/tests" className="text-blue-600 hover:underline">Back to tests</Link></div>;

    const { score, totalQuestions, percentage, review } = result;
    const grade = percentage >= 90 ? 'Excellent! 🏆' : percentage >= 75 ? 'Good Job! 🎉' : percentage >= 60 ? 'Passed ✅' : 'Keep Trying 💪';
    const gradeColor = percentage >= 75 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-500';

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-10">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-xl">
                <p className="text-white/70 text-sm font-medium mb-1">Your Result</p>
                <div className="text-6xl font-black mb-2">{percentage}%</div>
                <p className={`text-2xl font-bold ${percentage >= 75 ? 'text-green-300' : percentage >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>{grade}</p>
                <div className="flex justify-center gap-8 mt-6 text-sm">
                    <div><p className="text-white/60">Correct</p><p className="text-2xl font-bold">{score}</p></div>
                    <div className="border-x border-white/20 px-8"><p className="text-white/60">Wrong</p><p className="text-2xl font-bold">{totalQuestions - score}</p></div>
                    <div><p className="text-white/60">Total</p><p className="text-2xl font-bold">{totalQuestions}</p></div>
                </div>
            </div>

            {/* Review */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Answer Review</h2>
                <div className="space-y-4">
                    {review.map((q, i) => (
                        <div key={q.index} className={`bg-white rounded-2xl border-2 p-5 ${q.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                            <p className="text-sm font-semibold text-gray-900 mb-3">
                                <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 text-center mr-2 ${q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{i + 1}</span>
                                {q.questionText}
                            </p>
                            <div className="space-y-1.5">
                                {q.options.map(opt => {
                                    const isCorrect = opt.label === q.correctAnswer;
                                    const isStudent = opt.label === q.studentAnswer;
                                    return (
                                        <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isCorrect ? 'bg-green-50 border border-green-200 font-semibold text-green-800' : isStudent && !isCorrect ? 'bg-red-50 border border-red-200 text-red-700 line-through' : 'text-gray-600'}`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? 'bg-green-500 text-white' : isStudent ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-400'}`}>{opt.label}</span>
                                            {opt.text}
                                            {isCorrect && <span className="ml-auto text-xs text-green-600">✓ Correct</span>}
                                            {isStudent && !isCorrect && <span className="ml-auto text-xs text-red-500">✗ Your answer</span>}
                                        </div>
                                    );
                                })}
                                {!q.studentAnswer && <p className="text-xs text-gray-400 italic mt-1">— Not answered</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Link href="/student/tests" className="block text-center py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors">
                ← Back to Tests
            </Link>
        </div>
    );
}
