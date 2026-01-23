'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
    FiBook, FiShield, FiInfo, FiLock, FiHome,
    FiUploadCloud, FiPlus, FiDownload, FiTrash2, FiX
} from 'react-icons/fi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RulesPage() {
    const [rules, setRules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    
    // Track if we are editing an existing rule
    const [editingId, setEditingId] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        title: '',
        category: 'Academic',
        version: 'v1.0'
    })

    useEffect(() => {
        fetchRules()
    }, [])

    const fetchRules = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('school_rules')
            .select('*')
            .eq('is_active', true)
            .order('last_updated', { ascending: false })

        if (!error) setRules(data || [])
        setLoading(false)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setSelectedFile(null)
        setFormData({ title: '', category: 'Academic', version: 'v1.0' })
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return
        const { error } = await supabase
            .from('school_rules')
            .update({ is_active: false })
            .eq('id', id)

        if (error) toast.error("Failed to delete")
        else {
            toast.success("Rule removed")
            fetchRules()
        }
    }

    const handleDownload = async (url: string, title: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            toast.error("Download failed");
        }
    };

    const handleEdit = (rule: any) => {
        setEditingId(rule.id);
        setFormData({
            title: rule.title,
            category: rule.category,
            version: rule.version || 'v1.0'
        });
        setIsModalOpen(true);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            toast.success(`File selected: ${file.name}`)
        }
    }

    // --- LOGIC: UPDATE EXISTING ---
    const handleUpdateRegulation = async () => {
        if (!formData.title) return toast.error("Please enter a title")
        try {
            setUploading(true)
            const { error: dbError } = await supabase
                .from('school_rules')
                .update({
                    title: formData.title,
                    category: formData.category,
                    version: formData.version,
                    last_updated: new Date().toISOString().split('T')[0]
                })
                .eq('id', editingId)

            if (dbError) throw dbError
            toast.success('Regulation updated!')
            closeModal()
            fetchRules()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    // --- LOGIC: ADD NEW ---
    const handleAddRegulation = async () => {
        if (!formData.title) return toast.error("Please enter a title")
        if (!selectedFile) return toast.error("Please select a PDF file first")

        try {
            setUploading(true)
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `rules/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('school-documents')
                .upload(filePath, selectedFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('school-documents')
                .getPublicUrl(filePath)

            const { error: dbError } = await supabase.from('school_rules').insert([{
                title: formData.title,
                category: formData.category,
                version: formData.version,
                file_url: publicUrl,
                status: 'Active',
                is_active: true,
                last_updated: new Date().toISOString().split('T')[0]
            }])

            if (dbError) throw dbError

            toast.success('Regulation uploaded successfully!')
            closeModal()
            fetchRules()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setUploading(false)
        }
    }

    const categories = [
        { name: 'Academic', icon: <FiBook />, count: rules.filter(r => r.category === 'Academic').length },
        { name: 'Discipline', icon: <FiShield />, count: rules.filter(r => r.category === 'Discipline').length },
        { name: 'General', icon: <FiInfo />, count: rules.filter(r => r.category === 'General').length },
        { name: 'Safety', icon: <FiLock />, count: rules.filter(r => r.category === 'Safety').length },
        { name: 'Facilities', icon: <FiHome />, count: rules.filter(r => r.category === 'Facilities').length },
    ]

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-8 font-sans">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-slate-900">Rules & Regulations</h1>
                    <p className="text-slate-500 text-sm">Manage school policies and rules</p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {categories.map((cat) => (
                        <div key={cat.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-slate-400 text-[11px] font-bold uppercase mb-1">{cat.name}</p>
                            <p className="text-2xl font-black text-slate-800">{cat.count}</p>
                        </div>
                    ))}
                </div>

                {/* Banner */}
                <div className="bg-[#F3F0FF] border border-indigo-100 rounded-[2.5rem] p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 mb-1">Upload New Rules</h2>
                        <p className="text-slate-500 text-sm">Upload PDF documents for school policies</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-[#8B5CF6] text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg">
                        <FiUploadCloud /> Upload Document
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">All Rules & Regulations</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                    <th className="px-8 py-5">Title</th>
                                    <th className="px-8 py-5">Category</th>
                                    <th className="px-8 py-5 text-center">Last Updated</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-slate-50/50 transition-all">
                                        <td className="px-8 py-5 font-bold text-slate-700">{rule.title}</td>
                                        <td className="px-8 py-5">
                                            <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                                {rule.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-500 text-xs font-bold text-center">{rule.last_updated}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-3">
                                                <a href={rule.file_url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="View Document">
                                                    <FiBook size={18} />
                                                </a>
                                                <button onClick={() => handleDownload(rule.file_url, rule.title)} className="p-2 text-slate-400 hover:text-green-600 transition-colors" title="Download">
                                                    <FiDownload size={18} />
                                                </button>
                                                
                                                {/* EDIT BUTTON (Pencil Icon) */}
                                                <button onClick={() => handleEdit(rule)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors" title="Edit Rule">
                                                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>

                                                <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
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

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
                        <button onClick={closeModal} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><FiX size={20} /></button>
                        <h2 className="text-xl font-black text-slate-800">{editingId ? 'Edit Regulation' : 'New Regulation'}</h2>
                        <p className="text-slate-400 text-sm mb-6">{editingId ? 'Update details' : 'Fill in details and select your PDF'}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Document Title</label>
                                <input
                                    className="w-full border-2 border-slate-50 p-3.5 rounded-2xl outline-none focus:border-indigo-500 font-semibold bg-slate-50/50"
                                    placeholder="e.g. Student Conduct Policy"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Category</label>
                                    <select
                                        className="w-full border-2 border-slate-50 p-3.5 rounded-2xl outline-none font-semibold bg-slate-50/50"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Academic">Academic</option>
                                        <option value="Discipline">Discipline</option>
                                        <option value="General">General</option>
                                        <option value="Safety">Safety</option>
                                        <option value="Facilities">Facilities</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Version</label>
                                    <input
                                        className="w-full border-2 border-slate-50 p-3.5 rounded-2xl outline-none font-semibold bg-slate-50/50"
                                        placeholder="v1.0"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* FILE UPLOAD / STATUS SECTION */}
                            <div className="pt-2">
                                <label className={`w-full h-32 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all 
                                    ${editingId ? 'bg-slate-50 border-slate-100 cursor-not-allowed' : 
                                      selectedFile ? 'border-green-300 bg-green-50 cursor-pointer' : 'border-slate-200 hover:bg-slate-50 cursor-pointer'}`}>
                                    
                                    <FiUploadCloud className={`text-2xl mb-1 ${selectedFile ? 'text-green-500' : 'text-slate-400'}`} />
                                    <span className="text-[10px] px-8 text-center font-bold text-slate-500 uppercase leading-tight">
                                        {editingId 
                                            ? "File cannot be swapped during edit. Delete and re-upload to change the actual file." 
                                            : selectedFile ? selectedFile.name : 'Click to select PDF'}
                                    </span>
                                    {!editingId && (
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf"
                                            onChange={onFileChange}
                                        />
                                    )}
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={closeModal} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 border border-slate-100 hover:bg-slate-50">Cancel</button>
                                <button
                                    disabled={uploading}
                                    onClick={editingId ? handleUpdateRegulation : handleAddRegulation}
                                    className="flex-1 bg-[#8B5CF6] text-white py-3.5 rounded-2xl font-bold shadow-lg disabled:opacity-50"
                                >
                                    {uploading ? 'Processing...' : editingId ? 'Update' : 'Add Regulation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}