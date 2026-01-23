'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FiCheck, FiX, FiClock, FiUsers, FiSave, 
  FiAlertCircle, FiCheckCircle, FiEdit3, FiCalendar,
  FiUserCheck, FiUserX, FiActivity
} from 'react-icons/fi'

export default function AttendancePage() {
  const [todayClasses, setTodayClasses] = useState<any[]>([])
  const [submittedPeriods, setSubmittedPeriods] = useState<number[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [teacherId, setTeacherId] = useState('')

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayISO = new Date().toISOString().split('T')[0]
  const displayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const userEmail = localStorage.getItem('teacherEmail')
    if (!userEmail) return

    const { data: teacher } = await supabase.from('teachers').select('id').eq('email', userEmail).single()
    if (!teacher) return
    setTeacherId(teacher.id)

    const { data: schedule } = await supabase.from('timetable')
      .select('*, subjects(name)')
      .eq('day', todayName)
    
    setTodayClasses(schedule || [])

    const { data: existing } = await supabase.from('attendance')
      .select('period')
      .eq('date', todayISO)
      .eq('teacher_id', teacher.id)
    
    setSubmittedPeriods([...new Set(existing?.map(a => a.period) || [])])
  }

  async function loadAttendanceSheet(slot: any) {
    setSelectedSlot(slot)
    setLoading(true)
    setMessage(null)

    const { data: studentList } = await supabase.from('students')
      .select('*')
      .ilike('class_name', `${slot.class}%`)
      .eq('section', slot.section)
      .eq('status', 'active')
      .order('full_name', { ascending: true })

    const { data: existingRecords } = await supabase.from('attendance')
      .select('student_id, status')
      .eq('date', todayISO)
      .eq('period', slot.period)
      .eq('subject_id', slot.subject_id)

    const statusMap: Record<string, string> = {}
    
    if (existingRecords && existingRecords.length > 0) {
      existingRecords.forEach(r => { statusMap[r.student_id] = r.status })
    } else {
      studentList?.forEach(s => { statusMap[s.id] = 'present' })
    }

    setStudents(studentList || [])
    setAttendanceData(statusMap)
    setLoading(false)
  }

  async function handleSave() {
    setLoading(true)
    const records = students.map(s => ({
      student_id: s.id,
      teacher_id: teacherId,
      subject_id: selectedSlot.subject_id,
      status: attendanceData[s.id],
      date: todayISO,
      period: selectedSlot.period
    }))

    const { error } = await supabase.from('attendance').upsert(records, {
      onConflict: 'student_id, subject_id, date, period'
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: `Success! Attendance for Period ${selectedSlot.period} saved.` })
      setSubmittedPeriods(prev => [...new Set([...prev, selectedSlot.period])])
      setTimeout(() => setMessage(null), 5000)
    }
    setLoading(false)
  }

  const stats = {
    present: Object.values(attendanceData).filter(v => v === 'present').length,
    absent: Object.values(attendanceData).filter(v => v === 'absent').length,
    total: students.length
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 bg-[#fdfcfd] min-h-screen">
      
      {/* Top Banner - Soft Lavender Look */}
      <div className="bg-brand-soft rounded-[2rem] p-6 text-brand-dark shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden border border-brand-light/10">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-brand-light mb-1">
            <FiClock />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active Attendance Window</span>
          </div>
          <h1 className="text-2xl font-black text-brand-dark">Today: {displayDate}</h1>
          <p className="text-brand-light/80 text-xs font-bold mt-1">Marking is enabled for your classes today.</p>
        </div>
        <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white flex items-center gap-3 shadow-sm">
          <FiActivity className="text-brand" />
          <span className="text-sm font-black text-brand-dark uppercase tracking-wider">{todayName}</span>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      {/* Class Selector Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
          <FiUsers className="text-brand-light" /> Select Period
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {todayClasses.map((slot) => {
            const isDone = submittedPeriods.includes(slot.period);
            const isActive = selectedSlot?.id === slot.id;
            return (
              <button 
                key={slot.id} 
                onClick={() => loadAttendanceSheet(slot)}
                className={`relative p-4 rounded-3xl border-2 transition-all group
                  ${isActive ? 'border-brand bg-white shadow-md' : 'border-white bg-white shadow-sm hover:border-brand-soft'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[9px] font-black ${isActive ? 'text-brand' : 'text-slate-300'}`}>P-{slot.period}</span>
                  {isDone && <FiCheckCircle className="text-emerald-300" size={14} />}
                </div>
                <h4 className={`text-xs font-black truncate ${isActive ? 'text-brand-dark' : 'text-slate-600'}`}>{slot.subjects?.name}</h4>
                <p className="text-[10px] font-bold text-slate-400">{slot.class}-{slot.section}</p>
                {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSlot ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
          
          {/* Left: Stats Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-8 rounded-[2.5rem] border border-brand-soft shadow-sm sticky top-6">
              <div className="mb-6">
                <span className="text-[10px] font-black text-brand-light uppercase tracking-widest">Marking Sheet</span>
                <h2 className="text-2xl font-black text-brand-dark leading-tight">Class {selectedSlot.class}-{selectedSlot.section}</h2>
                <p className="text-sm font-bold text-slate-400 mt-1">{selectedSlot.subjects?.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#f2fcf6] p-4 rounded-3xl border border-emerald-50">
                  <p className="text-[9px] font-black text-emerald-600 uppercase">Present</p>
                  <p className="text-2xl font-black text-emerald-700">{stats.present}</p>
                </div>
                <div className="bg-[#fff8f8] p-4 rounded-3xl border border-rose-50">
                  <p className="text-[9px] font-black text-rose-600 uppercase">Absent</p>
                  <p className="text-2xl font-black text-rose-700">{stats.absent}</p>
                </div>
              </div>

              <button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full bg-brand-dark text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-brand transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-brand-soft"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FiSave /> Save Records</>}
              </button>
            </div>
          </div>

          {/* Right: Student Roster */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] border border-brand-soft shadow-sm overflow-hidden">
              <div className="p-6 border-b border-brand-soft bg-brand-accent/30 flex justify-between items-center">
                <span className="text-xs font-black text-brand-dark/60 uppercase tracking-widest">Student Roster ({stats.total})</span>
                <button 
                  onClick={() => {
                    const allPresent: any = {};
                    students.forEach(s => allPresent[s.id] = 'present');
                    setAttendanceData(allPresent);
                  }}
                  className="text-[9px] font-black bg-white border border-brand-soft px-3 py-1.5 rounded-lg text-brand hover:bg-brand-soft transition-colors"
                >
                    ALL PRESENT
                </button>
              </div>
              <div className="divide-y divide-brand-soft/30 h-[600px] overflow-y-auto">
                {students.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between p-5 hover:bg-brand-soft/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-brand-soft w-4">{idx + 1}</span>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm
                        ${attendanceData[s.id] === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
                      `}>
                        {s.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm leading-none mb-1">{s.full_name}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{s.student_id}</p>
                      </div>
                    </div>

                    <div className="flex bg-slate-50 p-1 rounded-xl gap-1 border border-slate-100">
                      <button 
                        onClick={() => setAttendanceData(prev => ({...prev, [s.id]: 'present'}))}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all flex items-center gap-1.5
                          ${attendanceData[s.id] === 'present' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        <FiUserCheck size={12} /> PRESENT
                      </button>
                      <button 
                        onClick={() => setAttendanceData(prev => ({...prev, [s.id]: 'absent'}))}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all flex items-center gap-1.5
                          ${attendanceData[s.id] === 'absent' ? 'bg-white text-rose-600 shadow-sm border border-rose-50' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        <FiUserX size={12} /> ABSENT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-brand-soft py-32 text-center shadow-sm">
            <div className="bg-brand-soft w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-brand">
                <FiUsers size={32} />
            </div>
            <h3 className="text-xl font-black text-brand-dark">Ready to mark?</h3>
            <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto mt-2">
                Tap a class period above to load the student list for today.
            </p>
        </div>
      )}
    </div>
  )
}