import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0A192F] relative overflow-hidden flex items-center justify-center p-6">
            {/* Grid background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                {/* Glow blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#19e66b]/5 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl" />
                {/* Floating shapes */}
                <div className="absolute top-16 right-24 w-12 h-12 rounded-xl border border-[#19e66b]/10 rotate-12 opacity-60" />
                <div className="absolute bottom-24 left-16 w-8 h-8 rounded-lg border border-indigo-400/10 -rotate-6 opacity-40" />
                <div className="absolute top-1/3 right-12 w-5 h-5 rounded-full bg-[#19e66b]/10" />
            </div>

            <div className="relative z-10 text-center max-w-lg w-full">
                {/* College logo */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19e66b] to-[#047857] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#19e66b]/20">L</div>
                    <p className="text-white/60 font-semibold text-sm">LDM College of Pharmacy</p>
                </div>

                {/* 404 number */}
                <div className="relative mb-6">
                    <h1 className="text-[160px] font-black leading-none select-none"
                        style={{ background: 'linear-gradient(135deg, #19e66b 0%, #047857 40%, #065f46 70%, transparent 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        404
                    </h1>
                    {/* Ghost/shadow text */}
                    <h1 className="absolute inset-0 text-[160px] font-black leading-none select-none text-white/[0.03] blur-sm">
                        404
                    </h1>
                </div>

                <h2 className="text-2xl font-extrabold text-white mb-3">Page Not Found</h2>
                <p className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm mx-auto">
                    The page you&apos;re looking for doesn&apos;t exist or may have been moved. Double-check the URL or head back home.
                </p>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link href="/"
                        className="px-6 py-3 bg-gradient-to-r from-[#19e66b] to-[#047857] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#19e66b]/20 hover:shadow-[#19e66b]/30 hover:scale-[1.03] transition-all">
                        ← Go Home
                    </Link>
                    <button onClick={() => window.history.back()}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white/70 font-semibold text-sm rounded-xl hover:bg-white/8 hover:text-white hover:border-white/20 transition-all">
                        Go Back
                    </button>
                </div>

                {/* Subtle hint */}
                <p className="mt-12 text-white/15 text-xs">
                    © {new Date().getFullYear()} LDM College of Pharmacy
                </p>
            </div>
        </div>
    );
}
