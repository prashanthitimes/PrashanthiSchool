'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  FiSave, FiCheckCircle, FiAlertCircle,
  FiUserCheck, FiUserX, FiSun, FiMoon, FiLock, FiEdit3
} from 'react-icons/fi'

export default function DailyAttendance() {
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [assignedClass, setAssignedClass] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAlreadySaved, setIsAlreadySaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [session, setSession] = useState<'morning' | 'afternoon'>('morning')
  
  // DARK MODE STATE
  const [darkMode, setDarkMode] = useState(false)

  const todayISO = new Date().toISOString().split('T')[0]
  const displayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  useEffect(() => {
    initPortal()
  }, [session])

  async function initPortal() {
    setLoading(true)
    setIsAlreadySaved(false)
    setIsEditing(false)
    const email = localStorage.getItem('teacherEmail')
    if (!email) return setLoading(false)

    const { data: teacher } = await supabase.from('teachers').select('id').eq('email', email).single()
    if (!teacher) return setLoading(false)
    setTeacherId(teacher.id)

    const { data: allotment } = await supabase
      .from('class_teacher_allotment')
      .select('class_name, section')
      .eq('teacher_id', teacher.id)
      .single()

    if (allotment) {
      setAssignedClass(allotment)
      const { data: roster } = await supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('class_name', allotment.class_name)
        .eq('section', allotment.section)
        .eq('status', 'active')
        .order('full_name')

      const { data: existing } = await supabase
        .from('daily_attendance')
        .select('student_id, status')
        .eq('date', todayISO)
        .eq('session', session)

      const map: Record<string, string> = {}
      if (existing && existing.length > 0) {
        existing.forEach(r => map[r.student_id] = r.status)
        setIsAlreadySaved(true)
      } else {
        roster?.forEach(s => map[s.id] = 'present')
      }
      setStudents(roster || [])
      setAttendanceData(map)
    }
    setLoading(false)
  }

  async function saveAttendance() {
    if (!teacherId || !students.length) return
    setSaving(true)
    const payload = students.map(s => ({
      student_id: s.id,
      teacher_id: teacherId,
      status: attendanceData[s.id] || 'present',
      date: todayISO,
      session: session
    }))

    const { error } = await supabase.from('daily_attendance').upsert(payload, { onConflict: 'student_id, date, session' })

    if (error) {
      setMessage({ type: 'error', text: "Error Saving" })
    } else {
      setMessage({ type: 'success', text: isEditing ? "Record Updated!" : "Attendance Filed!" })
      setIsAlreadySaved(true)
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#fffcfd] dark:bg-slate-950">
      <div className="w-8 h-8 border-4 border-brand-soft border-t-brand rounded-full animate-spin" />
    </div>
  )

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#fffcfd] dark:bg-slate-950 pb-20 font-sans transition-colors duration-500">

        {/* --- PREMIUM STICKY HEADER --- */}
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-brand-soft/50 dark:border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">

            {/* Left Side: Class Info */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight uppercase italic">{displayDate}</h1>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse"></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-brand tracking-widest uppercase">
                    Class {assignedClass?.class_name}-{assignedClass?.section}
                  </span>
                  <span className="text-[9px] text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {session}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Action Buttons & Theme Toggle */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
         

              {!isEditing && isAlreadySaved ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="group px-5 py-2.5 rounded-2xl font-black text-[10px] tracking-wider uppercase flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-slate-100 dark:border-slate-700 hover:border-brand/30 hover:text-brand transition-all shadow-sm active:scale-95"
                >
                  <FiEdit3 size={14} className="group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Edit Record</span>
                </button>
              ) : (
                <button
                  onClick={saveAttendance}
                  disabled={saving || (isAlreadySaved && !isEditing)}
                  className={`px-7 py-2.5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all active:scale-95 flex items-center gap-2 shadow-xl
                ${saving
                    ? 'bg-brand/50 cursor-not-allowed'
                    : 'bg-brand hover:shadow-brand/30 hover:-translate-y-0.5'} 
                text-white
              `}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Syncing
                    </span>
                  ) : (
                    <><FiSave size={14} /> <span className="hidden sm:inline">{isEditing ? 'Save Changes' : 'Submit Roster'}</span></>
                  )}
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* --- TABBED SESSION NAVIGATION --- */}
        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="flex bg-slate-100/80 dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-200/50 dark:border-slate-800 shadow-inner">
            <button
              onClick={() => setSession('morning')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.6rem] text-[11px] font-black transition-all duration-500 tracking-tight ${session === 'morning' ? 'bg-white dark:bg-slate-800 text-brand shadow-xl dark:shadow-none scale-[1.01]' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <FiSun size={15} /> MORNING
            </button>
            <button
              onClick={() => setSession('afternoon')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.6rem] text-[11px] font-black transition-all duration-500 tracking-tight ${session === 'afternoon' ? 'bg-white dark:bg-slate-800 text-brand shadow-xl dark:shadow-none scale-[1.01]' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <FiMoon size={15} /> AFTERNOON
            </button>
          </div>
        </div>

        {/* --- MAIN ROSTER CONTAINER --- */}
        <div className="max-w-7xl mx-auto p-4 space-y-6 mt-4">

          {/* Status Message (Toast) */}
          {message && (
            <div className={`p-4 rounded-3xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50'}`}>
              {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />} {message.text}
            </div>
          )}

          {/* --- SECTION HEADER --- */}
          <div className="flex justify-between items-end px-4 mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-brand/50 uppercase tracking-[0.2em] mb-0.5">Roster Overview</span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase italic">
                {students.length} <span className="text-brand/20 dark:text-slate-700">-</span> Total Students
              </span>
            </div>

            {(!isAlreadySaved || isEditing) && (
              <button
                onClick={() => { const p: any = {}; students.forEach(s => p[s.id] = 'present'); setAttendanceData(p); }}
                className="text-[10px] font-black bg-white dark:bg-slate-800 px-5 py-2.5 rounded-2xl border border-brand-soft dark:border-slate-700 text-brand shadow-sm hover:bg-brand hover:text-white transition-all active:scale-95"
              >
                MARK ALL PRESENT
              </button>
            )}
          </div>

          {/* --- TWO COLUMN GRID --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              students.slice(0, Math.ceil(students.length / 2)),
              students.slice(Math.ceil(students.length / 2))
            ].map((columnGroup, colIdx) => (
              <div key={colIdx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-soft/60 dark:border-slate-800 shadow-xl shadow-brand/5 dark:shadow-none overflow-hidden h-fit transition-colors">
                <div className="divide-y divide-brand-soft/10 dark:divide-slate-800">
                  {columnGroup.map((s) => (
                    <div key={s.id} className="px-6 py-5 flex items-center justify-between group transition-all hover:bg-brand-soft/5 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-[13px] shadow-sm transition-all duration-500 ${attendanceData[s.id] === 'present' ? 'bg-brand text-white' : 'bg-rose-500 text-white'}`}>
                          {s.full_name.charAt(0)}
                        </div>
                        {/* Name & ID */}
                        <div>
                          <h4 className="text-[14px] font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none mb-1.5">{s.full_name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{s.student_id}</p>
                        </div>
                      </div>

                      {/* Status Toggles */}
                      <div className={`flex gap-1.5 p-1.5 rounded-2xl border transition-all duration-300 ${isAlreadySaved && !isEditing ? 'opacity-30 grayscale cursor-not-allowed' : 'bg-slate-100/50 dark:bg-slate-950 border-brand-soft/30 dark:border-slate-800'}`}>
                        <button
                          disabled={isAlreadySaved && !isEditing}
                          onClick={() => setAttendanceData(prev => ({ ...prev, [s.id]: 'present' }))}
                          className={`w-11 h-10 rounded-xl flex items-center justify-center transition-all ${attendanceData[s.id] === 'present' ? 'bg-white dark:bg-slate-800 text-brand shadow-lg dark:shadow-none' : 'text-slate-400 dark:text-slate-700 hover:text-brand dark:hover:text-brand'}`}
                        >
                          <FiUserCheck size={20} />
                        </button>
                        <button
                          disabled={isAlreadySaved && !isEditing}
                          onClick={() => setAttendanceData(prev => ({ ...prev, [s.id]: 'absent' }))}
                          className={`w-11 h-10 rounded-xl flex items-center justify-center transition-all ${attendanceData[s.id] === 'absent' ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-lg dark:shadow-none' : 'text-slate-400 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-500'}`}
                        >
                          <FiUserX size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="text-center pt-12 pb-20">
          <div className="h-1 w-8 bg-brand-soft/50 dark:bg-slate-800 rounded-full mx-auto mb-4"></div>
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Official Academic Record</p>
        </footer>
      </div>
    </div>
  )
}