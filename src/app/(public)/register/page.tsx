'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaChevronRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import * as gtag from '@/lib/gtag';


// ─── Types ───────────────────────────────────────────────────────────
interface FormData {
    fullName: string;
    gender: string;
    dateOfBirth: string;
    mobileNumber: string;
    email: string;
    highestQualification: string;
    yearOfPassing: string;
    englishComfortLevel: string;
    password: string;
}

// ─── Constants ────────────────────────────────────────────────────────
const QUALIFICATIONS = ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate'];
const ENGLISH_LEVELS = [
    { value: 'Basic', label: 'Basic – I struggle with English' },
    { value: 'Moderate', label: 'Moderate – I understand simple English' },
    { value: 'Good', label: 'Good – I can speak and write well' },
];
const YEARS = Array.from({ length: 25 }, (_, i) => `${new Date().getFullYear() - i}`);
const OTP_RESEND_SECONDS = 60;
const STEPS = ['Basic Details', 'Academic Details', 'Verify Email', 'Done!'];

// ─── Helper Components ────────────────────────────────────────────────
const StepIndicator = ({ current }: { current: number }) => (
    <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < current
                    ? 'bg-[#10B981] text-white'
                    : i === current
                        ? 'bg-[#10B981] text-white ring-4 ring-[#10B981]/30'
                        : 'bg-white/10 text-white/30'
                    }`}>
                    {i < current ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded transition-all ${i < current ? 'bg-[#10B981]' : 'bg-white/10'}`} />
                )}
            </div>
        ))}
    </div>
);

const Label = ({ children, helper }: { children: React.ReactNode; helper?: string }) => (
    <div className="mb-1.5">
        <label className="block text-sm font-semibold text-white/90">{children}</label>
        {helper && <span className="text-xs text-white/50">{helper}</span>}
    </div>
);

const inputCls = 'w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all text-sm';
const selectCls = `${inputCls} appearance-none cursor-pointer`;

// ─── Main Component ───────────────────────────────────────────────────
export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormData>({
        fullName: '', gender: '', dateOfBirth: '', mobileNumber: '',
        email: '', highestQualification: '', yearOfPassing: '', englishComfortLevel: '', password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showHelper, setShowHelper] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpTimer, setOtpTimer] = useState(0);
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [registeredName, setRegisteredName] = useState('');
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // OTP countdown timer
    useEffect(() => {
        if (otpTimer <= 0) return;
        const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
        return () => clearInterval(interval);
    }, [otpTimer]);

    const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    // ── Step 1 → 2 ─────────────────────────────────────────────────
    const handleBasicNext = () => {
        if (!form.fullName || !form.gender || !form.dateOfBirth || !form.mobileNumber || !form.email || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!/^\d{10}$/.test(form.mobileNumber)) {
            setError('Mobile number must be 10 digits.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setError('');
        setStep(1);
    };

    // ── Step 2 → Register → Send OTP ───────────────────────────────
    const handleAcademicNext = async () => {
        if (!form.highestQualification || !form.yearOfPassing || !form.englishComfortLevel) {
            setError('Please fill in all fields.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.message);
                setLoading(false);
                return;
            }
            setRegisteredName(form.fullName.split(' ')[0]);
            // 🔥 Track account creation
            gtag.event.studentRegister();
            // Send OTP
            await sendOTP();
            setStep(2);

        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const sendOTP = async () => {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (data.success) {
            setOtpSent(true);
            setOtpTimer(OTP_RESEND_SECONDS);
        } else {
            setError(data.message);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setLoading(true);
        await sendOTP();
        setLoading(false);
    };

    // ── OTP input handling ──────────────────────────────────────────
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
        }
    };

    // ── Verify OTP ──────────────────────────────────────────────────
    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, otp: otpString }),
            });
            const data = await res.json();
            if (data.success) {
                // 🔥 Track OTP verified → full registration complete
                gtag.event.otpVerified();
                setStep(3);

            } else {
                setError(data.message);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Animation ───────────────────────────────────────────────────
    const stepVariants = {
        enter: { x: 40, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -40, opacity: 0 },
    };

    return (
        <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center px-4 py-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-white font-bold text-lg">LDM College</span>
            </Link>

            <div className="w-full max-w-md">
                {/* Header */}
                {step < 3 && (
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-extrabold text-white">Let&apos;s build your future 🌟</h1>
                        <p className="text-white/50 mt-1 text-sm">We will help you, step by step.</p>
                    </div>
                )}

                {/* Step indicator */}
                {step < 3 && <StepIndicator current={step} />}

                {/* Error message */}
                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <AnimatePresence mode="wait">
                        {/* ─── STEP 0: Basic Details ──────────────────────── */}
                        {step === 0 && (
                            <motion.div key="step0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                                <h2 className="text-lg font-bold text-white mb-4">Basic Details</h2>

                                <div>
                                    <Label helper="As written on your ID card">Your Full Name</Label>
                                    <input className={inputCls} placeholder="e.g. Priya Sharma" value={form.fullName} onChange={set('fullName')} />
                                </div>

                                <div>
                                    <Label>Gender</Label>
                                    <select className={selectCls} value={form.gender} onChange={set('gender')}>
                                        <option value="" className="bg-[#0A192F]">Select gender</option>
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <option key={g} value={g} className="bg-[#0A192F]">{g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label helper="The day, month, and year you were born">Date of Birth</Label>
                                    <input type="date" className={inputCls} value={form.dateOfBirth} onChange={set('dateOfBirth')} max={new Date().toISOString().split('T')[0]} />
                                </div>

                                <div>
                                    <Label helper="We will contact you here">Mobile Number</Label>
                                    <input className={inputCls} placeholder="10-digit mobile number" value={form.mobileNumber} onChange={set('mobileNumber')} maxLength={10} inputMode="tel" />
                                </div>

                                <div>
                                    <Label helper="We will send a verification code here">Email Address</Label>
                                    <input type="email" className={inputCls} placeholder="your@email.com" value={form.email} onChange={set('email')} inputMode="email" />
                                </div>

                                <div>
                                    <Label helper="Minimum 8 characters — keep it secret!">Create Password</Label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} className={`${inputCls} pr-10`} placeholder="Choose a strong password" value={form.password} onChange={set('password')} />
                                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <button onClick={handleBasicNext} className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                    Continue <FaChevronRight />
                                </button>
                            </motion.div>
                        )}

                        {/* ─── STEP 1: Academic Details ───────────────────── */}
                        {step === 1 && (
                            <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-4">
                                <h2 className="text-lg font-bold text-white mb-4">Academic Details</h2>

                                <div>
                                    <Label helper="Your last completed study">Highest Qualification</Label>
                                    <select className={selectCls} value={form.highestQualification} onChange={set('highestQualification')}>
                                        <option value="" className="bg-[#0A192F]">Select qualification</option>
                                        {QUALIFICATIONS.map((q) => (
                                            <option key={q} value={q} className="bg-[#0A192F]">{q}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label helper="The year you completed your last qualification">Year of Passing</Label>
                                    <select className={selectCls} value={form.yearOfPassing} onChange={set('yearOfPassing')}>
                                        <option value="" className="bg-[#0A192F]">Select year</option>
                                        {YEARS.map((y) => (
                                            <option key={y} value={y} className="bg-[#0A192F]">{y}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>English Comfort Level</Label>
                                    {/* Helper text accordion */}
                                    <button type="button" className="mb-2 text-xs text-[#10B981] underline" onClick={() => setShowHelper(!showHelper)}>
                                        ❓ What is English Comfort Level?
                                    </button>
                                    {showHelper && (
                                        <div className="mb-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-3 text-xs text-white/70 leading-relaxed">
                                            It means — how comfortable are you with the English language?<br />
                                            <strong className="text-white">Basic</strong> – I find English difficult.<br />
                                            <strong className="text-white">Moderate</strong> – I understand simple English.<br />
                                            <strong className="text-white">Good</strong> – I can read, write, and speak English.
                                        </div>
                                    )}
                                    <select className={selectCls} value={form.englishComfortLevel} onChange={set('englishComfortLevel')}>
                                        <option value="" className="bg-[#0A192F]">Select your comfort level</option>
                                        {ENGLISH_LEVELS.map((l) => (
                                            <option key={l.value} value={l.value} className="bg-[#0A192F]">{l.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => { setStep(0); setError(''); }} className="flex-1 py-3.5 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-all text-sm">
                                        ← Back
                                    </button>
                                    <button onClick={handleAcademicNext} disabled={loading} className="flex-1 py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                        {loading ? 'Creating account…' : <>Continue <FaChevronRight /></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STEP 2: OTP Verification ───────────────────── */}
                        {step === 2 && (
                            <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="space-y-5">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">📬</div>
                                    <h2 className="text-lg font-bold text-white">Almost there!</h2>
                                    <p className="text-sm text-white/50 mt-1">
                                        We sent a 6-digit code to<br />
                                        <span className="text-[#10B981] font-semibold">{form.email}</span>
                                    </p>
                                </div>

                                {/* OTP input boxes */}
                                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { otpRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30 transition-all"
                                        />
                                    ))}
                                </div>

                                {/* Timer */}
                                <div className="text-center text-sm text-white/50">
                                    {otpTimer > 0 ? (
                                        <span>Code expires in <span className="text-white font-semibold">{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</span></span>
                                    ) : (
                                        <button onClick={handleResendOTP} disabled={loading} className="text-[#10B981] underline font-semibold hover:text-[#34d399] disabled:opacity-50">
                                            {loading ? 'Sending…' : 'Resend code'}
                                        </button>
                                    )}
                                </div>

                                <button onClick={handleVerifyOTP} disabled={loading || otp.join('').length !== 6} className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? 'Verifying…' : 'Verify & Continue'}
                                </button>

                                <p className="text-center text-xs text-white/30">Check your spam folder if you don&apos;t see the email.</p>
                            </motion.div>
                        )}

                        {/* ─── STEP 3: Success ────────────────────────────── */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, type: 'spring' }} className="text-center space-y-5 py-4">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                                    <FaCheckCircle className="text-[#10B981] text-6xl mx-auto" />
                                </motion.div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white">You&apos;re registered! 🎉</h2>
                                    <p className="text-white/60 mt-2 text-sm">
                                        Welcome, <span className="text-[#10B981] font-bold">{registeredName || form.fullName.split(' ')[0]}</span>!<br />
                                        Your account has been created and verified.
                                    </p>
                                </div>
                                <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 text-sm text-white/70 text-left space-y-1">
                                    <p>✅ Account created</p>
                                    <p>✅ Email verified</p>
                                    <p>📄 Resume Builder ready for you</p>
                                </div>
                                <button onClick={() => router.push('/login')} className="w-full py-3.5 bg-gradient-to-r from-[#10B981] to-[#047857] text-white rounded-xl font-bold hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all">
                                    Login to Your Dashboard →
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {step === 0 && (
                    <p className="text-center text-sm text-white/40 mt-4">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#10B981] hover:underline font-semibold">Login here</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
