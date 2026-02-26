'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Download, FileText, Image as ImageIcon, User, Phone, Mail, BookOpen, Hash, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';

interface DashboardProfile {
    name: string; email: string; mobileNumber: string | null;
    batch: string | null; session: string | null;
    className: string | null; sessionFrom: number | null; sessionTo: number | null;
    rollNumber: string | null; username: string;
}
interface DocumentsData {
    passportPhotoUrl: string; passportPhotoType: string;
    marksheet10Url: string; marksheet10Type: string;
    marksheet12Url: string; marksheet12Type: string;
    aadhaarFamilyIdUrl: string; aadhaarFamilyIdType: string;
    uploadedAt: string;
}

const DOC_LABELS = [
    { urlKey: 'passportPhotoUrl', typeKey: 'passportPhotoType', label: 'Passport Size Photo', icon: <ImageIcon className="w-5 h-5" /> },
    { urlKey: 'marksheet10Url', typeKey: 'marksheet10Type', label: '10th Marksheet', icon: <FileText className="w-5 h-5" /> },
    { urlKey: 'marksheet12Url', typeKey: 'marksheet12Type', label: '12th Marksheet', icon: <FileText className="w-5 h-5" /> },
    { urlKey: 'aadhaarFamilyIdUrl', typeKey: 'aadhaarFamilyIdType', label: 'Aadhaar + Family ID', icon: <FileText className="w-5 h-5" /> },
] as const;

export default function StudentProfilePage() {
    const { data: session } = useSession();
    const [docs, setDocs] = useState<DocumentsData | null>(null);
    const [profile, setProfile] = useState<DashboardProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/student/my-documents').then(r => r.json()),
            fetch('/api/student/dashboard').then(r => r.json()),
        ]).then(([docsRes, dashRes]) => {
            if (docsRes.success) setDocs(docsRes.documents);
            if (dashRes.success) setProfile(dashRes.profile);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl">
            {/* ── Personal Information ── */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <div className="flex items-center gap-4">
                        {session?.user?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={session.user.image} alt="Avatar" className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                                {session?.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white">{profile?.name || session?.user?.name}</h2>
                            {profile?.className && (
                                <p className="text-blue-100 text-sm font-medium mt-0.5">🎓 {profile.className}</p>
                            )}
                            {profile?.rollNumber && (
                                <p className="text-blue-200 text-xs mt-0.5">Roll No: {profile.rollNumber}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoRow icon={<Mail className="w-4 h-4 text-blue-500" />} label="Email" value={profile?.email || session?.user?.email || '—'} />
                    <InfoRow icon={<Phone className="w-4 h-4 text-green-500" />} label="Phone" value={profile?.mobileNumber || 'Not provided'} />
                    <InfoRow icon={<BookOpen className="w-4 h-4 text-purple-500" />} label="Batch" value={profile?.batch || 'Not assigned'} />
                    <InfoRow
                        icon={<CalendarDays className="w-4 h-4 text-orange-500" />}
                        label="Session"
                        value={profile?.sessionFrom && profile?.sessionTo
                            ? `${profile.sessionFrom} – ${profile.sessionTo}`
                            : profile?.session || '—'}
                    />
                    <InfoRow icon={<BookOpen className="w-4 h-4 text-indigo-500" />} label="Class" value={profile?.className || '—'} />
                    <InfoRow icon={<Hash className="w-4 h-4 text-pink-500" />} label="Roll Number" value={profile?.rollNumber || '—'} />
                    <InfoRow icon={<User className="w-4 h-4 text-gray-400" />} label="Username" value={profile?.username || '—'} />
                    <InfoRow
                        icon={session?.user?.isProfileComplete
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-red-500" />}
                        label="Profile Status"
                        value={session?.user?.isProfileComplete ? 'Complete' : 'Incomplete'}
                        valueClass={session?.user?.isProfileComplete ? 'text-green-600' : 'text-red-500'}
                    />
                </div>
            </div>

            {/* ── My Documents ── */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> My Documents
                </h3>
                {!docs ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <XCircle className="w-10 h-10 text-red-400" />
                        <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
                        <a href="/complete-profile" className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                            Upload Documents
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {DOC_LABELS.map(({ urlKey, typeKey, label, icon }) => {
                            const url = (docs as any)[urlKey] as string;
                            const type = (docs as any)[typeKey] as string;
                            return (
                                <div key={urlKey} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 group">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">{label}</p>
                                        <p className="text-gray-400 text-xs uppercase">{type}</p>
                                    </div>
                                    <a
                                        href={url} target="_blank" rel="noopener noreferrer" download
                                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shrink-0"
                                    >
                                        <Download className="w-3.5 h-3.5" /> {type === 'pdf' ? 'PDF' : 'Image'}
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
                {docs?.uploadedAt && (
                    <p className="text-xs text-gray-400 mt-4">
                        Uploaded: {new Date(docs.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value, valueClass = 'text-gray-900' }: {
    icon: React.ReactNode; label: string; value: string; valueClass?: string;
}) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-sm font-semibold ${valueClass} break-all`}>{value}</p>
            </div>
        </div>
    );
}
