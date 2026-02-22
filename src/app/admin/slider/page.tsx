'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface Slide { _id: string; url: string; title: string; subtitle?: string; order: number; isActive: boolean; }

export default function AdminSliderPage() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const fetchSlides = useCallback(async () => {
        const res = await fetch('/api/admin/slider');
        const data = await res.json();
        if (data.success) setSlides(data.slides);
        setLoading(false);
    }, []);

    useEffect(() => { fetchSlides(); }, [fetchSlides]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleUpload = async () => {
        if (!file || !title.trim()) { setMsg('Image and title are required.'); return; }
        setUploading(true); setMsg('');
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', title);
        fd.append('subtitle', subtitle);
        const res = await fetch('/api/admin/slider', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
            setTitle(''); setSubtitle(''); setPreview(null); setFile(null);
            if (fileRef.current) fileRef.current.value = '';
            fetchSlides();
        } else {
            setMsg(data.message || 'Upload failed.');
        }
        setUploading(false);
    };

    const toggleActive = async (id: string, current: boolean) => {
        await fetch(`/api/admin/slider/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
        fetchSlides();
    };

    const moveOrder = async (id: string, direction: 'up' | 'down') => {
        const idx = slides.findIndex(s => s._id === id);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= slides.length) return;
        const a = slides[idx], b = slides[swapIdx];
        await Promise.all([
            fetch(`/api/admin/slider/${a._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: b.order }) }),
            fetch(`/api/admin/slider/${b._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: a.order }) }),
        ]);
        fetchSlides();
    };

    const deleteSlide = async (id: string) => {
        if (!confirm('Delete this slide? This cannot be undone.')) return;
        await fetch(`/api/admin/slider/${id}`, { method: 'DELETE' });
        fetchSlides();
    };

    const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Homepage Slider</h1>
                <p className="text-gray-500 text-sm mt-1">Upload and manage the images displayed in the homepage hero slider.</p>
            </div>

            {/* Upload Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="font-bold text-gray-800">Add New Slide</h2>
                <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl h-44 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all relative overflow-hidden"
                >
                    {preview ? (
                        <Image src={preview} alt="Preview" fill className="object-cover rounded-xl" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <p className="text-3xl mb-2">🖼</p>
                            <p className="text-sm font-medium">Click to choose an image</p>
                            <p className="text-xs">JPG, PNG, WebP — recommended 1920×1080</p>
                        </div>
                    )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                        <input className={inputCls} placeholder="e.g. Empowering Healthcare Leaders" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle (optional)</label>
                        <input className={inputCls} placeholder="e.g. Start your journey at LDM College" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
                    </div>
                </div>
                {msg && <p className="text-red-500 text-sm">{msg}</p>}
                <button
                    onClick={handleUpload}
                    disabled={uploading || !file || !title.trim()}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow disabled:opacity-50"
                >
                    {uploading ? 'Uploading…' : '⬆ Upload Slide'}
                </button>
            </div>

            {/* Slide List */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : slides.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl text-gray-400">
                    <p className="text-3xl mb-2">🖼</p>
                    <p>No slides yet. Upload your first one above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {slides.map((slide, i) => (
                        <div key={slide._id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${slide.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                            {/* Thumbnail */}
                            <div className="relative w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                <Image src={slide.url} alt={slide.title} fill className="object-cover" />
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{slide.title}</p>
                                {slide.subtitle && <p className="text-xs text-gray-500 truncate">{slide.subtitle}</p>}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${slide.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {slide.isActive ? 'Active' : 'Hidden'}
                                </span>
                            </div>
                            {/* Controls */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                <button onClick={() => moveOrder(slide._id, 'up')} disabled={i === 0} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-sm flex items-center justify-center">↑</button>
                                <button onClick={() => moveOrder(slide._id, 'down')} disabled={i === slides.length - 1} className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-sm flex items-center justify-center">↓</button>
                                <button onClick={() => toggleActive(slide._id, slide.isActive)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${slide.isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                                    {slide.isActive ? 'Hide' : 'Show'}
                                </button>
                                <button onClick={() => deleteSlide(slide._id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
