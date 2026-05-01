"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FiCalendar, FiClock, FiMapPin, FiBookOpen, 
  FiDownload, FiInfo, FiFileText, FiExternalLink, FiUser, FiPrinter 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

// ... Types remain same ...
type Student = { full_name: string; class_name: string; section: string; image_url?: string; };
type Syllabus = { id: string | number; subject_id: string | number; exam_name: string; chapters: string[]; pdf_url?: string; };
type Exam = { id: string | number; exam_date: string; start_time: string; end_time: string; room_no?: string; subjects?: { name: string }; exams?: { exam_name: string }; syllabus_details?: Syllabus; };
type ExamGroup = [string, Exam[]];

export default function ExamTimetable() {
  const [exams, setExams] = useState<ExamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  
  // Refs for the two different views
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchExamData(); }, []);

  async function fetchExamData() {
    try {
      setLoading(true);
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      const { data: student } = await supabase.from("students").select("*").eq("id", childId).single();
      if (!student) return;
      setStudentInfo(student);

      const classRaw = student.class_name;
      const sectionLetter = student.section.split('-').pop()?.trim() || student.section;

      const [timetableRes, syllabusRes] = await Promise.all([
        supabase.from("exam_timetables").select(`*, exams:exam_id (exam_name), subjects:subject_id (name)`).or(`class_name.eq.${classRaw},class_name.eq.${classRaw.replace(/\D/g, '')}-${sectionLetter}`).order("exam_date", { ascending: true }),
        supabase.from("exam_syllabus").select("*").eq("class_name", classRaw).eq("section", sectionLetter)
      ]);

      const timetableWithSyllabus = timetableRes.data?.map((item: any) => {
        const syllabus = syllabusRes.data?.find((s: any) => s.subject_id === item.subject_id && s.exam_name === item.exams?.exam_name);
        return { ...item, syllabus_details: syllabus };
      }) || [];

      const grouped = timetableWithSyllabus.reduce((acc: any, curr: any) => {
        const examTitle = curr.exams?.exam_name || "Official Examination";
        if (!acc[examTitle]) acc[examTitle] = [];
        acc[examTitle].push(curr);
        return acc;
      }, {});

      setExams(Object.entries(grouped));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleDownload = async () => {
    if (printRef.current) {
      setIsDownloading(true);
      const element = printRef.current;
      element.style.display = "block"; // Temporarily show

      const canvas = await html2canvas(element, {
        scale: 3, // High DPI for printing
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      element.style.display = "none"; // Hide again
      const link = document.createElement("a");
      link.download = `Official_Exam_Schedule_${studentInfo?.full_name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-[#a63d93] animate-pulse uppercase tracking-widest">Generating Academic Schedule...</div>;

  return (
    <div className="p-3 md:p-6 bg-[#fffcfd] dark:bg-slate-950 min-h-screen font-sans">
      
      {/* 1. HIDDEN OFFICIAL PRINT TEMPLATE */}
      <div ref={printRef} style={{ display: 'none', width: '800px', padding: '40px', background: 'white' }}>
        <div style={{ border: '10px double #a63d93', padding: '30px', position: 'relative' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #a63d93', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Prashanti Vidyalaya</h1>
            <p style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '3px', color: '#64748b', marginTop: '5px' }}>OFFICIAL EXAMINATION TIMETABLE & SYLLABUS</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '12px', fontWeight: 'bold' }}>
            <div>
              <p>STUDENT: {studentInfo?.full_name.toUpperCase()}</p>
              <p>CLASS: {studentInfo?.class_name} - {studentInfo?.section}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>ACADEMIC YEAR: 2025-26</p>
              <p>STATUS: OFFICIAL</p>
            </div>
          </div>

          {exams.map(([examName, schedules]) => (
            <div key={examName} style={{ marginBottom: '40px' }}>
              <h3 style={{ backgroundColor: '#a63d93', color: 'white', padding: '8px 15px', fontSize: '14px', borderRadius: '4px', textTransform: 'uppercase' }}>{examName}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fdf2f8' }}>
                    <th style={{ border: '1px solid #e9d1e4', padding: '10px', fontSize: '10px', textAlign: 'left' }}>DATE & TIME</th>
                    <th style={{ border: '1px solid #e9d1e4', padding: '10px', fontSize: '10px', textAlign: 'left' }}>SUBJECT</th>
                    <th style={{ border: '1px solid #e9d1e4', padding: '10px', fontSize: '10px', textAlign: 'left' }}>SYLLABUS / CHAPTERS</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item) => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid #e9d1e4', padding: '10px', fontSize: '10px', width: '150px' }}>
                        <strong>{new Date(item.exam_date).toLocaleDateString()}</strong><br/>
                        {item.start_time.slice(0,5)} | Room: {item.room_no || 'TBA'}
                      </td>
                      <td style={{ border: '1px solid #e9d1e4', padding: '10px', fontSize: '11px', fontWeight: 'bold' }}>{item.subjects?.name}</td>
                      <td style={{ border: '1px solid #e9d1e4', padding: '10px', fontSize: '9px', color: '#475569' }}>
                        {item.syllabus_details?.chapters.join(", ") || "Details Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
            <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '5px' }}>OFFICE SEAL</div>
            <div style={{ borderTop: '1px solid #000', width: '150px', textAlign: 'center', paddingTop: '5px' }}>PRINCIPAL</div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE UI (The screen version) */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-slate-800">
        <div>
           <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Academic Calendar</h2>
           <p className="text-[10px] text-slate-400 font-bold uppercase">View & Download Schedule</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-6 py-3 bg-[#a63d93] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          {isDownloading ? "Preparing PDF..." : <><FiPrinter size={14} /> Get Official Copy</>}
        </button>
      </div>

      {/* This is your original beautiful UI for the screen */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-[#e9d1e4] dark:border-slate-800 overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#a63d93] p-6 md:p-10 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 rounded-3xl border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0 shadow-inner">
               <FiUser size={40} className="opacity-40" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 italic">Examination Plan</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {studentInfo?.full_name}
                </span>
                <span className="bg-white text-[#a63d93] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                  Class {studentInfo?.class_name} — Sec {studentInfo?.section}
                </span>
              </div>
            </div>
          </div>
          <FiCalendar className="absolute right-[-30px] bottom-[-30px] text-white/5 size-64 -rotate-12" />
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-10 space-y-12">
          {exams.map(([examName, schedules]) => (
            <div key={examName} className="relative">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-xs font-black text-[#a63d93] uppercase tracking-[0.4em] whitespace-nowrap">{examName}</h3>
                <div className="h-[2px] w-full bg-gradient-to-r from-pink-100 to-transparent dark:from-slate-800"></div>
              </div>

              <div className="grid gap-6">
                {schedules.map((item: Exam) => (
                  <div key={item.id} className="group grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 border border-pink-50 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:border-[#a63d93] transition-all hover:shadow-xl">
                    
                    {/* Date/Time Block */}
                    <div className="lg:col-span-4 bg-slate-50/50 dark:bg-slate-800/40 p-6 flex items-center gap-6 border-b lg:border-b-0 lg:border-r border-pink-50 dark:border-slate-800">
                      <div className="bg-white dark:bg-slate-900 border-2 border-pink-100 dark:border-slate-700 rounded-2xl p-3 text-center min-w-[70px] shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">{new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-2xl font-black text-[#a63d93] leading-none">{new Date(item.exam_date).getDate()}</p>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase leading-tight mb-2">{item.subjects?.name}</h4>
                        <div className="flex flex-wrap gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                          <span className="flex items-center gap-1.5"><FiClock className="text-[#a63d93]"/> {item.start_time.slice(0, 5)}</span>
                          <span className="flex items-center gap-1.5"><FiMapPin className="text-[#a63d93]"/> {item.room_no || "Room 102"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Syllabus Block */}
                    <div className="lg:col-span-8 p-6">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                           <FiInfo /> Exam Syllabus
                         </span>
                         {item.syllabus_details?.pdf_url && (
                           <button onClick={() => window.open(item.syllabus_details?.pdf_url, '_blank')} className="text-[#a63d93] hover:underline text-[10px] font-black uppercase flex items-center gap-1">
                             Guide PDF <FiExternalLink />
                           </button>
                         )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.syllabus_details?.chapters.map((chapter, idx) => (
                          <span key={idx} className="bg-pink-50/50 dark:bg-slate-800 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-pink-100/50 dark:border-slate-700">
                            {chapter}
                          </span>
                        )) || <span className="text-[10px] italic text-slate-300 font-bold">Curriculum update in progress...</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <footer className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Academic Management System • PRASHANTI VIDYALAYA</p>
        </footer>
      </div>
    </div>
  );
}