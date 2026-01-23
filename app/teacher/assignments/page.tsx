'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiLayers, FiCalendar, FiClock, FiFileText,
    FiUpload, FiCheckCircle, FiAlertCircle, FiPlusCircle,
    FiTrash2, FiTarget, FiAward, FiX, FiBookOpen
} from 'react-icons/fi'

export default function AssignmentsPage() {
    const [todayClasses, setTodayClasses] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [viewingAssignment, setViewingAssignment] = useState<any>(null)
    const [form, setForm] = useState({
        title: '',
        instructions: '',
        maxMarks: '100',
        dueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0]
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [teacherId, setTeacherId] = useState('')

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayISO = new Date().toISOString().split('T')[0]

    useEffect(() => {
        fetchInitialData()
    }, [])

    async function fetchInitialData() {
        const userEmail = localStorage.getItem('teacherEmail')
        if (!userEmail) return
        const { data: teacher } = await supabase.from('teachers').select('id').eq('email', userEmail).single()
        if (!teacher) return
        setTeacherId(teacher.id)
        const { data: schedule } = await supabase.from('timetable').select('*, subjects(name)').eq('day', todayName)
        setTodayClasses(schedule || [])
        fetchAssignmentHistory(teacher.id)
    }

    async function fetchAssignmentHistory(tId: string) {
        const { data, error } = await supabase
            .from('assignments')
            .select('*, subjects(name)')
            .eq('teacher_id', tId)
            .order('due_date', { ascending: true })
        if (!error) setHistory(data || [])
    }

    async function handlePost(e: React.FormEvent) {
        e.preventDefault();
        if (!teacherId || !selectedSlot) return
        setLoading(true)
        const { error } = await supabase.from('assignments').insert([{
            teacher_id: teacherId,
            subject_id: selectedSlot.subject_id,
            class_name: selectedSlot.class,
            section: selectedSlot.section,
            period: selectedSlot.period,
            title: form.title,
            instructions: form.instructions,
            max_marks: parseInt(form.maxMarks),
            due_date: form.dueDate,
        }])

        if (error) {
            setMessage({ type: 'error', text: error.message })
        } else {
            setMessage({ type: 'success', text: `Assignment published successfully!` })
            setForm({ ...form, title: '', instructions: '' })
            setSelectedSlot(null)
            fetchAssignmentHistory(teacherId)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        setLoading(false)
    }

    const upcomingDeadlines = history.filter(a => a.due_date === todayISO);

    return (
        <div className="min-h-screen bg-[#FDFCFD] pb-32">
            
            {/* --- ASSIGNMENT DETAILS MODAL --- */}
            {viewingAssignment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-brand-soft/30 p-8 flex justify-between items-center border-b border-brand-soft">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand shadow-sm">
                                    <FiFileText size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-brand-light uppercase tracking-widest">Graded Task</p>
                                    <h3 className="text-xl font-black text-slate-800">{viewingAssignment.subjects?.name}</h3>
                                </div>
                            </div>
                            <button onClick={() => setViewingAssignment(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400">
                                <FiX size={24} />
                            </button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-brand-light opacity-50 uppercase tracking-widest">Title</label>
                                <p className="text-lg font-bold text-slate-700">{viewingAssignment.title}</p>
                            </div>
                            <div className="bg-brand-accent p-6 rounded-[2rem] text-slate-600 font-medium leading-relaxed border border-brand-soft">
                                {viewingAssignment.instructions}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-soft/20 p-4 rounded-2xl border border-brand-soft/50 text-center">
                                    <p className="text-[9px] font-black text-brand uppercase">Max Score</p>
                                    <p className="text-sm font-black text-brand-dark">{viewingAssignment.max_marks} Pts</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                                    <p className="text-[9px] font-black text-amber-500 uppercase">Deadline</p>
                                    <p className="text-sm font-black text-amber-700">{new Date(viewingAssignment.due_date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="px-6 pt-6">
                <div className="relative overflow-hidden bg-brand-soft p-10 rounded-[3rem] border border-brand-light/10 shadow-sm shadow-brand-soft/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white rounded-[2rem] shadow-sm text-brand-light border border-brand-soft">
                                <FiLayers size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark tracking-tight">Assignment Desk</h1>
                                <p className="text-brand-light font-bold text-sm mt-1 opacity-90">Manage student homework for {todayName}.</p>
                            </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white shadow-sm min-w-[160px]">
                            <p className="text-[10px] font-black text-brand-light uppercase tracking-widest text-center mb-1">Due Today</p>
                            <p className="text-4xl font-black text-brand-dark text-center">{upcomingDeadlines.length}</p>
                        </div>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-light/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            <div className="px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT: CLASS SELECTOR --- */}
                <div className="lg:col-span-4 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                            <span className="font-bold text-xs">{message.text}</span>
                        </div>
                    )}
                    
                    <h2 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] px-2 opacity-60">Today's Schedule</h2>
                    <div className="grid gap-3">
                        {todayClasses.map((slot) => (
                            <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                                className={`p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4
                                ${selectedSlot?.id === slot.id ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white text-slate-600 border-transparent shadow-sm hover:border-brand-soft'}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${selectedSlot?.id === slot.id ? 'bg-white/20' : 'bg-brand-soft text-brand-dark'}`}>
                                    P{slot.period}
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black uppercase opacity-70">Grade {slot.class}-{slot.section}</p>
                                    <p className="font-black text-md leading-tight">{slot.subjects?.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT: FORM --- */}
                <div className="lg:col-span-8">
                    {selectedSlot ? (
                        <form onSubmit={handlePost} className="bg-white rounded-[3rem] shadow-sm border border-brand-soft/50 overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="bg-brand-soft/20 p-8 border-b border-brand-soft flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-brand-dark">Assign Task</h3>
                                    <p className="text-brand-light font-bold text-xs">For {selectedSlot.subjects.name}</p>
                                </div>
                                <FiPlusCircle size={30} className="text-brand-light opacity-30" />
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase ml-1">Title</label>
                                    <input required type="text" placeholder="e.g. Creative Writing Unit 1" 
                                        className="w-full bg-brand-accent border-none rounded-xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all"
                                        value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase ml-1">Instructions</label>
                                    <textarea required rows={4} placeholder="Submission requirements and details..." 
                                        className="w-full bg-brand-accent border-none rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-brand outline-none transition-all"
                                        value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-brand-light uppercase ml-1 flex items-center gap-1"><FiAward/> Max Marks</label>
                                        <input type="number" className="w-full bg-brand-accent border-none rounded-xl p-4 font-black text-slate-600"
                                            value={form.maxMarks} onChange={e => setForm({...form, maxMarks: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-brand-light uppercase ml-1 flex items-center gap-1"><FiCalendar/> Final Due Date</label>
                                        <input type="date" className="w-full bg-brand-accent border-none rounded-xl p-4 font-black text-slate-600"
                                            value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                                    </div>
                                </div>

                                <button disabled={loading} className="w-full h-[64px] bg-brand text-white rounded-2xl font-black shadow-lg shadow-brand-soft hover:bg-brand-dark transition-all flex items-center justify-center gap-3">
                                    {loading ? 'Publishing...' : <><FiUpload /> CREATE ASSIGNMENT</>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-brand-soft p-10 text-center">
                            <div className="w-20 h-20 bg-brand-soft/30 rounded-3xl flex items-center justify-center mb-4 text-brand-light">
                                <FiPlusCircle size={40} />
                            </div>
                            <h3 className="text-lg font-black text-brand-dark">New Assignment</h3>
                            <p className="text-brand-light/60 font-bold text-sm max-w-xs mx-auto mt-2 italic">
                                Pick a period from the schedule to create a new task for your students.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ACTIVITY TABLE --- */}
            <div className="px-6 mt-16">
                <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <FiTarget className="text-brand" /> Active Registry
                    </h2>
                </div>
                
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand-soft/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-brand-accent text-[10px] font-black text-brand-light uppercase tracking-[0.2em] border-b border-brand-soft">
                                    <th className="px-8 py-6">Identity</th>
                                    <th className="px-8 py-6">Subject & Title</th>
                                    <th className="px-8 py-6">Scoring</th>
                                    <th className="px-8 py-6">Deadline</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-soft/30">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-brand-soft/10 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="bg-brand-soft text-brand-dark px-4 py-2 rounded-xl text-[10px] font-black border border-brand-soft">
                                                {item.class_name}-{item.section}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-700">{item.subjects?.name}</p>
                                            <p className="text-[11px] font-bold text-brand-light line-clamp-1 italic">{item.title}</p>
                                        </td>
                                        <td className="px-8 py-6 font-black text-brand text-sm italic">
                                            {item.max_marks} pts
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-brand-light opacity-50" size={14} />
                                                <span className={`text-xs font-black ${new Date(item.due_date) < new Date() ? 'text-rose-500' : 'text-slate-600'}`}>
                                                    {new Date(item.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setViewingAssignment(item)} className="p-3 bg-brand-soft/40 text-brand-dark rounded-xl hover:bg-brand hover:text-white transition-all">
                                                    <FiBookOpen size={16} />
                                                </button>
                                                <button 
                                                    onClick={async () => { if(confirm('Remove this assignment?')) { await supabase.from('assignments').delete().eq('id', item.id); fetchAssignmentHistory(teacherId); } }}
                                                    className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
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
                </div>
            </div>
        </div>
    )
}