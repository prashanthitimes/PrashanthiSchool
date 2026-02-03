'use client'

import { useEffect, useState, Fragment } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiCalendar, FiMapPin, FiClock, FiChevronLeft, FiTag,
    FiChevronRight, FiAlertCircle
} from 'react-icons/fi'

const typeColors: Record<string, string> = {
    'Holiday': 'bg-red-100 text-red-600 border-red-200',
    'Exam': 'bg-amber-100 text-amber-600 border-amber-200',
    'Meeting': 'bg-blue-100 text-blue-600 border-blue-200',
    'Event': 'bg-purple-100 text-purple-600 border-purple-200',
    'Function': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    'College Event': 'bg-pink-100 text-pink-600 border-pink-200'
}

export default function AcademicCalendar() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewDate, setViewDate] = useState(new Date()) // Controls which month we see

    useEffect(() => {
        fetchEvents()
    }, [])

    async function fetchEvents() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('is_active', true)
            if (error) throw error
            setEvents(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // --- CALENDAR GENERATION LOGIC ---
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

    // Create the array of days (including empty slots for the start of the week)
    const calendarDays = []
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
    for (let i = 1; i <= daysInMonth(viewDate.getFullYear(), viewDate.getMonth()); i++) calendarDays.push(i)

    return (
        <div className="min-h-screen bg-[#FDFCFD] p-6 md:p-10">
            {/* --- HEADER --- */}
            <div className="bg-brand-dark p-10 rounded-[3rem] shadow-xl mb-10 text-white flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Academic Calendar</h1>
                    <p className="text-white/60 font-bold text-xs uppercase tracking-widest mt-1">Manage School Events & Schedule</p>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Today</p>
                    <p className="text-xl font-black">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                {/* --- LEFT: UPCOMING LIST --- */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-lg font-black text-brand-dark uppercase flex items-center gap-2">
                        <FiTag className="text-brand" /> Upcoming
                    </h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {events.filter(e => new Date(e.start_date) >= new Date()).slice(0, 5).map(event => (
                            <div key={event.id} className="bg-white p-5 rounded-[2rem] border border-brand-soft shadow-sm group hover:border-brand transition-all">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${typeColors[event.event_type]}`}>
                                    {event.event_type}
                                </span>
                                <h4 className="text-sm font-black text-brand-dark mt-2 uppercase">{event.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">
                                    {new Date(event.start_date).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT: THE INTERACTIVE CALENDAR --- */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3rem] border border-brand-soft shadow-sm overflow-hidden">
                        {/* NAV CONTROLS */}
                        <div className="p-8 border-b border-brand-soft flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-2xl font-black text-brand-dark uppercase">
                                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={prevMonth} className="p-3 hover:bg-brand hover:text-white rounded-xl border border-brand-soft transition-all"><FiChevronLeft /></button>
                                <button onClick={() => setViewDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase border border-brand-soft rounded-xl hover:bg-slate-100">Today</button>
                                <button onClick={nextMonth} className="p-3 hover:bg-brand hover:text-white rounded-xl border border-brand-soft transition-all"><FiChevronRight /></button>
                            </div>
                        </div>

                        {/* CALENDAR GRID */}
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-1 mb-4">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-black text-brand-light uppercase py-2">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, idx) => {
                                    if (day === null) return <div key={idx} className="min-h-[100px] bg-slate-50/30 rounded-2xl"></div>

                                    // Check if this date has events
                                    const currentFullDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0]
                                    const dayEvents = events.filter(e => e.start_date === currentFullDate)
                                    const isToday = new Date().toISOString().split('T')[0] === currentFullDate

                                    return (
                                        <div key={idx} className={`min-h-[110px] p-3 rounded-2xl border transition-all ${isToday ? 'border-brand ring-1 ring-brand/20' : 'border-brand-soft hover:border-brand/40'}`}>
                                            <span className={`text-sm font-black ${isToday ? 'text-brand' : 'text-brand-dark/40'}`}>
                                                {day}
                                            </span>
                                            <div className="mt-2 space-y-1">
                                                {dayEvents.map(ev => (
                                                    <div key={ev.id} className={`text-[8px] font-black p-1 rounded-md truncate ${typeColors[ev.event_type]}`} title={ev.title}>
                                                        {ev.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* LEGEND */}
                    <div className="mt-6 flex flex-wrap gap-4 justify-center opacity-70">
                        {Object.keys(typeColors).map(type => (
                            <div key={type} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                                <span className={`w-2 h-2 rounded-full ${typeColors[type].split(' ')[0]}`}></span> {type}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}