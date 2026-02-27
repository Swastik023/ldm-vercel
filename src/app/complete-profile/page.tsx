'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Upload, FileText, Image as ImageIcon, XCircle, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DocField {
    key: string;
    label: string;
    hint: string;
    accept: string;
    allowedTypes: string[];
}

interface Batch { _id: string; name: string; program?: { name: string }; session?: { name: string }; }

// ─── Document slots ───────────────────────────────────────────────────────────
const DOC_FIELDS: DocField[] = [
    {
        key: 'passportPhoto',
        label: 'Passport Size Photo',
        hint: 'Clear photo of your face · Accepted: JPG, PNG, WEBP',
        accept: 'image/jpeg,image/png,image/webp',
        allowedTypes: ['jpg', 'jpeg', 'png', 'webp'],
    },
    {
        key: 'marksheet10',
        label: '10th Marksheet',
        hint: 'Class 10 result document · Accepted: PDF, JPG, PNG',
        accept: 'application/pdf,image/jpeg,image/png,image/webp',
        allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    },
    {
        key: 'marksheet12',
        label: '12th Marksheet',
        hint: 'Class 12 result document · Accepted: PDF, JPG, PNG',
        accept: 'application/pdf,image/jpeg,image/png,image/webp',
        allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    },
    {
        key: 'aadhaarFamilyId',
        label: 'Aadhaar + Family ID',
        hint: 'Aadhaar card and Family ID in one document · Accepted: PDF, JPG, PNG',
        accept: 'application/pdf,image/jpeg,image/png,image/webp',
        allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    },
];

const MAX_MB = 5;

// ─── File Upload Card ─────────────────────────────────────────────────────────
function DocUploadCard({
    field,
    file,
    onSelect,
    onRemove,
}: {
    field: DocField;
    file: File | null;
    onSelect: (f: File) => void;
    onRemove: () => void;
}) {
    const ext = file?.name.split('.').pop()?.toLowerCase() ?? '';
    const isPdf = ext === 'pdf';
    const preview = file && !isPdf ? URL.createObjectURL(file) : null;
    const sizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : null;

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) onSelect(f);
    }, [onSelect]);

    return (
        <div className={`rounded-2xl border-2 transition-all ${file ? 'border-[#10B981] bg-[#10B981]/5' : 'border-white/10 bg-white/5 border-dashed hover:border-white/30'}`}>
            {!file ? (
                <label
                    className="flex flex-col items-center gap-3 p-6 cursor-pointer"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-sm">{field.label}</p>
                        <p className="text-white/40 text-xs mt-1">{field.hint}</p>
                        <p className="text-[#10B981] text-xs mt-2 font-medium">Click or drag & drop · Max {MAX_MB}MB</p>
                    </div>
                    <input
                        type="file"
                        accept={field.accept}
                        className="sr-only"
                        onChange={e => { const f = e.target.files?.[0]; if (f) onSelect(f); }}
                    />
                </label>
            ) : (
                <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center shrink-0">
                        {isPdf ? <FileText className="w-5 h-5 text-[#10B981]" /> : <ImageIcon className="w-5 h-5 text-[#10B981]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{field.label}</p>
                        <p className="text-white/50 text-xs truncate">{file.name} · {sizeMB}MB</p>
                    </div>
                    {preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                    )}
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                        title="Remove file"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - 3 + i);

export default function CompleteProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [files, setFiles] = useState<Record<string, File | null>>({
        passportPhoto: null, marksheet10: null, marksheet12: null, aadhaarFamilyId: null,
    });
    const [batches, setBatches] = useState<Batch[]>([]);
    // Academic fields (Google users only)
    const [mobileNumber, setMobileNumber] = useState('');
    const [batchId, setBatchId] = useState('');
    const [sessionFrom, setSessionFrom] = useState('');
    const [sessionTo, setSessionTo] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const [fieldError, setFieldError] = useState<string | null>(null);

    // Google users need to fill academic info
    const isGoogleUser = session?.user?.provider === 'google';
    const needsExtraInfo = !session?.user?.isProfileComplete;

    // Live class preview
    const selectedBatch = batches.find(b => b._id === batchId);
    const classPreview = selectedBatch && sessionFrom && sessionTo && parseInt(sessionFrom) < parseInt(sessionTo)
        ? `${selectedBatch.name} (${sessionFrom}–${sessionTo})`
        : null;

    useEffect(() => {
        if (needsExtraInfo) {
            fetch('/api/public/batches').then(r => r.json()).then(d => { if (d.success) setBatches(d.batches); });
        }
    }, [needsExtraInfo]);

    const setFile = (key: string) => (file: File) => {
        setFieldError(null);
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const field = DOC_FIELDS.find(f => f.key === key)!;
        if (!field.allowedTypes.includes(ext)) {
            setFieldError(`${field.label}: Invalid file type. Accepted: ${field.allowedTypes.join(', ')}`);
            return;
        }
        if (file.size / (1024 * 1024) > MAX_MB) {
            setFieldError(`${field.label} exceeds ${MAX_MB}MB limit.`);
            return;
        }
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const removeFile = (key: string) => () => setFiles(prev => ({ ...prev, [key]: null }));

    const allUploaded = DOC_FIELDS.every(f => files[f.key] !== null);

    const handleSubmit = async () => {
        if (!allUploaded) { setError('Please upload all 4 required documents.'); return; }
        setError(''); setLoading(true);

        try {
            const fd = new FormData();
            for (const field of DOC_FIELDS) fd.append(field.key, files[field.key] as File);
            if (mobileNumber) fd.append('mobileNumber', mobileNumber);
            if (batchId) fd.append('batchId', batchId);
            if (sessionFrom) fd.append('sessionFrom', sessionFrom);
            if (sessionTo) fd.append('sessionTo', sessionTo);
            if (rollNumber) fd.append('rollNumber', rollNumber);

            const res = await fetch('/api/auth/complete-profile', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }
            await update();
            setDone(true);
            setTimeout(() => { window.location.href = '/pending-approval'; }, 1500);
        } catch {
            setError('Upload failed. Please check your connection and try again.');
        } finally { setLoading(false); }
    };

    // Disabled if docs missing, or Google user hasn't filled academic fields
    const googleAcademicComplete = !isGoogleUser || (batchId && sessionFrom && sessionTo && rollNumber &&
        parseInt(sessionFrom) < parseInt(sessionTo));
    const canSubmit = allUploaded && googleAcademicComplete;

    const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#10B981] text-sm';
    const selectCls = `${inputCls} appearance-none cursor-pointer`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#0d2137] to-[#0A192F] flex flex-col items-center justify-center px-4 py-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-white font-bold text-lg">LDM College</span>
            </div>

            <div className="w-full max-w-lg">
                {/* User greeting */}
                {session?.user && (
                    <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                        {session.user.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={session.user.image} alt="Profile" width={36} height={36} className="rounded-full" />
                        )}
                        <div>
                            <p className="text-white font-semibold text-sm">{session.user.name}</p>
                            <p className="text-white/40 text-xs">{session.user.email}</p>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center space-y-4"
                        >
                            <CheckCircle className="text-[#10B981] w-16 h-16 mx-auto" />
                            <h2 className="text-2xl font-extrabold text-white">Registration Complete! 🎉</h2>
                            <p className="text-white/60 text-sm">Redirecting you to your dashboard…</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="text-center">
                                <h1 className="text-2xl font-extrabold text-white">Complete Your Profile 📄</h1>
                                <p className="text-white/50 text-sm mt-1">Upload the following documents to activate your account.</p>
                            </div>

                            {/* Progress bar */}
                            <div className="bg-white/5 rounded-full h-2">
                                <motion.div
                                    className="bg-gradient-to-r from-[#10B981] to-[#047857] h-2 rounded-full"
                                    animate={{ width: `${(DOC_FIELDS.filter(f => files[f.key]).length / DOC_FIELDS.length) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                            <p className="text-white/40 text-xs text-right -mt-4">
                                {DOC_FIELDS.filter(f => files[f.key]).length} / {DOC_FIELDS.length} uploaded
                            </p>

                            {/* Google users: academic info required */}
                            {isGoogleUser && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Academic Details (required)</p>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Phone Number</label>
                                        <input className={inputCls} placeholder="10-digit mobile" value={mobileNumber}
                                            onChange={e => setMobileNumber(e.target.value)} maxLength={10} inputMode="tel" />
                                    </div>

                                    {/* Batch */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Batch <span className="text-red-400">*</span></label>
                                        <select className={selectCls} value={batchId} onChange={e => setBatchId(e.target.value)}>
                                            <option value="" className="bg-[#0A192F]">— Select Batch —</option>
                                            {batches.map(b => (
                                                <option key={b._id} value={b._id} className="bg-[#0A192F]">
                                                    {b.name}{(b as any).program ? ` · ${(b as any).program.name}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Session From / To */}
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
                                                {YEARS.filter(y => !sessionFrom || y > parseInt(sessionFrom)).map(y => (
                                                    <option key={y} value={y} className="bg-[#0A192F]">{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Live class preview */}
                                    {classPreview && (
                                        <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-sm text-[#10B981]">
                                            🎓 Class: <strong>{classPreview}</strong>
                                        </div>
                                    )}

                                    {/* Roll Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">
                                            Roll Number <span className="text-red-400">*</span>
                                            <span className="text-white/30 font-normal text-xs ml-1">(unique within class)</span>
                                        </label>
                                        <input className={inputCls} placeholder="e.g. 01, A-12" value={rollNumber}
                                            onChange={e => setRollNumber(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Document uploads */}
                            <div className="space-y-3">
                                {DOC_FIELDS.map(field => (
                                    <DocUploadCard
                                        key={field.key}
                                        field={field}
                                        file={files[field.key]}
                                        onSelect={setFile(field.key)}
                                        onRemove={removeFile(field.key)}
                                    />
                                ))}
                            </div>

                            {/* Validation messages */}
                            {fieldError && (
                                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {fieldError}
                                </div>
                            )}
                            {error && (
                                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            {/* Requirements note */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300 space-y-1">
                                <p className="font-semibold text-blue-200">All 4 documents are required</p>
                                <p>Maximum file size: {MAX_MB}MB each · Supported: PDF, JPG, PNG</p>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={!!(loading || !canSubmit)}
                                className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold text-base hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Uploading documents…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Complete Registration
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="w-full py-2.5 text-white/30 hover:text-white/60 text-sm transition-colors"
                            >
                                Sign out and come back later
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
