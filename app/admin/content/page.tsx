'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
    FiUpload, FiTrash2, FiEye, FiDownload, FiSearch, FiEdit3,
    FiFileText, FiVideo, FiImage, FiFolder, FiCalendar, FiClock, FiDatabase
} from 'react-icons/fi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CONTENT_TYPES = [
    { label: 'PDF', accept: '.pdf' },
    { label: 'Video', accept: 'video/*' },
    { label: 'Image', accept: 'image/*' },
    { label: 'Document', accept: '.doc,.docx,.txt' }
]
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English']

export default function ContentHubPage() {
    const [contents, setContents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [viewingResource, setViewingResource] = useState<any | null>(null)
    const [editingResource, setEditingResource] = useState<any | null>(null) // NEW: Edit State
    const [deleteId, setDeleteId] = useState<number | null>(null)
    
    const [formData, setFormData] = useState({
        title: '', subject: '', class: '', type: '', description: '', file: null as File | null
    })

    const [filterSubject, setFilterSubject] = useState('All')
    const [filterType, setFilterType] = useState('All')

    const fetchContent = async () => {
        setLoading(true)
        let query = supabase.from('content_hub').select('*').eq('is_active', true)
        if (filterSubject !== 'All') query = query.eq('subject', filterSubject)
        if (filterType !== 'All') query = query.eq('content_type', filterType)

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) toast.error('Failed to fetch content')
        else setContents(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchContent() }, [filterSubject, filterType])

    // --- HANDLE EDIT SUBMIT ---
    const handleUpdateContent = async () => {
        if (!editingResource.title || !editingResource.subject) return toast.error('Fields cannot be empty');
        
        const updateToast = toast.loading('Updating record...');
        try {
            const { error } = await supabase
                .from('content_hub')
                .update({
                    title: editingResource.title,
                    subject: editingResource.subject,
                    class: editingResource.class,
                    description: editingResource.description
                })
                .eq('id', editingResource.id);

            if (error) throw error;

            toast.success('Changes saved!', { id: updateToast });
            setEditingResource(null);
            fetchContent();
        } catch (err) {
            toast.error('Update failed', { id: updateToast });
        }
    }

    const downloadToSystem = async (fileUrl: string, fileName: string) => {
        const downloadToast = toast.loading('Preparing download...');
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); 
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Download started', { id: downloadToast });
        } catch (error) {
            toast.error('Download failed', { id: downloadToast });
        }
    };

    const handleFileUpload = async () => {
        if (!formData.file) return toast.error('Select a file first')
        if (!formData.title || !formData.subject || !formData.class || !formData.type)
            return toast.error('Please fill all required fields')

        const loadingToast = toast.loading('Uploading content...')

        try {
            const path = `${formData.subject}/${Date.now()}-${formData.file.name}`
            const { error: uploadError } = await supabase.storage.from('content_hubs').upload(path, formData.file)
            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from('content_hubs').getPublicUrl(path)
            const fileSize = (formData.file.size / (1024 * 1024)).toFixed(2)

            const { error: dbError } = await supabase.from('content_hub').insert([{
                title: formData.title,
                description: formData.description,
                subject: formData.subject,
                class: formData.class,
                content_type: formData.type,
                file_url: urlData.publicUrl,
                file_size_mb: fileSize,
                uploaded_by: 'Admin User',
                uploader_role: 'admin',
                is_active: true
            }])

            if (dbError) throw dbError

            toast.success('Content published successfully', { id: loadingToast })
            setShowUploadModal(false)
            setFormData({ title: '', subject: '', class: '', type: '', description: '', file: null })
            fetchContent()
        } catch (err: any) {
            toast.error(err.message || 'Upload failed', { id: loadingToast })
        }
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        const delToast = toast.loading('Deleting resource...')
        const { error } = await supabase.from('content_hub').update({ is_active: false }).eq('id', deleteId)
        if (error) toast.error('Delete failed', { id: delToast })
        else {
            toast.success('Moved to trash', { id: delToast })
            setDeleteId(null)
            fetchContent()
        }
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-8">
            <Toaster position="top-right" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Content Hub</h1>
                    <p className="text-slate-500 font-medium">Manage and organize your learning materials</p>
                </div>

                {/* STATS SECTION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={<FiFolder className="text-purple-600" />} label="Total Files" count={contents.length} color="bg-purple-50" />
                    <StatCard icon={<FiFileText className="text-blue-600" />} label="Documents" count={contents.filter(c => c.content_type !== 'Video' && c.content_type !== 'Image').length} color="bg-blue-50" />
                    <StatCard icon={<FiVideo className="text-green-600" />} label="Videos" count={contents.filter(c => c.content_type === 'Video').length} color="bg-green-50" />
                    <StatCard icon={<FiImage className="text-orange-600" />} label="Images" count={contents.filter(c => c.content_type === 'Image').length} color="bg-orange-50" />
                </div>

                {/* CTA BOX */}
                <div className="bg-[#F0E9FF] p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center mb-10 border border-[#DED0FF] shadow-sm">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <h3 className="text-xl font-bold text-[#4B1E96] mb-1">Upload Learning Materials</h3>
                        <p className="text-[#7E57C2] font-medium opacity-90">Easily share files with your students.</p>
                    </div>
                    <button onClick={() => setShowUploadModal(true)} className="bg-[#8B3DFF] hover:bg-[#7426F0] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-purple-200 transition-all active:scale-95">
                        <FiUpload size={20} /> Upload Content
                    </button>
                </div>

                {/* TABLE SECTION */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-12">
                    <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">All Resources</h3>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <select onChange={e => setFilterType(e.target.value)} className="flex-1 sm:flex-none text-sm font-semibold border border-slate-200 p-2.5 px-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <option value="All">All Types</option>
                                {CONTENT_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                            </select>
                            <select onChange={e => setFilterSubject(e.target.value)} className="flex-1 sm:flex-none text-sm font-semibold border border-slate-200 p-2.5 px-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <option value="All">All Subjects</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-50/50">
                                    <th className="px-8 py-5">Title</th>
                                    <th className="px-8 py-5">Type</th>
                                    <th className="px-8 py-5">Subject</th>
                                    <th className="px-8 py-5">Class</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-[#8B3DFF] animate-pulse font-bold text-lg italic">Fetching materials...</td></tr>
                                ) : contents.length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium italic">No resources found</td></tr>
                                ) : contents.map((content) => (
                                    <tr key={content.id} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="px-8 py-5 font-bold text-slate-800">{content.title}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${content.content_type === 'PDF' ? 'bg-rose-50 text-rose-600' : content.content_type === 'Video' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {content.content_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 font-semibold text-sm">{content.subject}</td>
                                        <td className="px-8 py-5 text-slate-500 font-semibold text-sm">{content.class}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-3 items-center justify-end">
                                                <button onClick={() => setViewingResource(content)} className="text-[#8B3DFF] bg-purple-50 p-2 rounded-lg hover:bg-purple-100 transition-colors" title="View">
                                                    <FiEye size={18} />
                                                </button>
                                                <button onClick={() => setEditingResource(content)} className="text-blue-500 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                                                    <FiEdit3 size={18} />
                                                </button>
                                                <button onClick={() => downloadToSystem(content.file_url, content.title)} className="text-slate-400 bg-slate-50 p-2 rounded-lg hover:text-emerald-500 hover:bg-emerald-50 transition-colors" title="Download">
                                                    <FiDownload size={18} />
                                                </button>
                                                <button onClick={() => setDeleteId(content.id)} className="text-slate-300 hover:text-rose-500 transition-colors ml-2" title="Delete">
                                                    <FiTrash2 size={18} />
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

            {/* --- EDIT MODAL --- */}
            {editingResource && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setEditingResource(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500">✕</button>
                        <h2 className="text-xl font-black text-slate-900 mb-1">Edit Resource</h2>
                        <p className="text-slate-400 text-sm mb-6 font-medium">Update the metadata for this file</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Title</label>
                                <input type="text" value={editingResource.title} className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm" onChange={e => setEditingResource({ ...editingResource, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Subject</label>
                                    <select value={editingResource.subject} className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm cursor-pointer" onChange={e => setEditingResource({ ...editingResource, subject: e.target.value })}>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Class</label>
                                    <input type="text" value={editingResource.class} className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm" onChange={e => setEditingResource({ ...editingResource, class: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">File Status</label>
                                <div className="bg-slate-50 p-3 rounded-xl text-xs font-bold text-slate-500 italic">File cannot be swapped during edit. Delete and re-upload to change the actual file.</div>
                            </div>
                            <button onClick={handleUpdateContent} className="w-full bg-[#8B3DFF] hover:bg-[#7426F0] text-white py-4 rounded-xl font-black text-md shadow-lg transition-all active:scale-95 mt-2">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM DELETE MODAL --- */}
            {deleteId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 text-center">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <FiTrash2 size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Resource?</h2>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">Moved items can be restored from the trash by an administrator.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW MODAL --- */}
            {viewingResource && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="bg-[#8B3DFF] p-8 text-white relative">
                            <button onClick={() => setViewingResource(null)} className="absolute top-6 right-6 opacity-70 hover:opacity-100">✕</button>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                                {viewingResource.content_type === 'Video' ? <FiVideo /> : <FiFileText />}
                            </div>
                            <h2 className="text-2xl font-black leading-tight mb-1">{viewingResource.title}</h2>
                            <p className="opacity-80 text-sm font-medium">{viewingResource.subject} • {viewingResource.class}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                                    <p className="font-bold text-slate-700">{viewingResource.content_type}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Size</p>
                                    <p className="font-bold text-slate-700">{viewingResource.file_size_mb} MB</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <a href={viewingResource.file_url} target="_blank" className="flex-1 bg-slate-900 text-white text-center py-3.5 rounded-xl font-bold text-sm hover:bg-black transition-all">Preview</a>
                                <button onClick={() => downloadToSystem(viewingResource.file_url, viewingResource.title)} className="flex-[1.5] bg-[#8B3DFF] text-white text-center py-3.5 rounded-xl font-bold text-sm hover:bg-[#7426F0] transition-all flex items-center justify-center gap-2">
                                    <FiDownload size={16} /> Save to System
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- UPLOAD MODAL --- */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500">✕</button>
                        <h2 className="text-xl font-black text-slate-900 mb-1">New Resource</h2>
                        <p className="text-slate-400 text-sm mb-6 font-medium">Add materials to your library</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Title</label>
                                <input type="text" placeholder="Chapter Name" className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm" onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Subject</label>
                                    <select className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm cursor-pointer" onChange={e => setFormData({ ...formData, subject: e.target.value })}>
                                        <option value="">Select</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Class</label>
                                    <input type="text" placeholder="e.g. 10A" className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm" onChange={e => setFormData({ ...formData, class: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Format Type</label>
                                <select className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-[#8B3DFF] outline-none font-semibold text-sm cursor-pointer" onChange={e => setFormData({ ...formData, type: e.target.value, file: null })}>
                                    <option value="">Select Type</option>
                                    {CONTENT_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:border-purple-200 transition-all bg-slate-50/30 group">
                                <input type="file" id="fileUp" className="hidden" disabled={!formData.type} onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })} />
                                <label htmlFor="fileUp" className={`cursor-pointer ${!formData.type ? 'opacity-30' : 'opacity-100'}`}>
                                    <FiUpload className="mx-auto mb-2 text-slate-300 group-hover:text-[#8B3DFF]" size={24} />
                                    <p className="text-slate-500 font-bold text-xs">{formData.file ? formData.file.name : formData.type ? `Choose ${formData.type}` : 'Select type first'}</p>
                                </label>
                            </div>
                            <button onClick={handleFileUpload} className="w-full bg-[#8B3DFF] hover:bg-[#7426F0] text-white py-4 rounded-xl font-black text-md shadow-lg transition-all active:scale-95 mt-2">Publish Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ icon, label, count, color }: any) {
    return (
        <div className={`${color} p-6 rounded-3xl flex items-center gap-4 border border-white shadow-sm transition-transform hover:scale-[1.02]`}>
            <div className="p-3 bg-white rounded-xl shadow-sm text-xl flex items-center justify-center">{icon}</div>
            <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{count}</p>
            </div>
        </div>
    )
}