'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import { 
    FiUser, FiCheckCircle, FiXCircle, FiClock, FiPlus,
    FiEye, FiMail, FiPhone, FiCalendar, FiUserPlus 
} from 'react-icons/fi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_COLORS: any = {
    'Pending': 'bg-amber-50 text-amber-600',
    'Approved': 'bg-emerald-50 text-emerald-600',
    'Rejected': 'bg-rose-50 text-rose-600',
    'Interview': 'bg-blue-50 text-blue-600'
}

export default function AdmissionsAdmin() {
    const [applicants, setApplicants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
    const [showAddModal, setShowAddModal] = useState(false) // State for Add Modal
    const [filterStatus, setFilterStatus] = useState('All')

    // Form State for adding new student
    const [newStudent, setNewStudent] = useState({
        full_name: '',
        email: '',
        phone: '',
        applied_class: '',
    })

    const fetchAdmissions = async () => {
        setLoading(true)
        let query = supabase.from('admissions').select('*').eq('is_active', true)
        if (filterStatus !== 'All') query = query.eq('status', filterStatus)

        const { data, error } = await query.order('application_date', { ascending: false })
        if (error) toast.error('Error loading admissions')
        else setApplicants(data || [])
        setLoading(false)
    }

    useEffect(() => { fetchAdmissions() }, [filterStatus])

    // --- LOGIC: ADD NEW STUDENT ---
    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if(!newStudent.full_name || !newStudent.email || !newStudent.applied_class) {
            return toast.error("Please fill required fields")
        }

        const addToast = toast.loading('Adding student record...')
        const { error } = await supabase.from('admissions').insert([
            { ...newStudent, status: 'Pending' }
        ])

        if (error) {
            toast.error('Failed to add student', { id: addToast })
        } else {
            toast.success('Student added successfully', { id: addToast })
            setShowAddModal(false)
            setNewStudent({ full_name: '', email: '', phone: '', applied_class: '' })
            fetchAdmissions()
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const loadToast = toast.loading(`Updating to ${newStatus}...`)
        const { error } = await supabase.from('admissions').update({ status: newStatus }).eq('id', id)

        if (error) toast.error('Update failed', { id: loadToast })
        else {
            toast.success(`Application ${newStatus}`, { id: loadToast })
            setSelectedStudent(null)
            fetchAdmissions()
        }
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] p-4 md:p-8">
            <Toaster position="top-right" />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Admissions Portal</h1>
                        <p className="text-slate-500 font-medium">Review and process new student applications</p>
                    </div>
                    {/* ADD STUDENT BUTTON */}
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                        <FiUserPlus /> Add New Student
                    </button>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={<FiUser className="text-indigo-600"/>} label="Total Applied" count={applicants.length} color="bg-indigo-50" />
                    <StatCard icon={<FiClock className="text-amber-600"/>} label="Pending" count={applicants.filter(a => a.status === 'Pending').length} color="bg-amber-50" />
                    <StatCard icon={<FiCheckCircle className="text-emerald-600"/>} label="Approved" count={applicants.filter(a => a.status === 'Approved').length} color="bg-emerald-50" />
                    <StatCard icon={<FiXCircle className="text-rose-600"/>} label="Rejected" count={applicants.filter(a => a.status === 'Rejected').length} color="bg-rose-50" />
                </div>

                {/* TABLE CONTAINER */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">Application List</h3>
                        <select 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full sm:w-48 text-sm font-semibold border border-slate-200 p-3 rounded-xl hover:bg-slate-50 outline-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Interview">Interview</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-50/50">
                                    <th className="px-8 py-5">Student Name</th>
                                    <th className="px-8 py-5">Applied Class</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={3} className="p-20 text-center text-indigo-600 animate-pulse font-bold">Loading...</td></tr>
                                ) : applicants.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-800">{student.full_name}</div>
                                            <div className="text-xs text-slate-400 font-medium">{student.email}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[student.status]}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button onClick={() => setSelectedStudent(student)} className="bg-slate-900 text-white p-2.5 px-4 rounded-xl text-xs font-bold">View Detail</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- ADD NEW STUDENT MODAL --- */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-300">✕</button>
                        <h2 className="text-xl font-black text-slate-900 mb-1">Manual Admission</h2>
                        <p className="text-slate-400 text-sm mb-6 font-medium">Add a student record manually</p>
                        
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Full Name</label>
                                <input required type="text" placeholder="John Doe" className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-indigo-600 outline-none font-semibold text-sm" 
                                    onChange={e => setNewStudent({...newStudent, full_name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Email</label>
                                    <input required type="email" placeholder="john@example.com" className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-indigo-600 outline-none font-semibold text-sm" 
                                        onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Phone</label>
                                    <input type="text" placeholder="+123456" className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-indigo-600 outline-none font-semibold text-sm" 
                                        onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase tracking-widest">Target Class</label>
                                <input required type="text" placeholder="e.g. Grade 10" className="w-full border-2 border-slate-50 p-3 rounded-xl focus:border-indigo-600 outline-none font-semibold text-sm" 
                                    onChange={e => setNewStudent({...newStudent, applied_class: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black shadow-lg transition-all active:scale-95 mt-2">Create Record</button>
                        </form>
                    </div>
                </div>
            )}

            {/* (Keep the same SelectedStudent View Detail Modal from previous response here) */}
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