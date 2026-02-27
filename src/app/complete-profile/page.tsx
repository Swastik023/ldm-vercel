'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Plus, X, Upload } from 'lucide-react';

interface DocField { key: string; label: string; hint: string; accept: string; allowedTypes: string[]; required?: boolean; }
interface Batch { _id: string; name: string; program?: { name: string }; }

const REQUIRED_DOCS: DocField[] = [
    { key: 'passportPhoto', label: 'Passport Size Photo', hint: 'Clear photo of your face · JPG, PNG, WEBP', accept: 'image/jpeg,image/png,image/webp', allowedTypes: ['jpg', 'jpeg', 'png', 'webp'], required: true },
    { key: 'marksheet10', label: '10th Marksheet', hint: 'Class 10 result · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], required: true },
    { key: 'marksheet12', label: '12th Marksheet', hint: 'Class 12 result · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], required: true },
];
const OPTIONAL_DOCS: DocField[] = [
    { key: 'aadhaarId', label: 'Aadhaar Card', hint: 'Aadhaar card (optional) · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
    { key: 'familyId', label: 'Family ID', hint: 'Family ID card (optional) · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
];

const MAX_MB = 5;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 4 + i);

// ── Small drop-zone card ──────────────────────────────────────────────────────
function DocCard({ field, file, onSelect, onRemove }: { field: DocField; file: File | null; onSelect: (f: File) => void; onRemove: () => void; }) {
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onSelect(f); }, [onSelect]);
    return (
        <div className={`rounded-2xl border-2 transition-all ${file ? 'border-[#10B981] bg-[#10B981]/5' : 'border-white/10 bg-white/5 border-dashed hover:border-white/25'}`}>
            {!file ? (
                <label className="flex flex-col items-center justify-center gap-2 py-5 px-4 cursor-pointer" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white/40" />
                    </div>
                    <div className="text-center">
                        <p className="text-white/80 text-sm font-semibold">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</p>
                        <p className="text-white/30 text-xs mt-0.5">{field.hint}</p>
                        <p className="text-[#10B981] text-xs mt-1 font-medium">Click or drag & drop</p>
                    </div>
                    <input type="file" accept={field.accept} className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
                </label>
            ) : (
                <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{field.label}</p>
                        <p className="text-white/40 text-xs">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)}MB</p>
                    </div>
                    <button onClick={onRemove} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Custom doc row ────────────────────────────────────────────────────────────
function CustomDocRow({ index, onRemove }: { index: number; file: File | null; title: string; onRemove: () => void; }) {
    return (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[#10B981] text-sm">✓</span>
            <span className="text-white/60 text-xs flex-1 truncate">Custom doc #{index + 1}</span>
            <button onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
    );
}

export default function CompleteProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [files, setFiles] = useState<Record<string, File | null>>({ passportPhoto: null, marksheet10: null, marksheet12: null, aadhaarId: null, familyId: null });
    const [customDocs, setCustomDocs] = useState<{ title: string; file: File }[]>([]);
    const [newCustomTitle, setNewCustomTitle] = useState('');
    const [newCustomFile, setNewCustomFile] = useState<File | null>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [mobileNumber, setMobileNumber] = useState('');
    const [batchId, setBatchId] = useState('');
    const [sessionFrom, setSessionFrom] = useState('');
    const [sessionTo, setSessionTo] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const isGoogleUser = session?.user?.provider === 'google';
    const selectedBatch = batches.find(b => b._id === batchId);
    const classPreview = selectedBatch && sessionFrom && sessionTo && parseInt(sessionFrom) < parseInt(sessionTo)
        ? `${selectedBatch.name} (${sessionFrom}–${sessionTo})` : null;

    useEffect(() => {
        fetch('/api/public/batches').then(r => r.json()).then(d => { if (d.success) setBatches(d.batches); });
    }, []);

    const setFile = (key: string) => (file: File) => {
        setFieldError(null);
        const all = [...REQUIRED_DOCS, ...OPTIONAL_DOCS];
        const field = all.find(f => f.key === key)!;
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!field.allowedTypes.includes(ext)) { setFieldError(`${field.label}: invalid file type. Accepted: ${field.allowedTypes.join(', ')}`); return; }
        if (file.size / (1024 * 1024) > MAX_MB) { setFieldError(`${field.label} exceeds ${MAX_MB}MB.`); return; }
        setFiles(prev => ({ ...prev, [key]: file }));
    };
    const removeFile = (key: string) => () => setFiles(prev => ({ ...prev, [key]: null }));

    const addCustomDoc = () => {
        if (!newCustomTitle.trim() || !newCustomFile) { setFieldError('Please enter a title and select a file for the custom document.'); return; }
        setCustomDocs(prev => [...prev, { title: newCustomTitle.trim(), file: newCustomFile }]);
        setNewCustomTitle(''); setNewCustomFile(null); setFieldError(null);
    };
    const removeCustomDoc = (i: number) => setCustomDocs(prev => prev.filter((_, j) => j !== i));

    const requiredUploaded = REQUIRED_DOCS.every(f => files[f.key] !== null);
    const googleAcademicComplete = !isGoogleUser || (batchId && sessionFrom && sessionTo && rollNumber && parseInt(sessionFrom) < parseInt(sessionTo));
    const canSubmit = requiredUploaded && googleAcademicComplete;
    const uploadedCount = [...REQUIRED_DOCS, ...OPTIONAL_DOCS].filter(f => files[f.key]).length;
    const totalCount = REQUIRED_DOCS.length + OPTIONAL_DOCS.length;

    const handleSubmit = async () => {
        if (!requiredUploaded) { setError('Please upload all 3 required documents (marked with *).'); return; }
        setError(''); setLoading(true);
        try {
            const fd = new FormData();
            for (const field of [...REQUIRED_DOCS, ...OPTIONAL_DOCS]) {
                if (files[field.key]) fd.append(field.key, files[field.key] as File);
            }
            customDocs.forEach((doc, i) => { fd.append(`customTitle${i}`, doc.title); fd.append(`customFile${i}`, doc.file); });
            if (mobileNumber) fd.append('mobileNumber', mobileNumber);
            if (batchId) fd.append('batchId', batchId);
            if (sessionFrom) fd.append('sessionFrom', sessionFrom);
            if (sessionTo) fd.append('sessionTo', sessionTo);
            if (rollNumber) fd.append('rollNumber', rollNumber);

            const res = await fetch('/api/auth/complete-profile', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }
            await update(); setDone(true);
            setTimeout(() => { window.location.href = '/pending-approval'; }, 1500);
        } catch { setError('Upload failed. Check your connection and try again.'); }
        finally { setLoading(false); }
    };

    const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#10B981] text-sm';
    const selectCls = `${inputCls} appearance-none cursor-pointer`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#0d2137] to-[#0A192F] flex flex-col items-center justify-center px-4 py-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                    <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-white font-bold text-lg">LDM College</span>
            </div>

            <div className="w-full max-w-lg">
                {session?.user && (
                    <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                        {session.user.image && <img src={session.user.image} alt="Profile" width={36} height={36} className="rounded-full" />}
                        <div>
                            <p className="text-white font-semibold text-sm">{session.user.name}</p>
                            <p className="text-white/40 text-xs">{session.user.email}</p>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-4">
                            <CheckCircle className="text-[#10B981] w-16 h-16 mx-auto" />
                            <h2 className="text-2xl font-extrabold text-white">Registration Complete! 🎉</h2>
                            <p className="text-white/60 text-sm">Redirecting to approval page…</p>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                            <div className="text-center">
                                <h1 className="text-2xl font-extrabold text-white">Complete Your Profile 📄</h1>
                                <p className="text-white/50 text-sm mt-1">Upload your documents to activate your account.</p>
                            </div>

                            {/* Progress */}
                            <div className="bg-white/5 rounded-full h-1.5">
                                <motion.div className="bg-gradient-to-r from-[#10B981] to-[#047857] h-1.5 rounded-full"
                                    animate={{ width: `${(uploadedCount / totalCount) * 100}%` }} transition={{ duration: 0.4 }} />
                            </div>
                            <p className="text-white/30 text-xs text-right -mt-2">{uploadedCount}/{totalCount} uploaded</p>

                            {/* Google users: academic info */}
                            {isGoogleUser && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Academic Details (required)</p>
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Phone Number</label>
                                        <input className={inputCls} placeholder="10-digit mobile" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} maxLength={10} inputMode="tel" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Batch <span className="text-red-400">*</span></label>
                                        <select className={selectCls} value={batchId} onChange={e => setBatchId(e.target.value)}>
                                            <option value="" className="bg-[#0A192F]">— Select Batch —</option>
                                            {batches.map(b => <option key={b._id} value={b._id} className="bg-[#0A192F]">{b.name}{b.program ? ` · ${b.program.name}` : ''}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-white/80 mb-1.5">Session From <span className="text-red-400">*</span></label>
                                            <select className={selectCls} value={sessionFrom} onChange={e => setSessionFrom(e.target.value)}>
                                                <option value="" className="bg-[#0A192F]">Year</option>
                                                {YEARS.map(y => <option key={y} value={y} className="bg-[#0A192F]">{y}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-white/80 mb-1.5">Session To <span className="text-red-400">*</span></label>
                                            <select className={selectCls} value={sessionTo} onChange={e => setSessionTo(e.target.value)}>
                                                <option value="" className="bg-[#0A192F]">Year</option>
                                                {YEARS.filter(y => !sessionFrom || y > parseInt(sessionFrom)).map(y => <option key={y} value={y} className="bg-[#0A192F]">{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {classPreview && (
                                        <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-sm text-[#10B981]">
                                            🎓 Class: <strong>{classPreview}</strong>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Roll Number <span className="text-red-400">*</span> <span className="text-white/30 font-normal text-xs">(unique within class)</span></label>
                                        <input className={inputCls} placeholder="e.g. 01, A-12" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Required docs */}
                            <div className="space-y-2">
                                <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Required Documents</p>
                                {REQUIRED_DOCS.map(field => (
                                    <DocCard key={field.key} field={field} file={files[field.key]} onSelect={setFile(field.key)} onRemove={removeFile(field.key)} />
                                ))}
                            </div>

                            {/* Optional docs */}
                            <div className="space-y-2">
                                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Optional Documents</p>
                                {OPTIONAL_DOCS.map(field => (
                                    <DocCard key={field.key} field={field} file={files[field.key]} onSelect={setFile(field.key)} onRemove={removeFile(field.key)} />
                                ))}
                            </div>

                            {/* Custom docs */}
                            <div className="space-y-3">
                                <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Additional Documents <span className="text-white/20 font-normal normal-case">(optional, any extra docs)</span></p>

                                {customDocs.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                                        <span className="text-[#10B981] text-sm flex-shrink-0">✓</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate">{doc.title}</p>
                                            <p className="text-white/30 text-xs truncate">{doc.file.name}</p>
                                        </div>
                                        <button onClick={() => removeCustomDoc(i)} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add custom doc */}
                                <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 space-y-3">
                                    <input className={inputCls} placeholder="Document title (e.g. Migration Certificate)" value={newCustomTitle} onChange={e => setNewCustomTitle(e.target.value)} />
                                    <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors">
                                        <Upload className="w-4 h-4 text-white/40" />
                                        <span className="text-sm text-white/50">{newCustomFile ? newCustomFile.name : 'Choose file (PDF, JPG, PNG)'}</span>
                                        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) setNewCustomFile(f); }} />
                                    </label>
                                    <button onClick={addCustomDoc} disabled={!newCustomTitle.trim() || !newCustomFile}
                                        className="flex items-center gap-2 text-sm text-[#10B981] font-semibold disabled:opacity-30 hover:text-[#10B981]/80 transition-colors">
                                        <Plus className="w-4 h-4" /> Add Document
                                    </button>
                                </div>
                            </div>

                            {/* Errors */}
                            {(fieldError || error) && (
                                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {fieldError || error}
                                </div>
                            )}

                            {/* Info */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300 space-y-1">
                                <p className="font-semibold text-blue-200">3 documents required (marked *)</p>
                                <p>Aadhaar and Family ID are optional · Max {MAX_MB}MB each · PDF, JPG, PNG</p>
                            </div>

                            {/* Submit */}
                            <button onClick={handleSubmit} disabled={!!(loading || !canSubmit)}
                                className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold text-base hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                                ) : (
                                    <><CheckCircle className="w-5 h-5" /> Complete Registration</>
                                )}
                            </button>

                            <button type="button" onClick={() => signOut({ callbackUrl: '/login' })}
                                className="w-full py-2.5 text-white/30 hover:text-white/60 text-sm transition-colors">
                                Sign out and come back later
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
