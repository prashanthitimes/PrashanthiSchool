'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
    FiUser, FiMail, FiPhone, FiBook, FiMapPin,
    FiCalendar, FiBriefcase, FiHash, FiInfo, FiLayers, FiStar
} from 'react-icons/fi'

export default function TeacherProfile() {
    const [profile, setProfile] = useState<any>(null)
    const [assignments, setAssignments] = useState<any[]>([])
    const [classIncharge, setClassIncharge] = useState<any>(null) // State for Class Teacher Allotment
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProfileData()
    }, [])

    async function fetchProfileData() {
        try {
            setLoading(true)
            const userEmail = localStorage.getItem('teacherEmail')

            if (!userEmail) {
                window.location.href = '/login/teacher'
                return
            }

            // 1. Fetch Teacher Details
            const { data: teacher, error: teacherError } = await supabase
                .from('teachers')
                .select('*')
                .eq('email', userEmail)
                .single()

            if (teacherError) throw teacherError
            setProfile(teacher)

            // 2. Fetch Class Teacher Allotment (New Logic)
            // 2. Fetch Class Teacher Allotment (Enhanced Logic)
            const { data: allotment, error: allotmentError } = await supabase
                .from('class_teacher_allotment')
                .select('class_name, section, academic_year')
                .eq('teacher_id', teacher.id)
                .order('academic_year', { ascending: false }) // Gets the most recent session
                .limit(1)
                .maybeSingle()

            if (allotmentError) {
                console.error('Allotment error:', allotmentError)
            }
            setClassIncharge(allotment)

            // 3. Fetch Subject Assignments
            const { data: assigned, error: assignError } = await supabase
                .from('subject_assignments')
                .select(`
                    id, academic_year, class_name, section,
                    subjects ( name, code )
                `)
                .eq('teacher_id', teacher.id)

            if (assignError) throw assignError
            setAssignments(assigned || [])

        } catch (error: any) {
            console.error('Error fetching profile:', error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
            {/* COMPACT HEADER CARD */}
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-brand-soft/30 relative overflow-hidden">
                {/* Minimal Background Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-soft rounded-full -mr-20 -mt-20 blur-2xl opacity-30"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Smaller Avatar */}
                    <div className="w-20 h-20 bg-brand rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-soft/50">
                        {profile?.full_name?.charAt(0)}
                    </div>

                    {/* Info Section */}
                    {/* Info Section */}
                    <div className="text-center md:text-left flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-0.5">
                            <h1 className="text-xl font-black text-slate-900 truncate">{profile?.full_name}</h1>
                            {classIncharge && (
                                <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase flex items-center gap-1 shadow-sm">
                                    <FiStar fill="white" size={8} /> Class Teacher
                                </span>
                            )}
                        </div>
                        <p className="text-brand-light font-bold text-xs mb-3">{profile?.department || 'Faculty'}</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                ID: {profile?.teacher_id}
                            </span>
                            {classIncharge && (
                                <span className="bg-brand-soft/50 text-brand-dark px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-brand-soft">
                                    In-Charge: {classIncharge.class_name}-{classIncharge.section}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Compact Stats */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="bg-brand-soft/20 px-4 py-2 rounded-2xl border border-brand-soft/30 text-center flex-1 md:w-20">
                            <p className="text-[8px] font-black text-brand-light uppercase">Load</p>
                            <p className="text-lg font-black text-brand-dark">{assignments.length}</p>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-center flex-1 md:w-24">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Session</p>
                            <p className="text-sm font-black text-slate-800 leading-tight">{classIncharge?.academic_year || '25-26'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="space-y-6">
                    {/* NEW: CLASS TEACHER CARD */}
                    {classIncharge ? (
                        <div className="bg-gradient-to-br from-brand to-brand-dark rounded-[2.5rem] p-8 text-white shadow-xl shadow-brand-soft/50 relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Assigned Class</p>
                                <h3 className="text-3xl font-black mb-4">Class Teacher</h3>
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                    <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Grade & Section</p>
                                    <p className="text-2xl font-black">{classIncharge.class_name} - {classIncharge.section}</p>
                                </div>
                                <p className="mt-4 text-xs font-bold opacity-60">Academic Year: {classIncharge.academic_year}</p>
                            </div>
                            <FiStar className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform" size={150} />
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-dashed border-slate-200 text-center">
                            <p className="text-slate-400 font-bold text-sm italic">No Class Teacher responsibility assigned.</p>
                        </div>
                    )}

                    <h3 className="text-xl font-black text-slate-800 ml-4 flex items-center gap-2">
                        <FiUser className="text-brand" /> Contact Details
                    </h3>
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                        <DetailItem icon={<FiMail />} label="Email" value={profile?.email} />
                        <DetailItem icon={<FiPhone />} label="Phone" value={profile?.phone || 'N/A'} />
                        <DetailItem icon={<FiBriefcase />} label="Dept" value={profile?.department} />
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-black text-slate-800 ml-4 flex items-center gap-2">
                        <FiLayers className="text-brand" /> Subject Assignments
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {assignments.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-soft/50 transition-all group relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-brand-soft/30 text-brand rounded-2xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                                            <FiBook size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Session</p>
                                            <p className="text-xs font-black text-slate-500">{item.academic_year}</p>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 group-hover:text-brand transition-colors">
                                        {item.subjects?.name}
                                    </h4>
                                    <div className="mt-8">
                                        <div className="inline-flex items-center gap-2 bg-brand-soft/20 px-4 py-2 rounded-xl border border-brand-soft/40">
                                            <FiMapPin className="text-brand" size={14} />
                                            <span className="text-sm font-black text-brand-dark uppercase tracking-tight">Class {item.class_name}-{item.section}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-2 text-8xl font-black text-brand-soft/20 group-hover:text-brand-soft/40 transition-colors z-0 select-none">
                                    {item.class_name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-5 group">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-brand-soft group-hover:text-brand transition-colors">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-black text-slate-800">{value}</p>
            </div>
        </div>
    )
}