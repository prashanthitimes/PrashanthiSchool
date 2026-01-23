'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiPlus, FiTrash2, FiCalendar, FiChevronRight, 
    FiCheckCircle, FiRefreshCw, FiX, FiLayers, FiBookOpen 
} from 'react-icons/fi'

export default function ExamSyllabusPage() {
    // Data States
    const [allocations, setAllocations] = useState<any[]>([])
    const [selectedAlloc, setSelectedAlloc] = useState<any>(null)
    const [syllabusHistory, setSyllabusHistory] = useState<any[]>([])
    const [activeExams, setActiveExams] = useState<any[]>([])
    
    // UI States
    const [fetchingExams, setFetchingExams] = useState(false)
    const [selectedExamID, setSelectedExamID] = useState('')
    const [currentChapter, setCurrentChapter] = useState('')
    const [chapterList, setChapterList] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [teacher, setTeacher] = useState<any>(null)

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    useEffect(() => { fetchInitialData() }, [])

    async function fetchInitialData() {
        const email = localStorage.getItem('teacherEmail')
        if (!email) return
        const { data: teacherData } = await supabase.from('teachers').select('id').eq('email', email).single()
        if (teacherData) {
            setTeacher(teacherData)
            const { data: allocated } = await supabase.from('subject_assignments')
                .select(`id, class_name, section, subject_id, subjects (id, name)`)
                .eq('teacher_id', teacherData.id)
            setAllocations(allocated || [])
            fetchSyllabusHistory(teacherData.id)
        }
    }

    async function fetchSyllabusHistory(tId: string) {
        const { data } = await supabase.from('exam_syllabus').select('*, subjects(name)')
            .eq('teacher_id', tId).order('created_at', { ascending: false })
        if (data) setSyllabusHistory(data)
    }

    const handleAllocSelect = async (alloc: any) => {
        setSelectedAlloc(alloc)
        setSelectedExamID(''); setChapterList([])
        setFetchingExams(true)
        try {
            const cleanClass = alloc.class_name.replace(/(st|nd|rd|th)/gi, '').trim()
            const searchStr = `${cleanClass}-${alloc.section.trim()}`
            const { data } = await supabase.from('exams').select('*').contains('classes', [searchStr])
            setActiveExams(data || [])
        } finally { setFetchingExams(false) }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedAlloc || !selectedExamID || chapterList.length === 0) return
        setLoading(true)
        const targetExam = activeExams.find(ex => ex.id === selectedExamID)
        const { error } = await supabase.from('exam_syllabus').insert([{
            teacher_id: teacher.id,
            subject_id: selectedAlloc.subject_id,
            class_name: selectedAlloc.class_name,
            section: selectedAlloc.section,
            exam_name: targetExam.exam_name,
            chapters: chapterList,
            exam_date: targetExam.start_date
        }])
        if (!error) {
            setChapterList([]); setSelectedExamID('')
            fetchSyllabusHistory(teacher.id)
        } else { alert(error.message) }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this entry?')) return
        const { error } = await supabase.from('exam_syllabus').delete().eq('id', id)
        if (!error) setSyllabusHistory(prev => prev.filter(i => i.id !== id))
    }

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-20">
            {/* --- HEADER --- */}
            <div className="px-6 pt-6">
                <div className="relative overflow-hidden bg-brand-soft p-10 rounded-[3rem] border border-brand-light/10 shadow-sm shadow-brand-soft/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white rounded-[2rem] shadow-sm text-brand-light border border-brand-soft">
                                <FiLayers size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark tracking-tight">Syllabus Desk</h1>
                                <p className="text-brand-light font-bold text-sm mt-1 opacity-90">Organize exam portions for {todayName}.</p>
                            </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white shadow-sm min-w-[160px]">
                            <p className="text-[10px] font-black text-brand-light uppercase tracking-widest text-center mb-1">Total Published</p>
                            <p className="text-4xl font-black text-brand-dark text-center">{syllabusHistory.length}</p>
                        </div>
                    </div>
                    {/* Decorative Blurs */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-light/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            <div className="px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
                {/* --- SIDEBAR: CLASSES --- */}
                <div className="lg:col-span-3 space-y-3">
                    <h2 className="text-[11px] font-black text-brand-light uppercase tracking-widest ml-4 mb-2">My Assignments</h2>
                    <div className="flex flex-col gap-2">
                        {allocations.map((item) => (
                            <button key={item.id} onClick={() => handleAllocSelect(item)}
                                className={`group p-4 rounded-[1.5rem] border transition-all text-left flex items-center justify-between
                                ${selectedAlloc?.id === item.id 
                                    ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' 
                                    : 'bg-white text-slate-600 border-brand-soft hover:border-brand-light'}`}>
                                <div>
                                    <p className={`text-[9px] font-bold uppercase mb-0.5 ${selectedAlloc?.id === item.id ? 'text-brand-accent' : 'text-brand-light'}`}>{item.subjects?.name}</p>
                                    <h3 className="font-black text-md">Grade {item.class_name}-{item.section}</h3>
                                </div>
                                <FiChevronRight className={`${selectedAlloc?.id === item.id ? 'translate-x-1' : 'opacity-20'} transition-transform`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- MAIN: FORM & REGISTRY --- */}
                <div className="lg:col-span-9 space-y-8">
                    {/* Compact Entry Form */}
                    {selectedAlloc ? (
                        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 shadow-sm relative overflow-hidden">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-6 bg-brand rounded-full"></div>
                                        <h3 className="font-black text-brand-dark uppercase text-xs tracking-wider">New Entry Configuration</h3>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-brand-light uppercase ml-1">Select Active Exam</label>
                                        <select required value={selectedExamID} onChange={e => setSelectedExamID(e.target.value)}
                                            className="w-full bg-brand-accent/50 border-none rounded-xl p-3 text-sm font-bold text-brand-dark outline-none ring-2 ring-transparent focus:ring-brand/10">
                                            <option value="">{fetchingExams ? 'Fetching Exams...' : 'Choose Exam'}</option>
                                            {activeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-brand-light uppercase ml-1">Add Chapter / Portion</label>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="e.g. Algebra Basics" className="flex-1 bg-brand-accent/50 border-none rounded-xl p-3 text-sm font-bold"
                                                value={currentChapter} onChange={e => setCurrentChapter(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), setChapterList([...chapterList, currentChapter]), setCurrentChapter(''))} />
                                            <button type="button" onClick={() => {if(currentChapter){setChapterList([...chapterList, currentChapter]); setCurrentChapter('')}}}
                                                className="bg-brand text-white px-4 rounded-xl shadow-md hover:bg-brand-dark transition-colors"><FiPlus /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between pt-6 md:pt-0">
                                    <div className="bg-brand-accent/30 rounded-2xl p-4 border border-dashed border-brand-light/20 min-h-[120px]">
                                        <div className="flex flex-wrap gap-2">
                                            {chapterList.length === 0 && <p className="text-[10px] text-brand-light italic opacity-60 m-auto mt-10 uppercase font-bold">No chapters listed</p>}
                                            {chapterList.map((ch, idx) => (
                                                <span key={idx} className="bg-white text-brand-dark px-3 py-1.5 rounded-lg border border-brand-soft text-[11px] font-black flex items-center gap-2 shadow-sm">
                                                    {ch} <FiX className="cursor-pointer text-red-400 hover:text-red-600" onClick={() => setChapterList(chapterList.filter((_, i) => i !== idx))} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button disabled={loading || !selectedExamID} className="mt-4 w-full py-4 bg-brand text-white rounded-2xl font-black text-sm shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 uppercase tracking-widest">
                                        {loading ? <FiRefreshCw className="animate-spin mx-auto" /> : 'Publish to Registry'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-brand-accent/20 border-2 border-dashed border-brand-soft rounded-[2.5rem] p-16 text-center">
                            <FiBookOpen size={48} className="mx-auto text-brand-light/30 mb-4" />
                            <p className="text-brand font-black text-sm uppercase tracking-widest">Select a class to start editing</p>
                        </div>
                    )}

                    {/* --- REGISTRY SECTION --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <FiCheckCircle className="text-brand" size={20} />
                            <h2 className="text-lg font-black text-brand-dark tracking-tight uppercase text-xs">Recently Published</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {syllabusHistory.map((item) => (
                                <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-brand-soft shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[9px] font-black text-brand bg-brand-accent px-2 py-0.5 rounded-full uppercase border border-brand-soft">
                                                {item.subjects?.name}
                                            </span>
                                            <h3 className="text-lg font-black text-brand-dark mt-2 leading-tight">{item.exam_name}</h3>
                                            <p className="text-[10px] text-brand-light font-bold">Grade {item.class_name}-{item.section}</p>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-brand-light/30 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="bg-brand-accent/30 p-3 rounded-xl mb-4">
                                        <p className="text-[11px] font-bold text-brand-dark leading-relaxed">
                                            {item.chapters.join(' • ')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-light uppercase opacity-70">
                                        <FiCalendar size={12} /> Date: {item.exam_date}
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