'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
    Upload, FileJson, BookOpen, Users, CheckCircle, XCircle,
    Clock, Download, Sparkles, ClipboardList,
} from 'lucide-react';

interface SubjectOption { _id: string; name: string; code?: string; }
interface BatchOption { _id: string; name: string; batchCode?: string; joiningYear?: number; intakeMonth?: string; program?: { name: string; code?: string }; }
interface AdminTest {
    _id: string; title: string; description?: string;
    durationMinutes: number; totalMarks: number; negativeMarking: number;
    questionCount: number; resultMode: 'instant' | 'manual';
    isPublished: boolean; isActive: boolean; attemptCount: number;
    subject: SubjectOption; batch: BatchOption; createdAt: string;
}
interface Attempt {
    _id: string;
    studentId: { fullName: string; rollNumber: string; email: string };
    marksObtained: number; totalMarks: number; percentage: number;
    correctCount: number; wrongCount: number; skippedCount: number; submittedAt: string;
}

// ── Template generators ──────────────────────────────────────────────────────
function makeQuestionsTemplate(title: string, duration: number, totalMarks: number, negMarking: number, resultMode: string) {
    return JSON.stringify({
        testMeta: {
            title,
            description: "Optional description for students",
            durationMinutes: duration,
            totalMarks,
            negativeMarking: negMarking,
            shuffleQuestions: false,
            shuffleOptions: false,
            resultMode,
        },
        sections: [
            { sectionId: "S1", title: "Section A", instructions: "Attempt all questions." }
        ],
        questions: [
            {
                questionId: "Q1",
                sectionId: "S1",
                type: "mcq",
                questionText: "Write your first question here?",
                marks: 2,
                options: [
                    { label: "A", text: "First option" },
                    { label: "B", text: "Second option" },
                    { label: "C", text: "Third option" },
                    { label: "D", text: "Fourth option" }
                ]
            },
            {
                questionId: "Q2",
                sectionId: "S1",
                type: "mcq",
                questionText: "Write your second question here?",
                marks: 2,
                options: [
                    { label: "A", text: "First option" },
                    { label: "B", text: "Second option" },
                    { label: "C", text: "Third option" },
                    { label: "D", text: "Fourth option" }
                ]
            }
        ]
    }, null, 2);
}

function makeAnswersTemplate(title: string) {
    return JSON.stringify({
        testTitle: title,
        answers: [
            { questionId: "Q1", correctAnswer: "B", reason: "Explanation for why B is correct." },
            { questionId: "Q2", correctAnswer: "A", reason: "Explanation for why A is correct." }
        ]
    }, null, 2);
}

function downloadJson(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TestManager() {
    const [tests, setTests] = useState<AdminTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
    const [loadingAttempts, setLoadingAttempts] = useState<string | null>(null);
    const [publishing, setPublishing] = useState<string | null>(null);
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);
    const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);

    // Options
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);

    // Form state
    const [testTitle, setTestTitle] = useState('');
    const [duration, setDuration] = useState(30);
    const [totalMarks, setTotalMarks] = useState(50);
    const [negMarking, setNegMarking] = useState(0);
    const [resultMode, setResultMode] = useState<'instant' | 'manual'>('instant');
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [qFileName, setQFileName] = useState('');
    const [aFileName, setAFileName] = useState('');
    const [step, setStep] = useState<1 | 2>(1);

    const qFileRef = useRef<HTMLInputElement>(null);
    const aFileRef = useRef<HTMLInputElement>(null);

    const load = useCallback(() => {
        setLoading(true);
        fetch('/api/admin/tests').then(r => r.json()).then(d => {
            if (d.success) setTests(d.tests);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        load();
        // Load batches + subjects
        Promise.all([
            fetch('/api/admin/batches?active=true').then(r => r.json()),
            fetch('/api/admin/academic-options/subjects').then(r => r.json()),
        ]).then(([batchData, subjectData]) => {
            if (batchData.success) setBatches(batchData.batches);
            if (subjectData.success) setSubjects(subjectData.subjects);
        });
    }, [load]);

    const handleDownloadTemplates = () => {
        const name = testTitle.trim() || 'My Test';
        downloadJson(makeQuestionsTemplate(name, duration, totalMarks, negMarking, resultMode), 'questions.json');
        setTimeout(() => {
            downloadJson(makeAnswersTemplate(name), 'answers.json');
        }, 300);
        toast.success('Templates downloaded! Fill them in and upload below.');
        setStep(2);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatch) { toast.error('Please select a Batch'); return; }
        if (!selectedSubject) { toast.error('Please select a Subject'); return; }
        const qFile = qFileRef.current?.files?.[0];
        const aFile = aFileRef.current?.files?.[0];
        if (!qFile || !aFile) { toast.error('Please select both JSON files'); return; }

        setUploading(true);
        setUploadErrors([]);
        setUploadWarnings([]);

        const fd = new FormData();
        fd.append('questions', qFile);
        fd.append('answers', aFile);
        fd.append('batchId', selectedBatch);
        fd.append('subjectId', selectedSubject);

        const res = await fetch('/api/admin/tests', { method: 'POST', body: fd });
        const data = await res.json();
        setUploading(false);

        if (data.success) {
            toast.success(data.message || 'Test created!');
            if (data.warnings?.length) setUploadWarnings(data.warnings);
            // Reset form
            setTestTitle(''); setDuration(30); setTotalMarks(50); setNegMarking(0);
            setResultMode('instant'); setSelectedBatch(''); setSelectedSubject('');
            setQFileName(''); setAFileName('');
            if (qFileRef.current) qFileRef.current.value = '';
            if (aFileRef.current) aFileRef.current.value = '';
            setStep(1);
            load();
        } else {
            toast.error(data.message || 'Upload failed');
            if (data.errors?.length) setUploadErrors(data.errors);
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        const res = await fetch(`/api/admin/tests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
        const d = await res.json();
        if (d.success) { setTests(ts => ts.map(t => t._id === id ? { ...t, isActive: !current } : t)); toast.success(`Test ${!current ? 'activated' : 'deactivated'}`); }
    };

    const deleteTest = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"?\n\nThis will also remove all student scores for this test. This cannot be undone.`)) return;
        const res = await fetch(`/api/admin/tests/${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.success) { setTests(ts => ts.filter(t => t._id !== id)); toast.success('Test deleted'); }
        else toast.error(d.message || 'Delete failed');
    };

    const publishResults = async (id: string) => {
        if (!confirm('This will make results visible to all students who have submitted this test. Proceed?')) return;
        setPublishing(id);
        const res = await fetch(`/api/admin/tests/${id}/publish`, { method: 'PATCH' });
        const d = await res.json();
        setPublishing(null);
        if (d.success) { setTests(ts => ts.map(t => t._id === id ? { ...t, isPublished: true } : t)); toast.success(d.message || 'Results published!'); }
        else toast.error(d.message || 'Failed to publish');
    };

    const loadAttempts = async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        if (attempts[id]) return;
        setLoadingAttempts(id);
        const res = await fetch(`/api/admin/tests/${id}`);
        const d = await res.json();
        if (d.success) setAttempts(prev => ({ ...prev, [id]: d.attempts }));
        setLoadingAttempts(null);
    };

    const canDownload = testTitle.trim().length > 0;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* ─── Create New Test Card ──────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> Create a New Test
                    </h2>
                    <p className="text-blue-200 text-sm mt-1">Fill in the details → download templates → upload filled files</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* ─ Step indicator ─ */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 text-sm font-bold ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step === 1 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{step > 1 ? '✓' : '1'}</span>
                            Set Details & Download Templates
                        </div>
                        <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full bg-blue-500 transition-all duration-500 ${step >= 2 ? 'w-full' : 'w-0'}`} />
                        </div>
                        <div className={`flex items-center gap-2 text-sm font-bold ${step === 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>2</span>
                            Upload Filled Files
                        </div>
                    </div>

                    {/* ─ STEP 1: Details ─ */}
                    <div className={`space-y-4 ${step === 2 ? 'opacity-60' : ''}`}>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Test Title */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Test Title *</label>
                                <input
                                    type="text"
                                    value={testTitle}
                                    onChange={e => setTestTitle(e.target.value)}
                                    placeholder="e.g. Mid-Semester Physics Test"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Batch */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Batch (who takes this test?) *</label>
                                <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                                    <option value="">— Select Batch —</option>
                                    {batches.map(b => (
                                        <option key={b._id} value={b._id}>{b.batchCode || b.name} {b.program?.name ? `— ${b.program.name}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Subject *</label>
                                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                                    <option value="">— Select Subject —</option>
                                    {subjects.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Duration (minutes)</label>
                                <input type="number" min={1} max={300} value={duration} onChange={e => setDuration(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            {/* Total Marks */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Total Marks</label>
                                <input type="number" min={1} value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            {/* Negative Marking */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                                    Negative Marking <span className="text-gray-400 font-normal normal-case">(marks deducted per wrong answer, 0 = none)</span>
                                </label>
                                <input type="number" min={0} step={0.25} value={negMarking} onChange={e => setNegMarking(Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>

                            {/* Result Mode */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Result Mode</label>
                                <div className="flex gap-3">
                                    {(['instant', 'manual'] as const).map(mode => (
                                        <button key={mode} type="button" onClick={() => setResultMode(mode)}
                                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${resultMode === mode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                            {mode === 'instant' ? '⚡ Show immediately' : '⏳ Publish manually'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    {resultMode === 'instant' ? 'Students see their score right after submitting.' : 'You control when students can see their results.'}
                                </p>
                            </div>
                        </div>

                        {/* Download Templates Button */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-800 mb-1">📥 Step 1: Download pre-filled question templates</p>
                            <p className="text-xs text-blue-600 mb-3">We'll generate two files for you. Open them in any text editor, fill in your questions and answers, then come back to upload.</p>
                            <button type="button" onClick={handleDownloadTemplates} disabled={!canDownload}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                <Download className="w-4 h-4" />
                                {canDownload ? `Download Templates for "${testTitle}"` : 'Enter a test title first'}
                            </button>
                        </div>
                    </div>

                    {/* ─ STEP 2: Upload ─ */}
                    {step === 2 && (
                        <form onSubmit={handleUpload} className="space-y-4 border-t border-gray-100 pt-6">
                            <div>
                                <p className="text-sm font-bold text-gray-800 mb-1">📤 Step 2: Upload your filled files</p>
                                <p className="text-xs text-gray-400 mb-4">Make sure both files are saved. Select them below and hit Upload.</p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Questions upload */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">questions.json *</label>
                                    <label className={`flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${qFileName ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                                        <FileJson className={`w-8 h-8 ${qFileName ? 'text-blue-500' : 'text-gray-300'}`} />
                                        <span className="text-xs text-center text-gray-500 font-medium">{qFileName || 'Click to select questions.json'}</span>
                                        {qFileName && <span className="text-xs text-green-600 font-semibold">✓ Selected</span>}
                                        <input ref={qFileRef} type="file" accept=".json" className="hidden"
                                            onChange={e => setQFileName(e.target.files?.[0]?.name || '')} />
                                    </label>
                                </div>

                                {/* Answers upload */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">answers.json *</label>
                                    <label className={`flex flex-col items-center gap-2 px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${aFileName ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}`}>
                                        <ClipboardList className={`w-8 h-8 ${aFileName ? 'text-green-500' : 'text-gray-300'}`} />
                                        <span className="text-xs text-center text-gray-500 font-medium">{aFileName || 'Click to select answers.json'}</span>
                                        {aFileName && <span className="text-xs text-green-600 font-semibold">✓ Selected</span>}
                                        <input ref={aFileRef} type="file" accept=".json" className="hidden"
                                            onChange={e => setAFileName(e.target.files?.[0]?.name || '')} />
                                    </label>
                                </div>
                            </div>

                            {/* Validation errors */}
                            {uploadErrors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-red-700 mb-2">❌ Found {uploadErrors.length} error(s) in your files — please fix and try again:</p>
                                    <ul className="space-y-1">
                                        {uploadErrors.map((e, i) => <li key={i} className="text-xs text-red-600">• {e}</li>)}
                                    </ul>
                                </div>
                            )}
                            {uploadWarnings.length > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-yellow-700 mb-2">⚠ Warnings (uploaded but please review):</p>
                                    <ul className="space-y-1">
                                        {uploadWarnings.map((w, i) => <li key={i} className="text-xs text-yellow-700">• {w}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                                    ← Back
                                </button>
                                <button type="submit" disabled={uploading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    {uploading ? 'Checking & Uploading…' : 'Upload & Create Test →'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* ─── Test List ─────────────────────────── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        All Tests ({tests.length})
                    </h2>
                    {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />}
                </div>

                {!loading && tests.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-gray-500 font-medium">No tests yet.</p>
                        <p className="text-gray-400 text-sm mt-1">Create your first test using the form above.</p>
                    </div>
                )}

                {tests.map(test => (
                    <div key={test._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-bold text-gray-900 truncate">{test.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {test.isActive ? '● Live' : '○ Hidden'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${test.resultMode === 'instant' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {test.resultMode === 'instant' ? '⚡ Instant' : '⏳ Manual'}
                                        </span>
                                        {test.resultMode === 'manual' && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${test.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {test.isPublished ? '✅ Results Published' : '🔒 Results Hidden'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{test.subject?.name || 'No subject'}</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{test.batch?.name || 'No batch'}</span>
                                        <span>⏱ {test.durationMinutes} min</span>
                                        <span>📊 {test.totalMarks} marks</span>
                                        <span>❓ {test.questionCount} questions</span>
                                        {test.negativeMarking > 0 && <span className="text-red-400">−{test.negativeMarking}/wrong</span>}
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-400" />{test.attemptCount} attempted</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                    {test.resultMode === 'manual' && !test.isPublished && (
                                        <button onClick={() => publishResults(test._id)} disabled={publishing === test._id}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold disabled:opacity-60 transition-colors whitespace-nowrap">
                                            {publishing === test._id ? '…' : '📢 Publish Results'}
                                        </button>
                                    )}
                                    <button onClick={() => toggleActive(test._id, test.isActive)} title={test.isActive ? 'Hide from students' : 'Show to students'}
                                        className={`p-2 rounded-lg text-xs transition-colors ${test.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                                        {test.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => deleteTest(test._id, test.title)} title="Delete test"
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => loadAttempts(test._id)} title="View student results"
                                        className={`p-2 rounded-lg transition-colors ${expandedId === test._id ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                                        {expandedId === test._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Attempts drawer */}
                        {expandedId === test._id && (
                            <div className="border-t border-gray-100">
                                {loadingAttempts === test._id ? (
                                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                                ) : (attempts[test._id] ?? []).length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50">No students have attempted this test yet.</div>
                                ) : (
                                    <>
                                        <div className="bg-gray-50 px-5 py-2.5 flex items-center justify-between">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Student Results (sorted by score)</p>
                                            <p className="text-xs text-gray-400">{(attempts[test._id] ?? []).length} submissions</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 bg-gray-50">
                                                        <th className="px-4 py-3 text-left">Rank</th>
                                                        <th className="px-4 py-3 text-left">Student</th>
                                                        <th className="px-4 py-3 text-left">Roll No.</th>
                                                        <th className="px-4 py-3 text-right">Marks</th>
                                                        <th className="px-4 py-3 text-right">Score</th>
                                                        <th className="px-4 py-3 text-center text-green-500">✓</th>
                                                        <th className="px-4 py-3 text-center text-red-500">✗</th>
                                                        <th className="px-4 py-3 text-center text-gray-400">—</th>
                                                        <th className="px-4 py-3 text-left">Submitted</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {(attempts[test._id] ?? []).map((att, idx) => (
                                                        <tr key={att._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs text-gray-400">#{idx + 1}</td>
                                                            <td className="px-4 py-3 font-semibold text-gray-900">{att.studentId?.fullName}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{att.studentId?.rollNumber}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-gray-800">{att.marksObtained}/{att.totalMarks}</td>
                                                            <td className={`px-4 py-3 text-right font-black text-base ${att.percentage >= 75 ? 'text-green-600' : att.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{att.percentage}%</td>
                                                            <td className="px-4 py-3 text-center text-green-600 font-bold">{att.correctCount}</td>
                                                            <td className="px-4 py-3 text-center text-red-500 font-bold">{att.wrongCount}</td>
                                                            <td className="px-4 py-3 text-center text-gray-400 font-bold">{att.skippedCount}</td>
                                                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(att.submittedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
