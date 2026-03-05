'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaChevronRight, FaEye, FaEyeSlash } from 'react-icons/fa';

interface BatchOption { _id: string; batchCode?: string; name: string; intakeMonth: string; joiningYear: number; status: string; program?: { name: string; code: string; duration_years: number; }; session?: { name: string; }; }

const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all text-sm';
const inputErrCls = 'w-full bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm';
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const selectErrCls = `${inputErrCls} appearance-none cursor-pointer`;

const OTP_RESEND_SECONDS = 60;
const STEPS = ['Your Details', 'Verify Email', 'Done!'];

const StepIndicator = ({ current }: { current: number }) => (
    <div className="flex items-center gap-1 mb-8">
        {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${i < current ? 'bg-[#10B981] text-white' : i === current ? 'bg-[#10B981] text-white ring-4 ring-[#10B981]/30' : 'bg-white/10 text-white/30'}`}>
                    {i < current ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded transition-all ${i < current ? 'bg-[#10B981]' : 'bg-white/10'}`} />}
            </div>
        ))}
    </div>
);

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - 3 + i);

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<-1 | 0 | 1 | 2>(-1);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [form, setForm] = useState({
        fullName: '', email: '', mobileNumber: '',
        batchId: '', rollNumber: '', semester: '', password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ── Batch filter state ────────────────────────────────────────────
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');

    // Derive unique months and years from all batches for filter dropdowns
    const availableMonths = [...new Set(batches.map(b => b.intakeMonth))].sort();
    const availableYears = [...new Set(batches.map(b => b.joiningYear))].sort((a, b) => b - a);

    // Filter batches based on selected month and year
    const filteredBatches = batches.filter(b => {
        if (filterMonth && b.intakeMonth !== filterMonth) return false;
        if (filterYear && b.joiningYear !== Number(filterYear)) return false;
        return true;
    });

    const selectedBatch = filteredBatches.find(b => b._id === form.batchId);

    // Auto-calculate course end date preview
    const courseEndPreview = (() => {
        if (!selectedBatch || !selectedBatch.program) return null;
        const jy = selectedBatch.joiningYear;
        if (selectedBatch.intakeMonth === 'January') {
            return `December ${jy + selectedBatch.program.duration_years - 1}`;
        }
        return `June ${jy + selectedBatch.program.duration_years}`;
    })();

    const classPreview = (() => {
        if (!selectedBatch) return null;
        return selectedBatch.batchCode || selectedBatch.name;
    })();

    useEffect(() => {
        fetch('/api/public/batches').then(r => r.json()).then(d => { if (d.success) setBatches(d.batches); });
    }, []);

    useEffect(() => {
        if (otpTimer <= 0) return;
        const t = setInterval(() => setOtpTimer(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [otpTimer]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        // Clear field error on change
        if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const sendOTP = async () => {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (data.success) setOtpTimer(OTP_RESEND_SECONDS);
        else setError(data.message);
    };

    const handleRegister = async () => {
        // Per-field validation with inline errors
        const errs: Record<string, string> = {};
        if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
        if (!form.email.trim()) errs.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
        if (!form.mobileNumber.trim()) errs.mobileNumber = 'Mobile number is required.';
        else if (!/^\d{10}$/.test(form.mobileNumber)) errs.mobileNumber = 'Must be 10 digits.';
        if (!form.batchId) errs.batchId = 'Please select your batch.';
        if (!form.rollNumber.trim()) errs.rollNumber = 'Roll number is required.';
        if (!form.password) errs.password = 'Password is required.';
        else if (form.password.length < 8) errs.password = 'Must be at least 8 characters.';
        else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
            errs.password = 'Must include at least one uppercase, lowercase, and number.';
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            setError('Please fix the errors below.');
            return;
        }

        setFieldErrors({});
        setError('');
        setLoading(true);
        try {
            // First, send the OTP. We only register AFTER OTP is verified.
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }

            setRegisteredEmail(form.email);
            setOtpTimer(OTP_RESEND_SECONDS);
            setStep(1); // Move to OTP input screen
        } catch { setError('Something went wrong. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleOtpChange = (i: number, v: string) => {
        if (!/^\d?$/.test(v)) return;
        const n = [...otp]; n[i] = v; setOtp(n);
        if (v && i < 5) otpRefs.current[i + 1]?.focus();
    };
    const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (p.length === 6) setOtp(p.split(''));
    };

    const handleVerifyOTP = async () => {
        const otpStr = otp.join('');
        if (otpStr.length !== 6) { setError('Enter all 6 digits.'); return; }
        setError(''); setLoading(true);
        try {
            // 1. Verify OTP
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, otp: otpStr }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }

            // 2. If OTP is correct, actually register the user
            const regRes = await fetch('/api/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const regData = await regRes.json();

            if (!regData.success) {
                setError(regData.message);
                // If roll number is taken, let them go back to fix it
                setStep(0);
                return;
            }

            setStep(2); // Success screen
        } catch { setError('Something went wrong.'); }
        finally { setLoading(false); }
    };

    const ic = (field: string) => fieldErrors[field] ? inputErrCls : inputCls;
    const sc = (field: string) => fieldErrors[field] ? selectErrCls : selectCls;

    const FieldErr = ({ field }: { field: string }) =>
        fieldErrors[field] ? <p className="text-red-400 text-xs mt-1">{fieldErrors[field]}</p> : null;

    return (
        <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center px-4 py-12">
            <Link href="/" className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-white font-bold text-lg">LDM College</span>
            </Link>

            <div className="w-full max-w-md">
                {step >= 0 && step < 2 && (
                    <div className="text-center mb-5">
                        <h1 className="text-2xl font-extrabold text-white">Join LDM College 🎓</h1>
                    </div>
                )}
                {step >= 0 && step < 2 && <StepIndicator current={step} />}

                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">{error}</div>
                )}

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <AnimatePresence mode="wait" initial={false}>

                        {/* ── Method chooser ─────────────────────────────── */}
                        {step === -1 && (
                            <motion.div key="method" initial={{ x: 0, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
                                <div className="text-center mb-4">
                                    <h2 className="text-lg font-bold text-white">Create your account</h2>
                                    <p className="text-white/40 text-sm mt-1">Choose how you&apos;d like to register</p>
                                </div>
                                <button
                                    onClick={() => signIn('google', { callbackUrl: '/complete-profile' })}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-gray-800 rounded-2xl font-semibold hover:bg-gray-100 transition-all shadow-lg"
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </button>
                                <div className="relative my-1">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                                    <div className="relative flex justify-center text-xs"><span className="px-3 bg-[#0A192F]/0 text-white/30">or</span></div>
                                </div>
                                <button onClick={() => setStep(0)} className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-semibold hover:bg-white/15 transition-all">
                                    ✉️ Register with Email
                                </button>
                                <p className="text-center text-xs text-white/30 pt-2">
                                    Already registered? <Link href="/login" className="text-[#10B981] font-semibold hover:underline">Login</Link>
                                </p>
                            </motion.div>
                        )}

                        {/* ── Step 0: Registration form ─────────────────── */}
                        {step === 0 && (
                            <motion.div key="step0" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                                <h2 className="text-base font-bold text-white">Your Details</h2>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Full Name</label>
                                    <input className={ic('fullName')} placeholder="e.g. Priya Sharma" value={form.fullName} onChange={set('fullName')} />
                                    <FieldErr field="fullName" />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Email Address</label>
                                    <input type="email" className={ic('email')} placeholder="you@example.com" value={form.email} onChange={set('email')} />
                                    <FieldErr field="email" />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Phone Number</label>
                                    <input className={ic('mobileNumber')} placeholder="10-digit mobile" value={form.mobileNumber} onChange={set('mobileNumber')} maxLength={10} inputMode="tel" />
                                    <FieldErr field="mobileNumber" />
                                </div>

                                {/* Batch Filters — Month & Year */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Intake Month</label>
                                        <select className={selectCls} value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setForm(prev => ({ ...prev, batchId: '' })); }}>
                                            <option value="" className="bg-[#0A192F]">All Months</option>
                                            {availableMonths.map(m => <option key={m} value={m} className="bg-[#0A192F]">{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Joining Year</label>
                                        <select className={selectCls} value={filterYear} onChange={e => { setFilterYear(e.target.value); setForm(prev => ({ ...prev, batchId: '' })); }}>
                                            <option value="" className="bg-[#0A192F]">All Years</option>
                                            {availableYears.map(y => <option key={y} value={String(y)} className="bg-[#0A192F]">{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Batch Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Select Batch <span className="text-red-400">*</span></label>
                                    <select className={sc('batchId')} value={form.batchId} onChange={set('batchId')}>
                                        <option value="" className="bg-[#0A192F]">— Select your assigned Batch —</option>
                                        {filteredBatches.map(b => (
                                            <option key={b._id} value={b._id} className="bg-[#0A192F]">
                                                {b.batchCode || b.name} {b.program?.name ? `— ${b.program.name}` : ''} {b.session?.name ? `(${b.session.name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {filteredBatches.length === 0 && (filterMonth || filterYear) && (
                                        <p className="text-yellow-400/80 text-xs mt-1">No batches found for the selected filters. Try different month/year.</p>
                                    )}
                                    <FieldErr field="batchId" />
                                </div>

                                {/* Class preview */}
                                {courseEndPreview && (
                                    <div className="flex flex-col gap-1 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-sm text-[#10B981]">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">🎓</span>
                                            <span>Your Batch: <strong>{classPreview}</strong></span>
                                        </div>
                                        {selectedBatch?.session?.name && (
                                            <div className="flex items-center gap-2 text-[#10B981]/80 text-xs">
                                                <span className="text-transparent">🎓</span>
                                                <span>Session: <strong>{selectedBatch.session.name}</strong></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-[#10B981]/80 text-xs">
                                            <span className="text-transparent">🎓</span>
                                            <span>Est. Graduation: <strong>{courseEndPreview}</strong></span>
                                        </div>
                                    </div>
                                )}

                                {/* Roll Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">
                                        Roll Number <span className="text-red-400">*</span> <span className="text-white/30 font-normal text-xs">(unique within class)</span>
                                    </label>
                                    <input className={ic('rollNumber')} placeholder="e.g. 01, A-12" value={form.rollNumber} onChange={set('rollNumber')} />
                                    <FieldErr field="rollNumber" />
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Current Semester <span className="text-white/30 font-normal text-xs">(optional)</span></label>
                                    <select className={selectCls} value={form.semester} onChange={set('semester')}>
                                        <option value="" className="bg-[#0A192F]">— Select Semester —</option>
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map(s => (
                                            <option key={s} value={s} className="bg-[#0A192F]">
                                                {s === 1 ? '1st' : s === 2 ? '2nd' : s === 3 ? '3rd' : `${s}th`} Semester
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/80 mb-1.5">Password</label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} className={ic('password') + ' pr-10'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                                            {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                                        </button>
                                    </div>
                                    <FieldErr field="password" />
                                </div>

                                <button
                                    onClick={handleRegister}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all"
                                >
                                    {loading ? 'Creating account…' : <><span>Continue</span><FaChevronRight size={12} /></>}
                                </button>
                            </motion.div>
                        )}

                        {/* ── Step 1: OTP ───────────────────────────────── */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                                <div className="text-center">
                                    <h2 className="text-lg font-bold text-white">Verify your email</h2>
                                    <p className="text-white/50 text-sm mt-1">6-digit code sent to <span className="text-[#10B981]">{form.email}</span></p>
                                </div>
                                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                                            onChange={e => handleOtpChange(i, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981] transition-all" />
                                    ))}
                                </div>
                                <div className="text-center text-sm text-white/50">
                                    {otpTimer > 0 ? (
                                        <span>Resend in <span className="text-white font-semibold">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</span></span>
                                    ) : (
                                        <button onClick={async () => { setLoading(true); await sendOTP(); setLoading(false); }} disabled={loading} className="text-[#10B981] underline font-semibold disabled:opacity-50">
                                            Resend code
                                        </button>
                                    )}
                                </div>
                                <button onClick={handleVerifyOTP} disabled={loading || otp.join('').length !== 6}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold disabled:opacity-60 transition-all">
                                    {loading ? 'Verifying…' : 'Verify & Continue'}
                                </button>
                            </motion.div>
                        )}

                        {/* ── Step 2: Done ──────────────────────────────── */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-5 py-4">
                                <FaCheckCircle className="text-[#10B981] text-5xl mx-auto" />
                                <div>
                                    <h2 className="text-xl font-extrabold text-white">Email Verified! 🎉</h2>
                                    {classPreview && (
                                        <p className="text-white/60 text-sm mt-2">
                                            Class: <span className="text-[#10B981] font-semibold">{classPreview}</span>
                                            {' · Roll No: '}<span className="text-[#10B981] font-semibold">{form.rollNumber}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 text-sm text-left space-y-1.5 text-white/70">
                                    <p>✅ Account created</p>
                                    <p>✅ Email verified</p>
                                    <p className="text-white/40 text-xs">Login with: <span className="text-[#10B981]">{registeredEmail}</span></p>
                                </div>
                                <button onClick={() => router.push('/login')}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all">
                                    Login & Upload Documents →
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {step === 0 && (
                    <p className="text-center text-sm text-white/40 mt-4">
                        Already registered? <Link href="/login" className="text-[#10B981] hover:underline font-semibold">Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
