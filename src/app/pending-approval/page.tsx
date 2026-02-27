'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';

interface RejectionInfo {
    rejectionReasons: Record<string, string>;
    status: string;
}

const DOC_LABELS: Record<string, string> = {
    passportPhoto: 'Passport Size Photo',
    marksheet10: '10th Marksheet',
    marksheet12: '12th Marksheet',
    aadhaarFamilyId: 'Aadhaar + Family ID',
};

const DOC_ACCEPT: Record<string, string> = {
    passportPhoto: 'image/jpeg,image/png,image/webp',
    marksheet10: 'application/pdf,image/jpeg,image/png,image/webp',
    marksheet12: 'application/pdf,image/jpeg,image/png,image/webp',
    aadhaarFamilyId: 'application/pdf,image/jpeg,image/png,image/webp',
};

const DOC_ICON: Record<string, string> = {
    passportPhoto: '📷',
    marksheet10: '📄',
    marksheet12: '📄',
    aadhaarFamilyId: '🪪',
};

export default function PendingApprovalPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const userStatus = session?.user?.status;
    const isProfileComplete = session?.user?.isProfileComplete;

    const [rejectionInfo, setRejectionInfo] = useState<RejectionInfo | null>(null);
    const [reuploadFiles, setReuploadFiles] = useState<Record<string, File | null>>({});
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);

    const fetchRejections = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch('/api/student/rejection-info');
            const data = await res.json();
            if (data.success) setRejectionInfo(data);
        } catch { /* silent */ }
    }, [session?.user?.id]);

    useEffect(() => {
        if (userStatus === 'rejected') fetchRejections();
    }, [userStatus, fetchRejections]);

    useEffect(() => {
        if (status === 'authenticated' && userStatus === 'active') {
            router.replace('/student');
        }
    }, [status, userStatus, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-2 border-[#19e66b]/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full border-2 border-t-[#19e66b] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-[#19e66b] font-black text-xl">L</div>
                    </div>
                    <p className="text-white/40 text-sm">Loading your account…</p>
                </div>
            </div>
        );
    }

    const isRejected = userStatus === 'rejected';
    const isUnderReview = userStatus === 'under_review';
    const isPending = userStatus === 'pending';
    const rejectedFields = rejectionInfo?.rejectionReasons ? Object.keys(rejectionInfo.rejectionReasons) : [];
    const allFilesProvided = rejectedFields.length > 0 && rejectedFields.every(k => reuploadFiles[k]);

    const handleFileSelect = (key: string, file: File) => {
        setReuploadFiles(prev => ({ ...prev, [key]: file }));
        setUploadError('');
    };

    const handleReupload = async () => {
        const missing = rejectedFields.filter(k => !reuploadFiles[k]);
        if (missing.length > 0) {
            setUploadError(`Please upload: ${missing.map(k => DOC_LABELS[k] || k).join(', ')}`);
            return;
        }
        setUploading(true);
        setUploadError('');
        try {
            const fd = new FormData();
            fd.append('isReupload', 'true');
            for (const key of rejectedFields) {
                if (reuploadFiles[key]) fd.append(key, reuploadFiles[key]!);
            }
            const res = await fetch('/api/auth/complete-profile', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.success) { setUploadError(data.message); }
            else {
                setUploadSuccess(true);
                await update();
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch { setUploadError('Upload failed. Try again.'); }
        finally { setUploading(false); }
    };

    return (
        <div className="min-h-screen bg-[#0A192F] relative overflow-hidden flex flex-col">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(25,230,107,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.04) 0%, transparent 50%)' }} />
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                {isRejected && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/5 blur-3xl" />}
                {isUnderReview && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#19e66b]/5 blur-3xl" />}
                {isPending && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl" />}
            </div>

            {/* Top nav */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19e66b] to-[#047857] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#19e66b]/20">L</div>
                    <div>
                        <p className="text-white font-bold text-sm leading-none">LDM College</p>
                        <p className="text-white/30 text-xs">of Pharmacy</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {session?.user?.email && (
                        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/60">
                            <div className="w-4 h-4 rounded-full bg-[#19e66b]/20 flex items-center justify-center text-[#19e66b] text-xs font-bold">{session.user.email[0].toUpperCase()}</div>
                            {session.user.email}
                        </div>
                    )}
                    <button onClick={() => signOut({ callbackUrl: '/login' })}
                        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/5">
                        Sign out
                    </button>
                </div>
            </nav>

            {/* Main content */}
            <main className="relative z-10 flex-1 flex items-start justify-center p-6 pt-10">
                <div className="w-full max-w-lg space-y-5">

                    {/* ── STATUS HEADER CARD ─────────────────────── */}
                    {isPending && !isProfileComplete && (
                        <div className="bg-white/[0.04] border border-amber-500/20 rounded-2xl p-6 text-center space-y-4 backdrop-blur-sm">
                            {/* Icon */}
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">📤</div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Action Required</p>
                                <h1 className="text-2xl font-extrabold text-white">Complete Your Profile</h1>
                                <p className="text-white/50 text-sm mt-2 leading-relaxed">
                                    Please upload your required documents to proceed with your application. Your profile is currently incomplete.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/complete-profile')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] transition-all"
                            >
                                <span>📋</span> Upload Documents Now
                            </button>
                        </div>
                    )}

                    {isUnderReview && (
                        <div className="bg-white/[0.04] border border-[#19e66b]/20 rounded-2xl p-6 text-center space-y-5 backdrop-blur-sm">
                            {/* Animated clock */}
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 rounded-full bg-[#19e66b]/10 animate-pulse" />
                                <div className="absolute inset-2 rounded-full border-2 border-t-[#19e66b] border-r-[#19e66b]/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '3s' }} />
                                <div className="absolute inset-0 flex items-center justify-center text-4xl">⏳</div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[#19e66b] uppercase tracking-widest mb-2">Under Review</p>
                                <h1 className="text-2xl font-extrabold text-white">Documents Submitted</h1>
                                <p className="text-white/50 text-sm mt-2 leading-relaxed">
                                    Your documents are currently being reviewed by the administration team. This usually takes 1–2 business days.
                                </p>
                            </div>

                            {/* Progress stepper */}
                            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-left space-y-0">
                                {[
                                    { icon: '✅', label: 'Documents submitted', sub: 'Completed', active: false, done: true },
                                    { icon: '🔍', label: 'Admin reviewing', sub: 'In progress', active: true, done: false },
                                    { icon: '🎓', label: 'Dashboard access', sub: 'Locked', active: false, done: false },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${step.done ? 'bg-[#19e66b]/20 border border-[#19e66b]/40' : step.active ? 'bg-blue-500/20 border border-blue-500/40 animate-pulse' : 'bg-white/5 border border-white/10'}`}>
                                                {step.icon}
                                            </div>
                                            {i < 2 && <div className={`w-px h-6 ${step.done ? 'bg-[#19e66b]/30' : 'bg-white/10'}`} />}
                                        </div>
                                        <div className="py-2">
                                            <p className={`text-sm font-semibold ${step.done ? 'text-[#19e66b]' : step.active ? 'text-white' : 'text-white/30'}`}>{step.label}</p>
                                            <p className={`text-xs ${step.done ? 'text-[#19e66b]/60' : step.active ? 'text-blue-400' : 'text-white/20'}`}>{step.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isRejected && (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="bg-white/[0.04] border border-red-500/20 rounded-2xl p-6 text-center space-y-3 backdrop-blur-sm">
                                <div className="relative w-20 h-20 mx-auto">
                                    <div className="absolute inset-0 rounded-full bg-red-500/10" />
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl">⚠️</div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Action Required</p>
                                    <h1 className="text-2xl font-extrabold text-white">Documents Rejected</h1>
                                    <p className="text-white/50 text-sm mt-2 leading-relaxed">
                                        Some documents did not meet our requirements. Please correct the issues below and re-upload.
                                    </p>
                                </div>
                            </div>

                            {/* Per-field rejection cards */}
                            {rejectionInfo?.rejectionReasons && Object.entries(rejectionInfo.rejectionReasons).map(([field, reason]) => (
                                <div key={field} className="bg-white/[0.04] border border-red-500/15 rounded-2xl p-5 space-y-3 backdrop-blur-sm">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{DOC_ICON[field] || '📄'}</span>
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm">{DOC_LABELS[field] || field}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-red-400 text-xs">⚠</span>
                                                <p className="text-red-300/80 text-xs">{reason}</p>
                                            </div>
                                        </div>
                                        {reuploadFiles[field] && (
                                            <div className="flex items-center gap-1 text-[#19e66b] text-xs font-semibold bg-[#19e66b]/10 px-2 py-0.5 rounded-full">
                                                <span>✓</span> Ready
                                            </div>
                                        )}
                                    </div>

                                    {/* Drop zone */}
                                    <label
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragging === field ? 'border-[#19e66b] bg-[#19e66b]/10 scale-[1.01]' : reuploadFiles[field] ? 'border-[#19e66b]/40 bg-[#19e66b]/5' : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'}`}
                                        onDragOver={e => { e.preventDefault(); setDragging(field); }}
                                        onDragLeave={() => setDragging(null)}
                                        onDrop={e => { e.preventDefault(); setDragging(null); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(field, f); }}
                                    >
                                        {reuploadFiles[field] ? (
                                            <div className="text-center">
                                                <p className="text-[#19e66b] font-semibold text-sm">✓ {reuploadFiles[field]!.name}</p>
                                                <p className="text-white/30 text-xs mt-0.5">{(reuploadFiles[field]!.size / (1024 * 1024)).toFixed(2)} MB · Click to change</p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm text-white/50"><span className="text-white/70 font-medium">Click to upload</span> or drag & drop</p>
                                                <p className="text-xs text-white/25 mt-1">PDF, JPG, PNG up to 5MB</p>
                                            </div>
                                        )}
                                        <input type="file" accept={DOC_ACCEPT[field] || 'image/*,application/pdf'} className="sr-only"
                                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(field, f); }} />
                                    </label>
                                </div>
                            ))}

                            {/* Loading skeleton if rejection info still loading */}
                            {!rejectionInfo && (
                                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                                    <div className="h-3 bg-white/5 rounded w-2/3" />
                                </div>
                            )}

                            {uploadError && (
                                <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                                    <span className="text-base mt-px">⚠️</span> {uploadError}
                                </div>
                            )}

                            {uploadSuccess ? (
                                <div className="bg-[#19e66b]/10 border border-[#19e66b]/30 rounded-xl px-4 py-4 text-center">
                                    <p className="text-[#19e66b] font-bold text-sm">✓ Resubmitted successfully! Refreshing…</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleReupload}
                                    disabled={uploading || !allFilesProvided}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#19e66b] to-[#047857] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#19e66b]/20 hover:shadow-[#19e66b]/30 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Uploading…</>
                                    ) : (
                                        <><span>🔄</span> Resubmit for Review</>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── FOOTER INFO ─────────────────────────────── */}
                    <div className="mt-2 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                        <p className="text-white/20 text-xs">For urgent queries, contact the college administration office.</p>
                        <button onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-xs text-white/30 hover:text-white/60 transition-colors whitespace-nowrap font-medium">
                            Sign Out →
                        </button>
                    </div>
                </div>
            </main>

            {/* Bottom bar */}
            <footer className="relative z-10 text-center py-4 text-white/15 text-xs border-t border-white/5">
                © {new Date().getFullYear()} LDM College of Pharmacy. All rights reserved.
            </footer>
        </div>
    );
}
