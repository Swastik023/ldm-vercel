'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, XCircle, Mail, LogOut, CheckCircle2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function PendingApprovalPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const userStatus = session?.user?.status;

    // If somehow user is active, push to dashboard
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

    return (
        <div className="min-h-screen bg-[#0A192F] flex flex-col items-center justify-center p-6">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 ${isRejected ? 'bg-red-500' : 'bg-[#10B981]'}`} />
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

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-5 backdrop-blur-sm">
                    {isRejected ? (
                        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                            <XCircle className="w-10 h-10 text-red-400" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center mx-auto">
                            <Clock className="w-10 h-10 text-[#10B981] animate-pulse" />
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl font-extrabold text-white mb-2">
                            {isRejected ? 'Registration Rejected' : 'Awaiting Approval ⏳'}
                        </h1>
                        <p className="text-white/60 text-sm leading-relaxed">
                            {isRejected
                                ? 'Your registration has been rejected by the admin. Please contact the college office for assistance.'
                                : 'Your account is under review. The college administrator will verify your details and approve your access shortly.'}
                        </p>
                    </div>

                    {/* User info chip */}
                    {session?.user?.email && (
                        <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70">
                            <Mail className="w-4 h-4 text-[#10B981]" />
                            {session.user.email}
                        </div>
                    )}

                    {!isRejected && (
                        <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-4 text-left space-y-2">
                            {[
                                'Admin reviews your registration details',
                                'You receive access to your student dashboard',
                                'Complete profile setup with documents',
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                                    <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold text-xs shrink-0">{i + 1}</div>
                                    {step}
                                </div>
                            ))}
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
