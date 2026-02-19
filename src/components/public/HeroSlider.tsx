'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
    {
        image: '/home/home_4.jpeg',
        title: 'Welcome to LDM Paramedical',
        subtitle: 'Empowering Healthcare Professionals of Tomorrow',
        color: 'from-blue-600 to-purple-600'
    },
    {
        image: '/home/home_3.jpeg',
        title: 'State-of-the-Art Campus',
        subtitle: 'Modern Facilities for Hands-on Learning',
        color: 'from-purple-600 to-pink-600'
    },
    {
        image: '/home/img4.jpeg',
        title: 'Expert Faculty',
        subtitle: 'Learn from Experienced Healthcare Professionals',
        color: 'from-pink-600 to-red-600'
    },
    {
        image: '/home/img2.jpeg',
        title: 'Practical Training',
        subtitle: 'Real-world Healthcare Experience',
        color: 'from-red-600 to-orange-600'
    },
    {
        image: '/home/yoga.jpeg',
        title: 'Holistic Development',
        subtitle: 'Integrating Yoga and Wellness Practices',
        color: 'from-orange-600 to-yellow-600'
    }
];

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
    const router = useRouter(); // Changed from useNavigate
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [direction, setDirection] = useState(1); // 1 for right, -1 for left
    const [autoplayEnabled, setAutoplayEnabled] = useState(true);
    const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            className="relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4rem)] overflow-hidden"
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
                            className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/70"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    </motion.div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
                        <motion.div
                            className="text-center max-w-7xl mx-auto w-full"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                                duration: 0.5,
                                ease: "easeOut",
                                delay: 0.2
                            }}
                        >
                            <motion.h1
                                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-3 sm:mb-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]"
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
                                className="text-lg sm:text-xl md:text-2xl text-center mb-6 sm:mb-8 max-w-3xl mx-auto text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] [text-shadow:_1px_1px_2px_rgb(0_0_0_/_40%)]"
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
                            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0 mt-2"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <motion.button
                                type="button"
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    setTimeout(() => router.push('/courses'), 100);
                                }}
                                className={`group w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-4 text-lg sm:text-xl font-medium text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-xl bg-gradient-to-r ${slides[currentSlide].color}`}
                            >
                                <motion.span
                                    className="relative z-10 flex items-center"
                                    whileHover={{ x: 10 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    Explore Courses
                                    <FaChevronRight className="ml-2 h-5 w-5" />
                                </motion.span>
                            </motion.button>

                            <motion.button
                                type="button"
                                onClick={() => {
                                    window.open(
                                        'https://wa.me/+919896607010?text=Hi,%20I%20would%20like%20to%20schedule%20an%20appointment%20for%20admission%20counseling.',
                                        '_blank',
                                        'noopener,noreferrer'
                                    );
                                }}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-4 text-lg sm:text-xl font-medium text-white bg-green-600 rounded-full overflow-hidden transition-all duration-300 hover:bg-green-700 hover:scale-105 transform shadow-lg hover:shadow-xl group"
                            >
                                <motion.span
                                    className="relative z-10 flex items-center"
                                    whileHover={{ x: 10 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                    Contact Us
                                    <FaChevronRight className="ml-2 h-5 w-5" />
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
