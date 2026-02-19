'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GalleryImage {
    _id: string;
    title: string;
    category?: string;
    imageUrl: string;
    isStatic?: boolean;
}

const CATEGORIES = ['All', 'Activity', 'Awards', 'Celebrations', 'Classroom', 'Faculty', 'Testimonials', 'Labs', 'Pharmacy', 'Hospital', 'General'];

const Gallery: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        // Fetch all images from CMS API
        // Note: Ensuring the API endpoint exists or handled
        fetch('/api/public/gallery')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.images)) {
                    const formattedImages = data.images.map((img: any) => ({
                        _id: img._id || img.id,
                        title: img.title || 'Untitled',
                        category: img.category || 'General',
                        imageUrl: img.imageUrl || img.image_path || '',
                        isStatic: false
                    }));
                    setImages(formattedImages);
                }
            })
            .catch(err => {
                console.error("Gallery API Error:", err);
                // Fallback or empty state handled by initial state
            });
    }, []);

    const filteredImages = filter === 'All'
        ? images
        : images.filter(img => img.category === filter || (!img.category && filter === 'General'));

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <div className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
                <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Campus Gallery
                    </span>
                </h1>

                {/* Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === cat
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredImages.length > 0 ? (
                        filteredImages.map((img) => (
                            <motion.div
                                key={img._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="h-72 overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {img.imageUrl && (img.imageUrl.toLowerCase().endsWith('.mp4') || img.imageUrl.toLowerCase().endsWith('.webm')) ? (
                                        <video
                                            controls
                                            className="w-full h-full object-cover"
                                            preload="metadata"
                                        >
                                            <source src={img.imageUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <img
                                            src={img.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                                            alt={img.title}
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 text-lg truncate">{img.title}</h3>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            {img.category || 'General'}
                                        </span>
                                        {img.isStatic && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Archive</span>}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p>No images found in this category.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Gallery;
