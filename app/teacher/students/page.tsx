'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiUsers, FiSearch, FiBook, FiChevronRight, 
    FiUser, FiPhone, FiMail, FiInfo, FiLayers, FiShield
} from 'react-icons/fi'

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
        if (!email) return

        const { data: teacher } = await supabase.from('teachers').select('id').eq('email', email).single()
        
        if (teacher) {
            const { data: allocated } = await supabase
                .from('subject_assignments')
                .select(`
                    id, class_name, section, academic_year,
                    subjects (name, code)
                `)
                .eq('teacher_id', teacher.id)
            
            setAllocations(allocated || [])
            if (allocated && allocated.length > 0) {
                handleClassSelect(allocated[0]) 
            }
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
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32">
            
            {/* --- HEADER (Same as Assignment Desk) --- */}
            <div className="px-6 pt-6">
                <div className="relative overflow-hidden bg-brand-soft p-10 rounded-[3rem] border border-brand-light/10 shadow-sm shadow-brand-soft/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white rounded-[2rem] shadow-sm text-brand-light border border-brand-soft">
                                <FiUsers size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark tracking-tight">Class Directory</h1>
                                <p className="text-brand-light font-bold text-sm mt-1 opacity-90">Access student records and parent contact info.</p>
                            </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white shadow-sm min-w-[160px]">
                            <p className="text-[10px] font-black text-brand-light uppercase tracking-widest text-center mb-1">Total Students</p>
                            <p className="text-4xl font-black text-brand-dark text-center">{students.length}</p>
                        </div>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-light/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            <div className="px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT: ALLOCATIONS --- */}
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] px-2 opacity-60">Allocated Classes</h2>
                    <div className="grid gap-3">
                        {allocations.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleClassSelect(item)}
                                className={`p-5 rounded-[2rem] border-2 transition-all text-left flex items-center justify-between
                                    ${selectedAllocation?.id === item.id 
                                        ? 'bg-brand text-white border-brand shadow-lg shadow-brand-soft' 
                                        : 'bg-white text-slate-600 border-transparent shadow-sm hover:border-brand-soft'}`}
                            >
                                <div>
                                    <p className={`text-[10px] font-black uppercase ${selectedAllocation?.id === item.id ? 'text-brand-soft' : 'text-brand-light'}`}>
                                        {item.subjects?.name}
                                    </p>
                                    <h3 className="font-black text-lg">Grade {item.class_name}-{item.section}</h3>
                                </div>
                                <FiChevronRight className={selectedAllocation?.id === item.id ? 'text-white' : 'text-brand-soft'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT: DETAILED STUDENT TABLE --- */}
                <div className="lg:col-span-9 space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-light opacity-60" />
                        <input 
                            type="text" 
                            placeholder="Search by student name or ID..."
                            className="w-full bg-white p-5 pl-16 rounded-[2rem] border-none shadow-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand-soft/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-brand-accent text-[10px] font-black text-brand-light uppercase tracking-[0.2em] border-b border-brand-soft">
                                        <th className="px-8 py-6">Roll</th>
                                        <th className="px-8 py-6">Student Identity</th>
                                        <th className="px-8 py-6">Parent Phone</th>
                                        <th className="px-8 py-6">Institutional Email</th>
                                        <th className="px-8 py-6 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-soft/30">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                                                    <p className="font-black text-brand-light text-xs uppercase tracking-widest">Synchronizing Records...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.map((stu) => (
                                        <tr key={stu.id} className="hover:bg-brand-soft/10 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="bg-brand-soft text-brand-dark px-3 py-1.5 rounded-xl text-[10px] font-black border border-brand-soft">
                                                    #{stu.roll_number}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div>
                                                    <p className="font-black text-slate-700 text-sm">{stu.full_name}</p>
                                                    <p className="text-[10px] font-bold text-brand-light uppercase tracking-tighter opacity-70">{stu.student_id}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-600 font-black text-xs">
                                                    <div className="w-7 h-7 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                                                        <FiPhone size={12}/>
                                                    </div>
                                                    {stu.parent_phone || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs italic">
                                                    <FiMail className="text-brand-light opacity-40" size={14}/>
                                                    {stu.email || '—'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    stu.status === 'active' 
                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                    {stu.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center">
                                                <p className="font-black text-slate-400 text-sm italic">No students found matching your search.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}