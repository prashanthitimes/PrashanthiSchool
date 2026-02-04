'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
    FiPlus, FiX, FiFileText, FiTrash2, FiSend, FiBell,
    FiEye, FiEdit2, FiCheck, FiAlertCircle, FiGrid, FiCheckCircle,
    FiShield, FiClock, FiDownload, FiUsers, FiTag, FiCalendar, FiLayers
} from 'react-icons/fi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['Event', 'Meeting', 'Exam', 'Holiday', 'General']
const RECIPIENTS_OPTIONS = ['Students', 'Parents', 'Teachers']
const CLASSES = Array.from({ length: 10 }, (_, i) => (i + 1).toString())
const SECTIONS = ['A', 'B', 'C']

export default function NoticesManagement() {
    const [notices, setNotices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [viewingNotice, setViewingNotice] = useState<any | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '', 
        category: 'General', 
        priority: 'Medium', 
        content: '', 
        recipients: [] as string[], 
        is_active: true,
        target_classes: [] as string[],
        target_all_classes: false
    })

    const fetchNotices = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('notices_circulars')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) toast.error('Failed to load registry')
        else setNotices(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchNotices() }, [])

    const toggleRecipient = (role: string) => {
        setFormData(prev => {
            const isSelected = prev.recipients.includes(role)
            const newRecipients = isSelected 
                ? prev.recipients.filter(r => r !== role) 
                : [...prev.recipients, role]
            
            return { 
                ...prev, 
                recipients: newRecipients,
                // Reset classes if Students is unselected
                target_classes: !newRecipients.includes('Students') ? [] : prev.target_classes,
                target_all_classes: !newRecipients.includes('Students') ? false : prev.target_all_classes
            }
        })
    }

    const toggleClassSection = (cls: string, sec: string) => {
        const val = `${cls}-${sec}`
        setFormData(prev => ({
            ...prev,
            target_all_classes: false,
            target_classes: prev.target_classes.includes(val)
                ? prev.target_classes.filter(t => t !== val)
                : [...prev.target_classes, val]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.recipients.length === 0) return toast.error("Select at least one recipient")
        if (formData.recipients.includes('Students') && !formData.target_all_classes && formData.target_classes.length === 0) {
            return toast.error("Please select at least one Class/Section")
        }

        setIsUploading(true)
        const loadingToast = toast.loading(editingId ? "Updating..." : "Publishing...")

        let attachment_url = editingId ? (notices.find(n => n.id === editingId))?.attachment_url : ''
        let attachment_name = editingId ? (notices.find(n => n.id === editingId))?.attachment_name : ''

        if (file) {
            const fileName = `${Date.now()}-${file.name}`
            const { error: upError } = await supabase.storage.from('notices-attachments').upload(fileName, file)
            if (!upError) {
                attachment_url = supabase.storage.from('notices-attachments').getPublicUrl(fileName).data.publicUrl
                attachment_name = file.name
            }
        }

        const payload = { ...formData, attachment_url, attachment_name }
        const action = editingId
            ? supabase.from('notices_circulars').update(payload).eq('id', editingId)
            : supabase.from('notices_circulars').insert([payload])

        const { error } = await action
        if (error) toast.error(error.message, { id: loadingToast })
        else {
            toast.success("Notice Committed", { id: loadingToast })
            closeModal()
            fetchNotices()
        }
        setIsUploading(false)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingId(null)
        setFile(null)
        setFormData({ 
            title: '', category: 'General', priority: 'Medium', content: '', 
            recipients: [], is_active: true, target_classes: [], target_all_classes: false 
        })
    }

    return (
        <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-500">
            <Toaster position="top-right" />
            
            {/* Header */}
            <header className="flex items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-brand-accent shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-accent text-brand-light rounded-2xl flex items-center justify-center shadow-inner">
                        <FiShield size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-brand-dark tracking-tight uppercase leading-none">Notice Registry</h1>
                        <p className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mt-1">Official Communications</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-brand hover:bg-brand-dark text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand/30">
                    <FiPlus size={18} className="inline mr-2" /> New Notice
                </button>
            </header>

            <div className="grid lg:grid-cols-12 gap-6">
                <aside className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-brand-accent shadow-sm">
                        <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-6">Metrics</p>
                        <div className="space-y-5">
                            <Metric icon={<FiGrid />} label="Total" value={notices.length} />
                            <Metric icon={<FiCheckCircle className="text-brand" />} label="Active" value={notices.filter(n => n.is_active).length} />
                        </div>
                    </div>
                </aside>

                <main className="lg:col-span-9">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-20 font-black text-brand-soft animate-pulse uppercase text-xs">Accessing Data...</div>
                        ) : notices.map((notice) => (
                            <NoticeCard
                                key={notice.id}
                                notice={notice}
                                onView={() => setViewingNotice(notice)}
                                onEdit={() => { setFormData(notice); setEditingId(notice.id); setShowModal(true); }}
                                onDelete={async () => { if (confirm("Confirm Purge?")) { await supabase.from('notices_circulars').delete().eq('id', notice.id); fetchNotices(); } }}
                            />
                        ))}
                    </div>
                </main>
            </div>

            {/* FULL VIEW MODAL */}
            {viewingNotice && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-brand-accent overflow-hidden animate-in zoom-in duration-300">
                        <div className={`h-2 w-full ${viewingNotice.is_active ? 'bg-brand' : 'bg-rose-500'}`} />
                        <div className="p-10 relative">
                            <button onClick={() => setViewingNotice(null)} className="absolute top-8 right-8 text-brand-light p-2 bg-brand-soft rounded-full hover:bg-brand-accent transition-colors"><FiX size={20} /></button>
                            <h2 className="text-3xl font-black text-brand-dark leading-tight uppercase tracking-tighter mb-6">{viewingNotice.title}</h2>
                            
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <DetailItem icon={<FiUsers />} label="Target Audience" value={viewingNotice.recipients?.join(', ')} />
                                {viewingNotice.recipients.includes('Students') && (
                                    <DetailItem icon={<FiLayers />} label="Classes" value={viewingNotice.target_all_classes ? "All Classes" : viewingNotice.target_classes.join(', ')} />
                                )}
                            </div>

                            <div className="bg-brand-accent/30 p-8 rounded-[2rem] mb-8 border border-brand-accent/50">
                                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewingNotice.content}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl border border-brand-accent overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-10 pb-4 flex justify-between items-center">
                            <h2 className="font-black text-2xl text-brand-dark uppercase tracking-tighter">{editingId ? 'Modify Entry' : 'New Registry'}</h2>
                            <button onClick={closeModal} className="text-brand-light p-2 bg-brand-soft rounded-full"><FiX size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-6 overflow-y-auto">
                            <Field label="Notice Title" value={formData.title} onChange={(v: any) => setFormData({ ...formData, title: v })} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField label="Category" value={formData.category} onChange={(v: any) => setFormData({ ...formData, category: v })} options={CATEGORIES} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Visibility</label>
                                    <div className="flex gap-2 p-1 bg-brand-accent rounded-2xl">
                                        <button type="button" onClick={() => setFormData({ ...formData, is_active: true })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.is_active ? 'bg-brand text-white' : 'text-brand-light'}`}>Active</button>
                                        <button type="button" onClick={() => setFormData({ ...formData, is_active: false })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!formData.is_active ? 'bg-rose-500 text-white' : 'text-brand-light'}`}>Inactive</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Recipients</label>
                                <div className="flex gap-2">
                                    {RECIPIENTS_OPTIONS.map(r => (
                                        <RecipientBtn key={r} label={r} active={formData.recipients.includes(r)} onClick={() => toggleRecipient(r)} />
                                    ))}
                                </div>
                            </div>

                            {/* CONDITIONAL CLASS SELECTOR */}
                            {formData.recipients.includes('Students') && (
                                <div className="p-6 bg-brand-soft/50 rounded-[2rem] border border-brand-accent animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[10px] font-black text-brand uppercase tracking-widest">Class & Section Selection</label>
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(prev => ({ ...prev, target_all_classes: !prev.target_all_classes, target_classes: [] }))}
                                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${formData.target_all_classes ? 'bg-brand text-white border-brand' : 'border-brand text-brand hover:bg-brand hover:text-white'}`}>
                                            {formData.target_all_classes ? 'Selected: All Classes' : 'Select All Classes'}
                                        </button>
                                    </div>
                                    
                                    {!formData.target_all_classes && (
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                            {CLASSES.map(cls => (
                                                <div key={cls} className="space-y-1">
                                                    <p className="text-[9px] font-black text-brand-light text-center uppercase">Class {cls}</p>
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {SECTIONS.map(sec => {
                                                            const isSel = formData.target_classes.includes(`${cls}-${sec}`)
                                                            return (
                                                                <button
                                                                    key={sec}
                                                                    type="button"
                                                                    onClick={() => toggleClassSection(cls, sec)}
                                                                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-bold border transition-all ${isSel ? 'bg-brand text-white border-brand' : 'bg-white text-brand-light border-brand-accent hover:border-brand-soft'}`}>
                                                                    {sec}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Official Content</label>
                                <textarea required rows={4} className="w-full bg-brand-accent/30 border border-brand-accent p-4 rounded-2xl outline-none font-bold text-brand-dark text-sm" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                            </div>

                            <button type="submit" disabled={isUploading} className="w-full py-5 bg-brand hover:bg-brand-dark text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-2">
                                <FiSend /> {isUploading ? 'Executing...' : 'Commit Notice'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

// Reuse your existing helper components (NoticeCard, DetailItem, Metric, Field, SelectField, RecipientBtn)...
// [Keeping logic same as your provided code for helpers]
function NoticeCard({ notice, onEdit, onDelete, onView }: any) {
    const isActive = notice.is_active;
    
    return (
        <div className={`group relative bg-white rounded-[2rem] border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isActive ? 'border-slate-200 shadow-sm' : 'border-rose-100 bg-rose-50/30'}`}>
            
            {/* Top Status Bar & Date Badge */}
            <div className="flex justify-between items-center p-6 pb-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                        {new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {!isActive && (
                        <span className="text-[9px] font-black text-rose-500 uppercase mt-1 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Inactive
                        </span>
                    )}
                </div>

                {/* Quick Actions - Floating Style */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-xl">
                    <button onClick={onView} title="View Details" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><FiEye size={16} /></button>
                    <button onClick={onEdit} title="Edit" className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><FiEdit2 size={16} /></button>
                    <button onClick={onDelete} title="Delete" className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><FiTrash2 size={16} /></button>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 pt-4">
                <div className="mb-4">
                    <h3 className={`text-xl font-bold leading-tight tracking-tight mb-2 line-clamp-2 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                        {notice.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                            {notice.category}
                        </span>
                        {notice.recipients.includes('Students') && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                                {notice.target_all_classes ? 'Entire School' : `${notice.target_classes.length} Classes`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Description Preview */}
                <p className={`text-sm leading-relaxed line-clamp-3 mb-6 ${isActive ? 'text-slate-500' : 'text-slate-300 italic'}`}>
                    {notice.content}
                </p>

                {/* Footer Section */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                    <div className="flex -space-x-2">
                        {notice.recipients?.map((r: string) => (
                            <div 
                                key={r} 
                                title={r} 
                                className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-700 shadow-sm ring-1 ring-slate-100"
                            >
                                {r[0]}
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={onView}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5 group/btn"
                    >
                        Read Full <FiSend className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Inactive Overlay Grid */}
            {!isActive && (
                <div className="absolute inset-0 bg-white/40 pointer-events-none rounded-[2rem] z-0" />
            )}
        </div>
    );
}

function DetailItem({ icon, label, value }: any) {
    return (
        <div className="flex items-start gap-3">
            <div className="bg-brand-accent p-2.5 rounded-xl text-brand">{icon}</div>
            <div>
                <p className="text-[9px] font-black text-brand-light uppercase tracking-widest">{label}</p>
                <p className="text-sm font-black text-brand-dark uppercase tracking-tight">{value}</p>
            </div>
        </div>
    )
}

function Metric({ icon, label, value }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-brand bg-brand-accent p-2 rounded-lg">{icon}</span>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-lg font-black text-brand-dark">{value}</span>
        </div>
    )
}

function Field({ label, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">{label}</label>
            <input required value={value} onChange={e => onChange(e.target.value)} className="w-full bg-brand-accent/30 border border-brand-accent focus:border-brand-light p-4 rounded-2xl outline-none font-bold text-brand-dark transition-all" />
        </div>
    )
}

function SelectField({ label, value, onChange, options }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-brand-accent/30 border border-brand-accent p-4 rounded-2xl font-bold text-brand-dark outline-none cursor-pointer">
                {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )
}

function RecipientBtn({ label, active, onClick }: any) {
    return (
        <button type="button" onClick={onClick} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${active ? 'bg-brand text-white border-brand shadow-md' : 'bg-brand-accent border-transparent text-brand-light hover:border-brand-soft'}`}>
            {label}
        </button>
    )
}