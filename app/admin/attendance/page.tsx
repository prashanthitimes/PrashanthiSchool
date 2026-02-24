'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiUserCheck, FiSearch, FiCalendar, FiBookOpen,
    FiCircle, FiCheckCircle, FiXCircle, FiClock, FiFilter
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
    const [subjectsList, setSubjectsList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false) // Toggle for mobile filters

    // Filters
    const [selectedDate, setSelectedDate] = useState('2026-01-19')
    const [selectedClass, setSelectedClass] = useState('All')
    const [selectedSubject, setSelectedSubject] = useState('All')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchAttendance()
    }, [selectedDate, selectedClass, selectedSubject])

    async function fetchInitialData() {
        const { data } = await supabase.from('subjects').select('id, name')
        if (data) setSubjectsList(data)
    }

    async function fetchAttendance() {
        setLoading(true);
        let query = supabase
            .from('attendance')
            .select(`
            *,
            students (*),
            subjects (*),
            teachers (*)
        `)
            .eq('date', selectedDate);

        if (selectedSubject !== 'All') {
            query = query.eq('subject_id', selectedSubject);
        }

        const { data, error } = await query;

        if (error) {
            setAttendance([]);
        } else {
            let results = data || [];
            if (selectedClass !== 'All') {
                const [cls, sec] = selectedClass.split('-');
                results = results.filter((item: any) =>
                    String(item.students?.class) === cls &&
                    item.students?.section === sec
                );
            }
            setAttendance(results);
        }
        setLoading(false);
    }

    const filteredData = attendance.filter(item => {
        const studentName = (item.students?.name || item.students?.student_name || "").toLowerCase()
        const subjectName = (item.subjects?.name || "").toLowerCase()
        const search = searchTerm.toLowerCase()
        return studentName.includes(search) || subjectName.includes(search)
    })

    return (
        <div className="p-4 md:p-6 mt-16 md:mt-10 space-y-6 max-w-[1400px] mx-auto min-h-screen bg-[#FCFAFC]">

            {/* HEADER SECTION */}
            <header className="bg-white p-4 md:px-8 md:py-6 rounded-3xl md:rounded-[2.5rem] border border-brand-soft/30 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-accent text-brand rounded-2xl flex items-center justify-center shrink-0">
                            <FiUserCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Attendance</h1>
                            <p className="text-[9px] font-bold text-brand tracking-[0.2em] uppercase mt-1 opacity-80">Admin Ledger</p>
                        </div>
                        {/* Mobile Filter Toggle */}
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="ml-auto lg:hidden p-3 bg-slate-50 rounded-xl text-brand border border-brand-soft/20"
                        >
                            <FiFilter />
                        </button>
                    </div>

                    {/* Filter Controls - Responsive visibility */}
                    <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row flex-wrap items-center gap-3 transition-all`}>
                        <div className="relative w-full sm:w-auto">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-brand-soft/20 rounded-2xl text-[11px] font-black uppercase outline-none"
                            />
                        </div>

                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-50 border border-brand-soft/20 rounded-2xl text-[11px] font-black uppercase outline-none cursor-pointer"
                        >
                            <option value="All">All Classes</option>
                            {classOptions.map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>

                        <div className="relative w-full sm:w-auto">
                            <FiBookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full pl-11 pr-6 py-3 bg-slate-50 border border-brand-soft/20 rounded-2xl text-[11px] font-black uppercase outline-none cursor-pointer"
                            >
                                <option value="All">All Subjects</option>
                                {subjectsList.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* STATS CARDS - 2 columns on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'Total', value: attendance.length, color: 'text-brand', icon: FiCircle },
                    { label: 'Present', value: attendance.filter(a => a.status === 'present').length, color: 'text-emerald-500', icon: FiCheckCircle },
                    { label: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: 'text-red-500', icon: FiXCircle },
                    { label: 'Late', value: attendance.filter(a => a.status === 'late').length, color: 'text-amber-500', icon: FiClock },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-brand-soft/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className={`text-xl md:text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
                        </div>
                        <stat.icon size={20} className="hidden md:block opacity-20" />
                    </div>
                ))}
            </div>

            {/* TABLE / LIST CONTAINER */}
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl border border-brand-soft/30 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-brand-soft/10">
                    <div className="relative max-w-md">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH STUDENT OR SUBJECT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-[10px] md:text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-brand/10"
                        />
                    </div>
                </div>

                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-brand-accent/40 text-[10px] font-black text-brand-dark/50 uppercase tracking-[0.2em]">
                                <th className="p-6 text-left">Student Profile</th>
                                <th className="p-6 text-left">Class Info</th>
                                <th className="p-6 text-left">Subject / Period</th>
                                <th className="p-6 text-center">Status</th>
                                <th className="p-6 text-right">Teacher</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-soft/10">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="group hover:bg-brand-accent/5 transition-all">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-brand-soft/30 flex items-center justify-center font-black text-brand shrink-0">
                                                {(item.students?.name || "U")[0]}
                                            </div>
                                            <span className="text-slate-800 font-black">{item.students?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-slate-500 font-bold uppercase text-[11px]">
                                        Class {item.students?.class}-{item.students?.section}
                                    </td>
                                    <td className="p-6">
                                        <div className="text-slate-700 font-bold">{item.subjects?.name || 'No Subject'}</div>
                                        <div className="text-[9px] text-brand opacity-60 font-black">Period {item.period}</div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className={`px-5 py-2 rounded-full border text-[9px] font-black tracking-widest uppercase ${statusStyles[item.status] || ''}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right text-slate-400 font-bold text-[10px]">
                                        {item.teachers?.name || 'Not Assigned'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE LIST VIEW */}
                <div className="md:hidden divide-y divide-brand-soft/10">
                    {filteredData.map((item) => (
                        <div key={item.id} className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-soft/30 flex items-center justify-center font-black text-brand shrink-0">
                                        {(item.students?.name || "U")[0]}
                                    </div>
                                    <div>
                                        <div className="text-slate-800 font-black text-sm">{item.students?.name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase">Class {item.students?.class}-{item.students?.section}</div>
                                    </div>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full border text-[8px] font-black tracking-widest uppercase ${statusStyles[item.status] || ''}`}>
                                    {item.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Subject</p>
                                    <p className="text-[11px] font-bold text-slate-700">{item.subjects?.name}</p>
                                    <p className="text-[9px] text-brand font-black">Period {item.period}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Teacher</p>
                                    <p className="text-[11px] font-bold text-slate-700">{item.teachers?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredData.length === 0 && (
                        <div className="p-10 text-center text-slate-400 font-bold text-xs">
                            No records found for this selection.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}