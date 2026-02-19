'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, ToggleLeft, ToggleRight, X, ChevronUp, ChevronDown } from 'lucide-react';

interface MarqueeMsg {
    _id: string;
    message: string;
    isActive: boolean;
    order: number;
    createdAt: string;
}

export default function MarqueeManagerPage() {
    const [messages, setMessages] = useState<MarqueeMsg[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/marquee');
            const data = await res.json();
            if (data.success) setMessages(data.messages);
        } catch {
            toast.error('Failed to load marquee messages');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/marquee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Message added');
                setNewMessage('');
                fetchMessages();
            } else {
                toast.error(data.message || 'Failed to add');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            const res = await fetch('/api/admin/marquee', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !current }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => prev.map(m => m._id === id ? { ...m, isActive: !current } : m));
                toast.success(current ? 'Message hidden' : 'Message shown');
            }
        } catch {
            toast.error('Failed to toggle');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            const res = await fetch(`/api/admin/marquee?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Message deleted');
                setMessages(prev => prev.filter(m => m._id !== id));
            }
        } catch {
            toast.error('Failed to delete');
        }
    };

    const activeCount = messages.filter(m => m.isActive).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Scrolling Updates Bar</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Manage the messages shown in the scrolling notice bar above the navigation.
                    <span className="ml-2 font-medium text-blue-600">{activeCount} active</span>
                </p>
            </div>

            {/* Live Preview */}
            <div className="bg-blue-800 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-bold bg-white text-blue-800 px-2 py-0.5 rounded flex-shrink-0">LIVE</span>
                <div className="flex-1 overflow-hidden">
                    <div className="whitespace-nowrap animate-marquee-slow text-sm">
                        {messages.filter(m => m.isActive).map(m => m.message).join('  •  ') || 'No active messages — add one below'}
                    </div>
                </div>
            </div>

            {/* Add Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" /> Add New Message
                </h2>
                <form onSubmit={handleAdd} className="flex gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="e.g. Admissions open for 2026 batch — Apply Now!"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {submitting ? 'Adding...' : 'Add'}
                    </button>
                </form>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">All Messages ({messages.length})</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
                ) : messages.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="text-4xl mb-3">📢</div>
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Add your first scrolling update above.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {messages.map(msg => (
                            <li key={msg._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition">
                                {/* Toggle */}
                                <button
                                    onClick={() => handleToggle(msg._id, msg.isActive)}
                                    className={`flex-shrink-0 transition-colors ${msg.isActive ? 'text-blue-600 hover:text-blue-800' : 'text-gray-300 hover:text-gray-500'}`}
                                    title={msg.isActive ? 'Click to hide' : 'Click to show'}
                                >
                                    {msg.isActive
                                        ? <ToggleRight className="w-7 h-7" />
                                        : <ToggleLeft className="w-7 h-7" />
                                    }
                                </button>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${msg.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                        {msg.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Added {new Date(msg.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${msg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {msg.isActive ? 'Visible' : 'Hidden'}
                                </span>

                                <button
                                    onClick={() => handleDelete(msg._id)}
                                    className="flex-shrink-0 text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
