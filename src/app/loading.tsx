export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-[#19e66b]/10 animate-ping" />
                    <div className="absolute inset-2 rounded-full border-2 border-t-[#19e66b] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#19e66b] to-[#047857] flex items-center justify-center font-black text-white text-sm">L</div>
                    </div>
                </div>
                <p className="text-white/30 text-xs font-medium">Loading…</p>
            </div>
        </div>
    );
}
