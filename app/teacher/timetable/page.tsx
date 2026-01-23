'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { FiCalendar, FiClock, FiDownload, FiInfo } from 'react-icons/fi'
import html2canvas from 'html2canvas'

export default function TeacherTimetable() {
  const [timetableMatrix, setTimetableMatrix] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const periods = [1, 2, 3, 4, 5, 6]
  
  const timeSlots: Record<number, string> = {
    1: "09:00 - 10:00", 2: "10:00 - 11:00", 3: "11:00 - 12:00",
    4: "12:00 - 01:00", 5: "02:00 - 03:00", 6: "03:00 - 04:00",
  }

  // --- HELPER: Generate Consistent Colors Based on Subject Name ---
  const getSubjectStyle = (subjectName: string) => {
    const name = subjectName || 'Default';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // List of elegant Tailwind color pairs
    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
      { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
      { bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-700' },
      { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
      { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
      { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700' },
      { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-700' },
      { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
    ];

    return colors[Math.abs(hash) % colors.length];
  }

  // --- FUNCTION: Export as Image ---
  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
        scale: 2, // High quality
        backgroundColor: '#ffffff',
    });
    const image = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `Timetable-${new Date().toLocaleDateString()}.png`;
    link.href = image;
    link.click();
  };

  useEffect(() => {
    fetchTeacherTimetable()
  }, [])

  async function fetchTeacherTimetable() {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('teacherEmail'); 

      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (tError || !teacher) return;

      const [assignmentsRes, timetableRes] = await Promise.all([
        supabase.from('subject_assignments').select('*').eq('teacher_id', teacher.id),
        supabase.from('timetable').select('*, subjects(*)')
      ]);

      const matrix: any = {};

      if (timetableRes.data && assignmentsRes.data) {
        timetableRes.data.forEach(slot => {
          const match = assignmentsRes.data.find(a => a.subject_id === slot.subject_id);
          if (match) {
            if (!matrix[slot.day]) matrix[slot.day] = {};
            matrix[slot.day][slot.period] = slot;
          }
        });
      }
      setTimetableMatrix(matrix);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand"></div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FiCalendar className="text-brand" /> Weekly Schedule
        </h2>
        <button 
          onClick={handleDownloadImage}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <FiDownload /> Export as Photo
        </button>
      </div>

      {/* TIMETABLE CONTAINER (This is what gets captured) */}
      <div 
        ref={printRef} 
        className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Teacher Timetable</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Academic Session 2025-26</p>
          </div>
          <div className="text-right">
             <div className="text-xs font-black text-brand flex items-center gap-1">
                <span className="w-2 h-2 bg-brand rounded-full animate-pulse"></span> Live Schedule
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="p-4 border-b border-r border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-widest text-left w-28">
                  <div className="flex items-center gap-2"><FiClock /> Time</div>
                </th>
                {days.map(day => (
                  <th key={day} className="p-4 border-b border-r border-slate-100 text-slate-700 font-black text-xs text-center min-w-[140px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period} className="group">
                  <td className="p-4 border-b border-r border-slate-100 text-[10px] font-black text-slate-400 bg-slate-50/30">
                    {timeSlots[period]}
                  </td>
                  {days.map(day => {
                    const slot = timetableMatrix[day]?.[period]
                    const styles = slot ? getSubjectStyle(slot.subjects?.name) : null;

                    return (
                      <td key={`${day}-${period}`} className="p-2 border-b border-r border-slate-100 align-top">
                        {slot ? (
                          <div className={`rounded-xl p-3 h-full border-l-4 shadow-sm transition-all ${styles?.bg} ${styles?.border} ${styles?.text}`}>
                            <p className="font-black text-xs mb-1 leading-tight">{slot.subjects?.name}</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] font-black bg-white/50 px-2 py-0.5 rounded-md uppercase">
                                    {slot.class}-{slot.section}
                                </span>
                                <FiInfo size={12} className="opacity-40" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-12 flex items-center justify-center">
                            <div className="w-6 h-[2px] bg-slate-100 rounded-full"></div>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer for the Photo Export */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Generated via School Management System</p>
        </div>
      </div>
    </div>
  )
}