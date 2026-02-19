'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageSlideshowProps {
    images: string[];
    interval?: number;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ images, interval = 3000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    // Preload images
    useEffect(() => {
        const preloadImages = async () => {
            try {
                const promises = images.map((src) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.src = src;
                        img.onload = () => {
                            setLoadedImages(prev => new Set([...prev, src]));
                            resolve(src);
                        };
                        img.onerror = () => reject(`Failed to load image: ${src}`);
                    });
                });

                await Promise.all(promises);
            } catch (err) {
                console.error('Error loading images:', err);
                setError('Some images failed to load. Please refresh the page.');
            }
        };

        preloadImages();
    }, [images]);

    useEffect(() => {
        if (images.length === 0) return;

        const timer = setInterval(() => {
            setDirection(Math.random() > 0.5 ? 1 : -1);
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval]);

    const slideVariants = {
        enter: (direction: number) => ({
            scale: 1.2,
            x: direction * 1000,
            opacity: 0,
            zIndex: 0,
        }),
        center: {
            scale: 1,
            x: 0,
            opacity: 1,
            zIndex: 1,
            transition: {
                scale: { duration: 3 },
                x: { duration: 0.5 },
                opacity: { duration: 0.5 }
            }
        },
        exit: (direction: number) => ({
            scale: 1.2,
            x: direction * -1000,
            opacity: 0,
            zIndex: 0,
            transition: {
                scale: { duration: 3 },
                x: { duration: 0.5 },
                opacity: { duration: 0.5 }
            }
        })
    };

    if (error) {
        return (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                {error}
            </div>
        );
    }

    if (images.length === 0 || loadedImages.size === 0) {
        return (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading images...</div>
            </div>
        );
    }

    const handleNext = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="relative w-full h-[500px] overflow-hidden rounded-xl bg-gray-900">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                >
                    {/* Background blur layer */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${images[currentIndex]})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(10px) brightness(0.6)',
                            transform: 'scale(1.1)',
                        }}
                    />

                    {/* Main image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src={images[currentIndex]}
                            className="w-full h-full object-contain"
                            alt={`Slide ${currentIndex + 1}`}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-300"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-300"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageSlideshow;
