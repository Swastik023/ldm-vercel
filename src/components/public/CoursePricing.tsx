'use client';

import React, { useEffect, useState } from 'react';
import { FaTag, FaFire, FaClock } from 'react-icons/fa';

interface PricingData {
    courseId: string;
    originalPrice: number;
    offerPrice: number;
    effectivePrice: number;
    offerActive: boolean;
    offerValidUntil: string | null;
    offerLabel: string;
    discountPercent: number;
    seatLimit: number | null;
}

function fmt(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

// ─── Countdown Hook ─────────────────────────────────────────────────────────
function useCountdown(target: string | null) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!target) return;
        const update = () => {
            const diff = new Date(target).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [target]);

    return timeLeft;
}

// ─── Compact Pricing Badge — for course cards on listing page ──────────────
export function CoursePricingBadge({ courseId, className = '' }: { courseId: string; className?: string }) {
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const countdown = useCountdown(pricing?.offerActive ? pricing.offerValidUntil : null);

    useEffect(() => {
        fetch('/api/public/course-pricing')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    const p = d.data.find((x: PricingData) => x.courseId === courseId);
                    if (p) setPricing(p);
                }
            });
    }, [courseId]);

    if (!pricing) return null;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2 flex-wrap">
                {pricing.offerActive ? (
                    <>
                        <span className="text-lg font-bold text-green-600">{fmt(pricing.offerPrice)}</span>
                        <span className="text-sm text-gray-400 line-through">{fmt(pricing.originalPrice)}</span>
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                            {pricing.discountPercent}% OFF
                        </span>
                    </>
                ) : (
                    <span className="text-lg font-bold text-gray-800">{fmt(pricing.originalPrice)}</span>
                )}
            </div>
            {pricing.offerActive && countdown && countdown !== 'Expired' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                    <FaClock className="w-3 h-3" /> Offer ends in: <span className="font-bold">{countdown}</span>
                </div>
            )}
        </div>
    );
}

// ─── Full Pricing Block — for course detail hero sidebar ──────────────────
interface FullPricingBlockProps {
    courseId: string;
}

export function CoursePricingBlock({ courseId }: FullPricingBlockProps) {
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState(true);
    const countdown = useCountdown(pricing?.offerActive && pricing.offerValidUntil ? pricing.offerValidUntil : null);

    useEffect(() => {
        fetch('/api/public/course-pricing')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    const p = d.data.find((x: PricingData) => x.courseId === courseId);
                    if (p) setPricing(p);
                }
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    if (loading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;
    if (!pricing) return null;

    const { offerActive, originalPrice, offerPrice, discountPercent, offerLabel, offerValidUntil, seatLimit } = pricing;

    return (
        <div className="rounded-2xl overflow-hidden border shadow-sm">
            {/* Offer header bar */}
            {offerActive && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                        <FaFire className="w-4 h-4 animate-pulse" /> {offerLabel}
                    </div>
                    <span className="bg-white text-red-600 text-xs font-black px-3 py-1 rounded-full">
                        {discountPercent}% OFF
                    </span>
                </div>
            )}

            <div className="bg-white p-5">
                {offerActive ? (
                    <>
                        {/* Price display */}
                        <div className="flex items-end gap-3 mb-1">
                            <span className="text-3xl font-black text-gray-900">{fmt(offerPrice)}</span>
                            <span className="text-lg text-gray-400 line-through pb-0.5">{fmt(originalPrice)}</span>
                        </div>
                        <p className="text-xs text-green-600 font-semibold mb-3">
                            You save {fmt(originalPrice - offerPrice)} ({discountPercent}% discount)
                        </p>

                        {/* Countdown */}
                        {offerValidUntil && countdown && countdown !== 'Expired' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-3">
                                <FaClock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                                <div>
                                    <p className="text-xs text-amber-600 font-medium">Offer ends in</p>
                                    <p className="text-base font-black text-amber-700 tabular-nums">{countdown}</p>
                                </div>
                            </div>
                        )}
                        {countdown === 'Expired' && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mb-3 text-center text-xs text-gray-500">
                                Offer has expired. Contact us for current pricing.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="mb-3">
                        <span className="text-3xl font-black text-gray-900">{fmt(originalPrice)}</span>
                        <p className="text-xs text-gray-400 mt-0.5">Course fee</p>
                    </div>
                )}

                {/* Seat limit warning */}
                {seatLimit && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                        <FaTag className="w-3 h-3 text-red-500 shrink-0" />
                        <p className="text-xs text-red-600 font-semibold">Only {seatLimit} seats left at this price!</p>
                    </div>
                )}

                <p className="text-xs text-gray-400 text-center">* Fees subject to change. Contact us for details.</p>
            </div>
        </div>
    );
}
