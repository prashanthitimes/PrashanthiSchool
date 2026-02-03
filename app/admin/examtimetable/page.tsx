'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Calendar, Plus, Save, Trash2, Printer, AlertCircle, CheckCircle, Clock, Info, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast, Toaster } from 'sonner'

export default function ExamTimetableManager() {
  const [exams, setExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [subjects, setSubjects] = useState<any[]>([])
  const [timetable, setTimetable] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'allot' | 'pending'>('list')
  const [scheduledStatus, setScheduledStatus] = useState<any[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    const { data: ex } = await supabase.from('exams').select('*').order('start_date', { ascending: false })
    const { data: sub } = await supabase.from('subjects').select('id, name')
    if (ex) setExams(ex)
    if (sub) setSubjects(sub)
    fetchAuditData()
  }

  const fetchAuditData = async () => {
    const { data } = await supabase.from('exam_timetables').select('exam_id, class_name')
    setScheduledStatus(data || [])
  }

  const fetchTimetable = async () => {
    if (!selectedExam || !selectedClass) return;
    const { data } = await supabase
      .from('exam_timetables')
      .select(`*, subjects(name)`)
      .eq('exam_id', selectedExam.id)
      .eq('class_name', selectedClass)
      .order('exam_date', { ascending: true })
    setTimetable(data || [])
  }

  useEffect(() => { fetchTimetable() }, [selectedClass, selectedExam])

  const bulkSave = async () => {
    if (!selectedExam || !selectedClass) return;
    const payload = timetable.filter(r => r.subject_id && r.exam_date).map(row => ({
      ...(row.id && String(row.id).includes('-') ? { id: row.id } : {}),
      exam_id: selectedExam.id,
      class_name: selectedClass,
      exam_date: row.exam_date,
      subject_id: row.subject_id,
      start_time: row.start_time || '09:00:00',
      end_time: row.end_time || '12:00:00',
      room_no: row.room_no || 'TBA'
    }));

    const { error } = await supabase.from('exam_timetables').upsert(payload, { 
      onConflict: 'exam_id,class_name,exam_date,subject_id' 
    });

    if (error) {
      toast.error("Constraint Violation: Unique Subject/Date required.");
    } else {
      toast.success("Academic Allotment Synchronized");
      setActiveTab('list');
      fetchTimetable();
      fetchAuditData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
      <Toaster position="top-right" richColors />

      {/* HEADER - YOUR CUSTOM STYLE */}
      <header className="flex flex-wrap items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-[#fdf2f9] shadow-sm gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fdf2f9] text-[#a63d93] rounded-2xl flex items-center justify-center shadow-inner">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Exam Allotment</h1>
            <p className="text-[10px] font-bold text-[#a63d93] tracking-[0.2em] uppercase">Registry & Timetabling</p>
          </div>
        </div>

        <div className="flex items-center bg-[#fdf2f9]/30 p-1.5 rounded-2xl border border-[#fdf2f9]">
          {[
            { id: "list", label: "View List" },
            { id: "allot", label: "Subjects allotment" },
            { id: "pending", label: "Pending" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                ? "bg-[#a63d93] text-white shadow-lg" 
                : "text-[#a63d93] hover:bg-[#fdf2f9]/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* TOOLBAR FOR SELECTING EXAM/CLASS */}
      {activeTab !== 'pending' && (
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 print:hidden">
            <div className="flex gap-4">
                <select className="premium-select" value={selectedExam?.id || ''} onChange={(e) => setSelectedExam(exams.find(x => x.id === e.target.value))}>
                    <option value="">Select Exam</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
                </select>
                {selectedExam && (
                    <select className="premium-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        <option value="">Select Class</option>
                        {selectedExam.classes.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
            </div>

            {selectedClass && activeTab === 'allot' && (
                <button onClick={bulkSave} className="flex items-center gap-2 bg-[#a63d93] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-105 transition-transform">
                    <Save size={16} /> Sync Allotment
                </button>
            )}
            
            {selectedClass && activeTab === 'list' && (
                <button onClick={() => window.print()} className="flex items-center gap-2 border-2 border-[#a63d93] text-[#a63d93] px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#fdf2f9]">
                    <Printer size={16} /> Print Schedule
                </button>
            )}
        </div>
      )}

      {/* CONTENT AREA */}
      <main className="max-w-7xl mx-auto">
        {activeTab === 'pending' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.map(ex => (
              <div key={ex.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-6 border-b pb-4">{ex.exam_name}</h3>
                <div className="space-y-3">
                  {ex.classes.map((cls: string) => {
                    const isDone = scheduledStatus.some(s => s.exam_id === ex.id && s.class_name === cls);
                    return (
                      <div key={cls} onClick={() => { setSelectedExam(ex); setSelectedClass(cls); setActiveTab('allot'); }} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-[#fdf2f9] cursor-pointer group transition-all">
                        <span className="text-xs font-bold text-slate-600">Class {cls}</span>
                        {isDone ? (
                          <span className="text-[8px] font-black uppercase bg-green-100 text-green-600 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1"><CheckCircle size={10}/> Ready</span>
                        ) : (
                          <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-600 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1"><Clock size={10}/> Pending</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : selectedClass ? (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden print:border-0 print:shadow-none">
            {/* OFFICIAL TABLE HEADER */}
            <div className="p-12 border-b-4 border-[#a63d93] flex justify-between items-end bg-gradient-to-r from-white to-[#fdf2f9]/30">
                <div>
                    <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedExam?.exam_name}</h2>
                    <div className="flex gap-4 mt-6">
                        <div className="bg-[#a63d93] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Class {selectedClass}</div>
                        <div className="bg-white border text-slate-400 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">Academic Session {new Date().getFullYear()}</div>
                    </div>
                </div>
                <div className="text-right print:hidden">
                    <p className="text-[10px] font-black text-[#a63d93] uppercase tracking-widest mb-1">Status</p>
                    <p className="text-xs font-bold text-slate-400">{activeTab === 'allot' ? 'Editing Mode' : 'Viewing Official Copy'}</p>
                </div>
            </div>

            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b">
                        <th className="p-8 text-left">Date & Weekday</th>
                        <th className="p-8 text-left">Subject Detail</th>
                        <th className="p-8 text-center">Time Slot</th>
                        <th className="p-8 text-center">Room</th>
                        {activeTab === 'allot' && <th className="p-8 print:hidden"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {timetable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#fdf2f9]/20 transition-colors">
                            <td className="p-8">
                                {activeTab === 'allot' ? (
                                    <input type="date" className="soft-input" min={selectedExam.start_date} max={selectedExam.end_date} value={row.exam_date || ''} onChange={(e) => { const n = [...timetable]; n[idx].exam_date = e.target.value; setTimetable(n); }} />
                                ) : (
                                    <div className="flex flex-col">
                                        <span className="font-black text-slate-800 text-md">{row.exam_date ? new Date(row.exam_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'TBA'}</span>
                                        <span className="text-[10px] font-bold text-[#a63d93] uppercase">{row.exam_date ? new Date(row.exam_date).toLocaleDateString('en-GB', {weekday: 'long'}) : ''}</span>
                                    </div>
                                )}
                            </td>
                            <td className="p-8">
                                {activeTab === 'allot' ? (
                                    <select className="soft-input font-bold" value={row.subject_id || ''} onChange={(e) => { const n = [...timetable]; n[idx].subject_id = e.target.value; setTimetable(n); }}>
                                        <option value="">Choose Subject</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                ) : <span className="text-sm font-black text-slate-700 uppercase">{row.subjects?.name || '---'}</span>}
                            </td>
                            <td className="p-8 text-center">
                                <div className="inline-flex items-center bg-slate-100 px-4 py-2 rounded-xl font-black text-[10px] text-slate-500 uppercase tracking-tighter">
                                    {row.start_time?.slice(0,5)} <span className="mx-2 text-slate-300">—</span> {row.end_time?.slice(0,5)}
                                </div>
                            </td>
                            <td className="p-8 text-center font-black text-slate-400 text-xs">
                                {activeTab === 'allot' ? <input className="soft-input w-20 text-center" value={row.room_no || ''} onChange={(e) => { const n = [...timetable]; n[idx].room_no = e.target.value; setTimetable(n); }} /> : (row.room_no || 'TBA')}
                            </td>
                            {activeTab === 'allot' && (
                                <td className="p-8 text-right print:hidden">
                                    <button onClick={() => setTimetable(timetable.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {activeTab === 'allot' && (
                <div className="p-10 bg-slate-50/50 print:hidden">
                    <button onClick={() => setTimetable([...timetable, { id: Math.random(), exam_date: selectedExam.start_date, start_time: '09:00', end_time: '12:00' }])} className="w-full py-6 border-4 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:border-[#a63d93] hover:text-[#a63d93] transition-all">
                        <Plus size={20} className="inline mr-2" /> Add Next Subject Row
                    </button>
                </div>
            )}

            {/* SIGNATURE SECTION FOR PDF */}
            <div className="p-16 flex justify-between items-end border-t border-slate-50">
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Doc ID: {selectedExam.id.slice(0,8)}</p>
                    <p className="text-xs font-bold text-slate-400 italic">Academic Registry Office</p>
                </div>
                <div className="hidden print:block text-center border-t-2 border-slate-900 pt-4 px-12 font-black text-[10px] uppercase tracking-widest">
                    Controller of Examinations
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Released On</p>
                    <p className="text-xs font-bold text-slate-500">{new Date().toLocaleDateString('en-GB')}</p>
                </div>
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
             <Calendar size={64} className="text-slate-200 mb-4" />
             <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Select Allotment Parameters</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        .premium-select { background: white; border: 2px solid #f1f5f9; padding: 0.8rem 1.2rem; border-radius: 1rem; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; outline: none; transition: border 0.2s; cursor: pointer; }
        .premium-select:focus { border-color: #a63d93; }
        .soft-input { border: 2px solid #f1f5f9; padding: 0.6rem 0.8rem; border-radius: 0.75rem; font-size: 11px; font-weight: 700; outline: none; width: 100%; }
        .soft-input:focus { border-color: #a63d93; background: #fdf2f9/30; }

        @media print {
            aside, nav, [class*="sidebar"], [class*="Header"], header, .print\:hidden, button { display: none !important; }
            body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .min-h-screen { min-height: 0 !important; padding: 0 !important; }
            .max-w-7xl { max-width: 100% !important; margin: 0 !important; width: 100% !important; }
            .rounded-[3rem] { border-radius: 0 !important; }
            .shadow-2xl { box-shadow: none !important; }
            
            /* Visibility Fix */
            body * { visibility: hidden; }
            .max-w-7xl, .max-w-7xl * { visibility: visible; }
            .max-w-7xl { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  )
}