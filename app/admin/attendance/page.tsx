'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiUserCheck, FiSearch, FiCalendar, 
    FiCircle, FiCheckCircle, FiXCircle, FiClock, FiFilter, FiSun, FiMoon
} from 'react-icons/fi'

const statusStyles: Record<string, string> = {
    present: "bg-emerald-50 text-emerald-600 border-emerald-100",
    absent: "bg-red-50 text-red-600 border-red-100",
    late: "bg-amber-50 text-amber-700 border-amber-100",
}

const classOptions = [
    'Pre-KG', 'LKG', 'UKG',
    ...Array.from({ length: 10 }, (_, i) => `${i + 1}`)
].flatMap(cls => ['A', 'B', 'C', 'D'].map(sec => `${cls}-${sec}`));

export default function AttendanceAdminPage() {
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)

    // Ensure default date is local Today
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().split('T')[0];
    })

    const [selectedClass, setSelectedClass] = useState('All')
    const [selectedSession, setSelectedSession] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAttendance()
    }, [selectedDate, selectedClass, selectedSession])

    async function fetchAttendance() {
        setLoading(true);
        try {
            // Clean Query String - No comments inside the backticks
            let query = supabase
                .from('daily_attendance')
                .select(`
                    *,
                    students (
                        id, 
                        full_name, 
                        class_name, 
                        section, 
                        student_id
                    ),
                    teachers (
                        id, 
                        full_name
                    )
                `)
                .eq('date', selectedDate);

            if (selectedSession !== 'All') {
                query = query.eq('session', selectedSession.toLowerCase());
            }

            const { data, error } = await query;
            if (error) throw error;

            let results = data || [];
            
            // Client-side Filter for Class-Section
            if (selectedClass !== 'All') {
                const [cls, sec] = selectedClass.split('-');
                results = results.filter((item: any) =>
                    String(item.students?.class_name) === cls &&
                    item.students?.section === sec
                );
            }
            setAttendance(results);
        } catch (error: any) {
            console.error("Supabase Query Error:", error.message);
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredData = attendance.filter(item => {
        const studentName = (item.students?.full_name || "").toLowerCase()
        const search = searchTerm.toLowerCase()
        return studentName.includes(search)
    })

    return (
        <div className="p-4 md:p-6 mt-16 md:mt-10 space-y-6 max-w-[1400px] mx-auto bg-[#FCFAFC] dark:bg-slate-950 transition-colors duration-300">

            {/* HEADER */}
            <header className="bg-white dark:bg-slate-900 p-4 md:px-8 md:py-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <FiUserCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none">Daily Ledger</h1>
                            <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Management View</p>
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className="ml-auto lg:hidden p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-indigo-600 border border-slate-100 dark:border-slate-700">
                            <FiFilter />
                        </button>
                    </div>

                    <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row flex-wrap items-center gap-3 transition-all`}>
                        <div className="relative w-full sm:w-auto">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase outline-none dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>

                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase outline-none cursor-pointer dark:text-slate-200 transition-all"
                        >
                            <option value="All">All Classes</option>
                            {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>

                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase outline-none cursor-pointer dark:text-slate-200 transition-all"
                        >
                            <option value="All">All Sessions</option>
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total Logs', value: attendance.length, color: 'text-slate-600', icon: FiCircle },
                    { label: 'Present', value: attendance.filter(a => a.status === 'present').length, color: 'text-emerald-500', icon: FiCheckCircle },
                    { label: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: 'text-red-500', icon: FiXCircle },
                    { label: 'Late/Other', value: attendance.filter(a => a.status === 'late').length, color: 'text-amber-500', icon: FiClock },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className={`text-xl md:text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
                        </div>
                        <stat.icon size={20} className="hidden md:block opacity-20" />
                    </div>
                ))}
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Records...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 md:p-6 border-b border-slate-50 dark:border-slate-800">
                            <div className="relative max-w-md">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="SEARCH BY STUDENT NAME..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-[10px] md:text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/10 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="p-6 text-left">Student Profile</th>
                                        <th className="p-6 text-left">Class Info</th>
                                        <th className="p-6 text-left">Session</th>
                                        <th className="p-6 text-center">Status</th>
                                        <th className="p-6 text-right">Marked By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-black text-indigo-600 shrink-0 uppercase">
                                                        {(item.students?.full_name || "U")[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-800 dark:text-slate-200 font-black">{item.students?.full_name || 'Unknown'}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{item.students?.student_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px]">
                                                {item.students?.class_name}-{item.students?.section}
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                                                    {item.session === 'morning' ? <FiSun className="text-orange-400" /> : <FiMoon className="text-indigo-400" />}
                                                    {item.session}
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={`px-5 py-2 rounded-full border text-[9px] font-black tracking-widest uppercase ${statusStyles[item.status] || ''}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right text-slate-400 dark:text-slate-500 font-bold text-[10px]">
                                                {item.teachers?.full_name || 'Admin'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredData.map((item) => (
                                <div key={item.id} className="p-5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-black text-indigo-600 uppercase">
                                                {(item.students?.full_name || "U")[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.students?.full_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.students?.class_name}-{item.students?.section}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase ${statusStyles[item.status] || ''}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase">{item.session} Session</span>
                                        <span className="text-slate-400 font-bold">By {item.teachers?.full_name || 'Admin'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredData.length === 0 && (
                            <div className="p-20 text-center">
                                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No Attendance Data Found</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}