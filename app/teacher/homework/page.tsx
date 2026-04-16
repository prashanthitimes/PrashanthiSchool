'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiBookOpen, FiCalendar, FiClock, FiLayers,
    FiSend, FiCheckCircle, FiAlertCircle, FiPlusCircle,
    FiTrash2, FiChevronRight, FiActivity, FiX
} from 'react-icons/fi'

export default function HomeworkPage() {
    const [todayClasses, setTodayClasses] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [viewingHw, setViewingHw] = useState<any>(null) // State for Modal
    const [editingId, setEditingId] = useState<string | null>(null) // Track edit mode
    const [deleteTarget, setDeleteTarget] = useState<any>(null)

    const [homeworkForm, setHomeworkForm] = useState({
        title: '',
        description: '',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    })

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    useEffect(() => {
        fetchInitialData()
    }, [])

    // 1. Update the state at the top
    const [allocatedClasses, setAllocatedClasses] = useState<any[]>([])

    // 2. Update the fetchInitialData function
    async function fetchInitialData() {
        const userEmail = localStorage.getItem('teacherEmail')
        if (!userEmail) return

        // Fetch Teacher ID
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', userEmail)
            .single()

        if (!teacher) return

        // FETCH ALL ALLOCATED CLASSES from your new table
        const { data: allocations, error: allocError } = await supabase
            .from('subject_assignments')
            .select(`
            id,
            class_name,
            section,
            academic_year,
            subject_id,
            subjects (id, name)
        `)
            .eq('teacher_id', teacher.id)
            .order('class_name', { ascending: true })

        if (!allocError) setAllocatedClasses(allocations || [])

        // Keep your history fetch
        fetchHistory(teacher.id)
    }



    async function fetchHistory(tId: string) {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const { data, error } = await supabase
            .from('homework')
            .select('*, subjects(id, name)')
            .eq('teacher_id', tId)
            .gte('assigned_date', oneWeekAgo.toISOString().split('T')[0])
            .order('due_date', { ascending: true })
        if (!error) setHistory(data || [])
    }

    async function handleSubmit() {
        const userEmail = localStorage.getItem('teacherEmail')
        if (!userEmail || !selectedSlot) return

        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', userEmail)
            .single()

        if (!teacher) return

        // ... inside handleSubmit function
        const payload = {
            title: homeworkForm.title,
            description: homeworkForm.description,
            due_date: homeworkForm.dueDate,
            teacher_id: teacher.id,
            class_name: selectedSlot.class,
            section: selectedSlot.section,
            // Change this line below:
            period: selectedSlot.period || 1,
            subject_id: selectedSlot.subject_id ?? selectedSlot.subjects?.id,
            assigned_date: new Date().toISOString().split('T')[0]
        }



        let error

        if (editingId) {
            // 🔁 UPDATE
            ({ error } = await supabase
                .from('homework')
                .update(payload)
                .eq('id', editingId))
        } else {
            // ➕ INSERT
            ({ error } = await supabase
                .from('homework')
                .insert(payload))
        }

        if (error) {
            console.error(error)
            alert(error.message)
            return
        }

        // ✅ Reset UI
        setHomeworkForm({
            title: '',
            description: '',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        })
        setEditingId(null)
        setSelectedSlot(null)

        // 🔄 Refresh history
        fetchHistory(teacher.id)
    }


    async function handleDelete() {
        if (!deleteTarget) return

        const { error } = await supabase
            .from('homework')
            .delete()
            .eq('id', deleteTarget.id)

        if (error) {
            console.error(error)
            alert('Failed to delete homework')
            return
        }

        // Close modal
        setDeleteTarget(null)

        // Refresh list
        const userEmail = localStorage.getItem('teacherEmail')
        if (!userEmail) return

        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', userEmail)
            .single()

        if (teacher) fetchHistory(teacher.id)
    }

    const upcomingDeadlines = history.filter(hw => {
        const diff = new Date(hw.due_date).getTime() - new Date().getTime();
        return diff > -86400000 && diff < 172800000;
    });
    return (
        <div className="bg-[#FDFCFD] dark:bg-slate-950 pb-20 relative transition-colors duration-300">

            {/* --- MODAL POPUP --- */}
            {viewingHw && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/20 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border dark:border-slate-800">
                        <div className="bg-brand-soft/30 dark:bg-brand/10 p-8 flex justify-between items-center border-b border-brand-soft dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-brand-light dark:text-brand-soft shadow-sm border dark:border-slate-700">
                                    <FiBookOpen size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-brand-light dark:text-brand-soft/60 uppercase tracking-widest">Assignment Details</p>
                                    <h3 className="text-xl font-black text-brand-dark dark:text-slate-100">{viewingHw.subjects?.name}</h3>
                                </div>
                            </div>
                            <button onClick={() => setViewingHw(null)} className="p-2 hover:bg-brand-soft dark:hover:bg-slate-800 rounded-full transition-colors">
                                <FiX size={24} className="text-slate-400 dark:text-slate-500" />
                            </button>
                        </div>
                        <div className="p-10">
                            <div className="mb-6">
                                <label className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Topic</label>
                                <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{viewingHw.title}</p>
                            </div>
                            <div className="mb-8">
                                <label className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Instructions</label>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-wrap mt-2 bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border dark:border-slate-800">
                                    {viewingHw.description}
                                </p>
                            </div>
                            <div className="flex justify-between items-center bg-brand-soft/10 dark:bg-brand/5 p-4 rounded-2xl border dark:border-brand/10">
                                <span className="text-xs font-black text-brand-light dark:text-brand-soft uppercase">Submission Deadline</span>
                                <span className="text-sm font-black text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                    <FiCalendar /> {new Date(viewingHw.due_date).toDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <div className="px-6 pt-6">
                <div className="relative overflow-hidden bg-brand-soft dark:bg-brand/20 p-10 rounded-[3rem] border border-brand-light/10 dark:border-brand/20 shadow-sm shadow-brand-soft/20">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm text-brand-light dark:text-brand-soft border border-brand-soft dark:border-slate-700">
                                <FiLayers size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-brand-dark dark:text-slate-100 tracking-tight">Home Work Desk</h1>
                                <p className="text-brand-light dark:text-slate-400 font-bold text-sm mt-1 opacity-90">Manage student homework for {todayName}.</p>
                            </div>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white dark:border-slate-700 shadow-sm min-w-[160px]">
                            <p className="text-[10px] font-black text-brand-light dark:text-brand-soft uppercase tracking-widest text-center mb-1">Due Today</p>
                            <p className="text-4xl font-black text-brand-dark dark:text-slate-100 text-center">{upcomingDeadlines.length}</p>
                        </div>
                    </div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 dark:bg-brand/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-light/10 dark:bg-brand/5 rounded-full blur-2xl"></div>
                </div>
            </div>

            <div className="px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- SIDEBAR --- */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-2">
                            My Allocated Classes
                        </h2>
                        <div className="grid gap-2">
                            {allocatedClasses.length > 0 ? (
                                allocatedClasses.map((item) => (
                                    <button
                                        key={item.id}
                                        // Look for the "My Allocated Classes" button in your code and update onClick
                                        onClick={() => {
                                            setSelectedSlot({
                                                id: item.id,
                                                class: item.class_name,
                                                section: item.section,
                                                period: 1, // <--- Add this default here
                                                subject_id: item.subject_id,
                                                subjects: item.subjects
                                            });
                                            setEditingId(null);
                                        }}
                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4
                        ${selectedSlot?.id === item.id
                                                ? 'bg-brand-light dark:bg-brand text-white border-brand-light dark:border-brand shadow-md'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-transparent dark:border-slate-800 shadow-sm hover:border-brand-soft dark:hover:border-slate-700'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedSlot?.id === item.id ? 'bg-white/20' : 'bg-brand-soft dark:bg-slate-800 text-brand-light dark:text-brand-soft'}`}>
                                            {item.class_name[0]}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black uppercase opacity-70">Grade {item.class_name}-{item.section}</p>
                                            <p className="font-black text-sm">{item.subjects?.name}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 p-4">No classes allocated yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- FORM --- */}
                <div className="lg:col-span-8">
                    {selectedSlot ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-brand-soft/40 dark:border-slate-800 overflow-hidden">
                            <div className="bg-brand-soft/30 dark:bg-slate-800/50 p-8 border-b border-brand-soft/50 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-brand-light dark:text-brand-soft">
                                        {editingId ? 'Edit Assignment' : selectedSlot.subjects.name}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">
                                        {editingId ? 'Updating previous entry' : `New Assignment for Class ${selectedSlot.class}-${selectedSlot.section}`}
                                    </p>
                                </div>
                                {editingId && (
                                    <button onClick={() => { setEditingId(null); setSelectedSlot(null); }} className="text-[10px] font-black text-rose-400 dark:text-rose-500 underline">CANCEL EDIT</button>
                                )}
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Homework Topic</label>
                                    <input
                                        type="text"
                                        placeholder="Chapter 2 – Fractions"
                                        className="w-full bg-brand-soft/10 dark:bg-slate-950 border-none rounded-xl p-4 font-bold text-slate-700 dark:text-slate-200
                                             placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-brand-light outline-none transition-colors"
                                        value={homeworkForm.title}
                                        onChange={(e) =>
                                            setHomeworkForm({ ...homeworkForm, title: e.target.value })
                                        }
                                    />

                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Instructions</label>
                                    <textarea
                                        rows={4}
                                        placeholder={`Read Chapter 2 thoroughly and solve questions 1–10.\nSubmit in your notebook by tomorrow.`}
                                        className="w-full bg-brand-soft/10 dark:bg-slate-950 border-none rounded-2xl p-4 font-bold text-slate-700 dark:text-slate-200
                                             placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-brand-light outline-none transition-colors"
                                        value={homeworkForm.description}
                                        onChange={(e) =>
                                            setHomeworkForm({ ...homeworkForm, description: e.target.value })
                                        }
                                    />

                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Submission Date</label>
                                        <input type="date" className="w-full bg-brand-soft/10 dark:bg-slate-950 border-none rounded-xl p-4 font-black text-slate-600 dark:text-slate-400 outline-none"
                                            value={homeworkForm.dueDate} onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })} />
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        className={`w-full h-[56px] ${editingId ? 'bg-brand-dark dark:bg-slate-800' : 'bg-brand-light dark:bg-brand'}
                                            text-white rounded-xl font-black shadow-lg hover:opacity-90 transition-all
                                            flex items-center justify-center gap-3`}
                                    >
                                        <FiSend /> {editingId ? 'UPDATE CHANGES' : 'POST ASSIGNMENT'}
                                    </button>

                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[450px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-brand-soft dark:border-slate-800 p-10 text-center">
                            <FiPlusCircle size={40} className="text-brand-light dark:text-slate-700 mb-4 opacity-40" />
                            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">Select a Class</h3>
                            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-2">Choose a period from the left schedule to start.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ACTIVITY LOG --- */}
            <div className="px-6 mt-12">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-6 px-2 flex items-center gap-2">
                    <FiClock className="text-brand-light dark:text-brand-soft" /> Recent Activity
                </h2>
                <div className="space-y-4">
                    {history.map((hw) => (
                        <div key={hw.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-brand-soft/40 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="p-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <span className="bg-brand-soft dark:bg-brand/20 text-brand-light dark:text-brand-soft px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap">
                                        {hw.class_name}-{hw.section}
                                    </span>
                                    <div>
                                        <h4 className="font-black text-slate-700 dark:text-slate-200 leading-tight">{hw.subjects?.name}</h4>
                                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">{hw.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="hidden sm:block">
                                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest text-center">Due Date</p>
                                        <p className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <FiCalendar className="text-brand-light dark:text-brand-soft" /> {new Date(hw.due_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setViewingHw(hw)} className="p-3 bg-brand-soft/30 dark:bg-brand/10 text-brand-light dark:text-brand-soft rounded-xl hover:bg-brand-soft dark:hover:bg-slate-800 transition-colors shadow-sm">
                                            <FiBookOpen size={18} />
                                        </button>
                                        <button onClick={() => {
                                            setSelectedSlot({
                                                id: 'editing',
                                                class: hw.class_name,
                                                section: hw.section,
                                                period: hw.period,
                                                subject_id: hw.subject_id,
                                                subjects: hw.subjects
                                            })

                                            setHomeworkForm({ title: hw.title, description: hw.description, dueDate: hw.due_date });
                                            setEditingId(hw.id);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-brand-light hover:text-white transition-all shadow-sm">
                                            <FiActivity size={18} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(hw)}
                                            className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-300 dark:text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/30 dark:bg-black/60 backdrop-blur-sm p-6">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border dark:border-slate-800">

                        <div className="bg-rose-50 dark:bg-rose-500/10 p-6 flex items-center gap-4 border-b border-rose-100 dark:border-rose-500/20">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center">
                                <FiTrash2 size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Delete</p>
                                <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">Delete Homework?</h3>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">
                                This will permanently remove the homework for
                                <span className="text-slate-800 dark:text-slate-200"> {deleteTarget.subjects?.name}</span>.
                                This action cannot be undone.
                            </p>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1 h-[48px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 h-[48px] bg-rose-500 text-white rounded-xl font-black hover:bg-rose-600 transition"
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}