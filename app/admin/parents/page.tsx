'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
    FiUserPlus, FiX, FiSave, FiUsers, FiEdit3, FiTrash2, FiPhone, FiInfo, FiSearch, FiDownload, FiFilter, FiAlertTriangle
} from 'react-icons/fi'
import { GraduationCap, Loader2, Filter } from "lucide-react"
import { toast, Toaster } from "sonner"

export default function AdminParentsPage() {
    // --- STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    
    const [students, setStudents] = useState<any[]>([])
    const [parents, setParents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Search and Table Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [tableClassFilter, setTableClassFilter] = useState('')
    const [tableSectionFilter, setTableSectionFilter] = useState('')

    // Modal Selection filters
    const [modalSelectedClass, setModalSelectedClass] = useState('')
    const [modalSelectedSection, setModalSelectedSection] = useState('')

    const [formData, setFormData] = useState({
        full_name: '',
        relation: '',
        email: '',
        phone_number: '',
        child_id: '',
        temp_password: ''
    })

    // --- DATA FETCHING ---
    const fetchInitialData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: stu } = await supabase.from('students').select('id, full_name, class_name, section')
            const { data: par } = await supabase.from('parents').select(`*, students:child_id (full_name, class_name, section)`)
            setStudents(stu || [])
            setParents(par || [])
        } catch (error) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInitialData()
    }, [fetchInitialData])

    // --- LOGIC: FILTERING & SEARCH ---
    const filteredParents = useMemo(() => {
        return parents.filter(p => {
            const matchesSearch = p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 p.students?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = tableClassFilter === '' || p.students?.class_name === tableClassFilter;
            const matchesSection = tableSectionFilter === '' || p.students?.section === tableSectionFilter;
            return matchesSearch && matchesClass && matchesSection;
        })
    }, [parents, searchQuery, tableClassFilter, tableSectionFilter])

    const availableClasses = useMemo(() => [...new Set(students.map(s => s.class_name))].sort(), [students])
    const availableSectionsForModal = useMemo(() => {
        return [...new Set(students.filter(s => s.class_name === modalSelectedClass).map(s => s.section))].sort()
    }, [students, modalSelectedClass])
    
    const studentsForModal = useMemo(() => {
        return students.filter(s => s.class_name === modalSelectedClass && s.section === modalSelectedSection)
    }, [students, modalSelectedClass, modalSelectedSection])

    // --- CREDENTIAL GENERATOR ---
    const generateUniqueCreds = (parentName: string, studentId: string) => {
        if (!parentName || !studentId) return;
        const student = students.find(s => s.id === studentId)
        const studentPart = student ? `.${student.full_name.split(' ')[0]}` : ''
        const email = (parentName.toLowerCase().replace(/\s+/g, '.') + studentPart + "@parent.com").toLowerCase()
        const password = Math.random().toString(36).slice(-4).toUpperCase() + "!" + Math.floor(1000 + Math.random() * 9000)
        
        setFormData(prev => ({ 
            ...prev, 
            full_name: parentName, 
            email: email, 
            temp_password: prev.temp_password || password 
        }))
    }

    // --- ACTIONS ---
    const downloadCSV = () => {
        if (filteredParents.length === 0) return toast.error("No data to export")
        const headers = ["Parent Name", "Relation", "Email", "Password", "Phone", "Child Name", "Class", "Section"]
        const rows = filteredParents.map(p => [
            `"${p.full_name}"`, `"${p.relation}"`, `"${p.email}"`, `"${p.temp_password}"`, `"${p.phone_number}"`,
            `"${p.students?.full_name}"`, `"${p.students?.class_name}"`, `"${p.students?.section}"`
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `parent_credentials_${new Date().toLocaleDateString()}.csv`)
        link.click()
    }

    const handleClearAll = async () => {
        const confirmDelete = confirm("⚠️ DANGER: This will permanently delete ALL parent records. This action cannot be undone. Type 'OK' to proceed.")
        if (!confirmDelete) return

        setLoading(true)
        try {
            const { error } = await supabase.from('parents').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Selects all rows
            if (error) throw error
            toast.success("All parent records cleared successfully")
            fetchInitialData()
        } catch (err: any) {
            toast.error("Cleanup failed: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenAddModal = () => {
        setIsEditMode(false)
        setSelectedId(null)
        setModalSelectedClass('')
        setModalSelectedSection('')
        setFormData({ full_name: '', relation: '', email: '', phone_number: '', child_id: '', temp_password: '' })
        setIsModalOpen(true)
    }

    const handleEditClick = (parent: any) => {
        setIsEditMode(true)
        setSelectedId(parent.id)
        if (parent.students) {
            setModalSelectedClass(parent.students.class_name)
            setModalSelectedSection(parent.students.section)
        }
        setFormData({
            full_name: parent.full_name,
            relation: parent.relation,
            email: parent.email,
            phone_number: parent.phone_number,
            child_id: parent.child_id,
            temp_password: parent.temp_password
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this parent account?")) return
        const { error } = await supabase.from('parents').delete().eq('id', id)
        if (error) toast.error(error.message)
        else { toast.success("Parent deleted"); fetchInitialData(); }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!formData.child_id) return toast.error("Please select a student")
        setSaving(true)
        try {
            if (isEditMode && selectedId) {
                const { error } = await supabase.from('parents').update(formData).eq('id', selectedId)
                if (error) throw error
                toast.success("Account updated")
            } else {
                const { error } = await supabase.from('parents').insert([formData])
                if (error) throw error
                toast.success("New parent added")
            }
            setIsModalOpen(false)
            fetchInitialData()
        } catch (err: any) { toast.error("Error: " + err.message)
        } finally { setSaving(false) }
    }

    return (
        <div className="min-h-screen bg-[#fdfafc] pt-12 pb-20 px-6">
            <Toaster position="top-center" richColors />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* HEADER SECTION */}
                <header className="flex flex-col lg:flex-row items-center justify-between bg-white px-8 py-7 rounded-[2.5rem] border border-[#e9d1e4] shadow-sm gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-[#fdfafc] text-[#d487bd] rounded-2xl flex items-center justify-center border border-[#e9d1e4]">
                            <FiUsers size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Parent Hub</h1>
                            <p className="text-[10px] font-bold text-[#d487bd] uppercase tracking-[0.2em]">Directory & Portal Access</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleClearAll} className="px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 flex items-center gap-2">
                            <FiAlertTriangle size={16}/> Clear All
                        </button>
                        <button onClick={downloadCSV} className="px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-[#d487bd] bg-white hover:bg-[#fdfafc] transition-all border border-[#e9d1e4] flex items-center gap-2">
                            <FiDownload size={16}/> Export CSV
                        </button>
                        <button onClick={handleOpenAddModal} className="bg-[#d487bd] hover:bg-[#c36fa8] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#e9d1e4] flex items-center gap-2 transition-transform active:scale-95">
                            <FiUserPlus size={18} /> Add New Parent
                        </button>
                    </div>
                </header>

                {/* SEARCH & FILTER BAR */}
                <div className="bg-white p-4 rounded-[2rem] border border-[#e9d1e4] flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px] relative">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by parent name, email or child..." 
                            className="w-full pl-12 pr-4 py-4 bg-[#fdfafc] rounded-xl border-none font-bold text-sm outline-none focus:ring-2 ring-[#e9d1e4]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FiFilter className="text-[#d487bd] ml-2" size={18}/>
                        <select 
                            value={tableClassFilter} 
                            onChange={(e) => setTableClassFilter(e.target.value)}
                            className="bg-[#fdfafc] border-none rounded-xl px-4 py-4 font-bold text-xs uppercase tracking-wider outline-none cursor-pointer"
                        >
                            <option value="">All Classes</option>
                            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select 
                            value={tableSectionFilter} 
                            onChange={(e) => setTableSectionFilter(e.target.value)}
                            className="bg-[#fdfafc] border-none rounded-xl px-4 py-4 font-bold text-xs uppercase tracking-wider outline-none cursor-pointer"
                        >
                            <option value="">All Sections</option>
                            {[...new Set(parents.map(p => p.students?.section).filter(Boolean))].sort().map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className="bg-white rounded-[3rem] border border-[#e9d1e4] overflow-hidden shadow-sm">
                    <table className="w-full border-separate border-spacing-y-2 px-6 pb-6">
                        <thead className="bg-[#fdfafc]">
                            <tr className="text-[10px] font-black text-[#d487bd] uppercase tracking-widest">
                                <th className="px-8 py-6 text-left">Guardian Details</th>
                                <th className="px-8 py-6 text-left">Credentials</th>
                                <th className="px-8 py-6 text-left">Linked Student</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#d487bd]" /></td></tr>
                            ) : filteredParents.length === 0 ? (
                                <tr><td colSpan={4} className="p-20 text-center font-bold text-slate-400">No records found matching filters</td></tr>
                            ) : (
                                filteredParents.map((p) => (
                                    <tr key={p.id} className="group transition-all hover:bg-[#fdfafc]">
                                        <td className="px-8 py-6 rounded-l-[2rem]">
                                            <p className="font-black text-slate-800">{p.full_name}</p>
                                            <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1"><FiPhone size={12}/> {p.phone_number}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Login: {p.email}</p>
                                                <p className="text-[10px] text-[#d487bd] font-mono font-bold mt-1">Pass: {p.temp_password}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#d487bd] border border-[#e9d1e4]"><GraduationCap size={14}/></div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700">{p.students?.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.students?.class_name} - {p.students?.section}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right rounded-r-[2rem]">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditClick(p)} title="Edit Account" className="p-3 bg-white border border-[#e9d1e4] text-[#d487bd] rounded-xl hover:bg-[#d487bd] hover:text-white transition-all"><FiEdit3 size={16}/></button>
                                                <button onClick={() => handleDelete(p.id)} title="Delete Account" className="p-3 bg-white border border-rose-100 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><FiTrash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-[#e9d1e4] overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
                        <div className="p-8 border-b bg-[#fdfafc] flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase">{isEditMode ? 'Edit' : 'New'} Parent</h2>
                                <p className="text-[10px] font-bold text-[#d487bd] uppercase tracking-widest mt-1">Set portal access credentials</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#e9d1e4] text-slate-400 hover:text-rose-500 transition-colors"><FiX size={20}/></button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Guardian Name</label>
                                    <input required type="text" value={formData.full_name} 
                                        onChange={(e) => {
                                            setFormData({...formData, full_name: e.target.value});
                                            if(formData.child_id) generateUniqueCreds(e.target.value, formData.child_id);
                                        }} 
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-[#e9d1e4] focus:bg-white rounded-2xl p-4 font-bold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Relation</label>
                                    <select required value={formData.relation} 
                                        onChange={(e) => setFormData({...formData, relation: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-[#e9d1e4] focus:bg-white rounded-2xl p-4 font-bold outline-none cursor-pointer">
                                        <option value="">Select Relation</option>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Phone Number</label>
                                    <input required type="tel" value={formData.phone_number} 
                                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})} 
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-[#e9d1e4] focus:bg-white rounded-2xl p-4 font-bold outline-none" />
                                </div>
                            </div>

                            <div className="p-8 bg-[#fdfafc] rounded-[2.5rem] border border-[#e9d1e4] space-y-6">
                                <div className="flex items-center gap-2 text-[#d487bd]">
                                    <Filter size={14}/><span className="text-[10px] font-black uppercase">Find Student</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select 
                                        value={modalSelectedClass} 
                                        onChange={(e) => { setModalSelectedClass(e.target.value); setModalSelectedSection(''); }}
                                        className="w-full bg-white border border-[#e9d1e4] rounded-xl p-3 text-sm font-bold"
                                    >
                                        <option value="">Select Class</option>
                                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select 
                                        disabled={!modalSelectedClass}
                                        value={modalSelectedSection} 
                                        onChange={(e) => setModalSelectedSection(e.target.value)}
                                        className="w-full bg-white border border-[#e9d1e4] rounded-xl p-3 text-sm font-bold disabled:opacity-50"
                                    >
                                        <option value="">Select Section</option>
                                        {availableSectionsForModal.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <select 
                                    required disabled={!modalSelectedSection}
                                    value={formData.child_id} 
                                    onChange={(e) => { 
                                        setFormData({...formData, child_id: e.target.value}); 
                                        generateUniqueCreds(formData.full_name, e.target.value); 
                                    }} 
                                    className="w-full bg-white border-2 border-[#d487bd]/20 focus:border-[#d487bd] rounded-2xl p-4 font-bold outline-none disabled:opacity-50">
                                    <option value="">Select Student Name</option>
                                    {studentsForModal.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                </select>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-[2rem] space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 overflow-hidden">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Login Email</p>
                                        <p className="text-xs font-bold text-white truncate">{formData.email || '...'}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Temp Password</p>
                                        <p className="text-xs font-mono font-bold text-[#d487bd]">{formData.temp_password || '...'}</p>
                                    </div>
                                </div>
                            </div>

                            <button disabled={saving} className="w-full bg-[#d487bd] hover:bg-[#c36fa8] text-white h-[75px] rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                {saving ? <Loader2 className="animate-spin" /> : <><FiSave size={20} /> {isEditMode ? 'Update' : 'Create'} Account</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}