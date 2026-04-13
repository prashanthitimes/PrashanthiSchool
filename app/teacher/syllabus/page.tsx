'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiPlus, FiTrash2, FiCalendar, FiChevronRight,
    FiCheckCircle, FiRefreshCw, FiX, FiLayers, FiBookOpen, FiFileText, FiUploadCloud
} from 'react-icons/fi'

export default function ExamSyllabusPage() {
    const [allocations, setAllocations] = useState<any[]>([])
    const [selectedAlloc, setSelectedAlloc] = useState<any>(null)
    const [syllabusHistory, setSyllabusHistory] = useState<any[]>([])
    const [activeExams, setActiveExams] = useState<any[]>([])
    const [selectedExamID, setSelectedExamID] = useState('')
    const [currentChapter, setCurrentChapter] = useState('')
    const [chapterList, setChapterList] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [teacher, setTeacher] = useState<any>(null)
    const [fetchingExams, setFetchingExams] = useState(false)

    // PDF States
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

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
        setSelectedExamID(''); setChapterList([]); setPdfFile(null)
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
        if (!selectedAlloc || !selectedExamID || (chapterList.length === 0 && !pdfFile)) {
            alert("Please add chapters or upload a PDF")
            return
        }
        
        setLoading(true)
        setIsUploading(true)

        try {
            let uploadedUrl = null

            // 1. Handle PDF Upload if file exists
            if (pdfFile) {
                const fileExt = pdfFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `syllabi/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('syllabus-pdfs') // Ensure this bucket exists in Supabase
                    .upload(filePath, pdfFile)

                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('syllabus-pdfs')
                    .getPublicUrl(filePath)
                
                uploadedUrl = urlData.publicUrl
            }

            // 2. Insert into Database
            const targetExam = activeExams.find(ex => ex.id === selectedExamID)
            const { error: dbError } = await supabase.from('exam_syllabus').insert([{
                teacher_id: teacher.id,
                subject_id: selectedAlloc.subject_id,
                class_name: selectedAlloc.class_name,
                section: selectedAlloc.section,
                exam_name: targetExam.exam_name,
                chapters: chapterList,
                exam_date: targetExam.start_date,
                pdf_url: uploadedUrl
            }])

            if (dbError) throw dbError

            // Reset Form
            setChapterList([]); setSelectedExamID(''); setPdfFile(null)
            fetchSyllabusHistory(teacher.id)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
            setIsUploading(false)
        }
    }

    async function handleDelete(item: any) {
        if (!confirm('Delete this entry?')) return
        
        // Remove from storage if PDF exists
        if (item.pdf_url) {
            const fileName = item.pdf_url.split('/').pop()
            await supabase.storage.from('syllabus-pdfs').remove([`syllabi/${fileName}`])
        }

        const { error } = await supabase.from('exam_syllabus').delete().eq('id', item.id)
        if (!error) setSyllabusHistory(prev => prev.filter(i => i.id !== item.id))
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
            {/* Header stays identical to your current code */}
            <div className="px-4 md:px-6 pt-4 md:pt-6">
                <div className="relative overflow-hidden bg-brand-soft dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-brand-light/10 dark:border-slate-800 shadow-sm">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm text-brand-light border border-brand-soft">
                                <FiLayers size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-brand-dark dark:text-slate-100">Syllabus Desk</h1>
                                <p className="text-brand-light dark:text-slate-400 font-bold text-xs">Portions for {todayName}</p>
                            </div>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 px-8 py-3 rounded-[1.5rem] border border-white dark:border-slate-700 text-center">
                            <p className="text-[9px] font-black text-brand-light uppercase tracking-widest">Registry Count</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
                {/* --- SIDEBAR --- */}
                <div className="lg:col-span-3 space-y-3">
                    <h2 className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-4">Assignments</h2>
                    <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                        {allocations.map((item) => (
                            <button key={item.id} onClick={() => handleAllocSelect(item)}
                                className={`group p-4 rounded-[1.5rem] border transition-all text-left flex items-center justify-between min-w-[220px] lg:min-w-full
                                ${selectedAlloc?.id === item.id ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white dark:bg-slate-900 border-brand-soft dark:border-slate-800'}`}>
                                <div>
                                    <p className={`text-[8px] font-bold uppercase ${selectedAlloc?.id === item.id ? 'text-white/70' : 'text-brand-light'}`}>{item.subjects?.name}</p>
                                    <h3 className="font-black text-sm">Grade {item.class_name}-{item.section}</h3>
                                </div>
                                <FiChevronRight className={selectedAlloc?.id === item.id ? 'translate-x-1' : 'opacity-20'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- MAIN FORM --- */}
                <div className="lg:col-span-9 space-y-8">
                    {selectedAlloc ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-soft dark:border-slate-800 p-8 shadow-sm">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-brand-light uppercase">Active Exam</label>
                                        <select required value={selectedExamID} onChange={e => setSelectedExamID(e.target.value)}
                                            className="w-full bg-brand-accent/50 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold outline-none">
                                            <option value="">{fetchingExams ? 'Fetching...' : 'Choose Exam'}</option>
                                            {activeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name}</option>)}
                                        </select>
                                    </div>

                                    {/* PDF Upload Box */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-brand-light uppercase">Document (PDF)</label>
                                        <div className={`relative border-2 border-dashed rounded-2xl p-4 transition-all ${pdfFile ? 'border-brand bg-brand/5' : 'border-brand-soft dark:border-slate-800'}`}>
                                            <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" 
                                                onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-xl ${pdfFile ? 'bg-brand text-white' : 'bg-brand-soft text-brand'}`}>
                                                    <FiUploadCloud size={20} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-black truncate">{pdfFile ? pdfFile.name : 'Upload PDF Syllabus'}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">{pdfFile ? `${(pdfFile.size/1024/1024).toFixed(2)} MB` : 'Optional • Max 10MB'}</p>
                                                </div>
                                                {pdfFile && <FiX className="text-red-400 cursor-pointer z-10" onClick={(e) => { e.preventDefault(); setPdfFile(null); }} />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-brand-light uppercase">Text Portions (Chapters)</label>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Add chapter name..." 
                                                className="flex-1 bg-brand-accent/50 dark:bg-slate-800 rounded-xl p-3 text-sm font-bold outline-none"
                                                value={currentChapter} onChange={e => setCurrentChapter(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), setChapterList([...chapterList, currentChapter]), setCurrentChapter(''))} />
                                            <button type="button" onClick={() => { if (currentChapter) { setChapterList([...chapterList, currentChapter]); setCurrentChapter('') } }}
                                                className="bg-brand text-white px-4 rounded-xl shadow-md"><FiPlus /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="bg-brand-accent/30 dark:bg-slate-800/40 rounded-2xl p-4 border border-dashed border-brand-light/20 min-h-[140px]">
                                        <div className="flex flex-wrap gap-2">
                                            {chapterList.length === 0 && !pdfFile && <p className="text-[10px] text-brand-light font-bold text-center w-full mt-10">NO PORTIONS ADDED</p>}
                                            {chapterList.map((ch, idx) => (
                                                <span key={idx} className="bg-white dark:bg-slate-800 text-brand-dark dark:text-slate-200 px-3 py-1.5 rounded-lg border border-brand-soft text-[10px] font-black flex items-center gap-2">
                                                    {ch} <FiX className="cursor-pointer text-red-400" onClick={() => setChapterList(chapterList.filter((_, i) => i !== idx))} />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button disabled={loading || !selectedExamID} className="mt-4 w-full py-4 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-brand/20 transition-all active:scale-95 disabled:opacity-40">
                                        {loading ? <FiRefreshCw className="animate-spin mx-auto" /> : 'Publish to Registry'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-brand-accent/20 border-2 border-dashed border-brand-soft rounded-[2rem] p-16 text-center">
                            <FiBookOpen size={40} className="mx-auto text-brand-light/30 mb-4" />
                            <p className="text-brand font-black text-xs uppercase tracking-widest">Select a class to configure syllabus</p>
                        </div>
                    )}

                    {/* --- REGISTRY HISTORY --- */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-brand-dark dark:text-slate-300 uppercase tracking-tight ml-2">Recently Published</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {syllabusHistory.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-soft dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[8px] font-black text-brand bg-brand-accent px-2 py-0.5 rounded-full uppercase">{item.subjects?.name}</span>
                                            <h3 className="text-lg font-black text-brand-dark dark:text-slate-100 mt-1">{item.exam_name}</h3>
                                            <p className="text-[10px] text-brand-light font-bold">Grade {item.class_name}-{item.section}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {item.pdf_url && (
                                                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" 
                                                    className="p-2 text-brand hover:bg-brand-accent rounded-xl transition-all" title="View PDF">
                                                    <FiFileText size={18} />
                                                </a>
                                            )}
                                            <button onClick={() => handleDelete(item)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-brand-accent/30 dark:bg-slate-800/50 p-3 rounded-xl mb-4">
                                        <p className="text-[10px] font-bold text-brand-dark dark:text-slate-300 leading-relaxed">
                                            {item.chapters?.length > 0 ? item.chapters.join(' • ') : 'Syllabus attached as PDF'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-light uppercase">
                                        <FiCalendar size={12} /> {item.exam_date}
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