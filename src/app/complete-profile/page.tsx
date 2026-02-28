'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Plus, X, Upload } from 'lucide-react';

interface DocField {
    key: string; label: string; hint: string; accept: string;
    allowedTypes: string[]; required?: boolean;
}
interface ProgramItem { _id: string; name: string; code: string; duration_years: number; }

const REQUIRED_DOCS: DocField[] = [
    { key: 'passportPhoto', label: 'Passport Size Photo', hint: 'Clear photo of your face · JPG, PNG, WEBP', accept: 'image/jpeg,image/png,image/webp', allowedTypes: ['jpg', 'jpeg', 'png', 'webp'], required: true },
    { key: 'marksheet10', label: '10th Marksheet', hint: 'Class 10 result · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], required: true },
    { key: 'marksheet12', label: '12th Marksheet', hint: 'Class 12 result · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], required: true },
    { key: 'aadhaarFront', label: 'Aadhaar Card (Front)', hint: 'Front side of Aadhaar card · JPG, PNG, PDF', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], required: true },
    { key: 'aadhaarBack', label: 'Aadhaar Card (Back)', hint: 'Back side of Aadhaar card · JPG, PNG, PDF', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'], required: true },
];
const OPTIONAL_DOCS: DocField[] = [
    { key: 'familyId', label: 'Family ID', hint: 'Family ID card (optional) · PDF, JPG, PNG', accept: 'application/pdf,image/jpeg,image/png,image/webp', allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
];

const MAX_MB = 5;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 4 + i);
const INTAKE_MONTHS = ['January', 'July'] as const;

// ── Small drop-zone card ──────────────────────────────────────────────────────
function DocCard({ field, file, onSelect, onRemove }: { field: DocField; file: File | null; onSelect: (f: File) => void; onRemove: () => void; }) {
    return (
        <div className={`relative flex items-center gap-3 bg-white/5 border ${file ? 'border-[#10B981]/40' : 'border-white/10'} rounded-xl px-4 py-3 transition-all`}>
            {file ? (
                <>
                    <span className="text-[#10B981] text-sm flex-shrink-0">✓</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{field.label}{field.required ? ' *' : ''}</p>
                        <p className="text-white/30 text-xs truncate">{file.name} · {(file.size / 1024).toFixed(0)}KB</p>
                    </div>
                    <button onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                </>
            ) : (
                <label className="flex items-center gap-3 w-full cursor-pointer group">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                        <Upload className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{field.label}{field.required ? <span className="text-red-400"> *</span> : ''}</p>
                        <p className="text-white/30 text-xs truncate">{field.hint}</p>
                    </div>
                    <input type="file" accept={field.accept} className="hidden" onChange={e => { if (e.target.files?.[0]) onSelect(e.target.files[0]); }} />
                </label>
            )}
        </div>
    );
}

export default function CompleteProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    const [files, setFiles] = useState<Record<string, File | null>>({ passportPhoto: null, marksheet10: null, marksheet12: null, aadhaarFront: null, aadhaarBack: null, familyId: null });
    const [customDocs, setCustomDocs] = useState<{ title: string; file: File }[]>([]);
    const [newCustomTitle, setNewCustomTitle] = useState('');
    const [newCustomFile, setNewCustomFile] = useState<File | null>(null);
    const [programs, setPrograms] = useState<ProgramItem[]>([]);
    const [mobileNumber, setMobileNumber] = useState('');
    const [programId, setProgramId] = useState('');
    const [joiningMonth, setJoiningMonth] = useState('');
    const [joiningYear, setJoiningYear] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldError, setFieldError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    // Document metadata
    const [meta10Roll, setMeta10Roll] = useState('');
    const [meta10Pct, setMeta10Pct] = useState('');
    const [meta12Roll, setMeta12Roll] = useState('');
    const [meta12Pct, setMeta12Pct] = useState('');
    const [aadhaarNumber, setAadhaarNumber] = useState('');

    const isGoogleUser = session?.user?.provider === 'google';
    const selectedProgram = programs.find(p => p._id === programId);

    // Auto-calculate course end date preview
    const courseEndPreview = (() => {
        if (!selectedProgram || !joiningMonth || !joiningYear) return null;
        const jy = parseInt(joiningYear);
        if (isNaN(jy)) return null;
        if (joiningMonth === 'January') {
            return `December ${jy + selectedProgram.duration_years - 1}`;
        }
        return `June ${jy + selectedProgram.duration_years}`;
    })();

    useEffect(() => {
        fetch('/api/public/programs').then(r => r.json()).then(d => { if (d.success) setPrograms(d.programs); });
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
    const metadataComplete = !!meta10Roll && !!meta10Pct && !!meta12Roll && !!meta12Pct && !!aadhaarNumber;
    const googleAcademicComplete = !isGoogleUser || (programId && joiningMonth && joiningYear && rollNumber);
    const canSubmit = requiredUploaded && metadataComplete && googleAcademicComplete;
    const uploadedCount = [...REQUIRED_DOCS, ...OPTIONAL_DOCS].filter(f => files[f.key]).length;
    const totalCount = REQUIRED_DOCS.length + OPTIONAL_DOCS.length;

    const handleSubmit = async () => {
        if (!requiredUploaded) { setError('Please upload all required documents (marked with *).'); return; }
        if (!metadataComplete) { setError('Please fill in all document details (Roll Numbers, Percentages, Aadhaar Number).'); return; }
        setError(''); setLoading(true);
        try {
            const fd = new FormData();
            for (const field of [...REQUIRED_DOCS, ...OPTIONAL_DOCS]) {
                if (files[field.key]) fd.append(field.key, files[field.key] as File);
            }
            customDocs.forEach((doc, i) => { fd.append(`customTitle${i}`, doc.title); fd.append(`customFile${i}`, doc.file); });
            if (mobileNumber) fd.append('mobileNumber', mobileNumber);
            if (programId) fd.append('programId', programId);
            if (joiningMonth) fd.append('joiningMonth', joiningMonth);
            if (joiningYear) fd.append('joiningYear', joiningYear);
            if (rollNumber) fd.append('rollNumber', rollNumber);

            // Document metadata
            const documentMeta = [
                { docType: '10th', docRollNumber: meta10Roll, docPercentage: meta10Pct },
                { docType: '12th', docRollNumber: meta12Roll, docPercentage: meta12Pct },
                { docType: 'Aadhaar', docNumber: aadhaarNumber.replace(/\s/g, '') },
            ];
            fd.append('documentMeta', JSON.stringify(documentMeta));

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
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Program (Course) <span className="text-red-400">*</span></label>
                                        <select className={selectCls} value={programId} onChange={e => setProgramId(e.target.value)}>
                                            <option value="" className="bg-[#0A192F]">— Select Program —</option>
                                            {programs.map(p => <option key={p._id} value={p._id} className="bg-[#0A192F]">{p.name} ({p.duration_years}yr)</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-white/80 mb-1.5">Joining Month <span className="text-red-400">*</span></label>
                                            <select className={selectCls} value={joiningMonth} onChange={e => setJoiningMonth(e.target.value)}>
                                                <option value="" className="bg-[#0A192F]">— Month —</option>
                                                {INTAKE_MONTHS.map(m => <option key={m} value={m} className="bg-[#0A192F]">{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-white/80 mb-1.5">Joining Year <span className="text-red-400">*</span></label>
                                            <select className={selectCls} value={joiningYear} onChange={e => setJoiningYear(e.target.value)}>
                                                <option value="" className="bg-[#0A192F]">Year</option>
                                                {YEARS.map(y => <option key={y} value={y} className="bg-[#0A192F]">{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {courseEndPreview && (
                                        <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-sm text-[#10B981]">
                                            📅 Course End: <strong>{courseEndPreview}</strong>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Roll Number <span className="text-red-400">*</span> <span className="text-white/30 font-normal text-xs">(your login ID)</span></label>
                                        <input className={inputCls} placeholder="e.g. 2024001" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
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

                            {/* Document Metadata */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Document Details <span className="text-red-400">*</span></p>

                                {/* 10th */}
                                <div>
                                    <p className="text-white/70 text-sm font-semibold mb-2">10th Marksheet</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className={inputCls} placeholder="10th Roll Number" value={meta10Roll} onChange={e => setMeta10Roll(e.target.value)} />
                                        <input className={inputCls} placeholder="Percentage (e.g. 85.5)" value={meta10Pct} onChange={e => setMeta10Pct(e.target.value)} inputMode="decimal" />
                                    </div>
                                </div>

                                {/* 12th */}
                                <div>
                                    <p className="text-white/70 text-sm font-semibold mb-2">12th Marksheet</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className={inputCls} placeholder="12th Roll Number" value={meta12Roll} onChange={e => setMeta12Roll(e.target.value)} />
                                        <input className={inputCls} placeholder="Percentage (e.g. 78.3)" value={meta12Pct} onChange={e => setMeta12Pct(e.target.value)} inputMode="decimal" />
                                    </div>
                                </div>

                                {/* Aadhaar */}
                                <div>
                                    <p className="text-white/70 text-sm font-semibold mb-2">Aadhaar Card</p>
                                    <input className={inputCls} placeholder="Aadhaar Number (12 digits)" value={aadhaarNumber}
                                        onChange={e => {
                                            const v = e.target.value.replace(/[^\d\s]/g, '');
                                            setAadhaarNumber(v);
                                        }} maxLength={14} inputMode="numeric" />
                                </div>
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

                                <div className="flex items-center gap-2">
                                    <input className={`${inputCls} flex-1`} placeholder="Document title" value={newCustomTitle} onChange={e => setNewCustomTitle(e.target.value)} />
                                    <label className="px-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white/50 text-sm cursor-pointer hover:bg-white/20 transition-colors flex-shrink-0">
                                        <Plus className="w-4 h-4 inline" />
                                        <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setNewCustomFile(e.target.files[0]); }} />
                                    </label>
                                    <button onClick={addCustomDoc} disabled={!newCustomTitle.trim() || !newCustomFile}
                                        className="px-3 py-3 bg-[#10B981] rounded-xl text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#059669] transition-colors flex-shrink-0">
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Errors */}
                            {(error || fieldError) && (
                                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-400/30 rounded-xl px-4 py-3">
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-300 text-sm">{error || fieldError}</p>
                                </div>
                            )}

                            {/* Submit / Logout */}
                            <div className="space-y-3">
                                <button onClick={handleSubmit} disabled={!canSubmit || loading}
                                    className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all shadow-lg ${canSubmit && !loading ? 'bg-gradient-to-r from-[#10B981] to-[#047857] text-white hover:shadow-[#10B981]/30 hover:shadow-xl' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                                    {loading ? 'Uploading…' : `Submit (${uploadedCount}/${REQUIRED_DOCS.length} required uploaded)`}
                                </button>
                                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-center text-white/30 hover:text-white/60 text-xs font-medium py-2 transition-colors">
                                    Sign out →
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
