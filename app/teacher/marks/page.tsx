'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiEdit3, FiSave, FiAward, FiRefreshCw,
    FiCheckCircle, FiAlertCircle, FiSearch, FiBookOpen,FiMessageSquare,
    FiUserX 
} from 'react-icons/fi'

export default function MarksEntryPage() {
    const [allocations, setAllocations] = useState<any[]>([])
    const [selectedAlloc, setSelectedAlloc] = useState<any>(null)
    const [exams, setExams] = useState<any[]>([])
    const [selectedExam, setSelectedExam] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [marksData, setMarksData] = useState<{ [key: string]: { marks: string, remarks: string, status: string } }>({})
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAllocations()
    }, [])

    async function fetchAllocations() {
        const email = localStorage.getItem('teacherEmail')
        const { data: teacher } = await supabase.from('teachers').select('id').eq('email', email).single()
        if (teacher) {
            const { data: alloc } = await supabase.from('subject_assignments')
                .select(`id, teacher_id, class_name, section, subjects(id, name)`)
                .eq('teacher_id', teacher.id)
            setAllocations(alloc || [])
        }
    }

    async function handleClassSelect(alloc: any) {
        setSelectedAlloc(alloc);
        setSelectedExam(null);
        setExams([]);
        setStudents([]);

        const { data: syllabusData } = await supabase
            .from('exam_syllabus')
            .select('*')
            .eq('class_name', alloc.class_name)
            .eq('section', alloc.section)
            .eq('subject_id', alloc.subjects.id);

        if (syllabusData && syllabusData.length > 0) {
            const examNames = syllabusData.map(s => s.exam_name);
            const { data: examDetails } = await supabase
                .from('exams')
                .select('id, exam_name, total_marks, pass_marks')
                .in('exam_name', examNames);

            const combinedData = syllabusData.map(s => ({
                ...s,
                exams: examDetails?.find(e => e.exam_name === s.exam_name) || { total_marks: 100, pass_marks: 33 }
            }));
            setExams(combinedData);
        }
    }

    async function handleExamSelect(exam: any) {
        setSelectedExam(exam)
        setLoading(true)
        const { data: studentList } = await supabase.from('students')
            .select('id, full_name, roll_number, student_id')
            .eq('class_name', exam.class_name)
            .eq('section', exam.section)
            .order('roll_number', { ascending: true })

        const { data: existingMarks } = await supabase.from('exam_marks').select('*').eq('syllabus_id', exam.id)

        const marksMap: any = {}
        studentList?.forEach(s => {
            const m = existingMarks?.find(mark => mark.student_id === s.id)
            marksMap[s.id] = { 
                marks: m ? m.marks_obtained.toString() : '', 
                remarks: m ? m.remarks : '',
                status: m ? m.status : 'Pending'
            }
        })
        setMarksData(marksMap)
        setStudents(studentList || [])
        setLoading(false)
    }

    const handleMarkInput = (studentId: string, value: string) => {
        if (value === '') {
            setMarksData(prev => ({
                ...prev,
                [studentId]: { ...prev[studentId], marks: '', status: 'Pending' }
            }))
            return;
        }

        const marks = parseFloat(value);
        const maxMarks = selectedExam.exams?.total_marks || 100;
        const passMarks = selectedExam.exams?.pass_marks || 33;
        
        if (marks > maxMarks) return;

        let status = marks >= passMarks ? 'Pass' : 'Fail';

        setMarksData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], marks: value, status: status }
        }))
    }

    const toggleAbsent = (studentId: string) => {
        setMarksData(prev => {
            const isCurrentlyAbsent = prev[studentId]?.status === 'Absent';
            return {
                ...prev,
                [studentId]: { 
                    ...prev[studentId], 
                    marks: isCurrentlyAbsent ? '' : '0', 
                    status: isCurrentlyAbsent ? 'Pending' : 'Absent',
                    // Remark logic: Add "Absent" if marking absent, Clear it if unmarking
                    remarks: isCurrentlyAbsent ? '' : 'Student was absent' 
                }
            }
        });
    }

    async function saveMarks() {
        // Validation: Check if all students have a status other than 'Pending'
        const incomplete = students.some(s => marksData[s.id]?.status === 'Pending' || marksData[s.id]?.marks === '');
        
        if (incomplete) {
            setMessage({ type: 'error', text: 'Please enter marks or mark absent for all students before saving.' });
            setTimeout(() => setMessage(null), 4000);
            return;
        }

        setLoading(true)
        
        // Map all student data for saving
        const updates = students.map(s => ({
            syllabus_id: selectedExam.id,
            student_id: s.id,
            subject_id: selectedExam.subject_id,
            teacher_id: selectedExam.teacher_id,
            marks_obtained: parseFloat(marksData[s.id].marks) || 0,
            remarks: marksData[s.id].remarks || '',
            status: marksData[s.id].status,
            total_marks: selectedExam.exams?.total_marks || 100 
        }))

        const { error } = await supabase.from('exam_marks').upsert(updates, { onConflict: 'syllabus_id, student_id' })
        
        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: 'All student marks saved successfully!' })
        }
        
        setLoading(false)
        setTimeout(() => setMessage(null), 3000)
    }

    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32">
            
            <div className="px-6 pt-6">
                <div className="relative overflow-hidden bg-brand-soft p-10 rounded-[3rem] border border-brand-light/10 shadow-sm shadow-brand-soft/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white rounded-[2rem] shadow-sm text-brand-light border border-brand-soft">
                                <FiAward size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark tracking-tight">Gradebook Desk</h1>
                                <p className="text-brand-light font-bold text-sm mt-1 opacity-90">Enter student marks and sync with registry.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                   

                            <div className="bg-white/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white shadow-sm min-w-[160px]">
                                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest text-center mb-1">Students Loaded</p>
                                <p className="text-4xl font-black text-brand-dark text-center">{students.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] px-4 opacity-60">1. Select Class Allocation</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {allocations.map(a => (
                                <button key={a.id} onClick={() => handleClassSelect(a)}
                                    className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col group
                                        ${selectedAlloc?.id === a.id ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white text-slate-600 border-transparent shadow-sm hover:border-brand-soft'}`}>
                                    <span className={`text-[9px] font-black uppercase ${selectedAlloc?.id === a.id ? 'text-brand-soft' : 'text-brand-light'}`}>{a.subjects.name}</span>
                                    <span className="font-black text-sm">Grade {a.class_name}-{a.section}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] px-4 opacity-60">2. Select Target Exam</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {exams.length > 0 ? exams.map(e => (
                                <button key={e.id} onClick={() => handleExamSelect(e)}
                                    className={`p-4 rounded-3xl border-2 text-left transition-all flex flex-col
                                        ${selectedExam?.id === e.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white text-slate-600 border-transparent shadow-sm hover:border-emerald-100'}`}>
                                    <span className="font-black text-sm truncate">{e.exam_name}</span>
                                    <span className={`text-[9px] font-bold ${selectedExam?.id === e.id ? 'text-emerald-100' : 'text-slate-400'}`}>Max: {e.exams?.total_marks}</span>
                                </button>
                            )) : (
                                <div className="col-span-full p-4 rounded-3xl border-2 border-dashed border-brand-soft/50 text-center flex items-center justify-center bg-white/50">
                                    <p className="text-[10px] font-bold text-slate-400 italic">Select a class to view available exams</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedExam ? (
                    <div className="bg-white rounded-[3rem] shadow-sm border border-brand-soft/50 overflow-hidden">
                        <div className="p-8 border-b border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4 bg-brand-soft/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl text-brand shadow-sm"><FiBookOpen size={20} /></div>
                                <div>
                                    <h3 className="font-black text-brand-dark text-lg">{selectedExam.exam_name} - {selectedAlloc.subjects.name}</h3>
                                    <p className="text-[10px] font-bold text-brand-light uppercase tracking-[0.15em]">Grade {selectedAlloc.class_name}{selectedAlloc.section} Registry</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                         {message && (
                                <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg animate-in slide-in-from-top-2 ${
                                    message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {message.type === 'success' ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />} 
                                    {message.text}
                                </div>
                            )}
                                <div className="relative flex-1 md:w-64">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light" />
                                    <input type="text" placeholder="Filter by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white border border-brand-soft rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 ring-brand/10" />
                                </div>
                                <button onClick={saveMarks} disabled={loading} className="bg-brand text-white px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all">
                                    {loading ? <FiRefreshCw className="animate-spin" /> : <FiSave />} SAVE ALL RECORDS
                                </button>
                            </div>
                            
                        </div>

                      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-brand-soft/50 overflow-hidden">
    {/* DESKTOP TABLE VIEW */}
    <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="bg-brand-accent/20 text-[10px] font-black text-brand-light uppercase tracking-[0.2em] border-b border-brand-soft">
                    <th className="px-10 py-6">Student</th>
                    <th className="px-10 py-6 w-40 text-center">Score / {selectedExam.exams?.total_marks}</th>
                    <th className="px-10 py-6 w-32 text-center">Attendance</th>
                    <th className="px-10 py-6">Status & Remarks</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/30">
                {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-brand-soft/5 transition-colors">
                        <td className="px-10 py-5">
                            <div className="flex items-center gap-4">
                                <span className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-100">#{s.roll_number}</span>
                                <div>
                                    <p className="font-black text-slate-700 text-sm">{s.full_name}</p>
                                    <p className="text-[9px] font-bold text-brand-light opacity-60 uppercase">{s.student_id}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-10 py-5">
                            <input type="number" 
                                disabled={marksData[s.id]?.status === 'Absent'}
                                className={`w-full border-2 border-transparent focus:border-brand focus:bg-white rounded-xl py-3 text-center font-black transition-all outline-none ${
                                    marksData[s.id]?.status === 'Absent' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-accent/30 text-brand'
                                }`}
                                value={marksData[s.id]?.marks || ''}
                                onChange={(e) => handleMarkInput(s.id, e.target.value)}
                            />
                        </td>
                        <td className="px-10 py-5 text-center">
                            <button onClick={() => toggleAbsent(s.id)}
                                className={`p-3 rounded-xl transition-all border-2 ${
                                    marksData[s.id]?.status === 'Absent' ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200'
                                }`}>
                                <FiUserX size={18} />
                            </button>
                        </td>
                        <td className="px-10 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-24">
                                    {/* Status Badges */}
                                    {marksData[s.id]?.status === 'Absent' ? (
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg uppercase">ABSENT</span>
                                    ) : marksData[s.id]?.status === 'Pass' ? (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg uppercase">PASSED</span>
                                    ) : marksData[s.id]?.status === 'Fail' ? (
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg uppercase">FAILED</span>
                                    ) : <span className="text-[9px] font-black text-slate-300 px-3 py-1.5 uppercase tracking-tighter">PENDING</span>}
                                </div>
                                <input type="text" placeholder="Add remarks..."
                                    className="flex-1 bg-transparent border-b border-brand-soft/30 py-2 px-2 text-xs font-bold text-slate-500 focus:border-brand outline-none transition-all"
                                    value={marksData[s.id]?.remarks || ''}
                                    onChange={(e) => setMarksData({...marksData, [s.id]: { ...marksData[s.id], remarks: e.target.value }})}
                                />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>

    {/* MOBILE CARD VIEW */}
    <div className="md:hidden divide-y divide-brand-soft/20 bg-slate-50/30">
        {filteredStudents.map(s => (
            <div key={s.id} className="p-5 space-y-4">
                {/* Header: Student Identity & Absent Toggle */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="bg-white text-slate-400 px-2 py-1 rounded-lg text-[10px] font-black border border-slate-200">#{s.roll_number}</span>
                        <div>
                            <p className="font-black text-slate-700 text-sm leading-tight">{s.full_name}</p>
                            <p className="text-[9px] font-bold text-brand-light uppercase">{s.student_id}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggleAbsent(s.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                            marksData[s.id]?.status === 'Absent' 
                            ? 'bg-rose-500 text-white border-rose-500' 
                            : 'bg-white text-slate-400 border-slate-100'
                        }`}>
                        <FiUserX size={14} /> {marksData[s.id]?.status === 'Absent' ? 'ABSENT' : 'MARK ABSENT'}
                    </button>
                </div>

                {/* Score and Status Inputs */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Score / {selectedExam.exams?.total_marks}</label>
                        <input type="number" 
                            disabled={marksData[s.id]?.status === 'Absent'}
                            placeholder="00"
                            className={`w-full border-2 border-transparent focus:border-brand rounded-xl py-3 text-center font-black transition-all outline-none text-lg ${
                                marksData[s.id]?.status === 'Absent' ? 'bg-slate-100 text-slate-300' : 'bg-brand-accent/20 text-brand shadow-sm'
                            }`}
                            value={marksData[s.id]?.marks || ''}
                            onChange={(e) => handleMarkInput(s.id, e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Current Status</label>
                        <div className="h-[54px] flex items-center justify-center rounded-xl bg-white border border-brand-soft/50">
                             {marksData[s.id]?.status === 'Absent' ? (
                                <span className="text-[10px] font-black text-rose-600 uppercase">ABSENT</span>
                            ) : marksData[s.id]?.status === 'Pass' ? (
                                <span className="text-[10px] font-black text-emerald-600 uppercase">PASSED</span>
                            ) : marksData[s.id]?.status === 'Fail' ? (
                                <span className="text-[10px] font-black text-rose-600 uppercase">FAILED</span>
                            ) : <span className="text-[10px] font-black text-slate-300 uppercase">PENDING</span>}
                        </div>
                    </div>
                </div>

                {/* Remarks Input */}
                <div className="bg-white p-2 rounded-xl border border-brand-soft/50 flex items-center gap-2">
                    <FiMessageSquare size={14} className="text-brand-light ml-2" />
                    <input type="text" placeholder="Add remarks for student..."
                        className="flex-1 bg-transparent py-2 text-xs font-bold text-slate-500 outline-none"
                        value={marksData[s.id]?.remarks || ''}
                        onChange={(e) => setMarksData({...marksData, [s.id]: { ...marksData[s.id], remarks: e.target.value }})}
                    />
                </div>
            </div>
        ))}
    </div>
</div>
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-brand-soft/50 p-10 text-center">
                        <div className="w-16 h-16 bg-brand-soft/20 rounded-[1.5rem] flex items-center justify-center mb-4 text-brand-light">
                            <FiEdit3 size={28} />
                        </div>
                        <h3 className="text-lg font-black text-brand-dark">Registry Ready</h3>
                        <p className="text-brand-light/60 font-bold text-xs max-w-xs mx-auto">Select a class and exam syllabus above to load the student list.</p>
                    </div>
                )}
            </div>
        </div>
    )
}