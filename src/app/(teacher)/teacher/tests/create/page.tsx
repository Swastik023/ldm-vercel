'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface BatchOption { _id: string; name: string; intakeMonth?: string; joiningYear?: number; program?: { code: string }; }
interface SubjectOption { _id: string; name: string; code: string; }

type UploadMode = 'combined' | 'dual' | 'paste';

export default function TeacherCreateTestPage() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const qFileRef = useRef<HTMLInputElement>(null);
    const aFileRef = useRef<HTMLInputElement>(null);

    const [uploadMode, setUploadMode] = useState<UploadMode>('combined');
    const [batchId, setBatchId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [combinedFile, setCombinedFile] = useState<File | null>(null);
    const [questionsFile, setQuestionsFile] = useState<File | null>(null);
    const [answersFile, setAnswersFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; warnings?: string[]; errors?: string[] } | null>(null);
    const [jsonText, setJsonText] = useState('');

    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    useEffect(() => {
        fetch('/api/teacher/classes/assign?view=available-batches')
            .then(r => r.json()).then(d => {
                if (d.success) {
                    setBatches(d.batches ?? []);
                    setSubjects(d.subjects ?? []);
                }
            }).catch(() => { });
    }, []);

    const handleCombinedFile = (file: File | null) => {
        setCombinedFile(file);
        setPreview(null);
        if (!file) return;
        file.text().then(text => {
            try { setPreview(JSON.parse(text)); }
            catch { setResult({ success: false, message: 'File is not valid JSON.' }); }
        });
    };

    const handleJsonText = (text: string) => {
        setJsonText(text);
        setPreview(null);
        if (!text.trim()) return;
        try {
            const parsed = JSON.parse(text);
            setPreview(parsed);
        } catch {
            // Don't show error while user is still typing
        }
    };

    const handleSubmit = async () => {
        setLoading(true); setResult(null);
        try {
            const fd = new FormData();
            fd.append('batchId', batchId);
            fd.append('subjectId', subjectId);
            if (academicYear.trim()) fd.append('academicYear', academicYear.trim());
            if (uploadMode === 'combined' && combinedFile) fd.append('combined', combinedFile);
            else if (uploadMode === 'dual' && questionsFile && answersFile) {
                fd.append('questions', questionsFile);
                fd.append('answers', answersFile);
            } else if (uploadMode === 'paste' && jsonText.trim()) {
                // Convert pasted text to a Blob/File and upload as 'combined'
                const blob = new Blob([jsonText], { type: 'application/json' });
                fd.append('combined', blob, 'test.json');
            }
            // Teachers use the same test creation API — admin auth is checked server-side
            // For teachers, we use the admin API since tests are shared resources
            const res = await fetch('/api/admin/tests', { method: 'POST', body: fd });
            const data = await res.json();
            setResult(data);
            if (data.success) setTimeout(() => router.push('/teacher/tests'), 2000);
        } catch {
            setResult({ success: false, message: 'Network error. Please try again.' });
        } finally { setLoading(false); }
    };

    const canSubmit = batchId && subjectId && (
        (uploadMode === 'combined' && combinedFile) ||
        (uploadMode === 'dual' && questionsFile && answersFile) ||
        (uploadMode === 'paste' && jsonText.trim().length > 0)
    );

    const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-white';

    const availableYears = [...new Set(batches.map(b => b.joiningYear))].filter(Boolean).sort((a, b) => (b as number) - (a as number));
    const filteredBatches = batches.filter(b => {
        if (filterMonth && b.intakeMonth !== filterMonth) return false;
        if (filterYear && b.joiningYear !== Number(filterYear)) return false;
        return true;
    });

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-16">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create MCQ Test</h1>
                    <p className="text-gray-500 text-sm mt-1">Upload a structured JSON file with your questions.</p>
                </div>
                <Link href="/teacher/tests" className="text-sm text-amber-600 hover:underline">← Back to Tests</Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                {/* Batch filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Batches</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {['January', 'July'].map(m => (
                            <button type="button" key={m} onClick={() => { setFilterMonth(m === filterMonth ? '' : m); setBatchId(''); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filterMonth === m ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}>
                                {m}
                            </button>
                        ))}
                        <span className="w-px bg-gray-200 mx-1" />
                        {availableYears.map(y => (
                            <button type="button" key={y as number} onClick={() => { setFilterYear(filterYear === String(y) ? '' : String(y)); setBatchId(''); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filterYear === String(y) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                                {y as number}
                            </button>
                        ))}
                        {(filterMonth || filterYear) && (
                            <button type="button" onClick={() => { setFilterMonth(''); setFilterYear(''); setBatchId(''); }}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition">
                                ✕ Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Batch + Subject + Academic Year */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Batch <span className="text-red-500">*</span></label>
                        <select className={inputCls} value={batchId} onChange={e => setBatchId(e.target.value)}>
                            <option value="">Select Batch</option>
                            {filteredBatches.map(b => (
                                <option key={b._id} value={b._id}>
                                    {b.name}{b.program ? ` (${b.program.code})` : ''} · {b.intakeMonth} {b.joiningYear}
                                </option>
                            ))}
                        </select>
                        {filteredBatches.length === 0 && batches.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">No batches match filters.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-500">*</span></label>
                        <select className={inputCls} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
                        <input className={inputCls} placeholder="e.g. 2025-26" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                    </div>
                </div>

                {/* Upload Mode Toggle */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Input Method</label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-200">
                        {(['combined', 'dual', 'paste'] as const).map(mode => (
                            <button key={mode} onClick={() => setUploadMode(mode)}
                                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${uploadMode === mode ? 'bg-amber-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                                {mode === 'combined' ? '📄 Upload JSON' : mode === 'dual' ? '📁 Two Files' : '✏️ Paste JSON'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Upload OR Paste */}
                {uploadMode === 'combined' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Combined JSON <span className="text-red-500">*</span></label>
                        <div onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                            <input ref={fileRef} type="file" accept=".json" className="hidden"
                                onChange={e => handleCombinedFile(e.target.files?.[0] ?? null)} />
                            {combinedFile ? (
                                <div>
                                    <p className="text-green-600 font-semibold">✓ {combinedFile.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{(combinedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-3xl mb-2">📄</p>
                                    <p className="text-gray-500 font-medium text-sm">Click to upload or drag &amp; drop</p>
                                    <p className="text-xs text-gray-400 mt-1">JSON file with questions + answers combined</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : uploadMode === 'dual' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">questions.json <span className="text-red-500">*</span></label>
                            <div onClick={() => qFileRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-all">
                                <input ref={qFileRef} type="file" accept=".json" className="hidden"
                                    onChange={e => setQuestionsFile(e.target.files?.[0] ?? null)} />
                                <p className="text-sm text-gray-500">{questionsFile ? `✓ ${questionsFile.name}` : 'Upload questions.json'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">answers.json <span className="text-red-500">*</span></label>
                            <div onClick={() => aFileRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition-all">
                                <input ref={aFileRef} type="file" accept=".json" className="hidden"
                                    onChange={e => setAnswersFile(e.target.files?.[0] ?? null)} />
                                <p className="text-sm text-gray-500">{answersFile ? `✓ ${answersFile.name}` : 'Upload answers.json'}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Paste JSON <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full h-64 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all bg-gray-50 resize-y"
                            placeholder={`{\n  "testTitle": "My Test",\n  "durationMinutes": 30,\n  "totalMarks": 10,\n  "questions": [...]\n}`}
                            value={jsonText}
                            onChange={e => handleJsonText(e.target.value)}
                            spellCheck={false}
                        />
                        {jsonText.trim() && !preview && (
                            <p className="text-xs text-red-500 mt-1">⚠️ Invalid JSON — check for syntax errors</p>
                        )}
                        {preview && (
                            <p className="text-xs text-green-600 mt-1">✅ Valid JSON — {preview.questions?.length ?? 0} question(s) detected</p>
                        )}
                    </div>
                )}

                {/* Preview */}
                {preview && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-2">📋 Preview — {preview.questions?.length ?? 0} question(s)</h3>
                        <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                            <p><strong>Title:</strong> {preview.testTitle ?? '—'}</p>
                            <p><strong>Duration:</strong> {preview.durationMinutes ?? '—'} min | <strong>Marks:</strong> {preview.totalMarks ?? '—'}</p>
                            {(preview.questions ?? []).slice(0, 5).map((q: any, i: number) => (
                                <p key={i} className="truncate">Q{i + 1}. {q.question ?? q.questionText ?? 'Untitled'}</p>
                            ))}
                            {(preview.questions?.length ?? 0) > 5 && (
                                <p className="text-gray-400">… and {preview.questions.length - 5} more</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Result */}
                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`rounded-xl p-4 text-sm ${result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                            {result.success ? (
                                <>
                                    <p className="font-semibold">✅ {result.message}</p>
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

                {/* Submit */}
                <button onClick={handleSubmit} disabled={loading || !canSubmit}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-orange-200 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating Test…</>
                    ) : '⚡ Create Test'}
                </button>
            </div>

            {/* Sample JSON */}
            <details className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <summary className="font-bold text-gray-900 text-sm cursor-pointer select-none">📖 Sample JSON Format (Click to expand)</summary>
                <pre className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">{`{
  "testTitle": "Midterm Pharmacology",
  "durationMinutes": 30,
  "totalMarks": 3,
  "negativeMarking": 0,
  "resultMode": "instant",
  "questions": [
    {
      "question": "What is the antidote for heparin?",
      "options": { "A": "Atropine", "B": "Protamine sulfate", "C": "Naloxone", "D": "Vitamin K" },
      "correctOption": "B",
      "reason": "Protamine sulfate neutralizes heparin.",
      "marks": 1
    }
  ]
}`}</pre>
            </details>
        </div>
    );
}
