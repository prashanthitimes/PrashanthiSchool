'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiSearch, FiFilter, FiUser, FiPlus, FiX, FiLayers, FiArrowUpRight, FiCalendar,
    FiTrash2, FiEdit3, FiEye, FiLock, FiAlertCircle, FiDownload, FiTrendingUp
} from 'react-icons/fi'
import { toast, Toaster } from 'sonner'

type Student = {
    id: string
    student_id: string
    full_name: string
    parent_phone: string
    class_name: string
    section: string
    roll_number: string
    status: string
    academic_year: string
    parents?: {
        full_name: string
        phone_number: string
        email?: string
    }
}

type PromotionHistory = {
    id: string
    student_id: string
    from_class_name: string
    from_section: string
    from_roll_number: string
    from_academic_year: string
    to_class_name: string
    to_section: string
    to_roll_number: string
    to_academic_year: string
    promoted_at: string
}

export default function AdminStudentDirectory() {
    const [activeTab, setActiveTab] = useState<'current' | 'promotions'>('current')
    const [students, setStudents] = useState<Student[]>([])
    const [promotionHistory, setPromotionHistory] = useState<PromotionHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('All')
    const [selectedYear, setSelectedYear] = useState('2026-27')
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
    const [promotionStudent, setPromotionStudent] = useState<Student | null>(null)
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)

    const grades = ["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
    const sections = ["A", "B", "C", "D"]
    const currentYear = '2026-27'
    const nextYear = '2027-28'

    // Fetch current students
    const fetchCurrentStudents = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    *,
                    parents:parents_child_fkey (
                        full_name,
                        phone_number,
                        email
                    )
                `)
                .eq('academic_year', currentYear)
                .order('class_name', { ascending: true })
                .order('roll_number', { ascending: true })

            if (error) throw error
            setStudents(data || [])
        } catch (error: any) {
            toast.error(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch promotion history
    const fetchPromotionHistory = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('student_promotions')
                .select('*')
                .eq('to_academic_year', nextYear)
                .order('promoted_at', { ascending: false })

            if (error) throw error
            setPromotionHistory(data || [])
        } catch (error: any) {
            toast.error(`Error loading promotions: ${error.message}`)
        }
    }, [])

    useEffect(() => {
        if (activeTab === 'current') {
            fetchCurrentStudents()
        } else {
            fetchPromotionHistory()
        }
    }, [activeTab, fetchCurrentStudents, fetchPromotionHistory])

    const filteredCurrentStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesClass = selectedClass === 'All' || s.class_name === selectedClass
            return matchesSearch && matchesClass
        })
    }, [students, searchTerm, selectedClass])

    const filteredPromotions = useMemo(() => {
        return promotionHistory.filter(p => {
            const matchesSearch = p.student_id.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesClass = selectedClass === 'All' || p.to_class_name === selectedClass
            return matchesSearch && matchesClass
        })
    }, [promotionHistory, searchTerm, selectedClass])

    // PROMOTE STUDENT
    const handlePromoteStudent = async (student: Student) => {
        if (!confirm(`Promote ${student.full_name} to next grade?`)) return

        try {
            // 1. Record promotion history
            const promotionRecord = {
                student_id: student.id,
                from_class_name: student.class_name,
                from_section: student.section,
                from_roll_number: student.roll_number,
                from_academic_year: currentYear,
                to_class_name: getNextGrade(student.class_name),
                to_section: student.section, // Keep same section
                to_roll_number: student.roll_number, // Keep same roll number
                to_academic_year: nextYear
            }

            const { error: promoError } = await supabase
                .from('student_promotions')
                .insert([promotionRecord])

            if (promoError) throw promoError

            // 2. Update student record for next year
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    class_name: promotionRecord.to_class_name,
                    academic_year: nextYear,
                    status: 'active'
                })
                .eq('id', student.id)

            if (updateError) throw updateError

            toast.success(`${student.full_name} promoted to ${promotionRecord.to_class_name} ${promotionRecord.to_section}!`)
            fetchCurrentStudents()
            fetchPromotionHistory()
            setPromotionStudent(null)

        } catch (error: any) {
            toast.error(`Promotion failed: ${error.message}`)
        }
    }

    const getNextGrade = (currentGrade: string): string => {
        const gradeOrder = ["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
        const currentIndex = gradeOrder.indexOf(currentGrade)
        return currentIndex < gradeOrder.length - 1 ? gradeOrder[currentIndex + 1] : currentGrade
    }

    const exportToCSV = (data: any[], fileName: string) => {
        if (data.length === 0) {
            toast.error("No data to export")
            return
        }

        const headers = ["Student ID,Full Name,Grade,Section,Roll No,Parent Phone,Academic Year\n"]
        const rows = data.map(s =>
            `${s.student_id},${s.full_name},${s.class_name},${s.section},${s.roll_number},${s.parent_phone || 'N/A'},${s.academic_year || 'N/A'}`
        ).join("\n")

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Exported ${data.length} records`)
    }

    const handlePromoteAll = async () => {
        if (!confirm(`Are you sure you want to promote all current students to next grade?`)) return

        try {
            const promotions = students.map(student => ({
                student_id: student.id,
                from_class_name: student.class_name,
                from_section: student.section,
                from_roll_number: student.roll_number,
                from_academic_year: currentYear,
                to_class_name: getNextGrade(student.class_name),
                to_section: student.section,
                to_roll_number: student.roll_number,
                to_academic_year: nextYear
            }))

            // 1. Insert all promotion records
            const { error: promoError } = await supabase
                .from('student_promotions')
                .insert(promotions)

            if (promoError) throw promoError

            // 2. Update all student records for next year
            for (const student of students) {
                const { error: updateError } = await supabase
                    .from('students')
                    .update({
                        class_name: getNextGrade(student.class_name),
                        academic_year: nextYear,
                        status: 'active'
                    })
                    .eq('id', student.id)

                if (updateError) throw updateError
            }

            toast.success(`All students promoted successfully!`)
            fetchCurrentStudents()
            fetchPromotionHistory()

        } catch (error: any) {
            toast.error(`Promotion failed: ${error.message}`)
        }
    }

    return (
        <div className="max-w-9xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 transition-colors duration-500
            bg-[#fcfcfd] dark:bg-slate-950 text-slate-900 dark:text-slate-200">

            <Toaster position="top-center" richColors theme="dark" />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 self-start">
                    <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-brand-light transition-all
                        bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
                        <FiUser size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-3xl font-black tracking-tight uppercase leading-none
                            text-slate-900 dark:text-white">
                            Student Registry
                        </h1>
                        <p className="text-brand-light font-bold text-[8px] md:text-[10px] tracking-[0.2em] uppercase opacity-70 mt-1">
                            {activeTab === 'current' ? 'Current Enrollment' : 'Promotion Management'}
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <div className="relative group">
                        <button
                            onClick={() => exportToCSV(
                                activeTab === 'current' ? students : promotionHistory,
                                activeTab === 'current' ? 'current_students' : 'promotions'
                            )}
                            className="w-full md:w-auto bg-brand-light text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-light/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <FiDownload size={18} /> Export
                        </button>
                        <button
                            onClick={() => handlePromoteAll()}
                            className="ml-3 w-full md:w-auto bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                        >
                            <FiArrowUpRight size={18} /> Promote All
                        </button>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <div className="flex bg-white dark:bg-slate-900 border rounded-[2rem] md:rounded-[3rem] border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl overflow-hidden">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`flex-1 py-6 px-8 font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3
                        ${activeTab === 'current'
                            ? 'bg-brand-light text-white shadow-lg'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <FiLayers size={18} />
                    Current Students ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab('promotions')}
                    className={`flex-1 py-6 px-8 font-black text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3
                        ${activeTab === 'promotions'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <FiTrendingUp size={18} />
                    Promotions ({promotionHistory.length})
                </button>
            </div>

            {/* FILTERS BAR */}
            <div className="p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] border flex flex-col md:flex-row gap-3 items-center transition-all
                bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl">

                <div className="relative flex-1 w-full">
                    <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'current' ? 'name or ID...' : 'student ID...'}`}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-brand-light transition-all
                            bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                    />
                </div>

                <div className="flex items-center px-4 rounded-2xl w-full md:w-auto border transition-all
                    bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <FiFilter className="text-slate-400 dark:text-slate-500 mr-2" size={14} />
                    <select
                        value={selectedClass}
                        className="w-full bg-transparent border-none py-4 font-black text-[11px] uppercase cursor-pointer outline-none
                            text-slate-600 dark:text-slate-300"
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="All">All Grades</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
            </div>

            {/* DATA TABLE - CURRENT STUDENTS */}
            {activeTab === 'current' && (
                <div className="rounded-[2rem] md:rounded-[3rem] border overflow-hidden transition-all
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl">

                    <div className="hidden md:block">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b
                                    bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800">
                                    <th className="px-10 py-7">Student Information</th>
                                    <th className="px-8 py-7">Class Details</th>
                                    <th className="px-8 py-7">Parent Status</th>
                                    <th className="px-10 py-7 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-32 text-center animate-pulse text-brand-light font-black tracking-widest">LOADING...</td></tr>
                                ) : filteredCurrentStudents.map((stu) => (
                                    <tr key={stu.id} className="transition-all group hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black border transition-all
                                                    bg-slate-100 dark:bg-slate-800 text-brand-light border-slate-200 dark:border-slate-700">
                                                    {stu.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-sm text-slate-800 dark:text-slate-100">{stu.full_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{stu.student_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border transition-all
                                                bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{stu.class_name} - {stu.section}</span>
                                                <span className="text-[10px] font-bold text-brand-light">#{stu.roll_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {stu.parents ? (
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                    Account Active
                                                </div>
                                            ) : (
                                                <div className="text-slate-400 dark:text-slate-600 font-bold text-[10px] uppercase italic">No Parent Linked</div>
                                            )}
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setViewingStudent(stu)}
                                                    className="p-3 rounded-xl transition-all border bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-brand-light hover:text-white border-slate-200 dark:border-slate-700"
                                                    title="View Details"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setPromotionStudent(stu)}
                                                    className="p-3 rounded-xl transition-all border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-100 dark:border-emerald-900/50"
                                                    title="Promote to Next Grade"
                                                >
                                                    <FiArrowUpRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE LIST VIEW - CURRENT STUDENTS */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCurrentStudents.map((stu) => (
                            <div key={stu.id} className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border
                                            bg-slate-100 dark:bg-slate-800 text-brand-light border-slate-200 dark:border-slate-700">
                                            {stu.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-xs text-slate-800 dark:text-slate-100">{stu.full_name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{stu.student_id}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-1 rounded border
                                        bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800">
                                        {stu.class_name}-{stu.section}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl border
                                    bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800">
                                    {stu.parents ? (
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                                        </div>
                                    ) : (
                                        <div className="text-slate-400 dark:text-slate-600 font-bold text-[9px] uppercase">No Parent</div>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setViewingStudent(stu)}
                                            className="p-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                        >
                                            <FiEye size={14} />
                                        </button>
                                        <button
                                            onClick={() => setPromotionStudent(stu)}
                                            className="p-2.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900/50"
                                        >
                                            <FiArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DATA TABLE - PROMOTIONS */}
            {activeTab === 'promotions' && (
                <div className="rounded-[2rem] md:rounded-[3rem] border overflow-hidden transition-all
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl">

                    <div className="hidden md:block">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b
                                    bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800">
                                    <th className="px-10 py-7">Student Information</th>
                                    <th className="px-10 py-7">From (Previous)</th>
                                    <th className="px-10 py-7">To (Current)</th>
                                    <th className="px-8 py-7 text-center">Promoted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-32 text-center animate-pulse text-emerald-500 font-black tracking-widest">LOADING PROMOTIONS...</td></tr>
                                ) : filteredPromotions.map((promo) => (
                                    <tr key={promo.id} className="transition-all group hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black border transition-all
                                                    bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200 dark:border-emerald-800/50">
                                                    {/* Fetch student name from students table or cache it */}
                                                    {promo.student_id.slice(-4)}
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-sm text-slate-800 dark:text-slate-100">{promo.student_id}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Promoted ✓</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="inline-flex flex-col gap-1">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{promo.from_class_name}-{promo.from_section}</span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{promo.from_roll_number}</span>
                                                <span className="text-[9px] text-slate-400 dark:text-slate-500">{promo.from_academic_year}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="inline-flex flex-col gap-1">
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{promo.to_class_name}-{promo.to_section}</span>
                                                <span className="text-[10px] font-bold text-emerald-500">#{promo.to_roll_number}</span>
                                                <span className="text-[9px] text-emerald-500">{promo.to_academic_year}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                {new Date(promo.promoted_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE PROMOTIONS VIEW */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPromotions.map((promo) => (
                            <div key={promo.id} className="p-6 space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border
                                            bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200 dark:border-emerald-800/50">
                                            {promo.student_id.slice(-4)}
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-sm text-slate-800 dark:text-slate-100">{promo.student_id}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">✓ Promoted</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-center p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</p>
                                        <p className="font-black text-emerald-600">{promo.from_class_name}-{promo.from_section}</p>
                                        <p className="text-[9px] text-slate-500">#{promo.from_roll_number}</p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 dark:border-slate-700 pl-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</p>
                                        <p className="font-black text-emerald-600">{promo.to_class_name}-{promo.to_section}</p>
                                        <p className="text-[9px] text-slate-500">#{promo.to_roll_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase">
                                        <FiCalendar size={12} />
                                        {new Date(promo.promoted_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STUDENT VIEW MODAL */}
            {viewingStudent && (
                <div className="fixed inset-0 backdrop-blur-xl z-[60] flex items-end md:items-center justify-center p-0 md:p-4
                    bg-slate-900/40 dark:bg-slate-950/80">
                    <div className="w-full max-w-4xl rounded-t-[2.5rem] md:rounded-[3.5rem] shadow-2xl border transition-all duration-300 relative overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95
                        bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">

                        <button
                            onClick={() => setViewingStudent(null)}
                            className="absolute right-6 top-6 md:right-8 md:top-8 z-10 p-2 rounded-full transition-colors
                                bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        >
                            <FiX size={20} />
                        </button>

                        <div className="flex flex-col md:flex-row">
                            {/* Profile Side */}
                            <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r transition-colors
                                bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center text-brand-light mb-4 md:mb-6 font-black text-3xl md:text-4xl shadow-xl border-4
                                    bg-white dark:bg-slate-900 border-white dark:border-slate-800">
                                    {viewingStudent.full_name.charAt(0)}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-center leading-tight text-slate-900 dark:text-white">
                                    {viewingStudent.full_name}
                                </h3>
                                <div className="mt-3 px-4 py-1.5 bg-brand-light text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                                    {viewingStudent.student_id}
                                </div>
                            </div>

                            {/* Details Side */}
                            <div className="w-full md:w-2/3 p-8 md:p-12 space-y-6 md:space-y-8">
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <InfoBox label="Grade" value={viewingStudent.class_name} />
                                    <InfoBox label="Section" value={viewingStudent.section} />
                                    <InfoBox label="Roll No" value={`#${viewingStudent.roll_number}`} />
                                    <InfoBox label="Phone" value={viewingStudent.parent_phone} />
                                    <InfoBox label="Year" value={currentYear} icon={FiCalendar} />
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black text-brand-light uppercase mb-4 tracking-widest flex items-center gap-2">
                                        <FiUser /> Guardian Details
                                    </h4>
                                    {viewingStudent.parents ? (
                                        <div className="p-4 rounded-2xl border flex justify-between items-center transition-colors
                                            bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Guardian Name</p>
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{viewingStudent.parents.full_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Contact Number</p>
                                                <p className="text-xs font-black text-brand-light">{viewingStudent.parents.phone_number || "N/A"}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-black border p-4 rounded-xl text-center uppercase
                                            text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-500 dark:bg-amber-950/20 dark:border-amber-900/30">
                                            No Parent Profile Linked
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PROMOTION CONFIRMATION MODAL */}
            {promotionStudent && (
                <div className="fixed inset-0 backdrop-blur-xl z-[70] flex items-center justify-center p-4
                    bg-slate-900/50 dark:bg-slate-950/90">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border transition-all duration-300 animate-in zoom-in-95
                        border-slate-200 dark:border-slate-800 p-8 space-y-6">

                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 border-4 border-emerald-200 dark:border-emerald-800/50">
                                <FiArrowUpRight size={32} className="animate-bounce" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                    Promote Student
                                </h3>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                    {promotionStudent.full_name}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Current</p>
                                    <div className="font-black text-lg text-slate-800 dark:text-slate-200">
                                        {promotionStudent.class_name}-{promotionStudent.section}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500">#{promotionStudent.roll_number}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-1">Next Year</p>
                                    <div className="font-black text-lg text-emerald-600">
                                        {getNextGrade(promotionStudent.class_name)}-{promotionStudent.section}
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-500">#{promotionStudent.roll_number}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-emerald-200 dark:border-emerald-800/50">
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 text-center">
                                    Academic Year: <span className="text-emerald-600 font-black">{nextYear}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setPromotionStudent(null)}
                                className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all border
                                    bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700
                                    hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handlePromoteStudent(promotionStudent)}
                                className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-emerald-500/25
                                    bg-emerald-500 text-white hover:brightness-105 active:scale-95 hover:shadow-xl"
                            >
                                Confirm Promotion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function InfoBox({ label, value, icon: Icon }: {
    label: string,
    value: string,
    icon?: React.ElementType
}) {
    return (
        <div className="p-5 rounded-2xl border transition-all duration-300 group
            bg-white border-slate-100 shadow-sm hover:border-brand-soft hover:shadow-md
            dark:bg-slate-950 dark:border-slate-800 dark:hover:border-brand-light/50 dark:shadow-none">

            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className="w-3 h-3 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 flex-shrink-0" />}
                <p className="text-[9px] font-black uppercase tracking-widest mb-1 transition-colors
                    text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400">
                    {label}
                </p>
            </div>

            <p className="font-black text-sm transition-colors
                text-slate-700 group-hover:text-brand-light
                dark:text-slate-200 dark:group-hover:text-brand-light">
                {value}
            </p>
        </div>
    )
}