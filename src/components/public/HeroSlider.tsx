'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import * as gtag from '@/lib/gtag';


// ── Static fallback slides (used when DB has no slides) ──────────────────────
const STATIC_SLIDES = [
    { image: '/home/home_4.jpeg', title: 'Empowering the Next Generation of Healthcare Leaders', subtitle: 'Start your journey at LDM Paramedical College', color: 'from-[#10B981] to-[#047857]' },
    { image: '/home/home_3.jpeg', title: 'State-of-the-Art Campus Space', subtitle: 'Modern Facilities built for Hands-on Learning', color: 'from-[#0A192F] to-[#1e3a5f]' },
    { image: '/home/img4.jpeg', title: 'Learn from Expert Faculty', subtitle: 'Mentorship from Experienced Healthcare Professionals', color: 'from-[#10B981] to-[#047857]' },
    { image: '/home/img2.jpeg', title: '100% Practical Training', subtitle: 'Real-world Clinical Experience', color: 'from-[#0A192F] to-[#1e3a5f]' },
    { image: '/home/yoga.jpeg', title: 'Holistic Development', subtitle: 'Integrating Yoga and Allied Sciences', color: 'from-[#10B981] to-[#047857]' },
];

interface SlideData { image: string; title: string; subtitle: string; color: string; }

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
    }),
};

const HeroSlider = () => {
    const router = useRouter();
    const [slides, setSlides] = useState<SlideData[]>(STATIC_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [direction, setDirection] = useState(1);
    const [autoplayEnabled, setAutoplayEnabled] = useState(true);
    const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch slides from DB, fall back to static if empty or error
    useEffect(() => {
        fetch('/api/public/slider')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.slides.length > 0) {
                    setSlides(data.slides.map((s: { url: string; title: string; subtitle?: string }) => ({
                        image: s.url,
                        title: s.title,
                        subtitle: s.subtitle || '',
                        color: 'from-[#10B981] to-[#047857]',
                    })));
                }
            })
            .catch(() => { /* keep static fallback silently */ });
    }, []);

    const startAutoplay = useCallback(() => {
        if (autoplayTimeoutRef.current) {
            clearTimeout(autoplayTimeoutRef.current);
        }

        if (autoplayEnabled) {
            autoplayTimeoutRef.current = setTimeout(() => {
                setDirection(1);
                setCurrentSlide((prev) => (prev + 1) % slides.length);
                startAutoplay(); // Recursively call to ensure continuous play
            }, 5000);
        }
    }, [autoplayEnabled]);

    useEffect(() => {
        // Preload images
        slides.forEach(slide => {
            const img = new Image();
            img.src = slide.image;
            img.onload = () => {
                setLoadedImages(prev => new Set([...prev, slide.image]));
            };
        });

        // Start autoplay immediately
        setAutoplayEnabled(true);
        startAutoplay();

        return () => {
            if (autoplayTimeoutRef.current) {
                clearTimeout(autoplayTimeoutRef.current);
            }
        };
    }, [startAutoplay]);

    // Handle visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setAutoplayEnabled(false);
                if (autoplayTimeoutRef.current) {
                    clearTimeout(autoplayTimeoutRef.current);
                }
            } else {
                setAutoplayEnabled(true);
                startAutoplay();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [startAutoplay]);

    // Handle window focus
    useEffect(() => {
        const handleFocus = () => {
            setAutoplayEnabled(true);
            startAutoplay();
        };

        const handleBlur = () => {
            setAutoplayEnabled(false);
            if (autoplayTimeoutRef.current) {
                clearTimeout(autoplayTimeoutRef.current);
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [startAutoplay]);

    return (
        <div
            className="relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] overflow-hidden bg-[#0A192F]"
            onMouseEnter={() => setAutoplayEnabled(false)}
            onMouseLeave={() => {
                setAutoplayEnabled(true);
                startAutoplay();
            }}
            onTouchStart={() => setAutoplayEnabled(false)}
            onTouchEnd={() => {
                setAutoplayEnabled(true);
                startAutoplay();
            }}
        >
            {/* Slides */}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={currentSlide}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 200, damping: 30 },
                        opacity: { duration: 0.8, ease: "easeInOut" },
                    }}
                    className="absolute inset-0"
                >
                    {/* Background Image with Ken Burns effect */}
                    <motion.div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        initial={{ scale: 1.1 }}
                        animate={{
                            scale: [1.1, 1.2],
                            transition: {
                                duration: 5,
                                ease: "easeOut",
                                times: [0, 1]
                            }
                        }}
                        style={{
                            backgroundImage: loadedImages.has(slides[currentSlide].image)
                                ? `url(${slides[currentSlide].image})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '100%',
                            width: '100%'
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#0A192F]/90 via-[#0A192F]/40 to-transparent"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    </motion.div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-start justify-center px-6 sm:px-12 lg:px-24 py-8">
                        <motion.div
                            className="text-left max-w-4xl"
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{
                                duration: 0.5,
                                ease: "easeOut",
                                delay: 0.2
                            }}
                        >
                            <motion.h1
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 text-white leading-tight"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeOut",
                                    delay: 0.3
                                }}
                            >
                                {slides[currentSlide].title}
                            </motion.h1>
                            <motion.p
                                className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-[#9ca3af] font-light max-w-2xl"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeOut",
                                    delay: 0.4
                                }}
                            >
                                {slides[currentSlide].subtitle}
                            </motion.p>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <motion.button
                                type="button"
                                onClick={() => { gtag.event.applyClick('hero_slider'); router.push('/collect-info'); }}
                                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-4 text-lg font-bold text-white rounded-full bg-gradient-to-r from-[#10B981] to-[#047857] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-105"
                            >
                                <motion.span
                                    className="relative flex items-center"
                                    whileHover={{ x: 5 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    Apply Now
                                    <FaChevronRight className="ml-2 h-4 w-4" />
                                </motion.span>
                            </motion.button>

                            <motion.button
                                type="button"
                                onClick={() => router.push('/courses')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-4 text-lg font-bold text-white border-2 border-[#10B981] rounded-full transition-all duration-300 hover:bg-[#10B981]/10 hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:scale-105 group"
                            >
                                <motion.span className="relative flex items-center">
                                    Explore Courses
                                </motion.span>
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentSlide ? 1 : -1);
                            setCurrentSlide(index);
                        }}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                            ? 'bg-white w-8'
                            : 'bg-white/50 hover:bg-white/75'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
