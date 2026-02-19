'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import HeroSlider from '@/components/public/HeroSlider';
import { useRouter } from 'next/navigation';
import { FaPhoneAlt, FaChevronRight } from 'react-icons/fa';
// import { usePopup } from '@/context/PopupContext'; // To handle later
import WhyChooseUs from '@/components/public/WhyChooseUs';

const Counter = ({ value }: { value: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (isInView && !hasAnimated.current) {
            hasAnimated.current = true;
            const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
            let startTimestamp: number;
            const duration = 2000; // 2 seconds

            const step = (timestamp: number) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);

                setCount(Math.floor(progress * numericValue));

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };

            window.requestAnimationFrame(step);
        }
    }, [isInView, value]);

    return (
        <span ref={ref}>
            {count}{value.includes('+') ? '+' : value.includes('%') ? '%' : ''}
        </span>
    );
};

export default function HomePage() {
    const router = useRouter();
    // const { openPopup } = usePopup(); // To handle later
    const statsRef = useRef(null);

    const stats = [
        { number: '100+', label: 'Students Enrolled' },
        // { number: 'abc', label: 'Expert Faculty' },
        { number: '98%', label: 'Placement Rate' },
        { number: '23+', label: 'Years Experience' },
    ];

    const openPopup = () => {
        // Placeholder for popup functionality
        window.open('tel:+919896607010');
    };

    return (
        <>
            <div className="flex-1">
                <HeroSlider />

                {/* Stats Section */}
                <section
                    className="py-20 bg-gradient-to-r from-blue-50 via-white to-purple-50"
                    aria-label="Statistics"
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-4xl font-bold sm:text-5xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 tracking-tight">
                                Our Impact in Numbers
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
                                Join a legacy of excellence in paramedical education
                            </p>
                        </motion.div>

                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12"
                            ref={statsRef}
                            role="list"
                            aria-label="Achievement statistics"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true, amount: 0.8 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="relative group"
                                >
                                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-all duration-500 group-hover:blur-xl"></div>
                                    <div className="relative bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group-hover:scale-[1.02] flex flex-col items-center"
                                        role="listitem"
                                    >
                                        <h3 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:via-blue-600 group-hover:to-purple-600 transition-all duration-500">
                                            <Counter value={stat.number} />
                                        </h3>
                                        <p className="text-lg sm:text-xl text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-300">{stat.label}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Welcome Section */}
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="grid md:grid-cols-2 gap-12 items-center"
                        >
                            <div>
                                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                    Welcome to LDM Paramedical
                                </h2>
                                <p className="text-lg text-gray-600 mb-8">
                                    We are committed to providing quality education in the field of paramedical sciences and skill development courses.
                                    Our state-of-the-art facilities and experienced faculty ensure that students receive
                                    the best possible training for their future careers.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        router.push('/courses');
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
                                >
                                    Explore Courses
                                </motion.button>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="relative"
                            >
                                <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl">
                                    {/* Ensure image path exists or replace with updated one */}
                                    <img
                                        src="/home/Home-about.jpeg"
                                        alt="LDM Campus"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-100 rounded-full -z-10" />
                                <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-100 rounded-full -z-10" />
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                <WhyChooseUs />

                {/* Call to Action */}
                <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
                    >
                        <h2 className="text-3xl font-bold text-white mb-8">
                            Ready to Start Your Journey?
                        </h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                router.push('/contact');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
                        >
                            Apply Now
                        </motion.button>
                    </motion.div>
                </section>
            </div>

            {/* Floating Contact Icon */}
            <motion.button
                onClick={openPopup}
                className="fixed bottom-12 right-8 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg z-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <FaPhoneAlt className="text-2xl" />
                <span className="sr-only">Contact Us</span>
            </motion.button>
        </>
    );
}
