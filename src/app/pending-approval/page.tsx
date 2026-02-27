'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, XCircle, Mail, LogOut, CheckCircle2, Upload, FileText, Image as ImageIcon, AlertTriangle, RefreshCw } from 'lucide-react';
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

export default function PendingApprovalPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const userStatus = session?.user?.status;

    const [rejectionInfo, setRejectionInfo] = useState<RejectionInfo | null>(null);
    const [reuploadFiles, setReuploadFiles] = useState<Record<string, File | null>>({});
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Fetch rejection reasons from API
    const fetchRejections = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch(`/api/student/rejection-info`);
            const data = await res.json();
            if (data.success) {
                setRejectionInfo(data);
            }
        } catch { /* silent */ }
    }, [session?.user?.id]);

    useEffect(() => {
        if (userStatus === 'rejected') fetchRejections();
    }, [userStatus, fetchRejections]);

    // If user is active, push to dashboard
    useEffect(() => {
        if (status === 'authenticated' && userStatus === 'active') {
            router.replace('/student');
        }
    }, [status, userStatus, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#10B981]" />
            </div>
        );
    }

    const isRejected = userStatus === 'rejected';
    const isUnderReview = userStatus === 'under_review';
    const isPending = userStatus === 'pending';
    const isProfileIncomplete = !session?.user?.isProfileComplete;

    const rejectedFields = rejectionInfo?.rejectionReasons ? Object.keys(rejectionInfo.rejectionReasons) : [];

    const handleFileSelect = (key: string, file: File) => {
        setReuploadFiles(prev => ({ ...prev, [key]: file }));
        setUploadError('');
    };

    const handleReupload = async () => {
        // Make sure all rejected fields have new files
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
                if (reuploadFiles[key]) {
                    fd.append(key, reuploadFiles[key]!);
                }
            }
            const res = await fetch('/api/auth/complete-profile', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data.success) {
                setUploadError(data.message);
            } else {
                setUploadSuccess(true);
                await update(); // refresh session
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch {
            setUploadError('Upload failed. Try again.');
        } finally {
            setUploading(false);
        }
    };

    // Determine page state and messaging
    let icon: React.ReactNode;
    let title: string;
    let description: string;
    let bgColor: string;

    if (isRejected) {
        icon = <AlertTriangle className="w-10 h-10 text-red-400" />;
        title = 'Documents Rejected';
        description = 'Some of your documents were rejected by the admin. Please re-upload the corrected documents below.';
        bgColor = 'bg-red-500';
    } else if (isPending && isProfileIncomplete) {
        icon = <Upload className="w-10 h-10 text-amber-400" />;
        title = 'Complete Your Profile';
        description = 'Please upload your required documents to continue the registration process.';
        bgColor = 'bg-amber-500';
    } else if (isUnderReview) {
        icon = <Clock className="w-10 h-10 text-[#10B981] animate-pulse" />;
        title = 'Under Review ⏳';
        description = 'Your documents have been submitted. The college administrator is reviewing your details. You will receive access once approved.';
        bgColor = 'bg-[#10B981]';
    } else {
        icon = <Clock className="w-10 h-10 text-[#10B981] animate-pulse" />;
        title = 'Awaiting Approval ⏳';
        description = 'Your account is registered. Please complete your profile to proceed.';
        bgColor = 'bg-[#10B981]';
    }

    return (
        <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 ${bgColor}`} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* College Brand */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center font-black text-white text-lg">L</div>
                    <span className="text-white font-bold text-xl">LDM College</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-5 backdrop-blur-sm">
                    {/* Status icon */}
                    <div className={`w-20 h-20 rounded-full ${isRejected ? 'bg-red-500/10 border-red-500/30' : 'bg-[#10B981]/10 border-[#10B981]/30'} border flex items-center justify-center mx-auto`}>
                        {icon}
                    </div>

                    <div>
                        <h1 className="text-2xl font-extrabold text-white mb-2">{title}</h1>
                        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
                    </div>

                    {/* Email */}
                    {session?.user?.email && (
                        <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70">
                            <Mail className="w-4 h-4 text-[#10B981]" />
                            {session.user.email}
                        </div>
                    )}

                    {/* Pending + profile incomplete → show go to complete-profile button */}
                    {isPending && isProfileIncomplete && (
                        <button
                            onClick={() => router.push('/complete-profile')}
                            className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Upload className="w-4 h-4" /> Upload Documents Now
                        </button>
                    )}

                    {/* Under review — just show steps */}
                    {isUnderReview && (
                        <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-4 text-left space-y-2">
                            {[
                                { text: 'Documents submitted', done: true },
                                { text: 'Admin reviews your details', done: false },
                                { text: 'Access to student dashboard', done: false },
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                                    {step.done
                                        ? <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                                        : <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/40 font-bold text-xs shrink-0">{i + 1}</div>
                                    }
                                    <span className={step.done ? 'text-[#10B981] font-semibold' : ''}>{step.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rejected — show reasons and re-upload UI */}
                    {isRejected && rejectionInfo?.rejectionReasons && (
                        <div className="space-y-4 text-left">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Rejected Documents</p>
                                {Object.entries(rejectionInfo.rejectionReasons).map(([field, reason]) => (
                                    <div key={field} className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-white font-semibold text-sm">{DOC_LABELS[field] || field}</p>
                                                <p className="text-red-300/80 text-xs">{reason}</p>
                                            </div>
                                        </div>
                                        {/* Re-upload input */}
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${reuploadFiles[field] ? 'border-[#10B981] bg-[#10B981]/5' : 'border-white/20 bg-white/5 hover:border-white/40'}`}>
                                            {reuploadFiles[field] ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[#10B981] font-semibold text-xs truncate">{reuploadFiles[field]!.name}</p>
                                                        <p className="text-white/40 text-xs">{(reuploadFiles[field]!.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-white/40 shrink-0" />
                                                    <span className="text-white/50 text-xs font-medium">Upload corrected {DOC_LABELS[field] || field}</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept={DOC_ACCEPT[field] || 'image/*,application/pdf'}
                                                className="sr-only"
                                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(field, f); }}
                                            />
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {uploadError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    {uploadError}
                                </div>
                            )}

                            {uploadSuccess ? (
                                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-4 py-3 text-sm text-[#10B981] font-semibold flex items-center gap-2 justify-center">
                                    <CheckCircle2 className="w-4 h-4" /> Resubmitted! Redirecting…
                                </div>
                            ) : (
                                <button
                                    onClick={handleReupload}
                                    disabled={uploading || rejectedFields.some(k => !reuploadFiles[k])}
                                    className="w-full py-3 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? 'Uploading…' : 'Resubmit for Review'}
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="w-full py-3 flex items-center justify-center gap-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 rounded-xl text-sm font-semibold transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>

                <p className="text-center text-white/20 text-xs mt-6">
                    For urgent queries, contact the college administration office.
                </p>
            </motion.div>
        </div>
    );
}
