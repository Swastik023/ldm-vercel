'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle, Calendar, TrendingUp, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AttendanceRecord {
    date: string;
    subject: { name: string; code: string } | null;
    teacher: { fullName: string } | null;
    section: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    marked_by: string;
    remarks: string;
}

interface Summary { present: number; absent: number; late: number; excused: number; total: number; percentage: number; }

interface CalendarDay {
    classes: Array<{ subject: string; code: string; teacher: string; status: string }>;
}

interface OpenSession {
    _id: string;
    subject: string;
    subject_code: string;
    teacher: string;
    deadline: string;
    section: string;
}

// ── Status Config ──────────────────────────────────────────────────────────────
const STATUS = {
    present: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', label: 'Present' },
    absent: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500', label: 'Absent' },
    late: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', dot: 'bg-amber-400', label: 'Late' },
    excused: { icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-400', label: 'Excused' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── Percentage Ring ────────────────────────────────────────────────────────────
function PercentageRing({ value, size = 140, stroke = 10 }: { value: number; size?: number; stroke?: number }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const color = value >= 90 ? '#10b981' : value >= 75 ? '#f59e0b' : '#ef4444';
    const bgColor = value >= 90 ? 'rgba(16,185,129,0.08)' : value >= 75 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill={bgColor}
                    stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - (value / 100) * circ }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-3xl font-extrabold"
                    style={{ color }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    {value}%
                </motion.span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Attendance</span>
            </div>
        </div>
    );
}

// ── Countdown Timer ────────────────────────────────────────────────────────────
function Countdown({ deadline }: { deadline: string }) {
    const [remaining, setRemaining] = useState('');

    useEffect(() => {
        const tick = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) { setRemaining('Expired'); return; }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline]);

    return <span className="font-mono font-bold text-lg">{remaining}</span>;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StudentAttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [calendar, setCalendar] = useState<Record<string, CalendarDay>>({});
    const [openSessions, setOpenSessions] = useState<OpenSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Calendar state
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [markingId, setMarkingId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const res = await fetch('/api/student/attendance');
            const d = await res.json();
            if (d.success) {
                setRecords(d.records);
                setSummary(d.summary);
                setCalendar(d.calendar || {});
                setOpenSessions(d.open_sessions || []);
            } else {
                setError(d.message || 'Failed to load attendance');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Self-mark handler ──────────────────────────────────────────────
    const handleSelfMark = async (sessionId: string) => {
        setMarkingId(sessionId);
        try {
            const res = await fetch('/api/student/attendance/self-mark', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendanceId: sessionId }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success('✅ Attendance marked!');
                setOpenSessions(prev => prev.filter(s => s._id !== sessionId));
                loadData();
            } else {
                toast.error(d.message || 'Failed to mark');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setMarkingId(null);
        }
    };

    // ── Calendar grid computation ──────────────────────────────────────
    const calendarGrid = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
        const totalDays = lastDay.getDate();

        const cells: Array<{ day: number | null; dateKey: string; data: CalendarDay | null }> = [];

        // Padding before
        for (let i = 0; i < startOffset; i++) cells.push({ day: null, dateKey: '', data: null });

        for (let d = 1; d <= totalDays; d++) {
            const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({ day: d, dateKey, data: calendar[dateKey] || null });
        }

        // Padding after
        while (cells.length % 7 !== 0) cells.push({ day: null, dateKey: '', data: null });

        return cells;
    }, [viewYear, viewMonth, calendar]);

    const getDayDotColor = (data: CalendarDay | null) => {
        if (!data || data.classes.length === 0) return null;
        const hasAbsent = data.classes.some(c => c.status === 'absent');
        const hasLate = data.classes.some(c => c.status === 'late');
        if (hasAbsent) return 'bg-red-500';
        if (hasLate) return 'bg-amber-400';
        return 'bg-emerald-500';
    };

    const isToday = (dateKey: string) => {
        return dateKey === new Date().toISOString().split('T')[0];
    };

    const navigateMonth = (dir: -1 | 1) => {
        setExpandedDay(null);
        if (dir === -1) {
            if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
            else setViewMonth(m => m - 1);
        } else {
            if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
            else setViewMonth(m => m + 1);
        }
    };

    // ── Loading / Error ────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">{error}</div>;

    const pct = summary?.percentage ?? 0;

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            {/* ── Hero: Percentage Ring + Summary ──────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
                <div className="flex items-center gap-6">
                    <PercentageRing value={pct} />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 mb-1">My Attendance</h1>
                        <p className="text-sm text-gray-400 mb-4">
                            {summary?.total || 0} classes recorded
                        </p>
                        {summary && (
                            <div className="grid grid-cols-2 gap-2">
                                {(['present', 'absent', 'late', 'excused'] as const).map(s => {
                                    const cfg = STATUS[s];
                                    return (
                                        <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${cfg.bg}`}>
                                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                            <span className={`text-xs font-semibold ${cfg.color}`}>{summary[s]}</span>
                                            <span className="text-[10px] text-gray-400">{cfg.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Low attendance warning */}
                {pct > 0 && pct < 75 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                    >
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-xs text-red-700">
                            <strong>Below 75%.</strong> Your exam eligibility may be affected. Attend classes regularly.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            {/* ── Self-Mark Banner ─────────────────────────────────────────── */}
            <AnimatePresence>
                {openSessions.map(sess => (
                    <motion.div
                        key={sess._id}
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-200/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{sess.subject}</p>
                                        <p className="text-[10px] text-white/60">{sess.teacher} · Sec {sess.section}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Closes in</p>
                                    <Countdown deadline={sess.deadline} />
                                </div>
                            </div>
                            <button
                                onClick={() => handleSelfMark(sess._id)}
                                disabled={markingId === sess._id}
                                className="w-full mt-2 py-2.5 bg-white text-violet-700 rounded-xl font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {markingId === sess._id ? (
                                    <><div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> Marking...</>
                                ) : (
                                    <><CheckCircle className="w-4 h-4" /> Mark Present</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* ── Calendar Month Grid ─────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                {/* Month nav */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <h2 className="text-sm font-bold text-gray-800">
                        {MONTHS[viewMonth]} {viewYear}
                    </h2>
                    <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 px-3 pt-2">
                    {DAYS.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2">{d}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px px-3 pb-4">
                    {calendarGrid.map((cell, i) => {
                        const dotColor = getDayDotColor(cell.data);
                        const today = isToday(cell.dateKey);
                        const expanded = expandedDay === cell.dateKey;

                        return (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.008 }}
                                onClick={() => cell.day && cell.data && setExpandedDay(expanded ? null : cell.dateKey)}
                                disabled={!cell.day}
                                className={`
                                    relative flex flex-col items-center justify-center py-2.5 rounded-xl transition-all text-sm
                                    ${!cell.day ? 'invisible' : ''}
                                    ${today ? 'bg-blue-50 ring-2 ring-blue-200 font-bold text-blue-700' : ''}
                                    ${expanded ? 'bg-gray-100 ring-2 ring-gray-300' : ''}
                                    ${cell.data ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default text-gray-300'}
                                `}
                            >
                                <span className={`text-xs ${today ? 'font-bold' : cell.data ? 'font-medium text-gray-700' : 'text-gray-300'}`}>
                                    {cell.day}
                                </span>
                                {dotColor && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Expanded day detail */}
                <AnimatePresence>
                    {expandedDay && calendar[expandedDay] && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-gray-100 overflow-hidden"
                        >
                            <div className="px-5 py-3 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {new Date(expandedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                                {calendar[expandedDay].classes.map((cls, j) => {
                                    const st = STATUS[cls.status as keyof typeof STATUS] || STATUS.absent;
                                    const Icon = st.icon;
                                    return (
                                        <div key={j} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${st.bg}`}>
                                            <Icon className={`w-4 h-4 ${st.color} shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{cls.subject}</p>
                                                <p className="text-[10px] text-gray-400">{cls.teacher} · {cls.code}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${st.color}`}>{st.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ── Legend ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-5 text-[10px] text-gray-400">
                {[
                    { dot: 'bg-emerald-500', label: 'Present' },
                    { dot: 'bg-red-500', label: 'Absent' },
                    { dot: 'bg-amber-400', label: 'Late' },
                    { dot: 'bg-gray-200', label: 'No class' },
                ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                        <span>{l.label}</span>
                    </div>
                ))}
            </div>

            {/* ── Recent Records Timeline ──────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-bold text-gray-800">Recent Records</h2>
                </div>
                {records.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No attendance yet</p>
                        <p className="text-xs mt-1">Records appear once teachers mark attendance</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {records.slice(0, 15).map((r, i) => {
                            const st = STATUS[r.status];
                            const Icon = st.icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition"
                                >
                                    <div className={`w-8 h-8 rounded-lg ${st.bg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-4 h-4 ${st.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{r.subject?.name || 'N/A'}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            {' · '}{r.teacher?.fullName || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${st.bg} ${st.color}`}>
                                        {st.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
