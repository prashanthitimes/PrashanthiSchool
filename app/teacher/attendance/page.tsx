'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FiSave, FiCheckCircle, FiAlertCircle, FiUserCheck, FiUserX, FiSun, FiMoon } from 'react-icons/fi'

export default function DailyAttendance() {
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [assignedClass, setAssignedClass] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // NEW: Session State
  const [session, setSession] = useState<'morning' | 'afternoon'>('morning')

  const todayISO = new Date().toISOString().split('T')[0]
  const displayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    initPortal()
  }, [session]) // Re-run when session changes

  async function initPortal() {
    setLoading(true)
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

      // Fetch attendance specifically for the selected session
      const { data: existing } = await supabase
        .from('daily_attendance')
        .select('student_id, status')
        .eq('date', todayISO)
        .eq('session', session)

      const map: Record<string, string> = {}
      if (existing?.length) {
        existing.forEach(r => map[r.student_id] = r.status)
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
    setMessage(null)

    const payload = students.map(s => ({
      student_id: s.id,
      teacher_id: teacherId,
      status: attendanceData[s.id] || 'present',
      date: todayISO,
      session: session // Send session to DB
    }))

    const { error } = await supabase
      .from('daily_attendance')
      .upsert(payload, { onConflict: 'student_id, date, session' })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: `${session.toUpperCase()} attendance saved!` })
      setTimeout(() => setMessage(null), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-indigo-600">Loading {session} roster...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-32">
      {/* Header */}
      <div className="bg-white border rounded-[2rem] p-6 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-800">{displayDate}</h1>
          <p className="text-slate-500 font-bold text-sm">
            {assignedClass ? `Class ${assignedClass.class_name}-${assignedClass.section}` : 'No Class'}
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button 
            onClick={() => setSession('morning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${session === 'morning' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
          >
            <FiSun /> MORNING
          </button>
          <button 
            onClick={() => setSession('afternoon')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${session === 'afternoon' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            <FiMoon /> AFTERNOON
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 border animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* List Container */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Sheet</span>
                <span className="text-xs font-bold text-indigo-600 uppercase">{session} SESSION</span>
            </div>
            <button onClick={() => {
                const p: any = {}; students.forEach(s => p[s.id] = 'present'); setAttendanceData(p);
            }} className="text-[10px] font-black bg-white border px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50">MARK ALL PRESENT</button>
        </div>

        <div className="divide-y divide-slate-100">
          {students.map(s => (
            <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${attendanceData[s.id] === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {s.full_name.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{s.full_name}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase">{s.student_id}</span>
                </div>
              </div>
              
              <div className="flex gap-2 bg-slate-100/50 p-1 rounded-xl border">
                <button 
                  onClick={() => setAttendanceData(prev => ({...prev, [s.id]: 'present'}))}
                  className={`w-12 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${attendanceData[s.id] === 'present' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-300'}`}
                >
                    <FiUserCheck size={16} />
                    <span className="text-[8px] font-black mt-0.5">PRES</span>
                </button>
                <button 
                  onClick={() => setAttendanceData(prev => ({...prev, [s.id]: 'absent'}))}
                  className={`w-12 h-10 rounded-lg flex flex-col items-center justify-center transition-all ${attendanceData[s.id] === 'absent' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-300'}`}
                >
                    <FiUserX size={16} />
                    <span className="text-[8px] font-black mt-0.5">ABS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <button 
          onClick={saveAttendance}
          disabled={saving}
          className={`w-full max-w-4xl mx-auto py-5 rounded-[1.5rem] font-black shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 ${session === 'morning' ? 'bg-orange-500' : 'bg-indigo-900'} text-white`}
        >
          {saving ? 'Saving...' : <><FiSave /> SAVE {session.toUpperCase()} ATTENDANCE</>}
        </button>
      </div>
    </div>
  )
}