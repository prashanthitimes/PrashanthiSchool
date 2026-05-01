'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { FiCalendar, FiClock, FiDownload, FiInfo, FiPrinter } from 'react-icons/fi'
import html2canvas from 'html2canvas'

export default function TeacherTimetable() {
  const [timetableMatrix, setTimetableMatrix] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [teacherName, setTeacherName] = useState("")
  
  // Ref for the high-quality official document template
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

  // --- FUNCTION: Official Download Method ---
  const handleDownloadOfficial = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const element = printRef.current;
      element.style.display = "block";

      const canvas = await html2canvas(element, {
        scale: 3, // High-definition
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      element.style.display = "none";

      const link = document.createElement("a");
      link.download = `Official_Teacher_Schedule_${teacherName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
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
        .select('*')
        .eq('email', userEmail)
        .single();

      if (tError || !teacher) return;
      setTeacherName(teacher.full_name);

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
      {/* Action Bar - No Design Changes */}
      <div className="flex justify-between items-center px-4 mt-10">
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FiCalendar className="text-brand dark:text-brand-soft" /> Weekly Schedule
        </h2>
        <button
          onClick={handleDownloadOfficial}
          disabled={downloading}
          className="flex items-center gap-2 bg-slate-900 dark:bg-brand text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 dark:hover:bg-brand-dark transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
        >
          {downloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPrinter />} 
          {downloading ? 'Processing...' : 'Export Official'}
        </button>
      </div>

      {/* VISIBLE UI - KEEPING YOUR DESIGN EXACTLY THE SAME */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Teacher Timetable</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Academic Session 2025-26</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-brand dark:text-brand-soft flex items-center gap-1">
              <span className="w-2 h-2 bg-brand dark:bg-brand-soft rounded-full animate-pulse"></span> Live Schedule
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                <th className="p-4 border-b border-r border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-widest text-left w-28">
                  <div className="flex items-center gap-2"><FiClock /> Time</div>
                </th>
                {days.map(day => (
                  <th key={day} className="p-4 border-b border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs text-center min-w-[140px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period} className="group">
                  <td className="p-4 border-b border-r border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/20">
                    {timeSlots[period]}
                  </td>
                  {days.map(day => {
                    const slot = timetableMatrix[day]?.[period]
                    const styles = slot ? getSubjectStyle(slot.subjects?.name) : null;
                    return (
                      <td key={`${day}-${period}`} className="p-2 border-b border-r border-slate-100 dark:border-slate-800 align-top">
                        {slot ? (
                          <div className={`rounded-xl p-3 h-full border-l-4 shadow-sm transition-all ${styles?.bg} ${styles?.border} ${styles?.text} dark:brightness-90 dark:contrast-125`}>
                            <p className="font-black text-xs mb-1 leading-tight">{slot.subjects?.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] font-black bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md uppercase">
                                {slot.class}-{slot.section}
                              </span>
                              <FiInfo size={12} className="opacity-40" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-12 flex items-center justify-center">
                            <div className="w-6 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full"></div>
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
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Generated via School Management System</p>
        </div>
      </div>

      {/* --- HIDDEN OFFICIAL PRINT TEMPLATE (Used for Download Only) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div ref={printRef} style={{ width: '1200px', padding: '60px', backgroundColor: 'white', fontFamily: 'sans-serif' }}>
          <div style={{ border: '10px double #a63d93', padding: '40px', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '4px solid #a63d93', paddingBottom: '20px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#a63d93', margin: 0, textTransform: 'uppercase' }}>Prashanti Vidyalaya</h1>
              <p style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '6px', color: '#64748b', margin: '8px 0' }}>OFFICIAL FACULTY TIME-TABLE • 2026-27</p>
            </div>

            {/* Teacher Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fdf2f8', padding: '25px', borderRadius: '15px', marginBottom: '40px', border: '1px solid #fbcfe8' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Faculty Name</p>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#000' }}>{teacherName.toUpperCase()}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Designation</p>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#000' }}>Senior Faculty</h2>
              </div>
            </div>

            {/* Official Table Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(6, 1fr)', gap: '10px' }}>
              {/* Corner Cell */}
              <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>TIME / DAY</div>
              
              {/* Days Header */}
              {days.map(day => (
                <div key={day} style={{ backgroundColor: '#a63d93', color: 'white', padding: '15px', textAlign: 'center', borderRadius: '8px', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>
                  {day}
                </div>
              ))}

              {/* Rows */}
              {periods.map(period => (
                <React.Fragment key={period}>
                  {/* Time Cell */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {timeSlots[period]}
                  </div>
                  {/* Subject Cells */}
                  {days.map(day => {
                    const slot = timetableMatrix[day]?.[period];
                    return (
                      <div key={`${day}-${period}`} style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        minHeight: '110px',
                        backgroundColor: slot ? '#fdf2f8' : 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}>
                        {slot ? (
                          <>
                            <p style={{ fontSize: '14px', fontWeight: '900', color: '#a63d93', margin: '0 0 8px 0' }}>{slot.subjects?.name}</p>
                            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#a63d93', color: 'white', padding: '2px 8px', borderRadius: '4px', alignSelf: 'center' }}>
                              CL {slot.class}-{slot.section}
                            </span>
                          </>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* Verification Footer */}
            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '2px solid #000', width: '220px', paddingTop: '10px', fontSize: '12px', fontWeight: '900' }}>ISSUED BY ADMINISTRATION</div>
               </div>
               <div style={{ textAlign: 'center', opacity: 0.3 }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold' }}>OFFICIAL DIGITAL COPY • 2026</p>
               </div>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '2px solid #000', width: '220px', paddingTop: '10px', fontSize: '12px', fontWeight: '900' }}>PRINCIPAL / OFFICE SEAL</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}