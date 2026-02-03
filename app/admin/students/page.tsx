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

    const grades = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
    const sections = ["A", "B", "C", "D"]

const fetchData = useCallback(async () => {
    setLoading(true)
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                parents (
                    email, 
                    temp_password, 
                    full_name
                )
            `)
            .order('class_name', { ascending: true })

        if (error) throw error 
        setStudents(data || [])
    } catch (error: any) {
        console.error("Supabase Error:", error.message)
        // This will now show you if any other columns are missing
        toast.error(`Database Error: ${error.message}`) 
    } finally {
        setLoading(false)
    }
}, [])

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
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 bg-[#fffcfd] min-h-screen">
            <Toaster position="top-center" richColors />

            <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-soft rounded-3xl flex items-center justify-center text-brand-light border border-brand-soft shadow-sm">
                        <FiUser size={30} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Student Registry</h1>
                        <p className="text-brand-light font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Enrollment Management System</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* EXPORT DROPDOWN */}
                    <div className="relative group">
                        <button className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-700 transition-all">
                            <FiDownload size={18} /> Export
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                            <button
                                onClick={() => exportToCSV(students, 'all_students')}
                                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-brand-soft/20 hover:text-brand-light transition-colors border-b border-slate-50"
                            >
                                All Students ({students.length})
                            </button>
                            <button
                                onClick={() => exportToCSV(filteredStudents, `grade_${selectedClass}`)}
                                className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-brand-soft/20 hover:text-brand-light transition-colors"
                            >
                                Current View ({filteredStudents.length})
                            </button>
                        </div>
                    </div>


                </div>
            </header>

            {/* FILTERS */}
            <div className="bg-white p-4 rounded-[2.5rem] border border-brand-soft flex flex-col lg:flex-row gap-4 items-center shadow-sm">
                <div className="relative flex-1 w-full">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-light" />
                    <input
                        type="text"
                        placeholder="Search student name or ID..."
                        className="w-full pl-14 pr-6 py-4 bg-brand-soft/20 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-brand-light"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center bg-brand-soft/30 px-4 rounded-2xl w-full lg:w-auto">
                    <FiFilter className="text-brand-light mr-2" size={14} />
                    <select
                        value={selectedClass}
                        className="w-full bg-transparent border-none py-4 font-black text-slate-700 text-[11px] uppercase cursor-pointer outline-none"
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="All">All Grades</option>
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="bg-white rounded-[3rem] border border-brand-soft overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-brand-soft/10 text-[10px] font-black text-brand-light uppercase tracking-widest border-b border-brand-soft">
                            <th className="px-10 py-7">Student Information</th>
                            <th className="px-8 py-7">Class Details</th>
                            <th className="px-8 py-7">Parent Status</th>
                            <th className="px-10 py-7 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-soft/10">
                        {loading ? (
                            <tr><td colSpan={4} className="p-32 text-center animate-pulse text-brand-light font-black tracking-widest">LOADING...</td></tr>
                        ) : filteredStudents.map((stu) => (
                            <tr key={stu.id} className="hover:bg-brand-soft/5 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand-soft text-brand-light rounded-xl flex items-center justify-center font-black">
                                            {stu.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-sm">{stu.full_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{stu.student_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                        <span className="text-xs font-black text-slate-700">{stu.class_name} - {stu.section}</span>
                                        <span className="text-[10px] font-bold text-brand-light">#{stu.roll_number}</span>
                                    </div>
                                </td>
                               <td className="px-8 py-6">
    {/* Check if parents exists and handle both Object and Array formats */}
    { (Array.isArray(stu.parents) ? stu.parents.length > 0 : !!stu.parents) ? (
        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 
            Account Active
        </div>
    ) : (
        <div className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter italic">
            No Parent Linked
        </div>
    )}
</td>
                                <td className="px-10 py-6">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => setViewingStudent(stu)} className="p-3 bg-brand-soft/50 text-brand-light rounded-xl hover:bg-brand-light hover:text-white transition-all"><FiEye size={16} /></button>
                                        <button
onClick={() => handleDelete(stu.id)}
                                            title={stu.attendance_count > 0 ? "Attendance exists" : "Delete student"}
                                            className={`p-3 rounded-xl transition-all ${stu.attendance_count > 0
                                                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                                : "bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white"
                                                }`}
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* HORIZONTAL VIEW MODAL */}
            {viewingStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setViewingStudent(null)} className="absolute right-8 top-8 z-10 p-2 bg-slate-100 text-slate-400 hover:text-rose-500 rounded-full transition-all"><FiX size={24} /></button>
                        <div className="flex flex-col md:flex-row">
                            <div className="w-full md:w-1/3 bg-brand-soft/20 p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-brand-soft/30">
                                <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center text-brand-light mb-6 font-black text-4xl shadow-xl border-4 border-white">{viewingStudent.full_name.charAt(0)}</div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center leading-tight">{viewingStudent.full_name}</h3>
                                <div className="mt-4 px-4 py-2 bg-brand-light text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">{viewingStudent.student_id}</div>
                            </div>
                            <div className="w-full md:w-2/3 p-12 space-y-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2"><FiLayers className="text-brand-light" /> Academic Profile</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoBox label="Grade / Class" value={viewingStudent.class_name} />
                                        <InfoBox label="Section" value={viewingStudent.section} />
                                        <InfoBox label="Roll Number" value={`#${viewingStudent.roll_number}`} />
                                        <InfoBox label="Parent Contact" value={viewingStudent.parent_phone} />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-[10px] font-black text-brand-light uppercase mb-4 tracking-widest flex items-center gap-2"><FiLock /> Parent Portal</h4>
                                    {(() => {
                                        const parent = Array.isArray(viewingStudent.parents) ? viewingStudent.parents[0] : viewingStudent.parents;
                                        if (parent) return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Login Email</p>
                                                    <p className="text-sm font-black text-slate-700 truncate">{parent.email}</p>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Temp Password</p>
                                                    <p className="text-sm font-mono font-black text-brand-light">{parent.temp_password}</p>
                                                </div>
                                            </div>
                                        )
                                        return (
                                            <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                                                <FiAlertCircle className="text-amber-500" size={24} /><p className="text-[10px] font-black text-amber-700 uppercase">Parent Not Found</p>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    )
}

function InfoBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-brand-soft transition-colors">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="font-black text-slate-700 text-sm group-hover:text-brand-light transition-colors">{value}</p>
        </div>
    )
}