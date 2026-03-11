'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiSearch, FiFilter, FiUser, FiPlus, FiX, FiLayers,
    FiTrash2, FiEdit3, FiEye, FiLock, FiAlertCircle, FiDownload
} from 'react-icons/fi'
import { toast, Toaster } from 'sonner'

export default function AdminStudentDirectory() {
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewingStudent, setViewingStudent] = useState<any>(null)
    const [editMode, setEditMode] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('All')

    const [formData, setFormData] = useState({
        id: '',
        student_id: '',
        full_name: '',
        parent_phone: '',
        class_name: '',
        section: '',
        roll_number: '',
        status: 'active',
        academic_year: '2026-27'
    })

    const grades = ["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
    const sections = ["A", "B", "C", "D"]

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                *,
                parents:parents_child_fkey (
                    full_name,
                    phone_number
                )
            `) // Removed email/password, added phone_number
                .order('class_name', { ascending: true })

            if (error) throw error
            setStudents(data || [])
        } catch (error: any) {
            toast.error(`Database Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesClass = selectedClass === 'All' || s.class_name === selectedClass
            return matchesSearch && matchesClass
        })
    }, [students, searchTerm, selectedClass])

    // --- EXPORT LOGIC ---
    const exportToCSV = (data: any[], fileName: string) => {
        if (data.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Student ID,Full Name,Grade,Section,Roll No,Parent Phone,Parent Email\n"];
        const rows = data.map(s => {
            const p = Array.isArray(s.parents) ? s.parents[0] : s.parents;
            return `${s.student_id},${s.full_name},${s.class_name},${s.section},${s.roll_number},${s.parent_phone},${p?.email || 'N/A'}`;
        }).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${data.length} records`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const payload = { ...formData }
        if (!editMode) {
            delete (payload as any).id
            if (!payload.student_id) payload.student_id = `STU-${Date.now().toString().slice(-6)}`
        }

        const { error } = editMode
            ? await supabase.from('students').update(payload).eq('id', formData.id)
            : await supabase.from('students').insert([payload])

        if (error) {
            error.code === '23505' ? toast.error("Duplicate ID") : toast.error(error.message)
        } else {
            toast.success(editMode ? "Record Updated" : "Student Enrolled")
            setIsModalOpen(false)
            fetchData()
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("This will delete the student AND all attendance records. Continue?")) return

        // 1️⃣ Delete attendance FIRST
        const { error: attendanceError } = await supabase
            .from('attendance')
            .delete()
            .eq('student_id', id)

        if (attendanceError) {
            console.error(attendanceError)
            toast.error("Failed to delete attendance records")
            return
        }

        // 2️⃣ Now delete student
        const { error: studentError } = await supabase
            .from('students')
            .delete()
            .eq('id', id)

        if (studentError) {
            console.error(studentError)
            toast.error(studentError.message)
        } else {
            toast.success("Student and attendance deleted successfully")
            fetchData()
        }
    }

return (
    // Main Container: Swaps from a soft off-white to deep slate
    <div className="max-w-9xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 transition-colors duration-500
        bg-[#fcfcfd] dark:bg-slate-950 text-slate-900 dark:text-slate-200">
        
        <Toaster position="top-center" richColors theme="dark" />

        {/* HEADER & EXPORT */}
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
                        Enrollment Management System
                    </p>
                </div>
            </div>

            <div className="w-full md:w-auto">
                <div className="relative group">
                    <button className="w-full md:w-auto bg-brand-light text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-light/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                        <FiDownload size={18} /> Export
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-full md:w-48 border transition-all z-50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
                        <button onClick={() => exportToCSV(students, 'all_students')} className="w-full text-left px-5 py-3 text-[10px] font-black uppercase transition-colors border-b
                            text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800">
                            All Students ({students.length})
                        </button>
                        <button onClick={() => exportToCSV(filteredStudents, `grade_${selectedClass}`)} className="w-full text-left px-5 py-3 text-[10px] font-black uppercase transition-colors
                            text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                            Current View ({filteredStudents.length})
                        </button>
                    </div>
                </div>
            </div>
        </header>

        {/* FILTERS BAR */}
        <div className="p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] border flex flex-col md:flex-row gap-3 items-center transition-all
            bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl">
            <div className="relative flex-1 w-full">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                    type="text"
                    placeholder="Search name or ID..."
                    className="w-full pl-12 pr-6 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-brand-light transition-all
                        bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    <option value="All" className="dark:bg-slate-900">All Grades</option>
                    {grades.map(g => <option key={g} value={g} className="dark:bg-slate-900">{g}</option>)}
                </select>
            </div>
        </div>

        {/* DATA CONTAINER */}
        <div className="rounded-[2rem] md:rounded-[3rem] border overflow-hidden transition-all
            bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl">
            
            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b
                            bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800">
                            <th className="px-10 py-7">Student Information</th>
                            <th className="px-8 py-7">Class Details</th>
                            <th className="px-8 py-7">Parent Status</th>
                            <th className="px-10 py-7 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={4} className="p-32 text-center animate-pulse text-brand-light font-black tracking-widest">LOADING...</td></tr>
                        ) : filteredStudents.map((stu) => (
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
                                        <button onClick={() => setViewingStudent(stu)} className="p-3 rounded-xl transition-all border
                                            bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-brand-light hover:text-white border-slate-200 dark:border-slate-700">
                                            <FiEye size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(stu.id)} className={`p-3 rounded-xl transition-all border 
                                            ${stu.attendance_count > 0 
                                                ? "bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 cursor-not-allowed" 
                                                : "bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-100 dark:border-rose-900/50 hover:bg-rose-500 hover:text-white"}`}>
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOBILE LIST VIEW */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((stu) => (
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
                                <button onClick={() => setViewingStudent(stu)} className="p-2.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"><FiEye size={14} /></button>
                                <button onClick={() => handleDelete(stu.id)} className="p-2.5 rounded-lg border bg-white dark:bg-rose-950/30 text-rose-500 border-slate-200 dark:border-rose-900/50"><FiTrash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* MODAL SECTION */}
        {viewingStudent && (
            <div className="fixed inset-0 backdrop-blur-xl z-[60] flex items-end md:items-center justify-center p-0 md:p-4
                bg-slate-900/40 dark:bg-slate-950/80">
                <div className="w-full max-w-4xl rounded-t-[2.5rem] md:rounded-[3.5rem] shadow-2xl border transition-all duration-300 relative overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95
                    bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                    
                    <button onClick={() => setViewingStudent(null)} className="absolute right-6 top-6 md:right-8 md:top-8 z-10 p-2 rounded-full transition-colors
                        bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">
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
    </div>
);
}

function InfoBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-5 rounded-2xl border transition-all duration-300 group
            /* Light Mode: White background, soft gray border */
            bg-white border-slate-100 shadow-sm hover:border-brand-soft hover:shadow-md
            /* Dark Mode: Deep slate background, darker border */
            dark:bg-slate-950 dark:border-slate-800 dark:hover:border-brand-light/50 dark:shadow-none">
            
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 transition-colors
                /* Light Mode: Subtle gray */
                text-slate-400 group-hover:text-slate-500
                /* Dark Mode: Muted slate */
                dark:text-slate-500 dark:group-hover:text-slate-400">
                {label}
            </p>
            
            <p className="font-black text-sm transition-colors
                /* Light Mode: Sharp dark text */
                text-slate-700 group-hover:text-brand-light
                /* Dark Mode: Bright off-white */
                dark:text-slate-200 dark:group-hover:text-brand-light">
                {value}
            </p>
        </div>
    )
}