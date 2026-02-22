'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, Suspense } from 'react';
import { GA_ID, pageview } from '@/lib/gtag';

/**
 * RouteChangeTracker — tracks page views on every client-side navigation.
 * Must be inside <Suspense> because useSearchParams() requires it in Next.js 14+.
 */
function RouteChangeTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!pathname) return;
        const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
        pageview(url);
    }, [pathname, searchParams]);

    return null;
}

/**
 * GoogleAnalytics — renders GA4 scripts and the route tracker.
 * Renders nothing if GA_ID is not set (safe for local dev).
 */
export default function GoogleAnalytics() {
    if (!GA_ID || GA_ID === 'G-XXXXXXXXXX') return null;

    return (
        <>
            {/* Load gtag.js — deferred, non-blocking */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
            />
            {/* Initialize GA4 */}
            <Script id="ga4-init" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_ID}', {
                        page_path: window.location.pathname,
                        anonymize_ip: true,
                        send_page_view: false
                    });
                `}
            </Script>
            {/* Track every client-side route change */}
            <Suspense fallback={null}>
                <RouteChangeTracker />
            </Suspense>
        </>
    );
}
