'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiUsers, FiSearch, FiChevronRight,
    FiHome, FiMapPin, FiUser
} from 'react-icons/fi'
import { RiParentLine } from 'react-icons/ri' // Optional: if you have remix-icons, otherwise FiUser is fine

export default function TeacherClassList() {
    const [allocations, setAllocations] = useState<any[]>([])
    const [selectedAllocation, setSelectedAllocation] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchTeacherAllocations()
    }, [])

   async function fetchTeacherAllocations() {

    const email = localStorage.getItem('teacherEmail')

    if (!email) {
        console.log("Teacher not logged in")
        window.location.href = '/login/teacher'
        return
    }

    const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', email)
        .single()

    if (teacherError || !teacher) {
        console.log("Teacher not found in database", teacherError)
        setLoading(false)
        return
    }

    const { data: allocated } = await supabase
        .from('subject_assignments')
       .select(`
    id, class_name, section, academic_year, subject_id
`)
        .eq('teacher_id', teacher.id)

    setAllocations(allocated || [])

    if (allocated && allocated.length > 0) {
        handleClassSelect(allocated[0])
    }

    setLoading(false)
}

    async function handleClassSelect(allocation: any) {
        setSelectedAllocation(allocation)
        setLoading(true)

        const { data: studentList } = await supabase
            .from('students')
            .select('*')
            .eq('class_name', allocation.class_name)
            .eq('section', allocation.section)
            .eq('academic_year', allocation.academic_year)
            .order('roll_number', { ascending: true })

        setStudents(studentList || [])
        setLoading(false)
    }

    const filteredStudents = students.filter(s =>
        (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.student_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.father_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
        <div className="min-h-screen bg-[#FDFCFD] dark:bg-slate-950 pb-32 transition-colors duration-300">

            {/* --- HEADER --- */}
            <div className="px-6 pt-6">
                <div className="relative overflow-hidden bg-brand-soft dark:bg-slate-900 p-10 rounded-[3rem] border border-brand-light/10 dark:border-slate-800 shadow-sm">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm text-brand-light dark:text-brand border border-brand-soft dark:border-slate-700">
                                <FiUsers size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark dark:text-slate-100 tracking-tight">Class Directory</h1>
                                <p className="text-brand-light dark:text-slate-400 font-bold text-sm mt-1 opacity-90">Student profiles and family background records.</p>
                            </div>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white dark:border-slate-700 shadow-sm min-w-[160px]">
                            <p className="text-[10px] font-black text-brand-light dark:text-brand uppercase tracking-widest text-center mb-1">Total Enrolled</p>
                            <p className="text-4xl font-black text-brand-dark dark:text-slate-100 text-center">{students.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT: CLASS SELECTOR --- */}
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] px-2 opacity-60">Your Assignments</h2>
                    <div className="grid gap-3">
                        {allocations.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleClassSelect(item)}
                                className={`p-5 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between
                                ${selectedAllocation?.id === item.id
                                        ? 'bg-brand text-white border-brand shadow-lg'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-transparent dark:border-slate-800 shadow-sm hover:border-brand-soft dark:hover:border-brand/30'}`}
                            >
                                <div>
                                    <p className={`text-[10px] font-black uppercase ${selectedAllocation?.id === item.id ? 'text-brand-soft' : 'text-brand-light dark:text-brand'}`}>
                                        {item.subjects?.name}
                                    </p>
                                    <h3 className="font-black text-lg dark:text-slate-100">Grade {item.class_name}-{item.section}</h3>
                                </div>
                                <FiChevronRight className={selectedAllocation?.id === item.id ? 'text-white' : 'text-brand-soft'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT: STUDENT DIRECTORY --- */}
                <div className="lg:col-span-9 space-y-6">
                    <div className="relative">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-light dark:text-slate-500 opacity-60" />
                        <input
                            type="text"
                            placeholder="Search by student, ID, or father's name..."
                            className="w-full bg-white dark:bg-slate-900 p-5 pl-16 rounded-[2rem] border-none shadow-sm font-bold text-slate-700 dark:text-slate-200 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-brand transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-brand-soft/50 dark:border-slate-800 overflow-hidden">
                        {/* DESKTOP TABLE VIEW */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-brand-accent dark:bg-slate-800/50 text-[10px] font-black text-brand-light dark:text-slate-400 uppercase tracking-[0.2em] border-b border-brand-soft dark:border-slate-800">
                                        <th className="px-8 py-6">Roll</th>
                                        <th className="px-8 py-6">Student Identity</th>
                                        <th className="px-8 py-6">Parents Information</th>
                                        <th className="px-8 py-6">Residential Area</th>
                                        <th className="px-8 py-6 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-soft/30 dark:divide-slate-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                                                <p className="font-black text-brand-light dark:text-slate-500 text-xs uppercase tracking-widest">Loading Records...</p>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.map((stu) => (
                                        <tr key={stu.id} className="hover:bg-brand-soft/5 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black border dark:border-slate-700">
                                                    #{stu.roll_number || '00'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-black text-slate-700 dark:text-slate-200 text-sm">{stu.full_name}</p>
                                                    <p className="text-[10px] font-bold text-brand-light dark:text-slate-500 uppercase">{stu.student_id}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs">
                                                        <FiUser size={12} className="text-brand-light dark:text-brand" />
                                                        <span className="opacity-60 text-[10px]">F:</span> {stu.father_name || '—'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs">
                                                        <FiUser size={12} className="text-brand-light dark:text-brand" />
                                                        <span className="opacity-60 text-[10px]">M:</span> {stu.mother_name || '—'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs capitalize">
                                                    <FiHome className="text-brand-light dark:text-brand opacity-50" size={14} />
                                                    {stu.village || 'No Address'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${stu.status === 'active'
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                    {stu.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW */}
                        <div className="md:hidden divide-y divide-brand-soft/20 dark:divide-slate-800">
                            {loading ? (
                                <div className="p-10 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                                    <p className="text-[10px] font-black text-brand-light dark:text-slate-500 uppercase tracking-widest">Loading...</p>
                                </div>
                            ) : filteredStudents.map((stu) => (
                                <div key={stu.id} className="p-5 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3">
                                            <div className="h-10 w-10 bg-brand-soft dark:bg-slate-800 rounded-xl flex items-center justify-center text-brand font-black text-xs border dark:border-slate-700">
                                                {stu.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight">{stu.full_name}</p>
                                                <p className="text-[10px] font-bold text-brand-light dark:text-slate-500 uppercase tracking-tight">{stu.student_id}</p>
                                            </div>
                                        </div>
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-lg text-[9px] font-black border dark:border-slate-700">
                                            #{stu.roll_number || '00'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="space-y-1.5">
                                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Parent Details</p>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                                                    <span className="w-3 h-3 rounded-full bg-brand-light/10 dark:bg-brand/20 flex items-center justify-center text-[8px] text-brand">F</span>
                                                    {stu.father_name || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                                                    <span className="w-3 h-3 rounded-full bg-brand-light/10 dark:bg-brand/20 flex items-center justify-center text-[8px] text-brand">M</span>
                                                    {stu.mother_name || '—'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 border-t border-slate-200/50 dark:border-slate-700 pt-2">
                                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Address</p>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-[11px] capitalize">
                                                <FiHome size={10} className="text-brand-light dark:text-brand" />
                                                {stu.village || 'No Address Provided'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${stu.status === 'active'
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                                            }`}>
                                            {stu.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}