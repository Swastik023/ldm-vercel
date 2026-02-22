'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as gtag from '@/lib/gtag';


interface Question { index: number; questionText: string; options: { label: string; text: string }[]; }
interface TestMeta { _id: string; title: string; duration: number; questionCount: number; }

export default function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [testId, setTestId] = useState('');
    const [test, setTest] = useState<TestMeta | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const submittedRef = useRef(false);

    // Resolve params
    useEffect(() => {
        params.then(p => setTestId(p.id));
    }, [params]);

    const handleSubmit = useCallback(async (auto = false) => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const answersArr = Object.entries(answers).map(([i, sel]) => ({ questionIndex: Number(i), selectedOption: sel }));

        try {
            const res = await fetch(`/api/student/tests/${testId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: answersArr }),
            });
            const data = await res.json();
            if (data.success) {
                // 🔥 Track test submit with score
                gtag.event.testSubmit(test?.title || '', data.score, data.percentage);
                // Store result for result page via sessionStorage
                sessionStorage.setItem(`test_result_${testId}`, JSON.stringify(data));
                router.replace(`/student/tests/${testId}/result`);

            } else {
                setError(data.message || 'Submission failed.');
                setSubmitting(false);
                submittedRef.current = false;
            }
        } catch {
            setError('Network error. Please check your connection.');
            setSubmitting(false);
            submittedRef.current = false;
        }
    }, [answers, testId, router]);

    useEffect(() => {
        if (!testId) return;
        fetch(`/api/student/tests/${testId}`)
            .then(r => r.json())
            .then(data => {
                if (!data.success) {
                    if (data.alreadyAttempted) router.replace(`/student/tests/${testId}/result`);
                    else setError(data.message || 'Test not available.');
                } else {
                    setTest(data.test);
                    setQuestions(data.questions);
                    setTimeLeft(data.test.duration * 60);
                    // 🔥 Track test start
                    gtag.event.testStart(data.test.title);
                }
                setLoading(false);
            })
            .catch(() => { setError('Failed to load test.'); setLoading(false); });
    }, [testId, router]);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || !test) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(true); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [test, handleSubmit]);

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const answeredCount = Object.keys(answers).length;
    const isUrgent = timeLeft <= 60 && timeLeft > 0;

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
    if (error) return <div className="flex flex-col items-center justify-center h-[60vh] gap-4"><p className="text-red-600 font-medium">{error}</p><button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">← Go back</button></div>;
    if (!test) return null;

    return (
        <div className="max-w-2xl mx-auto pb-28">
            {/* Sticky header */}
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 -mx-4 mb-6 flex items-center justify-between shadow-sm">
                <div>
                    <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{test.title}</h1>
                    <p className="text-xs text-gray-500">{answeredCount}/{test.questionCount} answered</p>
                </div>
                <div className={`text-2xl font-mono font-bold tabular-nums ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {questions.map((q, qi) => (
                    <div key={q.index} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-900 mb-4">
                            <span className="inline-block w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold leading-7 text-center mr-2">{qi + 1}</span>
                            {q.questionText}
                        </p>
                        <div className="space-y-2">
                            {q.options.map(opt => {
                                const isSelected = answers[q.index] === opt.label;
                                return (
                                    <label key={opt.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name={`q${q.index}`} value={opt.label} checked={isSelected} onChange={() => setAnswers(prev => ({ ...prev, [q.index]: opt.label }))} className="sr-only" />
                                        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'}`}>
                                            {opt.label}
                                        </span>
                                        <span className="text-sm text-gray-800">{opt.text}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Fixed submit bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500"><span className="font-bold text-gray-900">{answeredCount}</span> of {test.questionCount} answered {answeredCount < test.questionCount ? <span className="text-yellow-600">({test.questionCount - answeredCount} remaining)</span> : <span className="text-green-600">✓ All done!</span>}</p>
                <button onClick={() => { if (answeredCount < test.questionCount && !confirm(`You have ${test.questionCount - answeredCount} unanswered question(s). Submit anyway?`)) return; handleSubmit(); }} disabled={submitting} className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-green-200 transition-all disabled:opacity-60 w-full sm:w-auto">
                    {submitting ? 'Submitting…' : 'Submit Test →'}
                </button>
            </div>
        </div>
    );
}
