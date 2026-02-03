'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiClock, FiCalendar, FiMapPin, FiBookOpen, 
    FiActivity, FiRefreshCw, FiAlertCircle, FiX, FiFilter 
} from 'react-icons/fi'

export default function TeacherExamTimetable() {
    const [timetable, setTimetable] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // States for filtering and assignments
    const [teacherAssignments, setTeacherAssignments] = useState<any[]>([])
    const [selectedFilterClass, setSelectedFilterClass] = useState<string>('all')
    
    // State for the Detail View
    const [selectedExam, setSelectedExam] = useState<any | null>(null)
    const [subjectDetails, setSubjectDetails] = useState<any[]>([])
    const [loadingDetails, setLoadingDetails] = useState(false)

    useEffect(() => {
        fetchTeacherSchedule()
    }, [])

    async function fetchTeacherSchedule() {
        try {
            setLoading(true)
            const email = localStorage.getItem('teacherEmail')
            if (!email) return

            // 1. Get Teacher ID
            const { data: teacherData } = await supabase.from('teachers').select('id').eq('email', email).single()
            if (!teacherData) throw new Error("Teacher profile not found")

            // 2. Get Teacher's assigned classes and subjects
            const { data: assignments } = await supabase
                .from('subject_assignments')
                .select('class_name, section, subject_id, subjects(name)')
                .eq('teacher_id', teacherData.id)

            if (assignments) {
                setTeacherAssignments(assignments)
                
                // Format classes for the overlaps query (e.g., "10-A")
                const classStrings = assignments.map(a => {
                    const numOnly = a.class_name.replace(/(st|nd|rd|th)/gi, '').trim()
                    return `${numOnly}-${a.section.trim()}`
                })

                // 3. Fetch Exams overlapping with teacher's classes
                const { data: exams, error: eError } = await supabase
                    .from('exams')
                    .select('*')
                    .overlaps('classes', classStrings) 
                    .order('start_date', { ascending: true })

                if (eError) throw eError
                setTimetable(exams || [])
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Filtered Timetable based on Dropdown
    const filteredTimetable = selectedFilterClass === 'all' 
        ? timetable 
        : timetable.filter(exam => exam.classes.includes(selectedFilterClass))

    async function viewFullSheet(exam: any) {
        setSelectedExam(exam)
        setLoadingDetails(true)
        try {
            const { data, error } = await supabase
                .from('exam_syllabus')
                .select('*, subjects(name)')
                .eq('exam_name', exam.exam_name)
                // Filter syllabus specifically to classes this teacher handles
                .in('class_name', teacherAssignments.map(a => a.class_name))
            
            if (error) throw error
            setSubjectDetails(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingDetails(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FDFCFD] p-6 md:p-10 relative">
            {/* --- HEADER --- */}
            <div className="bg-brand-soft p-10 rounded-[3rem] border border-brand-light/10 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-white rounded-[2rem] shadow-sm text-brand-light border border-brand-soft">
                            <FiCalendar size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-brand-dark tracking-tight uppercase">My Exam Schedule</h1>
                            <p className="text-brand-light font-bold text-xs uppercase tracking-widest mt-1">Class-Specific Timings</p>
                        </div>
                    </div>

                    {/* --- TOP FILTER --- */}
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-brand-soft w-full md:w-auto">
                        <div className="pl-3 text-brand-light"><FiFilter /></div>
                        <select 
                            className="bg-transparent border-none text-sm font-black text-brand-dark focus:ring-0 cursor-pointer pr-10"
                            value={selectedFilterClass}
                            onChange={(e) => setSelectedFilterClass(e.target.value)}
                        >
                            <option value="all">All My Classes</option>
                            {teacherAssignments.map((a, i) => {
                                const val = `${a.class_name.replace(/(st|nd|rd|th)/gi, '').trim()}-${a.section.trim()}`;
                                return <option key={i} value={val}>Grade {a.class_name}-{a.section}</option>
                            })}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- EXAM GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center font-black text-brand-light animate-pulse uppercase">Syncing your assignments...</div>
                ) : filteredTimetable.length > 0 ? (
                    filteredTimetable.map((exam) => {
                        // Find which of the teacher's assignments belong to THIS specific exam card
                        const relevantAssignments = teacherAssignments.filter(a => {
                            const formatted = `${a.class_name.replace(/(st|nd|rd|th)/gi, '').trim()}-${a.section.trim()}`;
                            return exam.classes.includes(formatted);
                        });

                        return (
                            <div key={exam.id} className="bg-white p-8 rounded-[2.5rem] border border-brand-soft shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-brand-dark text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                                        {new Date(exam.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-brand uppercase">Standard Time</span>
                                        <span className="text-xs font-bold text-slate-400">09:00 AM - 12:00 PM</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-brand-dark uppercase mb-4 leading-tight">{exam.exam_name}</h3>
                                
                                <div className="space-y-4 mb-8">
                                    <p className="text-[10px] font-black text-brand-light uppercase tracking-widest">Your Assigned Subjects:</p>
                                    {relevantAssignments.map((ra, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-brand-soft/50 p-3 rounded-xl border border-brand-soft">
                                            <FiBookOpen className="text-brand" />
                                            <div>
                                                <p className="text-xs font-black text-brand-dark uppercase">{ra.subjects?.name}</p>
                                                <p className="text-[10px] font-bold text-brand-light uppercase">Grade {ra.class_name}-{ra.section}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-brand-soft">
                        <FiAlertCircle size={48} className="mx-auto text-brand-light opacity-20 mb-4" />
                        <p className="font-black text-brand-light uppercase text-xs">No exams found for the selected filter</p>
                    </div>
                )}
            </div>

        </div>
    )
}