'use client'

import { useEffect, useState, Fragment } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiCalendar, FiMapPin, FiClock, FiChevronLeft, FiTag,
    FiChevronRight, FiAlertCircle, FiArrowRight
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
    const [viewDate, setViewDate] = useState(new Date())
    // Initialize selectedDate with local YYYY-MM-DD to match database format
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'))

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

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))

    const calendarDays = []
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
    for (let i = 1; i <= daysInMonth(viewDate.getFullYear(), viewDate.getMonth()); i++) calendarDays.push(i)

    // Filter events for the selected day (Mobile logic)
    const selectedDayEvents = events.filter(e => e.start_date === selectedDate)

 return (
    <div className="min-h-screen bg-[#FDFCFD] dark:bg-slate-950 p-4 md:p-10 pb-20 transition-colors duration-300">
        {/* --- HEADER --- */}
        {/* Keeping the purple but adding a slight dark-mode gradient shift */}
        <div className="bg-[#722366] dark:bg-gradient-to-br dark:from-[#5a1c51] dark:to-[#43153d] p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl mb-6 md:mb-10 text-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
                <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">Academic Calendar</h1>
                <p className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-1">School Events & Schedule</p>
            </div>
            <div className="flex flex-col items-center md:items-end">
                <p className="text-[9px] font-black opacity-50 uppercase tracking-widest">Today</p>
                <p className="text-lg md:text-xl font-black">{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long' })}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">

            {/* --- LEFT: UPCOMING --- */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
                <h2 className="text-sm md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                    <FiTag className="text-[#722366] dark:text-brand-soft" /> Upcoming
                </h2>
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto gap-4 pb-4 lg:pb-0 scrollbar-hide">
                    {events
                        .filter(e => e.start_date >= new Date().toLocaleDateString('en-CA'))
                        .sort((a, b) => a.start_date.localeCompare(b.start_date))
                        .slice(0, 5)
                        .map(event => (
                        <div key={event.id} className="min-w-[250px] lg:min-w-full bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-[#722366] dark:hover:border-brand-soft transition-all flex-shrink-0">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${typeColors[event.event_type] || 'bg-slate-100 dark:bg-slate-800'}`}>
                                {event.event_type}
                            </span>
                            <h4 className="text-xs md:text-sm font-black text-slate-800 dark:text-slate-100 mt-2 uppercase">{event.title}</h4>
                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mt-2">
                                <FiCalendar size={12} />
                                <p className="text-[10px] font-bold">{new Date(event.start_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT: CALENDAR --- */}
            <div className="lg:col-span-3">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {/* NAV CONTROLS */}
                    <div className="p-5 md:p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <h2 className="text-sm md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase">
                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-1 md:gap-2">
                            <button onClick={prevMonth} className="p-2 md:p-3 hover:bg-[#722366] dark:hover:bg-brand hover:text-white rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 transition-all dark:text-slate-300"><FiChevronLeft /></button>
                            <button onClick={() => {
                                const today = new Date();
                                setViewDate(today);
                                setSelectedDate(today.toLocaleDateString('en-CA'));
                            }} className="px-3 md:px-4 py-2 text-[9px] md:text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors">Today</button>
                            <button onClick={nextMonth} className="p-2 md:p-3 hover:bg-[#722366] dark:hover:bg-brand hover:text-white rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 transition-all dark:text-slate-300"><FiChevronRight /></button>
                        </div>
                    </div>

                    {/* CALENDAR GRID */}
                    <div className="p-3 md:p-6">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase py-2">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                            {calendarDays.map((day, idx) => {
                                if (day === null) return <div key={idx} className="aspect-square md:min-h-[100px] bg-slate-50/30 dark:bg-slate-800/20 rounded-lg md:rounded-2xl"></div>

                                const year = viewDate.getFullYear();
                                const month = String(viewDate.getMonth() + 1).padStart(2, '0');
                                const dateStr = String(day).padStart(2, '0');
                                const currentFullDate = `${year}-${month}-${dateStr}`;

                                const dayEvents = events.filter(e => e.start_date === currentFullDate);
                                const isToday = new Date().toLocaleDateString('en-CA') === currentFullDate;
                                const isSelected = selectedDate === currentFullDate;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedDate(currentFullDate)}
                                        className={`
                                            aspect-square md:aspect-auto md:min-h-[110px] p-1 md:p-3 rounded-xl md:rounded-2xl border cursor-pointer transition-all flex flex-col
                                            ${isSelected 
                                                ? 'bg-[#722366] dark:bg-brand border-[#722366] dark:border-brand text-white' 
                                                : 'border-slate-100 dark:border-slate-800 dark:bg-slate-900 hover:border-[#722366]/30 dark:hover:border-brand-soft/30'}
                                            ${isToday && !isSelected ? 'ring-2 ring-[#722366] dark:ring-brand-soft ring-offset-2 dark:ring-offset-slate-900' : ''}
                                        `}
                                    >
                                        <span className={`text-[10px] md:text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-[#722366] dark:text-brand-soft' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {day}
                                        </span>

                                        <div className="mt-auto flex flex-wrap justify-center md:justify-start gap-0.5 md:space-y-1">
                                            {dayEvents.map(ev => (
                                                <Fragment key={ev.id}>
                                                    {/* Desktop: Text Bar */}
                                                    <div className={`hidden md:block w-full text-[8px] font-black p-1 rounded-md truncate ${isSelected ? 'bg-white/20 text-white' : `${typeColors[ev.event_type]} dark:brightness-90`}`}>
                                                        {ev.title}
                                                    </div>
                                                    {/* Mobile: Simple Dot */}
                                                    <div className={`md:hidden w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#722366] dark:bg-brand-soft'}`}></div>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* MOBILE: SELECTED DAY EVENTS LIST */}
                    <div className="md:hidden p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                            Events for {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                        </h3>
                        {selectedDayEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayEvents.map(ev => (
                                    <div key={ev.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                        <div className={`w-2 h-10 rounded-full ${typeColors[ev.event_type]?.split(' ')[0] || 'bg-slate-200 dark:bg-slate-800'}`}></div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">{ev.title}</p>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{ev.event_type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 italic">No events scheduled for this day.</p>
                        )}
                    </div>
                </div>

                {/* LEGEND */}
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center opacity-70">
                    {Object.keys(typeColors).map(type => (
                        <div key={type} className="flex items-center gap-2 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${typeColors[type].split(' ')[0]}`}></span> {type}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
)
}