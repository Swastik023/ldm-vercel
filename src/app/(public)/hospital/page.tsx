'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Icons } from '@/components/public/Icons';
import Team from '../team/page'; // Reusing Team page as component might be cleaner if exported as component, but let's check Team.tsx
import LogoMarquee from '@/components/public/LogoMarquee';
import ImageSlideshow from '@/components/public/ImageSlideshow';

// We need to make sure Team exports the component properly. 
// In Next.js page.tsx usually exports default. I might need to refactor Team to be a reusable component if I want to embed it.
// For now, I'll assume I can import it or I should duplicate the Team section code here if it was meant to be the exact same content.
// Looking at legacy Hospital.tsx, it imports Team from './Team'. 
// I'll extract Team to a component later if needed, but for now I'll use a simplified version or just import the default export from Team page if it works as a component (it should, as it's a React component).

import TeamPage from '../team/page';

interface Feature {
    title: string;
    description: string;
    icon: keyof typeof Icons;
    delay: number;
}

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
        <span ref={ref} className="text-4xl font-bold">
            {count}{value.includes('+') ? '+' : value.includes('%') ? '%' : ''}
        </span>
    );
};

const features: Feature[] = [
    {
        title: "Cashless TPA",
        description: "Modern medical equipment and advanced healthcare technology for optimal patient care",
        icon: "Building2",
        delay: 0.1
    },
    {
        title: "Expert Medical Team",
        description: "Highly qualified doctors and medical professionals with extensive experience",
        icon: "Users",
        delay: 0.2
    },
    {
        title: "Research Excellence",
        description: "Cutting-edge medical research and continuous innovation in healthcare",
        icon: "BookOpen",
        delay: 0.3
    },
    {
        title: "24/7 Emergency Care",
        description: "Round-the-clock emergency services with rapid response teams",
        icon: "Phone",
        delay: 0.4
    },
    {
        title: "Patient-Centric Approach",
        description: "Personalized care plans and compassionate healthcare services",
        icon: "Target",
        delay: 0.5
    },
    {
        title: "Academic Excellence",
        description: "Comprehensive medical education and training programs",
        icon: "Library",
        delay: 0.6
    }
];

const HospitalPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-violet-800 to-blue-800 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center text-white">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl md:text-5xl font-bold mb-4"
                        >
                            Dr Dharm Dev Memorial Hospital
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-xl mb-8"
                        >
                            Providing Quality Healthcare with Compassion
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mb-12"
                        >
                            <ImageSlideshow
                                images={[
                                    '/hospital/hospital.jpeg',
                                    '/hospital/ICU.jpeg',
                                    '/hospital/opd.jpeg',
                                    '/hospital/ward.jpeg',
                                    '/hospital/private_room.jpeg'
                                ]}
                                interval={5000}
                            />
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { number: "50+", label: "Years of Excellence" },
                                // { number: "100+", label: "Medical Experts" },
                                { number: "2500+", label: "Patients Treated" },
                                { number: "96%", label: "Patient Satisfaction" }
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <Counter value={stat.number} />
                                    <p className="text-lg mt-2 opacity-90">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Legacy Section */}
            <section className="py-20 bg-white relative z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Legacy of Excellence</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Since our establishment, we have been committed to providing exceptional healthcare and medical education
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((item, index) => {
                            // Dynamically access icon from Icons object
                            // Note: Icons is an object with components as values
                            const IconComponent = (Icons as any)[item.icon];

                            if (!IconComponent) return null;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: item.delay }}
                                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="text-blue-600 mb-4">
                                        <IconComponent className="w-12 h-12" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{item.title}</h3>
                                    <p className="text-gray-600 text-center">{item.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>


            {/* Reusing Team Section */}
            <TeamPage />

            {/* Testimonials Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Patients Say</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Real stories from our valued patients
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Dr. Rajesh Kumar",
                                role: "Senior Surgeon",
                                quote: "The medical facilities and equipment here are world-class. It's a privilege to serve patients in such an advanced environment."
                            },
                            {
                                name: "Mrs. Priya Sharma",
                                role: "Patient",
                                quote: "The care and attention I received was exceptional. The staff was professional, caring, and made me feel comfortable throughout my treatment."
                            },
                            {
                                name: "Dr. Anjali Gupta",
                                role: "Medical Director",
                                quote: "Our commitment to excellence in healthcare and medical education sets us apart. We're proud of our legacy and continuous growth."
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white p-8 rounded-2xl shadow-lg"
                            >
                                <div className="text-blue-600 mb-4">
                                    <Icons.MessageCircle className="w-8 h-8" />
                                </div>
                                <p className="text-gray-600 mb-6 italic">{testimonial.quote}</p>
                                <div>
                                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                                    <p className="text-gray-500">{testimonial.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Companies */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mt-16"
            >
                <LogoMarquee />
            </motion.div>


            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-violet-800 to-blue-800">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto text-white"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience World-Class Healthcare?</h2>
                        <p className="text-xl mb-8 opacity-90">Book an appointment today and take the first step towards better health</p>
                        <div className="flex  flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://wa.me/+919896607010?text=Hi,%20I%20would%20like%20to%20schedule%20an%20appointment."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-green-600 rounded-full overflow-hidden transition-all duration-300 hover:bg-green-700 hover:scale-105 transform shadow-lg hover:shadow-xl"
                            >
                                <span className="flex   items-center">
                                    Book Appointment
                                    <Icons.Phone className="ml-2 h-5 w-5" />
                                </span>
                            </a>
                            <button
                                onClick={() => window.location.href = 'tel:+919896607010'}
                                className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-500 rounded-full overflow-hidden transition-all duration-300 hover:bg-blue-600 hover:scale-105 transform shadow-lg hover:shadow-xl"
                            >
                                <span className="flex items-center">
                                    Call Now
                                    <Icons.Phone className="ml-2 h-5 w-5" />
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>



            {/* Floating Appointment Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-11 right-8 z-50"
            >
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <a
                        href="https://wa.me/+919896607010?text=Hi ,%20I%20would%20like%20to%20schedule%20an%20appointment."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-800 to-blue-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10"
                    >
                        <Icons.Phone className="w-6 h-6" />
                        <span className="font-medium text-lg">Book Appointment</span>
                    </a>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default HospitalPage;
