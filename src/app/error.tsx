'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[RouteError]', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0A192F] relative overflow-hidden flex items-center justify-center p-6">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl" />
            </div>

            <div className="relative z-10 text-center max-w-md w-full">
                <div className="flex items-center justify-center gap-3 mb-10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19e66b] to-[#047857] flex items-center justify-center font-black text-white text-base">L</div>
                    <p className="text-white/60 font-semibold text-sm">LDM College of Pharmacy</p>
                </div>

                <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>

                <h1 className="text-2xl font-extrabold text-white mb-3">Oops! An Error Occurred</h1>
                <p className="text-white/40 text-sm leading-relaxed mb-8">
                    Something went wrong while loading this page. This is likely a temporary issue.
                </p>

                {error?.digest && (
                    <p className="mb-6 text-xs text-white/20 font-mono bg-white/5 border border-white/8 rounded-lg px-3 py-2">
                        Ref: {error.digest}
                    </p>
                )}

                <div className="flex items-center justify-center gap-3">
                    <button onClick={reset}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm rounded-xl hover:scale-[1.03] transition-all">
                        Try Again
                    </button>
                    <Link href="/"
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white/70 font-semibold text-sm rounded-xl hover:bg-white/8 hover:text-white transition-all">
                        Go Home
                    </Link>
                </div>

                <p className="mt-10 text-white/15 text-xs">© {new Date().getFullYear()} LDM College of Pharmacy</p>
            </div>
        </div>
    );
}
