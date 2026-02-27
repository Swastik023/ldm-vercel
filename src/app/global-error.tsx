'use client';

import { useEffect } from 'react';

const s = {
    page: { minHeight: '100vh', background: '#0A192F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative' as const, overflow: 'hidden' },
    glow1: { position: 'absolute' as const, top: '25%', right: '25%', width: '384px', height: '384px', borderRadius: '50%', background: 'rgba(239,68,68,0.05)', filter: 'blur(64px)', pointerEvents: 'none' as const },
    glow2: { position: 'absolute' as const, bottom: '25%', left: '25%', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(249,115,22,0.05)', filter: 'blur(64px)', pointerEvents: 'none' as const },
    content: { position: 'relative' as const, zIndex: 10, textAlign: 'center' as const, maxWidth: '480px', width: '100%' },
    logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '48px' },
    logoIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #19e66b, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '16px' },
    logoText: { color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '14px' },
    num: { fontSize: '148px', fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #f97316 0%, #ef4444 40%, #991b1b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', userSelect: 'none' as const },
    h2: { fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '12px' },
    p: { color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px', maxWidth: '360px', margin: '0 auto 32px' },
    digest: { fontSize: '11px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px', marginBottom: '24px', display: 'inline-block' },
    btns: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' as const },
    btnPrimary: { padding: '12px 24px', background: 'linear-gradient(to right, #ef4444, #f97316)', color: 'white', fontWeight: 700, fontSize: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'transform 0.15s' },
    btnSecondary: { padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '14px', borderRadius: '10px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'background 0.15s' },
    footer: { marginTop: '48px', color: 'rgba(255,255,255,0.15)', fontSize: '12px' },
};

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error('[GlobalError]', error); }, [error]);

    return (
        <html lang="en">
            <head><title>500 – Something Went Wrong | LDM College</title></head>
            <body style={{ margin: 0, padding: 0 }}>
                <div style={s.page}>
                    <div style={s.glow1} /><div style={s.glow2} />
                    <div style={s.content}>
                        <div style={s.logo}>
                            <div style={s.logoIcon}>L</div>
                            <span style={s.logoText}>LDM College of Pharmacy</span>
                        </div>
                        <div style={s.num}>500</div>
                        <h1 style={s.h2}>Something Went Wrong</h1>
                        <p style={s.p}>Our server encountered an unexpected error. This has been logged and we&apos;re looking into it. Please try again in a moment.</p>
                        {error?.digest && <div style={s.digest}>Error ID: {error.digest}</div>}
                        <div style={s.btns}>
                            <button style={s.btnPrimary} onClick={reset}>Try Again</button>
                            <a href="/" style={s.btnSecondary}>Go Home</a>
                        </div>
                        <p style={s.footer}>© {new Date().getFullYear()} LDM College of Pharmacy</p>
                    </div>
                </div>
            </body>
        </html>
    );
}
