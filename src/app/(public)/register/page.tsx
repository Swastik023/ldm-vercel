'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaChevronRight } from 'react-icons/fa';

interface Batch { _id: string; name: string; program?: { name: string }; }

const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all text-sm';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

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

const stepVariants = { enter: { x: 40, opacity: 0 }, center: { x: 0, opacity: 1 }, exit: { x: -40, opacity: 0 } };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - 3 + i); // 3 years back, 12 forward

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(-1);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [form, setForm] = useState({
        fullName: '', email: '', mobileNumber: '',
        batchId: '', sessionFrom: '', sessionTo: '',
        rollNumber: '', password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Derived class name preview
    const selectedBatch = batches.find(b => b._id === form.batchId);
    const classPreview = selectedBatch && form.sessionFrom && form.sessionTo && parseInt(form.sessionFrom) < parseInt(form.sessionTo)
        ? `${selectedBatch.name} (${form.sessionFrom}–${form.sessionTo})`
        : null;

    useEffect(() => {
        fetch('/api/public/batches').then(r => r.json()).then(d => { if (d.success) setBatches(d.batches); });
    }, []);

    useEffect(() => {
        if (otpTimer <= 0) return;
        const t = setInterval(() => setOtpTimer(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [otpTimer]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

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
        // Client-side validation
        if (!form.fullName || !form.email || !form.mobileNumber || !form.batchId ||
            !form.sessionFrom || !form.sessionTo || !form.rollNumber || !form.password) {
            setError('Please fill in all fields.'); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Please enter a valid email.'); return;
        }
        if (!/^\d{10}$/.test(form.mobileNumber)) {
            setError('Mobile number must be 10 digits.'); return;
        }
        if (parseInt(form.sessionFrom) >= parseInt(form.sessionTo)) {
            setError('Session "From" year must be before Session "To" year.'); return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.'); return;
        }

        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.success) { setError(data.message); return; }
            setRegisteredEmail(form.email);
            await sendOTP();
            setStep(1);
        } catch { setError('Something went wrong.'); }
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
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, otp: otpStr }),
            });
            const data = await res.json();
            if (data.success) setStep(2);
            else setError(data.message);
        } catch { setError('Something went wrong.'); }
        finally { setLoading(false); }
    };

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
                    <AnimatePresence mode="wait">

                        {/* ── Method chooser ─────────────────────────────── */}
                        {step === -1 && (
                            <motion.div key="method" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
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
                            <motion.div key="step0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                                <h2 className="text-base font-bold text-white">Your Details</h2>

                                {/* Full Name */}
                                <Field label="Full Name">
                                    <input className={inputCls} placeholder="e.g. Priya Sharma" value={form.fullName} onChange={set('fullName')} />
                                </Field>

                                {/* Email */}
                                <Field label="Email Address">
                                    <input type="email" className={inputCls} placeholder="you@example.com" value={form.email} onChange={set('email')} />
                                </Field>

                                {/* Phone */}
                                <Field label="Phone Number">
                                    <input className={inputCls} placeholder="10-digit mobile" value={form.mobileNumber} onChange={set('mobileNumber')} maxLength={10} inputMode="tel" />
                                </Field>

                                {/* Batch */}
                                <Field label={<>Batch <RequiredStar /></>}>
                                    <select className={selectCls} value={form.batchId} onChange={set('batchId')}>
                                        <option value="" className="bg-[#0A192F]">— Select Batch —</option>
                                        {batches.map(b => (
                                            <option key={b._id} value={b._id} className="bg-[#0A192F]">
                                                {b.name}{b.program ? ` · ${b.program.name}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                {/* Session From / To */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label={<>Session From <RequiredStar /></>}>
                                        <select className={selectCls} value={form.sessionFrom} onChange={set('sessionFrom')}>
                                            <option value="" className="bg-[#0A192F]">Year</option>
                                            {YEARS.map(y => <option key={y} value={y} className="bg-[#0A192F]">{y}</option>)}
                                        </select>
                                    </Field>
                                    <Field label={<>Session To <RequiredStar /></>}>
                                        <select className={selectCls} value={form.sessionTo} onChange={set('sessionTo')}>
                                            <option value="" className="bg-[#0A192F]">Year</option>
                                            {YEARS.filter(y => !form.sessionFrom || y > parseInt(form.sessionFrom)).map(y => (
                                                <option key={y} value={y} className="bg-[#0A192F]">{y}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                {/* Class preview */}
                                {classPreview && (
                                    <div className="flex items-center gap-2 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl px-3 py-2 text-sm text-[#10B981]">
                                        <span className="text-base">🎓</span>
                                        <span>Your class: <strong>{classPreview}</strong></span>
                                    </div>
                                )}

                                {/* Roll Number */}
                                <Field label={<>Roll Number <RequiredStar /> <span className="text-white/30 font-normal text-xs">(unique within class)</span></>}>
                                    <input className={inputCls} placeholder="e.g. 01, A-12" value={form.rollNumber} onChange={set('rollNumber')} />
                                </Field>

                                {/* Password */}
                                <Field label="Password">
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
                                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                                            {showPassword ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                </Field>

                                <button
                                    onClick={handleRegister}
                                    disabled={loading || !form.batchId || !form.sessionFrom || !form.sessionTo || !form.rollNumber}
                                    className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all"
                                >
                                    {loading ? 'Creating account…' : <><span>Continue</span><FaChevronRight size={12} /></>}
                                </button>
                            </motion.div>
                        )}

                        {/* ── Step 1: OTP ───────────────────────────────── */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-5">
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

// ── Small helpers ─────────────────────────────────────────────────────────────
function RequiredStar() { return <span className="text-red-400">*</span>; }

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-white/80 mb-1.5">{label}</label>
            {children}
        </div>
    );
}
