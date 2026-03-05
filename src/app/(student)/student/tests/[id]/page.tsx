'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import * as gtag from '@/lib/gtag';

interface TestOption { label: string; text: string; }
interface TestQuestion { questionId: string; sectionId?: string; questionText: string; marks: number; options: TestOption[]; }
interface TestSection { sectionId: string; title: string; instructions?: string; }
interface TestMeta { _id: string; title: string; description?: string; durationMinutes: number; totalMarks: number; negativeMarking: number; questionCount: number; resultMode: 'instant' | 'manual'; sections: TestSection[]; subject: { name: string } | null; }

type PaletteStatus = 'unanswered' | 'answered' | 'flagged';

const MAX_WARNINGS = 3;

// ── Moving watermark ──────────────────────────────────────────────────────────
function ExamWatermark({ name, id }: { name: string; id: string }) {
    const [pos, setPos] = useState({ x: 20, y: 20 });
    const [dir, setDir] = useState({ dx: 0.3, dy: 0.2 });

    useEffect(() => {
        let x = Math.random() * 60 + 10;
        let y = Math.random() * 60 + 10;
        let dx = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.2);
        let dy = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.2);

        const frame = setInterval(() => {
            x += dx;
            y += dy;
            if (x <= 5 || x >= 70) dx *= -1;
            if (y <= 5 || y >= 80) dy *= -1;
            setPos({ x, y });
            setDir({ dx, dy });
        }, 50);
        return () => clearInterval(frame);
    }, []);

    return (
        <div
            className="fixed pointer-events-none z-50 select-none opacity-[0.08] text-gray-800 font-bold text-sm rotate-[-20deg] transition-none"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, willChange: 'left, top' }}
        >
            <div>{name}</div>
            <div className="text-xs opacity-80">{id}</div>
        </div>
    );
}

// ── Security warning overlay ──────────────────────────────────────────────────
function WarningOverlay({ count, max, onDismiss }: { count: number; max: number; onDismiss: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center space-y-4">
                <div className="text-5xl">⚠️</div>
                <h2 className="text-xl font-black text-red-600">Security Warning</h2>
                <p className="text-gray-700 text-sm">
                    You switched away from the exam window. This has been logged.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                    <p className="text-red-700 font-bold text-sm">
                        Warning {count} of {max}
                    </p>
                    {count >= max - 1 && (
                        <p className="text-red-600 text-xs mt-0.5 font-semibold">
                            Next violation will auto-submit your exam!
                        </p>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl text-sm"
                >
                    Return to Exam
                </button>
            </div>
        </div>
    );
}

export default function TakeTestPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [testId, setTestId] = useState('');
    const [test, setTest] = useState<TestMeta | null>(null);
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [flags, setFlags] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [warningCount, setWarningCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const submittedRef = useRef(false);
    const totalSeconds = useRef(0);
    const endTimeRef = useRef(0);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const warningCountRef = useRef(0); // ref version for use in event handlers

    // Resolve params once
    useEffect(() => { params.then(p => setTestId(p.id)); }, [params]);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (auto = false) => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);
        // Exit fullscreen on submit
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });

        const answersArr = questions.map(q => ({ questionId: q.questionId, selectedOption: answers[q.questionId] ?? null }));

        try {
            const res = await fetch(`/api/student/tests/${testId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: answersArr }),
            });
            const data = await res.json();
            if (data.success) {
                gtag.event.testSubmit(test?.title || '', data.marksObtained, data.percentage);
                sessionStorage.setItem(`test_result_${testId}`, JSON.stringify(data));
                router.replace(`/student/tests/${testId}/result`);
            } else {
                setError(data.message || 'Submission failed.');
                setSubmitting(false);
                submittedRef.current = false;
            }
        } catch {
            setError('Network error. Please try again.');
            setSubmitting(false);
            submittedRef.current = false;
        }
    }, [answers, testId, router, test, questions]);

    // ── Load test ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!testId) return;
        fetch(`/api/student/tests/${testId}`)
            .then(r => r.json())
            .then(d => {
                if (!d.success) {
                    if (d.alreadyAttempted) router.replace(`/student/tests/${testId}/result`);
                    else setError(d.message || 'Test not available.');
                } else {
                    setTest(d.test);
                    setQuestions(d.questions);
                    totalSeconds.current = d.test.durationMinutes * 60;
                    endTimeRef.current = Date.now() + d.test.durationMinutes * 60 * 1000;
                    setTimeLeft(d.test.durationMinutes * 60);
                    gtag.event.testStart(d.test.title);
                }
                setLoading(false);
            })
            .catch(() => { setError('Failed to load test.'); setLoading(false); });
    }, [testId, router]);

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!test) return;
        timerRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) { clearInterval(timerRef.current!); handleSubmit(true); }
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test]);

    // ── Fullscreen request ───────────────────────────────────────────────────
    useEffect(() => {
        if (!test) return;
        const requestFS = async () => {
            try {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } catch { /* User denied fullscreen — not blocking */ }
        };
        requestFS();

        const onFsChange = () => {
            const inFs = !!document.fullscreenElement;
            setIsFullscreen(inFs);
            if (!inFs && !submittedRef.current) {
                // They exited fullscreen — treat as warning
                triggerWarning();
            }
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test]);

    // ── Tab / visibility detection ───────────────────────────────────────────
    const triggerWarning = useCallback(() => {
        if (submittedRef.current) return;
        const newCount = warningCountRef.current + 1;
        warningCountRef.current = newCount;
        setWarningCount(newCount);

        if (newCount >= MAX_WARNINGS) {
            setIsAutoSubmitting(true);
            setShowWarning(false);
            setTimeout(() => handleSubmit(true), 1500);
        } else {
            setShowWarning(true);
        }
        // Log to server (fire-and-forget)
        if (testId) {
            fetch(`/api/student/tests/${testId}/violation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'tab_switch', count: newCount }),
            }).catch(() => { });
        }
    }, [testId, handleSubmit]);

    useEffect(() => {
        if (!test) return;
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !submittedRef.current) {
                triggerWarning();
            }
        };
        const onBlur = () => {
            if (!submittedRef.current) triggerWarning();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('blur', onBlur);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('blur', onBlur);
        };
    }, [test, triggerWarning]);

    // ── Disable copy / right-click / selection ────────────────────────────────
    useEffect(() => {
        if (!test) return;
        const noop = (e: Event) => e.preventDefault();
        const noContextMenu = (e: MouseEvent) => e.preventDefault();
        const noKeyboard = (e: KeyboardEvent) => {
            // Block Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, PrintScreen
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'a', 'x', 'u', 's'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            if (e.key === 'PrintScreen') e.preventDefault();
        };
        document.addEventListener('copy', noop);
        document.addEventListener('cut', noop);
        document.addEventListener('paste', noop);
        document.addEventListener('contextmenu', noContextMenu);
        document.addEventListener('keydown', noKeyboard);
        document.addEventListener('selectstart', noop);
        return () => {
            document.removeEventListener('copy', noop);
            document.removeEventListener('cut', noop);
            document.removeEventListener('paste', noop);
            document.removeEventListener('contextmenu', noContextMenu);
            document.removeEventListener('keydown', noKeyboard);
            document.removeEventListener('selectstart', noop);
        };
    }, [test]);

    const scrollTo = (idx: number) => {
        setActiveIdx(idx);
        questionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const toggleFlag = (qId: string) => setFlags(f => { const next = new Set(f); next.has(qId) ? next.delete(qId) : next.add(qId); return next; });

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const answeredCount = Object.keys(answers).length;
    const timerPct = totalSeconds.current > 0 ? (timeLeft / totalSeconds.current) * 100 : 0;
    const urgent = timeLeft <= 60 && timeLeft > 0;
    const very_urgent = timeLeft <= 30 && timeLeft > 0;

    const paletteStatus = (q: TestQuestion): PaletteStatus => {
        if (flags.has(q.questionId)) return 'flagged';
        if (answers[q.questionId]) return 'answered';
        return 'unanswered';
    };

    const paletteStyle = (status: PaletteStatus, isActive: boolean) => {
        if (isActive) return 'ring-2 ring-blue-500 bg-blue-100 text-blue-800 border-blue-400';
        if (status === 'answered') return 'bg-green-500 text-white border-green-500 hover:bg-green-600';
        if (status === 'flagged') return 'bg-orange-400 text-white border-orange-400 hover:bg-orange-500';
        return 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-blue-50';
    };

    const studentName = session?.user?.name || session?.user?.email || 'Student';
    const studentId = session?.user?.id || session?.user?.email || 'ID';

    if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
            <div className="text-5xl">⚠️</div>
            <p className="text-red-600 font-semibold">{error}</p>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">← Go back</button>
        </div>
    );
    if (!test) return null;

    if (isAutoSubmitting) return (
        <div className="fixed inset-0 bg-red-900 flex flex-col items-center justify-center gap-4 text-white text-center">
            <div className="text-6xl">🚨</div>
            <h2 className="text-2xl font-black">Auto-Submitting Exam</h2>
            <p className="text-red-300 text-sm">Maximum warnings exceeded. Your answers are being submitted.</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mt-2" />
        </div>
    );

    // Group questions by section
    const sections = test.sections?.length > 0 ? test.sections : [{ sectionId: '', title: '' }];
    const bySection = sections.map(sec => ({
        ...sec,
        questions: sec.sectionId
            ? questions.filter(q => q.sectionId === sec.sectionId)
            : questions,
    }));

    return (
        // user-select:none on the whole exam
        <div className="max-w-3xl mx-auto pb-36 select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>

            {/* ─── Floating Watermark ───────────────────────────── */}
            <ExamWatermark name={studentName} id={studentId} />

            {/* ─── Warning count indicator ──────────────────────── */}
            {warningCount > 0 && !showWarning && (
                <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700 font-semibold">
                    ⚠️ Warning {warningCount}/{MAX_WARNINGS} — Stay on this tab!
                </div>
            )}

            {/* ─── Fullscreen nag ───────────────────────────────── */}
            {!isFullscreen && (
                <div className="mb-3 flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800">
                    <span>🔲 For best experience, exam should run in fullscreen.</span>
                    <button
                        onClick={() => document.documentElement.requestFullscreen().catch(() => { })}
                        className="text-xs font-bold bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Enter Fullscreen
                    </button>
                </div>
            )}

            {/* ─── Warning Overlay ─────────────────────────────── */}
            {showWarning && (
                <WarningOverlay
                    count={warningCount}
                    max={MAX_WARNINGS}
                    onDismiss={() => {
                        setShowWarning(false);
                        document.documentElement.requestFullscreen().catch(() => { });
                    }}
                />
            )}

            {/* ─── Sticky Header ───────────────────────────────── */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm px-4 py-3 -mx-4 mb-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{test.title}</h1>
                        <p className="text-xs text-gray-400">
                            {test.subject?.name && <span>{test.subject.name} · </span>}
                            {answeredCount}/{test.questionCount} answered
                        </p>
                    </div>
                    <div className={`shrink-0 text-2xl font-mono font-black tabular-nums px-4 py-1.5 rounded-xl transition-colors ${very_urgent ? 'bg-red-600 text-white animate-pulse' : urgent ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-800'}`}>
                        ⏱ {fmt(timeLeft)}
                    </div>
                </div>
                {/* Timer bar */}
                <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-1 rounded-full transition-all duration-1000 ${timerPct > 50 ? 'bg-green-500' : timerPct > 20 ? 'bg-yellow-400' : 'bg-red-500'}`}
                        style={{ width: `${timerPct}%` }} />
                </div>
            </div>

            {/* ─── Question Palette ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Question Navigator</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {questions.map((q, i) => {
                        const status = paletteStatus(q);
                        return (
                            <button key={q.questionId} onClick={() => scrollTo(i)}
                                className={`w-9 h-9 rounded-lg text-xs font-bold border-2 transition-all ${paletteStyle(status, activeIdx === i)}`}>
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Answered ({answeredCount})</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> Flagged ({flags.size})</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Not Answered ({Math.max(0, test.questionCount - answeredCount)})</span>
                </div>
                {test.negativeMarking > 0 && (
                    <p className="mt-2 text-xs text-red-500 font-medium">⚠ Negative marking: −{test.negativeMarking} per wrong answer</p>
                )}
            </div>

            {/* ─── Questions by Section ────────────────────────── */}
            {bySection.map(sec => (
                <div key={sec.sectionId || 'default'} className="mb-6">
                    {sec.title && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
                            <h2 className="font-bold text-indigo-800 text-sm">{sec.title}</h2>
                            {sec.instructions && <p className="text-xs text-indigo-600 mt-0.5">{sec.instructions}</p>}
                        </div>
                    )}
                    <div className="space-y-4">
                        {sec.questions.map(q => {
                            const globalIdx = questions.findIndex(gq => gq.questionId === q.questionId);
                            const isFlagged = flags.has(q.questionId);
                            const isAnswered = !!answers[q.questionId];
                            const isActive = activeIdx === globalIdx;
                            return (
                                <div key={q.questionId} ref={el => { if (globalIdx >= 0) questionRefs.current[globalIdx] = el; }}
                                    onClick={() => setActiveIdx(globalIdx)}
                                    className={`bg-white rounded-2xl border-2 shadow-sm p-5 transition-all cursor-pointer ${isActive ? 'border-blue-400 ring-2 ring-blue-50' : isFlagged ? 'border-orange-200' : isAnswered ? 'border-green-100' : 'border-gray-100 hover:border-gray-200'}`}>
                                    {/* Question header */}
                                    <div className="flex items-start justify-between mb-4 gap-2">
                                        <p className="text-sm font-semibold text-gray-900 flex-1">
                                            <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold mr-2 shrink-0 ${isAnswered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{globalIdx + 1}</span>
                                            {q.questionText}
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-gray-400 font-medium">[{q.marks}M]</span>
                                            <button onClick={(e) => { e.stopPropagation(); toggleFlag(q.questionId); }}
                                                title="Flag for review"
                                                className={`text-lg transition-all ${isFlagged ? 'text-orange-500' : 'text-gray-300 hover:text-orange-400'}`}>
                                                🚩
                                            </button>
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-2">
                                        {q.options.map(opt => {
                                            const isSelected = answers[q.questionId] === opt.label;
                                            return (
                                                <label key={opt.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 transition-all select-none ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                                                    <input type="radio" name={`q_${q.questionId}`} value={opt.label} checked={isSelected}
                                                        onChange={() => setAnswers(prev => ({ ...prev, [q.questionId]: opt.label }))} className="sr-only" />
                                                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'}`}>{opt.label}</span>
                                                    <span className="text-sm text-gray-800">{opt.text}</span>
                                                </label>
                                            );
                                        })}
                                    </div>

                                    {/* Previous / Next */}
                                    <div className="flex justify-between mt-4 pt-3 border-t border-gray-50">
                                        <button disabled={globalIdx === 0} onClick={(e) => { e.stopPropagation(); scrollTo(globalIdx - 1); }}
                                            className="text-xs text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors">← Prev</button>
                                        {globalIdx < questions.length - 1 ? (
                                            <button onClick={(e) => { e.stopPropagation(); scrollTo(globalIdx + 1); }}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Next →</button>
                                        ) : (
                                            <span className="text-xs text-green-600 font-semibold">Last question ✓</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* ─── Fixed Submit Bar ──────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-30">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                    <span className="font-bold text-gray-900">{answeredCount}</span> of {test.questionCount} answered
                    {flags.size > 0 && <span className="ml-2 text-orange-500 font-medium">· {flags.size} flagged</span>}
                    {answeredCount < test.questionCount && <span className="text-yellow-600"> ({test.questionCount - answeredCount} remaining)</span>}
                </div>
                <button
                    onClick={() => {
                        if (answeredCount < test.questionCount && !confirm(`You have ${test.questionCount - answeredCount} unanswered question(s). Submit anyway?`)) return;
                        handleSubmit();
                    }}
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-green-200 transition-all disabled:opacity-60">
                    {submitting ? 'Submitting…' : 'Submit Test →'}
                </button>
            </div>
        </div>
    );
}
