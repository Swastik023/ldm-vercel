'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaPlus, FaTimes } from 'react-icons/fa';

// ─── Constants ────────────────────────────────────────────────────────
const INDIA_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'];

const CAREER_OBJECTIVES = [
    'To work in a reputed hospital and gain practical experience in patient care and clinical operations.',
    'To serve patients with dedication and improve my healthcare skills every day.',
    'To build a stable and respected career in the medical and paramedical field.',
    'To support doctors and medical teams professionally and efficiently.',
    'Custom – Write your own…',
];

const ALL_SKILLS = ['Patient Care', 'Communication', 'Team Work', 'Time Management', 'Basic Computer Knowledge', 'Record Keeping', 'Medical Equipment Handling', 'Hygiene & Safety Knowledge'];
const ALL_LANGUAGES = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi', 'Gujarati', 'Urdu', 'Odia'];
const INTERNSHIP_DURATIONS = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'];
const HEALTHCARE_ROLES = ['General Duty Assistant (GDA)', 'Patient Care Assistant', 'Nursing Assistant', 'Lab Technician Trainee', 'Radiology Assistant', 'Pharmacy Intern', 'OT Technician Trainee', 'Emergency Care Assistant'];
const QUALIFICATIONS = ['10th Pass', '12th Pass', 'Diploma', 'Graduate', 'Post Graduate'];
const YEARS = Array.from({ length: 25 }, (_, i) => `${new Date().getFullYear() - i}`);

// ─── Types ───────────────────────────────────────────────────────────
interface EducationEntry { qualification: string; institution: string; yearOfPassing: string; percentage: string; }

interface ResumeData {
    address: { state: string; district: string; customText: string };
    careerObjective: string;
    education: EducationEntry[];
    skills: string[];
    internship: { hasInternship: boolean; hospitalName: string; duration: string; role: string };
    experience: { isFresher: boolean; jobRole: string; organization: string; duration: string; responsibilities: string[] };
    languages: string[];
}

const INITIAL: ResumeData = {
    address: { state: '', district: '', customText: '' },
    careerObjective: '',
    education: [],
    skills: [],
    internship: { hasInternship: false, hospitalName: '', duration: '', role: '' },
    experience: { isFresher: true, jobRole: '', organization: '', duration: '', responsibilities: [] },
    languages: [],
};

// ─── Helper sub-components ────────────────────────────────────────────
const SectionCard = ({ icon, title, isOpen, onToggle, children, done }: { icon: string; title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode; done?: boolean }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="font-semibold text-white text-sm">{title}</span>
                {done && <FaCheckCircle className="text-[#10B981] w-4 h-4" />}
            </div>
            {isOpen ? <FaChevronUp className="text-white/40" /> : <FaChevronDown className="text-white/40" />}
        </button>
        {isOpen && <div className="px-5 pb-5 pt-1 space-y-3 border-t border-white/10">{children}</div>}
    </div>
);

const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all text-sm';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

const HelperText = ({ text }: { text: string }) => (
    <p className="text-xs text-white/40 mt-1">{text}</p>
);

// ─── Main Component ───────────────────────────────────────────────────
export default function ResumeBuilderPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [openSection, setOpenSection] = useState<string>('objective');
    const [resume, setResume] = useState<ResumeData>(INITIAL);
    const [customObjective, setCustomObjective] = useState('');
    const [selectedObjective, setSelectedObjective] = useState('');
    const [addingEdu, setAddingEdu] = useState(false);
    const [newEdu, setNewEdu] = useState<EducationEntry>({ qualification: '', institution: '', yearOfPassing: '', percentage: '' });
    const [customSkill, setCustomSkill] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedMsg, setSavedMsg] = useState('');
    const [userInfo, setUserInfo] = useState<{ fullName: string; email: string; mobileNumber: string; dateOfBirth: string; qualification: string } | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') { router.push('/login'); return; }
        if (status === 'authenticated') loadData();
    }, [status]);

    const loadData = async () => {
        const res = await fetch('/api/student/resume');
        const data = await res.json();
        if (data.success) {
            if (data.resume) setResume({ ...INITIAL, ...data.resume });
            if (data.profile && data.user) {
                setUserInfo({
                    fullName: data.user.fullName,
                    email: data.user.email,
                    mobileNumber: data.profile.mobileNumber,
                    dateOfBirth: data.profile.dateOfBirth,
                    qualification: data.profile.highestQualification,
                });
                // Pre-fill education from profile if empty
                if (!data.resume?.education?.length && data.profile.highestQualification) {
                    setResume((prev) => ({
                        ...prev,
                        education: [{ qualification: data.profile.highestQualification, institution: '', yearOfPassing: String(data.profile.yearOfPassing), percentage: '' }],
                    }));
                }
            }
        }
    };

    const toggle = (key: string) => setOpenSection(openSection === key ? '' : key);

    const toggleChip = (arr: string[], value: string, setter: (next: string[]) => void) => {
        setter(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
    };

    const setSkills = (next: string[]) => setResume((p) => ({ ...p, skills: next }));
    const setLanguages = (next: string[]) => setResume((p) => ({ ...p, languages: next }));

    const handleObjectiveSelect = (val: string) => {
        setSelectedObjective(val);
        if (val !== 'Custom – Write your own…') {
            setResume((p) => ({ ...p, careerObjective: val }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const careerObj = selectedObjective === 'Custom – Write your own…' ? customObjective : resume.careerObjective;
        const payload = { ...resume, careerObjective: careerObj };
        const res = await fetch('/api/student/resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        setSaving(false);
        if (data.success) { setSavedMsg('Saved! ✅'); setTimeout(() => setSavedMsg(''), 2500); }
    };

    if (status === 'loading') {
        return <div className="min-h-screen bg-[#0A192F] flex items-center justify-center text-white">Loading…</div>;
    }

    return (
        <div className="min-h-screen bg-[#0A192F] pb-24">
            {/* Header */}
            <div className="px-4 pt-8 pb-6 max-w-2xl mx-auto">
                <h1 className="text-2xl font-extrabold text-white">You&apos;re almost done! 🚀</h1>
                <p className="text-white/50 text-sm mt-1">Let&apos;s complete your resume. It will help you get a job.</p>
            </div>

            <div className="px-4 max-w-2xl mx-auto space-y-3">

                {/* ── Personal Info ── */}
                <SectionCard icon="🧑" title="Personal Information" isOpen={openSection === 'personal'} onToggle={() => toggle('personal')} done={!!userInfo}>
                    {userInfo ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[['Full Name', userInfo.fullName], ['Email', userInfo.email], ['Mobile', userInfo.mobileNumber]].map(([label, val]) => (
                                <div key={label} className={label === 'Email' ? 'col-span-2' : ''}>
                                    <p className="text-xs text-white/40 mb-1">{label}</p>
                                    <div className="bg-white/5 rounded-xl px-3 py-2 text-white text-sm">{val}</div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-white/40 text-sm">Loading…</p>}

                    <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-2">📍 Your Address <span className="text-white/20">(Where you currently live)</span></p>
                        <div className="grid grid-cols-2 gap-2">
                            <select className={selectCls} value={resume.address.state} onChange={(e) => setResume((p) => ({ ...p, address: { ...p.address, state: e.target.value } }))}>
                                <option value="" className="bg-[#0A192F]">Select State</option>
                                {INDIA_STATES.map((s) => <option key={s} value={s} className="bg-[#0A192F]">{s}</option>)}
                            </select>
                            <input className={inputCls} placeholder="District" value={resume.address.district} onChange={(e) => setResume((p) => ({ ...p, address: { ...p.address, district: e.target.value } }))} />
                        </div>
                        <input className={`${inputCls} mt-2`} placeholder="Village / Town / Area (optional)" value={resume.address.customText} onChange={(e) => setResume((p) => ({ ...p, address: { ...p.address, customText: e.target.value } }))} />
                    </div>
                </SectionCard>

                {/* ── Career Objective ── */}
                <SectionCard icon="🎯" title="Career Objective" isOpen={openSection === 'objective'} onToggle={() => toggle('objective')} done={!!resume.careerObjective}>
                    <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl px-4 py-3 text-xs text-white/60 mb-3">
                        <strong className="text-[#10B981]">What is Career Objective?</strong><br />
                        It is 2–3 lines about what kind of job you want and what you want to do. It goes at the top of your resume.
                    </div>
                    <div className="space-y-2">
                        {CAREER_OBJECTIVES.map((obj) => (
                            <button key={obj} onClick={() => handleObjectiveSelect(obj)} className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all ${selectedObjective === obj ? 'border-[#10B981] bg-[#10B981]/10 text-white' : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white/80'}`}>
                                {obj}
                            </button>
                        ))}
                    </div>
                    {selectedObjective === 'Custom – Write your own…' && (
                        <textarea className={`${inputCls} mt-2 h-28 resize-none`} placeholder="Write your career objective here in your own words…" value={customObjective} onChange={(e) => setCustomObjective(e.target.value)} />
                    )}
                </SectionCard>

                {/* ── Education ── */}
                <SectionCard icon="🎓" title="Education" isOpen={openSection === 'education'} onToggle={() => toggle('education')} done={resume.education.length > 0}>
                    <div className="space-y-2">
                        {resume.education.map((edu, i) => (
                            <div key={i} className="bg-white/5 rounded-xl px-4 py-3 flex items-start justify-between">
                                <div>
                                    <p className="text-white text-sm font-semibold">{edu.qualification}</p>
                                    <p className="text-white/40 text-xs">{edu.institution || 'Institution not set'} · {edu.yearOfPassing}</p>
                                    {edu.percentage && <p className="text-white/40 text-xs">{edu.percentage}%</p>}
                                </div>
                                <button onClick={() => setResume((p) => ({ ...p, education: p.education.filter((_, j) => j !== i) }))} className="text-white/30 hover:text-red-400 ml-2 mt-0.5">
                                    <FaTimes />
                                </button>
                            </div>
                        ))}
                    </div>

                    {!addingEdu ? (
                        <button onClick={() => setAddingEdu(true)} className="w-full mt-2 py-2.5 border border-dashed border-[#10B981]/40 text-[#10B981] rounded-xl text-sm flex items-center justify-center gap-2 hover:border-[#10B981] transition-colors">
                            <FaPlus /> Add Qualification
                        </button>
                    ) : (
                        <div className="mt-2 space-y-2 bg-white/5 rounded-xl p-3">
                            <select className={selectCls} value={newEdu.qualification} onChange={(e) => setNewEdu((p) => ({ ...p, qualification: e.target.value }))}>
                                <option value="" className="bg-[#0A192F]">Qualification</option>
                                {QUALIFICATIONS.map((q) => <option key={q} value={q} className="bg-[#0A192F]">{q}</option>)}
                            </select>
                            <input className={inputCls} placeholder="School / College name" value={newEdu.institution} onChange={(e) => setNewEdu((p) => ({ ...p, institution: e.target.value }))} />
                            <div className="grid grid-cols-2 gap-2">
                                <select className={selectCls} value={newEdu.yearOfPassing} onChange={(e) => setNewEdu((p) => ({ ...p, yearOfPassing: e.target.value }))}>
                                    <option value="" className="bg-[#0A192F]">Year</option>
                                    {YEARS.map((y) => <option key={y} value={y} className="bg-[#0A192F]">{y}</option>)}
                                </select>
                                <input className={inputCls} placeholder="% or Grade (optional)" value={newEdu.percentage} onChange={(e) => setNewEdu((p) => ({ ...p, percentage: e.target.value }))} />
                            </div>
                            <HelperText text='"Percentage" means how many marks out of 100 you got on average.' />
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setAddingEdu(false)} className="flex-1 py-2 border border-white/20 text-white/60 rounded-xl text-sm">Cancel</button>
                                <button onClick={() => { if (newEdu.qualification && newEdu.institution && newEdu.yearOfPassing) { setResume((p) => ({ ...p, education: [...p.education, newEdu] })); setNewEdu({ qualification: '', institution: '', yearOfPassing: '', percentage: '' }); setAddingEdu(false); } }} className="flex-1 py-2 bg-[#10B981] text-white rounded-xl text-sm font-semibold">Add</button>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* ── Skills ── */}
                <SectionCard icon="🛠️" title="Skills" isOpen={openSection === 'skills'} onToggle={() => toggle('skills')} done={resume.skills.length > 0}>
                    <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl px-4 py-2 text-xs text-white/60 mb-2">
                        <strong className="text-[#10B981]">What are Skills?</strong> Skills mean what you can do well — things you are good at in your work.
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_SKILLS.map((skill) => (
                            <button key={skill} onClick={() => toggleChip(resume.skills, skill, setSkills)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${resume.skills.includes(skill) ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40'}`}>
                                {skill}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                        <input className={`${inputCls} flex-1`} placeholder="Add custom skill…" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && customSkill.trim()) { setSkills([...resume.skills, customSkill.trim()]); setCustomSkill(''); } }} />
                        <button onClick={() => { if (customSkill.trim()) { setSkills([...resume.skills, customSkill.trim()]); setCustomSkill(''); } }} className="px-4 py-2 bg-[#10B981] text-white rounded-xl text-xs font-semibold">+ Add</button>
                    </div>
                </SectionCard>

                {/* ── Internship ── */}
                <SectionCard icon="🏥" title="Training / Internship" isOpen={openSection === 'internship'} onToggle={() => toggle('internship')}>
                    <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl px-4 py-2 text-xs text-white/60 mb-2">
                        <strong className="text-[#10B981]">What is Internship?</strong> It is practical training you do at a hospital or clinic to learn real work experience.
                    </div>
                    <p className="text-sm text-white/70 mb-2">Have you done any training or internship?</p>
                    <div className="flex gap-2 mb-3">
                        {['Yes', 'No'].map((opt) => (
                            <button key={opt} onClick={() => setResume((p) => ({ ...p, internship: { ...p.internship, hasInternship: opt === 'Yes' } }))} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${(resume.internship.hasInternship ? 'Yes' : 'No') === opt ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white/5 border-white/20 text-white/60'}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                    {resume.internship.hasInternship && (
                        <div className="space-y-2">
                            <input className={inputCls} placeholder="Hospital / Clinic Name" value={resume.internship.hospitalName} onChange={(e) => setResume((p) => ({ ...p, internship: { ...p.internship, hospitalName: e.target.value } }))} />
                            <div className="grid grid-cols-2 gap-2">
                                <select className={selectCls} value={resume.internship.duration} onChange={(e) => setResume((p) => ({ ...p, internship: { ...p.internship, duration: e.target.value } }))}>
                                    <option value="" className="bg-[#0A192F]">Duration</option>
                                    {INTERNSHIP_DURATIONS.map((d) => <option key={d} value={d} className="bg-[#0A192F]">{d}</option>)}
                                </select>
                                <select className={selectCls} value={resume.internship.role} onChange={(e) => setResume((p) => ({ ...p, internship: { ...p.internship, role: e.target.value } }))}>
                                    <option value="" className="bg-[#0A192F]">Your Role</option>
                                    {HEALTHCARE_ROLES.map((r) => <option key={r} value={r} className="bg-[#0A192F]">{r}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* ── Work Experience ── */}
                <SectionCard icon="💼" title="Work Experience" isOpen={openSection === 'experience'} onToggle={() => toggle('experience')}>
                    <p className="text-sm text-white/70 mb-2">Have you worked anywhere before?</p>
                    <div className="flex gap-2 mb-3">
                        {['Fresher (No Experience)', 'Yes, I have worked'].map((opt, i) => (
                            <button key={opt} onClick={() => setResume((p) => ({ ...p, experience: { ...p.experience, isFresher: i === 0 } }))} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${resume.experience.isFresher === (i === 0) ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white/5 border-white/20 text-white/60'}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                    {!resume.experience.isFresher && (
                        <div className="space-y-2">
                            <input className={inputCls} placeholder="Job title / Role" value={resume.experience.jobRole} onChange={(e) => setResume((p) => ({ ...p, experience: { ...p.experience, jobRole: e.target.value } }))} />
                            <input className={inputCls} placeholder="Hospital / Organization name" value={resume.experience.organization} onChange={(e) => setResume((p) => ({ ...p, experience: { ...p.experience, organization: e.target.value } }))} />
                            <input className={inputCls} placeholder="Duration (e.g. 2 years)" value={resume.experience.duration} onChange={(e) => setResume((p) => ({ ...p, experience: { ...p.experience, duration: e.target.value } }))} />
                        </div>
                    )}
                </SectionCard>

                {/* ── Languages ── */}
                <SectionCard icon="🗣️" title="Languages Known" isOpen={openSection === 'languages'} onToggle={() => toggle('languages')} done={resume.languages.length > 0}>
                    <HelperText text="Languages you can speak or understand — even a little bit counts!" />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {ALL_LANGUAGES.map((lang) => (
                            <button key={lang} onClick={() => toggleChip(resume.languages, lang, setLanguages)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${resume.languages.includes(lang) ? 'bg-[#10B981] border-[#10B981] text-white' : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40'}`}>
                                {lang}
                            </button>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {/* ── Fixed bottom bar ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#0A192F]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex gap-3 max-w-2xl mx-auto">
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 border border-[#10B981] text-[#10B981] rounded-xl font-semibold text-sm transition-all hover:bg-[#10B981]/10 disabled:opacity-50">
                    {saving ? 'Saving…' : savedMsg || '💾 Save Progress'}
                </button>
                <button onClick={() => { handleSave(); setTimeout(() => router.push('/student/resume/preview'), 800); }} className="flex-1 py-3 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold text-sm hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all">
                    Preview My Resume →
                </button>
            </div>
        </div>
    );
}
