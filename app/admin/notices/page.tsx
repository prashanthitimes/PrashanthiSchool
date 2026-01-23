'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
    FiPlus, FiX, FiFileText, FiTrash2, FiSend, FiBell,
    FiEye, FiEdit2, FiCheck, FiAlertCircle, FiGrid, FiCheckCircle,
    FiShield, FiClock, FiDownload, FiUsers, FiTag, FiCalendar
} from 'react-icons/fi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['Event', 'Meeting', 'Exam', 'Holiday', 'General']
const RECIPIENTS_OPTIONS = ['Students', 'Parents', 'Teachers']

export default function NoticesManagement() {
    const [notices, setNotices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [viewingNotice, setViewingNotice] = useState<any | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        title: '', category: 'General', priority: 'Medium', content: '', recipients: [] as string[], is_active: true
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
        if (role === 'All') {
            const isAllSelected = formData.recipients.length === RECIPIENTS_OPTIONS.length
            setFormData(prev => ({ ...prev, recipients: isAllSelected ? [] : [...RECIPIENTS_OPTIONS] }))
        } else {
            setFormData(prev => ({
                ...prev,
                recipients: prev.recipients.includes(role)
                    ? prev.recipients.filter(r => r !== role)
                    : [...prev.recipients, role]
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.recipients.length === 0) return toast.error("Select at least one recipient")

        setIsUploading(true)
        const loadingToast = toast.loading(editingId ? "Updating..." : "Publishing...")

        let attachment_url = (notices.find(n => n.id === editingId))?.attachment_url || ''
        let attachment_name = (notices.find(n => n.id === editingId))?.attachment_name || ''

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
            toast.success("Success", { id: loadingToast })
            closeModal()
            fetchNotices()
        }
        setIsUploading(false)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingId(null)
        setFile(null)
        setFormData({ title: '', category: 'General', priority: 'Medium', content: '', recipients: [], is_active: true })
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
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-brand hover:bg-brand-dark text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand/30">
                    <FiPlus size={18} className="inline mr-2" /> New Notice
                </button>
            </header>

            <div className="grid lg:grid-cols-12 gap-6">
                {/* Sidebar */}
                <aside className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-brand-accent shadow-sm">
                        <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-6">Metrics</p>
                        <div className="space-y-5">
                            <Metric icon={<FiGrid />} label="Total" value={notices.length} />
                            <Metric icon={<FiCheckCircle className="text-brand" />} label="Active" value={notices.filter(n => n.is_active).length} />
                            <Metric icon={<FiAlertCircle className="text-rose-500" />} label="Inactive" value={notices.filter(n => !n.is_active).length} />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-20 font-black text-brand-soft animate-pulse uppercase text-xs">Accessing Data...</div>
                        ) : notices.map((notice) => (
                            <NoticeCard
                                key={notice.id}
                                notice={notice}
                                onView={() => setViewingNotice(notice)}
                                onEdit={() => {
                                    setFormData(notice);
                                    setEditingId(notice.id);
                                    setShowModal(true);
                                }}
                                onDelete={async () => {
                                    if (confirm("Confirm Purge?")) {
                                        await supabase.from('notices_circulars').delete().eq('id', notice.id);
                                        fetchNotices();
                                    }
                                }}
                            />
                        ))}
                    </div>
                </main>
            </div>

            {/* FULL VIEW MODAL - SHOWING ALL DETAILS */}
            {viewingNotice && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-brand-accent overflow-hidden animate-in zoom-in duration-300">
                        {/* Status Line */}
                        <div className={`h-2 w-full ${viewingNotice.is_active ? 'bg-brand' : 'bg-rose-500'}`} />

                        <div className="p-10 relative">
                            <button onClick={() => setViewingNotice(null)} className="absolute top-8 right-8 text-brand-light p-2 bg-brand-soft rounded-full hover:bg-brand-accent transition-colors"><FiX size={20} /></button>

                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-brand-soft text-brand font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2">
                                    <FiTag /> {viewingNotice.category}
                                </span>
                                <span className={`font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest ${viewingNotice.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {viewingNotice.priority} Priority
                                </span>
                            </div>

                            <h2 className="text-3xl font-black text-brand-dark leading-tight uppercase tracking-tighter mb-6">{viewingNotice.title}</h2>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <DetailItem icon={<FiCalendar />} label="Date Published" value={new Date(viewingNotice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                                <DetailItem icon={<FiUsers />} label="Target Audience" value={viewingNotice.recipients?.join(', ') || 'Global'} />
                            </div>

                            <div className="bg-brand-accent/30 p-8 rounded-[2rem] mb-8 border border-brand-accent/50">
                                <p className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-3">Notice Content</p>
                                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{viewingNotice.content}</p>
                            </div>

                            {viewingNotice.attachment_url && (
                                <a href={viewingNotice.attachment_url} target="_blank" className="flex items-center justify-between p-5 bg-brand text-white rounded-[1.5rem] group hover:bg-brand-dark transition-all shadow-lg shadow-brand/20">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 p-2 rounded-lg"><FiFileText size={20} /></div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase opacity-70">Official Attachment</p>
                                            <p className="text-xs font-black truncate max-w-[300px]">{viewingNotice.attachment_name}</p>
                                        </div>
                                    </div>
                                    <FiDownload className="mr-2 group-hover:translate-y-1 transition-transform" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-brand-accent overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-10 pb-0 flex justify-between items-center">
                            <h2 className="font-black text-2xl text-brand-dark uppercase tracking-tighter">{editingId ? 'Modify Entry' : 'New Registry'}</h2>
                            <button onClick={closeModal} className="text-brand-light p-2 bg-brand-soft rounded-full"><FiX size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <Field label="Notice Title" value={formData.title} onChange={(v: any) => setFormData({ ...formData, title: v })} />
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField label="Category" value={formData.category} onChange={(v: any) => setFormData({ ...formData, category: v })} options={CATEGORIES} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Visibility Status</label>
                                    <div className="flex gap-2 p-1 bg-brand-accent rounded-2xl">
                                        <button type="button" onClick={() => setFormData({ ...formData, is_active: true })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${formData.is_active ? 'bg-brand text-white shadow-md' : 'text-brand-light'}`}>Active</button>
                                        <button type="button" onClick={() => setFormData({ ...formData, is_active: false })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!formData.is_active ? 'bg-rose-500 text-white shadow-md' : 'text-brand-light'}`}>Inactive</button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Recipients</label>
                                <div className="grid grid-cols-4 gap-2">
                                    <RecipientBtn label="All" active={formData.recipients.length === 3} onClick={() => toggleRecipient('All')} />
                                    {RECIPIENTS_OPTIONS.map(r => (
                                        <RecipientBtn key={r} label={r} active={formData.recipients.includes(r)} onClick={() => toggleRecipient(r)} />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Official Content</label>
                                <textarea required rows={4} className="w-full bg-brand-accent/30 border border-brand-accent p-4 rounded-2xl outline-none focus:border-brand-light font-bold text-brand-dark text-sm" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
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

// --- Internal Helper Components ---

function NoticeCard({ notice, onEdit, onDelete, onView }: any) {
    const isActive = notice.is_active;
    return (
        <div className={`p-8 rounded-[2.5rem] bg-white border transition-all hover:shadow-2xl group relative overflow-hidden ${isActive ? 'border-brand-accent/50 shadow-md' : 'border-transparent shadow-sm'}`}>
            {!isActive && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 z-20" />}
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-4 rounded-2xl ${isActive ? 'bg-brand-soft text-brand' : 'bg-slate-100 text-slate-400'}`}>
                    <FiBell size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={onView} className="p-3 text-brand hover:bg-brand-accent rounded-xl"><FiEye size={16} /></button>
                    <button onClick={onEdit} className="p-3 text-brand-light hover:bg-brand-accent rounded-xl"><FiEdit2 size={16} /></button>
                    <button onClick={onDelete} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl"><FiTrash2 size={16} /></button>
                </div>
            </div>
            <div className="mt-6 relative z-10">
                <h3 className={`font-black text-lg leading-tight uppercase tracking-tight ${isActive ? 'text-brand-dark' : 'text-slate-400'}`}>{notice.title}</h3>
                <div className="flex items-center gap-2 mt-3">
                    <span className="text-[8px] font-black text-brand-light bg-brand-accent px-2 py-0.5 rounded uppercase tracking-wider">{notice.category}</span>
                    {!isActive && <span className="text-[8px] font-black text-rose-500 border border-rose-500 px-1.5 py-0.5 rounded uppercase">Inactive</span>}
                </div>
            </div>
            <div className="pt-6 mt-6 border-t border-brand-accent flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">{new Date(notice.created_at).toLocaleDateString()}</span>
                <span className="text-brand-dark">{notice.recipients?.slice(0, 1)}...</span>
            </div>
        </div>
    )
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
        <button type="button" onClick={onClick} className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${active ? 'bg-brand text-white border-brand shadow-md' : 'bg-brand-accent border-transparent text-brand-light hover:border-brand-soft'}`}>
            {label}
        </button>
    )
}