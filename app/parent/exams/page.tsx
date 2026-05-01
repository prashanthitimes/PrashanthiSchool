"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FiCalendar, FiClock, FiMapPin, FiBookOpen, 
  FiDownload, FiInfo, FiHash, FiPrinter, FiUser 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

export default function ExamTimetable() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  // Refs for UI and hidden Print Template
  const tableRef = useRef(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExamData();
  }, []);

  async function fetchExamData() {
    try {
      setLoading(true);
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      const { data: student } = await supabase
        .from("students")
        .select("full_name, class_name, section, id")
        .eq("id", childId)
        .single();

      if (!student) return;
      setStudentInfo(student);

      const classNum = student.class_name.replace(/\D/g, '');
      const sectionLetter = student.section.split('-').pop()?.trim() || student.section;
      const dbClassName = `${classNum}-${sectionLetter}`;

      const { data: timetableData, error } = await supabase
        .from("exam_timetables")
        .select(`
          *,
          exams:exam_id (exam_name),
          subjects:subject_id (name)
        `)
        .eq("class_name", dbClassName)
        .order("exam_date", { ascending: true });

      if (error) throw error;

      const grouped = timetableData.reduce((acc: any, curr: any) => {
        const examTitle = curr.exams?.exam_name || "General Examination";
        if (!acc[examTitle]) acc[examTitle] = [];
        acc[examTitle].push(curr);
        return acc;
      }, {});

      setExams(Object.entries(grouped));
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const exportOfficialSchedule = async () => {
    if (printRef.current) {
      setIsExporting(true);
      const element = printRef.current;
      
      // Temporarily show the element off-screen to capture
      element.style.display = "block";

      const canvas = await html2canvas(element, {
        scale: 3, // High resolution for printing
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      element.style.display = "none";
      
      const link = document.createElement("a");
      link.download = `Official_Schedule_${studentInfo?.full_name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setIsExporting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4"></div>
      <p className="text-brand text-[10px] font-black uppercase tracking-widest animate-pulse">Authenticating Records...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-10 bg-[#fffcfd] dark:bg-slate-950 min-h-screen font-sans pb-24 transition-colors duration-300">

      {/* --- HIDDEN OFFICIAL PRINT TEMPLATE --- */}
      <div 
        ref={printRef} 
        style={{ 
          display: 'none', 
          width: '800px', 
          padding: '50px', 
          backgroundColor: 'white', 
          color: '#000',
          fontFamily: 'sans-serif' 
        }}
      >
        <div style={{ border: '8px double #a63d93', padding: '40px', position: 'relative' }}>
          {/* Official Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #a63d93', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '900', textTransform: 'uppercase', color: '#a63d93', margin: '0 0 5px 0' }}>Prashanti Vidyalaya</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '4px', color: '#64748b', margin: 0 }}>OFFICIAL EXAMINATION ADVISORY</p>
          </div>

          {/* Student Profile Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', backgroundColor: '#fdf2f8', padding: '20px', borderRadius: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#a63d93', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Candidate Name</p>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{studentInfo?.full_name.toUpperCase()}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', color: '#a63d93', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Class & Section</p>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{studentInfo?.class_name} — {studentInfo?.section}</h2>
            </div>
          </div>

          {/* Table Content */}
          {exams.map(([examName, schedules]: any) => (
            <div key={examName} style={{ marginBottom: '35px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'white', backgroundColor: '#a63d93', padding: '8px 15px', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '15px' }}>
                {examName}
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #000' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Subject</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontSize: '12px', fontWeight: '700' }}>
                        {new Date(item.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '900' }}>{item.subjects?.name}</td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</td>
                      <td style={{ padding: '12px', fontSize: '12px' }}>Room {item.room_no || 'TBA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Signatures */}
          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '180px', marginTop: '40px', paddingTop: '10px', fontSize: '10px', fontWeight: '900' }}>CONTROLLER OF EXAMS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', width: '180px', marginTop: '40px', paddingTop: '10px', fontSize: '10px', fontWeight: '900' }}>PRINCIPAL SEAL</div>
            </div>
          </div>
        </div>
      </div>


      {/* --- INTERACTIVE WEB UI --- */}
      <div className="max-w-8xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
            Examination Portal
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Academic Session 2026-27</p>
        </div>
        
        <button
          onClick={exportOfficialSchedule}
          disabled={isExporting}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? "Generating..." : <><FiPrinter size={16} /> Export Official Copy</>}
        </button>
      </div>

      <div ref={tableRef} className="max-w-8xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-[#e9d1e4] dark:border-slate-800">
        
        {/* Visual Header */}
        <div className="bg-brand dark:bg-slate-800 p-8 md:p-12 text-white relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                <FiUser size={32} className="text-brand-soft" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">Schedule <span className="opacity-40 font-light italic">Report</span></h2>
                <div className="flex justify-center md:justify-start gap-2">
                  <span className="bg-black/20 px-3 py-1 rounded-lg text-[9px] font-bold border border-white/10 uppercase tracking-widest">Class {studentInfo?.class_name}</span>
                  <span className="bg-black/20 px-3 py-1 rounded-lg text-[9px] font-bold border border-white/10 uppercase tracking-widest">Sec {studentInfo?.section}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-10">
              <p className="text-brand-soft/60 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Authenticated Student</p>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-white">{studentInfo?.full_name}</h3>
            </div>
          </div>
          <FiCalendar className="absolute right-[-20px] bottom-[-20px] text-white/5 size-60 -rotate-12 pointer-events-none" />
        </div>

        {/* Schedule List */}
        <div className="p-6 md:p-12 bg-white dark:bg-slate-900">
          {exams.length > 0 ? (
            exams.map(([examName, schedules]: any) => (
              <div key={examName} className="mb-12 last:mb-0">
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-brand dark:text-brand-soft font-black text-xs uppercase tracking-[0.3em]">{examName}</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                </div>

                <div className="grid gap-4">
                  {schedules.map((item: any) => (
                    <div
                      key={item.id}
                      className="group flex flex-col md:flex-row items-stretch md:items-center gap-6 p-6 rounded-[2rem] border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20 hover:border-brand/40 transition-all hover:shadow-lg"
                    >
                      <div className="flex md:flex-col items-center justify-between md:justify-center w-full md:w-24 h-20 md:h-24 bg-white dark:bg-slate-800 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm group-hover:bg-brand transition-colors">
                        <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-white/60">
                          {new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-3xl font-black tracking-tighter text-slate-800 dark:text-slate-100 group-hover:text-white">
                          {new Date(item.exam_date).getDate()}
                        </span>
                        <span className="text-[10px] font-bold uppercase opacity-60 text-slate-400 group-hover:text-white/60">
                          {new Date(item.exam_date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                          {item.subjects?.name}
                        </h4>
                        <div className="flex gap-4 mt-3">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                            <FiClock className="text-brand" /> {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                            <FiMapPin className="text-brand" /> Room {item.room_no || "TBA"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <FiBookOpen size={40} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">No Examination Records Found</h3>
            </div>
          )}
        </div>

        <div className="bg-slate-900 p-8 text-center">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Prashanti Vidyalaya Academic Portal • 2026</p>
        </div>
      </div>
    </div>
  );
}