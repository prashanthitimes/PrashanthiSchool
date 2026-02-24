'use client'

import { supabase } from '@/lib/supabase'
import {
    FiUserPlus, FiX, FiSave, FiUsers, FiEdit3, FiTrash2, FiPhone, FiInfo, FiSearch, FiDownload, FiFilter, FiAlertTriangle, FiUpload
} from 'react-icons/fi'
import { GraduationCap, Loader2, Filter } from "lucide-react"
import { toast, Toaster } from "sonner"
import * as XLSX from 'xlsx' // Install via npm install xlsx
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

export default function AdminParentsPage() {
    // --- STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null) // Add this line
    const [students, setStudents] = useState<any[]>([])
    const [parents, setParents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [importing, setImporting] = useState(false)

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
        user_id: '', // Changed from email to user_id
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
                p.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) || // Updated to user_id
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
        // Shorten user_id: Use first 3 letters of parent name + first 3 of student name + random 4 chars
        const parentInitials = parentName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 3)
            .toLowerCase()

        const studentInitials = student.full_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 3)
            .toLowerCase()
        const userId = parentInitials + studentInitials + Math.random().toString(36).slice(-4).toLowerCase()
        const password = Math.random().toString(36).slice(-4).toUpperCase() + "." + Math.floor(1000 + Math.random() * 9000)

        setFormData(prev => ({
            ...prev,
            full_name: parentName,
            user_id: userId, // Set shorter user_id
            temp_password: prev.temp_password || password
        }))
    }

    // --- ACTIONS ---
    const downloadCSV = () => {
        if (filteredParents.length === 0) return toast.error("No data to export")
        const headers = ["Parent Name", "Relation", "User ID", "Password", "Phone", "Child Name", "Class", "Section"] // Updated headers
        const rows = filteredParents.map(p => [
            `"${p.full_name}"`, `"${p.relation}"`, `"${p.user_id}"`, `"${p.temp_password}"`, `"${p.phone_number}"`, // Updated to user_id
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

    const downloadSampleExcel = () => {
        const sampleData = [
            ['Parent Name', 'Relation', 'Phone Number', 'Child Name'],
            ['John Doe', 'Father', '123-456-7890', 'Alice Smith'],
            ['Jane Doe', 'Mother', '098-765-4321', 'Bob Johnson'],
            ['Mike Guardian', 'Guardian', '555-123-4567', 'Charlie Brown']
        ]
        const ws = XLSX.utils.aoa_to_sheet(sampleData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Parents')
        XLSX.writeFile(wb, 'parent_import_sample.xlsx')
    }

    const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        setImporting(true)
        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

                const headers = jsonData[0] as string[]
                const expectedHeaders = ['Parent Name', 'Relation', 'Phone Number', 'Child Name']
                if (!expectedHeaders.every(h => headers.includes(h))) {
                    throw new Error('Invalid Excel format. Expected columns: Parent Name, Relation, Phone Number, Child Name')
                }

                const parentsToInsert = []
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i] as string[]
                    const parentName = row[headers.indexOf('Parent Name')]
                    const relation = row[headers.indexOf('Relation')]
                    const phone = row[headers.indexOf('Phone Number')]
                    const childName = row[headers.indexOf('Child Name')]

                    const student = students.find(s => s.full_name === childName)
                    if (!student) {
                        toast.error(`Student "${childName}" not found. Skipping row ${i + 1}`)
                        continue
                    }

                    // Generate creds
                    const parentInitials = parentName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 3)
                        .toLowerCase()

                    const studentInitials = student.full_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 3)
                        .toLowerCase()
                    const userId = parentInitials + studentInitials + Math.random().toString(36).slice(-4).toLowerCase()
                    const password = Math.random().toString(36).slice(-4).toUpperCase() + "." + Math.floor(1000 + Math.random() * 9000)
                    parentsToInsert.push({
                        full_name: parentName,
                        relation,
                        user_id: userId,
                        phone_number: phone,
                        child_id: student.id,
                        temp_password: password
                    })
                }

                if (parentsToInsert.length > 0) {
                    const { error } = await supabase.from('parents').insert(parentsToInsert)
                    if (error) throw error
                    toast.success(`${parentsToInsert.length} parents imported successfully`)
                    fetchInitialData()
                }
            }
            reader.readAsArrayBuffer(file)
        } catch (error: any) {
            toast.error("Import failed: " + error.message)
        } finally {
            setImporting(false)
            event.target.value = '' // Reset file input
        }
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
        setFormData({ full_name: '', relation: '', user_id: '', phone_number: '', child_id: '', temp_password: '' }) // Updated
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
            user_id: parent.user_id, // Updated
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
        } catch (err: any) {
            toast.error("Error: " + err.message)
        } finally { setSaving(false) }
    }

    return (
        <div className="min-h-screen bg-[#fdfafc] pt-6 md:pt-12 pb-20 px-4 md:px-6">
            <Toaster position="top-center" richColors />

            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">

                {/* --- ENHANCED HEADER SECTION --- */}
                <header className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-[#e9d1e4] shadow-sm mb-4 md:mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8">

                        {/* Branding & Stats Group */}
                        <div className="flex items-center gap-4 md:gap-5 w-full lg:w-auto">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#fdfafc] to-[#f5e6f1] text-[#d487bd] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center border border-[#e9d1e4] shadow-inner shrink-0">
                                {/* We use a single size in the prop, and scale it via CSS classes */}
                                <FiUsers className="w-7 h-7 md:w-10 md:h-10" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase">
                                    PARENT<span className="text-[#d487bd]">HUB</span>
                                </h1>
                                <div className="flex items-center gap-2 md:gap-3 mt-1">
                                    <p className="text-[#d487bd] font-bold text-[9px] md:text-[10px] tracking-wider md:tracking-[0.2em] uppercase opacity-80">
                                        Portal Access
                                    </p>
                                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                    <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
                                        {parents.length} Accounts
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Group - Scrollable on mobile if needed */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 md:gap-3 w-full lg:w-auto">
                            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />

                            {/* Secondary Actions Group */}
                            <div className="flex gap-2">
                                <button onClick={handleClearAll} className="bg-rose-50 text-rose-500 border border-rose-100 p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-rose-500 hover:text-white transition-all" title="Clear All">
                                    <FiAlertTriangle size={18} />
                                </button>
                                <button onClick={downloadSampleExcel} className="bg-[#fdfafc] text-slate-600 border border-[#e9d1e4]/50 px-3 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <FiInfo size={16} className="text-[#d487bd]" /> <span className="hidden sm:inline">Sample</span>
                                </button>
                            </div>

                            <button onClick={() => fileInputRef.current?.click()} className="bg-white border-2 border-slate-100 text-slate-600 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                                <FiUpload size={16} className="text-emerald-500" /> Import
                            </button>

                            <button onClick={downloadCSV} className="bg-slate-800 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                                <FiDownload size={16} /> <span className="hidden sm:inline">{tableClassFilter ? `Export ${tableClassFilter}` : 'Export All'}</span><span className="sm:hidden">Export</span>
                            </button>

                            <button onClick={handleOpenAddModal} className="w-full sm:w-auto bg-[#d487bd] text-white px-6 md:px-8 py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-xl shadow-[#d487bd]/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <FiUserPlus size={18} /> Add Parent
                            </button>
                        </div>
                    </div>
                </header>

                {/* SEARCH & FILTER BAR */}
                <div className="bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-[#e9d1e4] flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search parents..."
                            className="w-full pl-11 pr-4 py-3 md:py-4 bg-[#fdfafc] rounded-xl border-none font-bold text-sm outline-none focus:ring-2 ring-[#e9d1e4]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        <FiFilter className="text-[#d487bd] shrink-0" size={18} />
                        <select
                            value={tableClassFilter}
                            onChange={(e) => setTableClassFilter(e.target.value)}
                            className="flex-1 md:flex-none bg-[#fdfafc] border-none rounded-xl px-3 py-3 md:py-4 font-bold text-[10px] md:text-xs uppercase outline-none cursor-pointer whitespace-nowrap"
                        >
                            <option value="">Classes</option>
                            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={tableSectionFilter}
                            onChange={(e) => setTableSectionFilter(e.target.value)}
                            className="flex-1 md:flex-none bg-[#fdfafc] border-none rounded-xl px-3 py-3 md:py-4 font-bold text-[10px] md:text-xs uppercase outline-none cursor-pointer"
                        >
                            <option value="">Sections</option>
                            {[...new Set(parents.map(p => p.students?.section).filter(Boolean))].sort().map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TABLE / CARD SECTION */}
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-[#e9d1e4] overflow-hidden shadow-sm">
                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                        <table className="w-full border-separate border-spacing-y-2 px-6 pb-6">
                            <thead className="bg-[#fdfafc]">
                                <tr className="text-[10px] font-black text-[#d487bd] uppercase tracking-widest">
                                    <th className="px-8 py-6 text-left">Guardian</th>
                                    <th className="px-8 py-6 text-left">Credentials</th>
                                    <th className="px-8 py-6 text-left">Linked Student</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[#d487bd]" /></td></tr>
                                ) : filteredParents.length === 0 ? (
                                    <tr><td colSpan={4} className="p-20 text-center font-bold text-slate-400">No records found</td></tr>
                                ) : (
                                    filteredParents.map((p) => (
                                        <tr key={p.id} className="group transition-all hover:bg-[#fdfafc]">
                                            <td className="px-8 py-6 rounded-l-[2rem]">
                                                <p className="font-black text-slate-800">{p.full_name}</p>
                                                <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1"><FiPhone size={12} /> {p.phone_number}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.user_id}</p>
                                                    <p className="text-[10px] text-[#d487bd] font-mono font-bold">Pass: {p.temp_password}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#d487bd] border border-[#e9d1e4]"><GraduationCap size={14} /></div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-700">{p.students?.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.students?.class_name} - {p.students?.section}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right rounded-r-[2rem]">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(p)} className="p-3 bg-white border border-[#e9d1e4] text-[#d487bd] rounded-xl hover:bg-[#d487bd] hover:text-white transition-all"><FiEdit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-3 bg-white border border-rose-100 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><FiTrash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-[#e9d1e4]/30">
                        {loading ? (
                            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#d487bd]" /></div>
                        ) : filteredParents.length === 0 ? (
                            <div className="p-10 text-center font-bold text-slate-400 text-sm">No records found matching filters</div>
                        ) : (
                            filteredParents.map((p) => (
                                <div key={p.id} className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-slate-800">{p.full_name}</p>
                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-1"><FiPhone size={10} /> {p.phone_number}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditClick(p)} className="p-2.5 bg-[#fdfafc] border border-[#e9d1e4] text-[#d487bd] rounded-lg"><FiEdit3 size={14} /></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-rose-50 text-rose-400 rounded-lg"><FiTrash2 size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-[#fdfafc] p-3 rounded-xl border border-slate-100">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Student</p>
                                            <p className="text-xs font-black text-slate-700 truncate">{p.students?.full_name}</p>
                                            <p className="text-[9px] text-[#d487bd] font-bold uppercase">{p.students?.class_name}-{p.students?.section}</p>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-xl">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Credentials</p>
                                            <p className="text-[10px] text-white font-bold truncate">ID: {p.user_id}</p>
                                            <p className="text-[10px] text-[#d487bd] font-mono font-bold truncate">PW: {p.temp_password}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* FORM MODAL - Improved for Mobile */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                        <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl border-t md:border border-[#e9d1e4] overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300 max-h-[92vh] flex flex-col">
                            <div className="p-6 md:p-8 border-b bg-[#fdfafc] flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase">{isEditMode ? 'Edit' : 'New'} Parent</h2>
                                    <p className="text-[9px] md:text-[10px] font-bold text-[#d487bd] uppercase tracking-widest mt-1">Set portal access credentials</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-[#e9d1e4] text-slate-400"><FiX size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase ml-2">Guardian Name</label>
                                        <input required type="text" value={formData.full_name}
                                            onChange={(e) => {
                                                setFormData({ ...formData, full_name: e.target.value });
                                                if (formData.child_id) generateUniqueCreds(e.target.value, formData.child_id);
                                            }}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-[#e9d1e4] focus:bg-white rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none text-sm md:text-base" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase ml-2">Relation</label>
                                        <select required value={formData.relation}
                                            onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-[#e9d1e4] focus:bg-white rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none text-sm md:text-base">
                                            <option value="">Select Relation</option>
                                            <option value="Father">Father</option>
                                            <option value="Mother">Mother</option>
                                            <option value="Guardian">Guardian</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase ml-2">Phone Number</label>
                                        <input required type="tel" value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-[#e9d1e4] focus:bg-white rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none text-sm md:text-base" />
                                    </div>
                                </div>

                                <div className="p-5 md:p-8 bg-[#fdfafc] rounded-[1.5rem] md:rounded-[2.5rem] border border-[#e9d1e4] space-y-4 md:space-y-6">
                                    <div className="flex items-center gap-2 text-[#d487bd]">
                                        <FiFilter size={14} /><span className="text-[10px] font-black uppercase">Find Student</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <select
                                            value={modalSelectedClass}
                                            onChange={(e) => { setModalSelectedClass(e.target.value); setModalSelectedSection(''); }}
                                            className="w-full bg-white border border-[#e9d1e4] rounded-xl p-3 text-xs md:text-sm font-bold"
                                        >
                                            <option value="">Class</option>
                                            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <select
                                            disabled={!modalSelectedClass}
                                            value={modalSelectedSection}
                                            onChange={(e) => setModalSelectedSection(e.target.value)}
                                            className="w-full bg-white border border-[#e9d1e4] rounded-xl p-3 text-xs md:text-sm font-bold disabled:opacity-50"
                                        >
                                            <option value="">Section</option>
                                            {availableSectionsForModal.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <select
                                        required disabled={!modalSelectedSection}
                                        value={formData.child_id}
                                        onChange={(e) => {
                                            setFormData({ ...formData, child_id: e.target.value });
                                            generateUniqueCreds(formData.full_name, e.target.value);
                                        }}
                                        className="w-full bg-white border-2 border-[#d487bd]/20 focus:border-[#d487bd] rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none disabled:opacity-50 text-xs md:text-sm">
                                        <option value="">Select Student Name</option>
                                        {studentsForModal.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                    </select>
                                </div>

                                <div className="p-5 bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] space-y-4">
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10 overflow-hidden">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Login User ID</p>
                                            <p className="text-[10px] md:text-xs font-bold text-white truncate">{formData.user_id || '...'}</p>
                                        </div>
                                        <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10 overflow-hidden">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Temp Password</p>
                                            <p className="text-[10px] md:text-xs font-mono font-bold text-[#d487bd] truncate">{formData.temp_password || '...'}</p>
                                        </div>
                                    </div>
                                </div>

                                <button disabled={saving} className="w-full bg-[#d487bd] hover:bg-[#c36fa8] text-white h-[65px] md:h-[75px] rounded-xl md:rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all shrink-0 mb-4">
                                    {saving ? <Loader2 className="animate-spin" /> : <><FiSave size={20} /> {isEditMode ? 'Update' : 'Create'} Account</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}