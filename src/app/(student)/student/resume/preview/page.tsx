'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────
interface ResumeData {
    address?: { state?: string; district?: string; customText?: string };
    careerObjective?: string;
    education?: { qualification: string; institution: string; yearOfPassing: number; percentage?: string }[];
    skills?: string[];
    internship?: { hasInternship: boolean; hospitalName?: string; duration?: string; role?: string };
    experience?: { isFresher: boolean; jobRole?: string; organization?: string; duration?: string; responsibilities?: string[] };
    languages?: string[];
}

interface ProfileData { mobileNumber?: string; dateOfBirth?: string; }
interface UserData { fullName?: string; email?: string; }

// ─── Resume Document Component (A4 layout, print-ready) ──────────────
function ResumeDocument({ resume, profile, user }: { resume: ResumeData; profile: ProfileData; user: UserData }) {
    const addressParts = [resume.address?.customText, resume.address?.district, resume.address?.state].filter(Boolean).join(', ');

    return (
        <div id="resume-document" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif", background: 'white', width: '210mm', minHeight: '297mm', padding: '18mm 16mm', boxSizing: 'border-box', fontSize: '10pt', color: '#1f2937', lineHeight: '1.5' }}>

            {/* ── Header ── */}
            <div style={{ borderBottom: '3px solid #10B981', paddingBottom: '12px', marginBottom: '14px' }}>
                <h1 style={{ margin: 0, fontSize: '24pt', fontWeight: 800, color: '#0A192F', letterSpacing: '-0.5px' }}>{user.fullName || 'Your Name'}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '9pt', color: '#6b7280' }}>
                    {profile.mobileNumber && <span>📱 {profile.mobileNumber}</span>}
                    {user.email && <span>✉️ {user.email}</span>}
                    {addressParts && <span>📍 {addressParts}</span>}
                </div>
            </div>

            {/* ── Career Objective ── */}
            {resume.careerObjective && (
                <Section title="Career Objective">
                    <p style={{ margin: 0, color: '#374151', fontStyle: 'italic' }}>{resume.careerObjective}</p>
                </Section>
            )}

            {/* ── Education ── */}
            {(resume.education?.length ?? 0) > 0 && (
                <Section title="Education">
                    {resume.education!.map((edu, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: i < resume.education!.length - 1 ? '8px' : 0 }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, color: '#0A192F' }}>{edu.qualification}</p>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '9pt' }}>{edu.institution}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ margin: 0, color: '#374151' }}>{edu.yearOfPassing}</p>
                                {edu.percentage && <p style={{ margin: 0, color: '#10B981', fontSize: '9pt', fontWeight: 600 }}>{edu.percentage}%</p>}
                            </div>
                        </div>
                    ))}
                </Section>
            )}

            {/* ── Skills ── */}
            {(resume.skills?.length ?? 0) > 0 && (
                <Section title="Skills">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {resume.skills!.map((skill, i) => (
                            <span key={i} style={{ background: '#f0fdf4', border: '1px solid #10B981', borderRadius: '100px', padding: '3px 10px', fontSize: '9pt', color: '#065f46', fontWeight: 600 }}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── Internship ── */}
            {resume.internship?.hasInternship && (
                <Section title="Internship / Training">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#0A192F' }}>{resume.internship.role}</p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '9pt' }}>{resume.internship.hospitalName}</p>
                        </div>
                        <p style={{ margin: 0, color: '#374151' }}>{resume.internship.duration}</p>
                    </div>
                </Section>
            )}

            {/* ── Work Experience ── */}
            {!resume.experience?.isFresher && resume.experience?.organization && (
                <Section title="Work Experience">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#0A192F' }}>{resume.experience.jobRole}</p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '9pt' }}>{resume.experience.organization}</p>
                        </div>
                        <p style={{ margin: 0, color: '#374151' }}>{resume.experience.duration}</p>
                    </div>
                </Section>
            )}

            {/* ── Languages ── */}
            {(resume.languages?.length ?? 0) > 0 && (
                <Section title="Languages Known">
                    <p style={{ margin: 0, color: '#374151' }}>{resume.languages!.join(' • ')}</p>
                </Section>
            )}

            {/* ── Footer ── */}
            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '8pt', color: '#d1d5db' }}>
                Generated by LDM College Resume Builder
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '14px' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '11pt', fontWeight: 800, color: '#0A192F', paddingLeft: '10px', borderLeft: '4px solid #10B981', lineHeight: '1.2' }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function ResumePreviewPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [resume, setResume] = useState<ResumeData>({});
    const [profile, setProfile] = useState<ProfileData>({});
    const [user, setUser] = useState<UserData>({});
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') loadData();
    }, [status]);

    const loadData = async () => {
        const res = await fetch('/api/student/resume');
        const data = await res.json();
        if (data.success) {
            setResume(data.resume || {});
            setProfile(data.profile || {});
            setUser(data.user || {});
        }
        setLoading(false);
    };

    const handleDownload = async () => {
        setDownloading(true);
        // Dynamically import html2pdf to avoid SSR issues
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.getElementById('resume-document');
        if (!element) { setDownloading(false); return; }

        const fileName = `${(user.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
        await html2pdf().set({
            margin: 0,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(element).save();
        setDownloading(false);
    };

    if (loading || status === 'loading') {
        return <div className="min-h-screen bg-[#0A192F] flex items-center justify-center text-white text-sm">Loading your resume…</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top bar */}
            <div className="bg-[#0A192F] text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
                <div>
                    <h1 className="font-bold text-base">Resume Preview</h1>
                    <p className="text-white/40 text-xs">This is how your resume will look when downloaded.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/student/resume" className="px-4 py-2 border border-white/20 text-white rounded-xl text-sm hover:bg-white/10 transition-colors">
                        ✏️ Edit
                    </Link>
                    <button onClick={handleDownload} disabled={downloading} className="px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl text-sm font-bold shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] hover:scale-105 transition-all disabled:opacity-60">
                        {downloading ? '⏳ Generating PDF…' : '⬇️ Download PDF'}
                    </button>
                </div>
            </div>

            {/* A4 Preview */}
            <div className="flex justify-center py-8 px-4">
                <div className="shadow-2xl">
                    <ResumeDocument resume={resume} profile={profile} user={user} />
                </div>
            </div>
        </div>
    );
}
