'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { FiCalendar, FiClock, FiDownload, FiInfo, FiPrinter } from 'react-icons/fi'
import html2canvas from 'html2canvas'
import { saveImageFromDataUrl } from "@/lib/nativeDownload"

export default function TeacherTimetable() {
  const [timetableMatrix, setTimetableMatrix] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [teacherName, setTeacherName] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  
  // Dynamic periods based on database
  const [periods, setPeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  
  // Default standard school timings as a fallback
  const [timeSlots, setTimeSlots] = useState<Record<number, string>>({
    1: "09:00 - 09:45", 2: "09:45 - 10:30", 3: "10:30 - 11:15",
    4: "11:15 - 12:00", 5: "12:00 - 12:45", 6: "12:45 - 01:30",
    7: "01:30 - 02:15", 8: "02:15 - 03:00", 9: "03:00 - 03:45",
    10: "03:45 - 04:30", 11: "04:30 - 05:15", 12: "05:15 - 06:00"
  })
  
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return daysList.includes(today) ? today : 'Monday';
  });

  const printRef = useRef<HTMLDivElement>(null)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayShort: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
  }

  // UI Colors
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

  // PDF Export HEX Colors
  const getSubjectHexStyle = (subjectName: string) => {
    const name = subjectName || 'Default';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      { bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8' }, 
      { bg: '#ecfdf5', border: '#34d399', text: '#047857' }, 
      { bg: '#f5f3ff', border: '#a78bfa', text: '#4338ca' }, 
      { bg: '#fffbeb', border: '#fbbf24', text: '#b45309' }, 
      { bg: '#fff1f2', border: '#fb7185', text: '#be123c' }, 
      { bg: '#eef2ff', border: '#818cf8', text: '#4338ca' }, 
      { bg: '#ecfeff', border: '#22d3ee', text: '#0f766e' }, 
      { bg: '#fff7ed', border: '#fb923c', text: '#c2410c' }, 
    ];
    return colors[Math.abs(hash) % colors.length];
  }

  const handleDownloadOfficial = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const element = printRef.current;
      element.style.display = "block"; 

      const canvas = await html2canvas(element, {
        scale: 3, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      element.style.display = "none"; 

      const dataUrl = canvas.toDataURL("image/png");
      const fileName = `Official_Teacher_Schedule_${teacherName.replace(/\s+/g, '_')}.png`;

      await saveImageFromDataUrl(dataUrl, fileName);

    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed: " + (err instanceof Error ? err.message : String(err)));
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

      const [assignmentsRes, timetableRes, periodsRes] = await Promise.all([
        supabase.from('subject_assignments').select('*').eq('teacher_id', teacher.id),
        supabase.from('timetable').select('*, subjects(*)'),
        supabase.from('periods').select('*')
      ]);

      if (assignmentsRes.data && assignmentsRes.data.length > 0) {
        setAcademicYear(assignmentsRes.data[0].academic_year || "");
      }

      const normalizeClass = (val: string) => {
        if (!val) return "";
        return val.toString().toLowerCase().replace(/(st|nd|rd|th|class|\s)/gi, "").trim();
      };

      const exactDBTimes: Record<number, string> = {};
      const matrix: any = {};
      const activePeriods = new Set<number>();

      if (timetableRes.data && assignmentsRes.data) {
        
        // 1. Map exact timings from the periods table based on the teacher's assigned classes
        if (periodsRes.data) {
          assignmentsRes.data.forEach(assignment => {
            const cleanAssignClass = normalizeClass(assignment.class_name);
            const cleanAssignSec = (assignment.section || "").toLowerCase().trim();

            periodsRes.data.forEach((p: any) => {
              const cleanPeriodClass = normalizeClass(p.class);
              const cleanPeriodSec = (p.section || "").toLowerCase().trim();
              
              // In your database, the period number is stored under 'id'
              const periodNum = p.period || p.id;

              if (cleanAssignClass === cleanPeriodClass && cleanAssignSec === cleanPeriodSec) {
                if (periodNum && p.start_time && p.end_time) {
                  const start = p.start_time.slice(0, 5);
                  const end = p.end_time.slice(0, 5);
                  exactDBTimes[periodNum] = `${start} - ${end}`;
                }
              }
            });
          });
        }

        // 2. Build the timetable matrix
        timetableRes.data.forEach(slot => {
          const cleanSlotClass = normalizeClass(slot.class);
          const cleanSlotSec = (slot.section || "").toLowerCase().trim();

          const isAssignmentMatch = assignmentsRes.data?.find(a => {
            const cleanAssignClass = normalizeClass(a.class_name);
            const cleanAssignSec = (a.section || "").toLowerCase().trim();
            
            return a.subject_id === slot.subject_id && 
                   cleanAssignClass === cleanSlotClass && 
                   cleanAssignSec === cleanSlotSec;
          });

          if (isAssignmentMatch) {
            if (slot.period) activePeriods.add(slot.period);

            if (!matrix[slot.day]) matrix[slot.day] = {};
            if (!matrix[slot.day][slot.period]) matrix[slot.day][slot.period] = [];
            
            const isDuplicate = matrix[slot.day][slot.period].some((existingSlot: any) => 
               existingSlot.class === slot.class && existingSlot.section === slot.section && existingSlot.subject_id === slot.subject_id
            );

            if (!isDuplicate) {
              matrix[slot.day][slot.period].push(slot);
            }
          }
        });

        // Update UI states
        if (activePeriods.size > 0) {
          setPeriods(Array.from(activePeriods).sort((a, b) => a - b));
        }
        if (Object.keys(exactDBTimes).length > 0) {
          setTimeSlots(prev => ({ ...prev, ...exactDBTimes }));
        }
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
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand border-r-transparent"></div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 px-4 mt-6 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FiCalendar className="text-brand dark:text-brand-soft" /> Weekly Schedule
        </h2>
        <button
          onClick={handleDownloadOfficial}
          disabled={downloading}
          className="flex items-center gap-2 bg-slate-900 dark:bg-brand text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 dark:hover:bg-brand-dark transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none whitespace-nowrap"
        >
          {downloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiPrinter />}
          <span className="hidden xs:inline sm:inline">{downloading ? 'Processing...' : 'Export Official'}</span>
          <span className="inline xs:hidden sm:hidden">{downloading ? '...' : 'Export'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Teacher Timetable</h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Academic Session {academicYear}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] sm:text-xs font-black text-brand dark:text-brand-soft flex items-center gap-1">
              <span className="w-2 h-2 bg-brand dark:bg-brand-soft rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">Live Schedule</span>
              <span className="sm:hidden">Live</span>
            </div>
          </div>
        </div>

        {/* ---------- MOBILE VIEW ---------- */}
        <div className="sm:hidden">
          <div className="flex gap-2 overflow-x-auto px-3 py-3 border-b border-slate-100 dark:border-slate-800 no-scrollbar">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 ${
                  activeDay === day
                    ? 'bg-slate-900 dark:bg-brand text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {dayShort[day]}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {periods.map(period => {
              const slots = timetableMatrix[activeDay]?.[period] || [];
              const hasClasses = slots.length > 0;
              const styles = hasClasses ? getSubjectStyle(slots[0].subjects?.name) : null;
              
              const timeString = timeSlots[period] || `Per ${period}`;
              const timeParts = timeString.includes('-') ? timeString.split('-') : [timeString, ''];

              return (
                <div key={period} className="flex items-stretch gap-3 p-3">
                  <div className="w-16 shrink-0 flex flex-col justify-center">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 leading-tight">
                      {timeParts[0]?.trim()}
                    </span>
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 leading-tight">
                      {timeParts[1] ? `- ${timeParts[1].trim()}` : ''}
                    </span>
                  </div>
                  <div className="flex-1">
                    {hasClasses ? (
                      <div className={`rounded-xl p-3 border-l-4 shadow-sm ${styles?.bg} ${styles?.border} ${styles?.text} dark:brightness-90 dark:contrast-125`}>
                        <div className="flex items-center justify-between">
                          <p className="font-black text-xs leading-tight">
                            {Array.from(new Set(slots.map((s:any) => s.subjects?.name))).join(" / ")}
                          </p>
                          <FiInfo size={12} className="opacity-40 shrink-0 ml-2" />
                        </div>
                        <span className="inline-block mt-2 text-[9px] font-black bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md uppercase">
                          {slots.map((s:any) => `${s.class || s.class_name}-${s.section}`).join(" / ")}
                        </span>
                      </div>
                    ) : (
                      <div className="h-12 flex items-center">
                        <div className="w-6 h-[2px] bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ---------- DESKTOP / TABLET VIEW ---------- */}
        <div className="hidden sm:block overflow-x-auto">
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
                  <td className="p-4 border-b border-r border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/20 whitespace-nowrap">
                    {timeSlots[period] || `Per ${period}`}
                  </td>
                  {days.map(day => {
                    const slots = timetableMatrix[day]?.[period] || [];
                    const hasClasses = slots.length > 0;
                    const styles = hasClasses ? getSubjectStyle(slots[0].subjects?.name) : null;
                    
                    return (
                      <td key={`${day}-${period}`} className="p-2 border-b border-r border-slate-100 dark:border-slate-800 align-top">
                        {hasClasses ? (
                          <div className={`rounded-xl p-3 h-full border-l-4 shadow-sm transition-all ${styles?.bg} ${styles?.border} ${styles?.text} dark:brightness-90 dark:contrast-125`}>
                            <p className="font-black text-xs mb-1 leading-tight">
                               {Array.from(new Set(slots.map((s:any) => s.subjects?.name))).join(" / ")}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[9px] font-black bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md uppercase">
                                {slots.map((s:any) => `${s.class || s.class_name}-${s.section}`).join(" / ")}
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

      {/* --- HIDDEN OFFICIAL PRINT TEMPLATE (WITH INCREASED FONTS & DYNAMIC COLORS) --- */}
      <div 
        ref={printRef} 
        style={{ 
          display: 'none', 
          width: '1200px', 
          padding: '60px', 
          backgroundColor: 'white', 
          fontFamily: 'sans-serif' 
        }}
      >
        <div style={{ border: '10px double #a63d93', padding: '40px', position: 'relative' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '4px solid #a63d93', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#a63d93', margin: 0, textTransform: 'uppercase' }}>Prashanthi Vidyalaya</h1>
            <p style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '6px', color: '#64748b', margin: '8px 0' }}>OFFICIAL FACULTY TIME-TABLE {academicYear ? `• ${academicYear}` : ''}</p>
          </div>

          {/* Teacher Details */}
          <div style={{ display: 'flex', justifyItems: 'space-between', backgroundColor: '#fdf2f8', padding: '25px', borderRadius: '15px', marginBottom: '40px', border: '1px solid #fbcfe8' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Faculty Name</p>
              <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#000' }}>{teacherName.toUpperCase()}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Status</p>
              <h2 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#000' }}>OFFICIAL</h2>
            </div>
          </div>

          {/* Official Table Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(6, 1fr)', gap: '10px' }}>
            {/* Corner Cell */}
            <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
              TIME / DAY
            </div>

            {/* Days Header */}
            {days.map(day => (
              <div key={day} style={{ backgroundColor: '#a63d93', color: 'white', padding: '15px', textAlign: 'center', borderRadius: '8px', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>
                {day}
              </div>
            ))}

            {/* Rows */}
            {periods.map(period => (
              <React.Fragment key={period}>
                {/* Time Cell */}
                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center' }}>
                  {timeSlots[period] || `Per ${period}`}
                </div>
                {/* Subject Cells */}
                {days.map(day => {
                  const slots = timetableMatrix[day]?.[period] || [];
                  const hasClasses = slots.length > 0;
                  const hexStyle = hasClasses ? getSubjectHexStyle(slots[0].subjects?.name) : null;
                  
                  return (
                    <div key={`${day}-${period}`} style={{
                      padding: '15px',
                      borderRadius: '12px',
                      border: hasClasses ? `2px solid ${hexStyle?.border}` : '1px solid #e2e8f0',
                      minHeight: '120px',
                      backgroundColor: hasClasses ? hexStyle?.bg : 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}>
                      {hasClasses ? (
                        <>
                          <p style={{ fontSize: '18px', fontWeight: '900', color: hexStyle?.text, margin: '0 0 10px 0', lineHeight: '1.2' }}>
                            {Array.from(new Set(slots.map((s:any) => s.subjects?.name))).join(" / ")}
                          </p>
                          <span style={{ fontSize: '14px', fontWeight: '800', backgroundColor: hexStyle?.text, color: 'white', padding: '4px 10px', borderRadius: '6px', alignSelf: 'center' }}>
                            CL {slots.map((s:any) => `${s.class || s.class_name}-${s.section}`).join(" / ")}
                          </span>
                        </>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '16px' }}>—</span>}
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
                <p style={{ fontSize: '10px', fontWeight: 'bold' }}>OFFICIAL DIGITAL COPY</p>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '2px solid #000', width: '220px', paddingTop: '10px', fontSize: '12px', fontWeight: '900' }}>PRINCIPAL / OFFICE SEAL</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
