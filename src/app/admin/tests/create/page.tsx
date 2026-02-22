'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const EXAMPLE = `Q1. What is HTML?
A) Programming Language
B) Markup Language
C) Database
D) Server
Answer: B

Q2. CSS stands for?
A) Computer Style Sheets
B) Creative Style System
C) Cascading Style Sheets
D) Colorful Style Syntax
Answer: C`;

export default function CreateTestPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; parsedCount?: number; warnings?: string[]; errors?: string[] } | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/admin/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, duration: Number(duration), rawText }),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                setTimeout(() => router.push('/admin/tests'), 2000);
            }
        } catch {
            setResult({ success: false, message: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create MCQ Test</h1>
                    <p className="text-gray-500 text-sm mt-1">Paste questions from ChatGPT or any AI — we'll parse them automatically.</p>
                </div>
                <Link href="/admin/tests" className="text-sm text-blue-600 hover:underline">← Back to Tests</Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Title + Duration */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Title <span className="text-red-500">*</span></label>
                        <input className={inputCls} placeholder="e.g. Computer Basics — Unit 1" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes) <span className="text-red-500">*</span></label>
                        <input type="number" min={1} className={inputCls} placeholder="e.g. 30" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                </div>

                {/* MCQ Textarea */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">Paste MCQs Here <span className="text-red-500">*</span></label>
                        <button onClick={() => setRawText(EXAMPLE)} className="text-xs text-blue-500 hover:underline">Load example</button>
                    </div>
                    <textarea
                        className={`${inputCls} h-72 resize-none font-mono text-xs leading-relaxed`}
                        placeholder={EXAMPLE}
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Supported: Q1. / 1. • Options: A) / A. / (A) • Answer: A / Ans: A</p>
                </div>

                {/* Result message */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`rounded-xl p-4 text-sm ${result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
                        >
                            {result.success ? (
                                <>
                                    <p className="font-semibold">✅ Test created! {result.parsedCount} question{result.parsedCount !== 1 ? 's' : ''} parsed.</p>
                                    {result.warnings && result.warnings.length > 0 && (
                                        <ul className="mt-2 space-y-1 text-yellow-700 text-xs list-disc list-inside">
                                            {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    )}
                                    <p className="mt-2 text-xs text-green-600">Redirecting to test list…</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold">❌ {result.message}</p>
                                    {result.errors && result.errors.length > 0 && (
                                        <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
                                            {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !title || !duration || !rawText}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating…</>
                    ) : '⚡ Generate Test'}
                </button>
            </div>
        </div>
    );
}
