"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiCalendar, FiClock, FiMapPin, FiBookOpen, FiDownload, FiInfo, FiChevronRight } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

export default function ExamTimetable() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const tableRef = useRef(null);

  useEffect(() => {
    fetchExamData();
  }, []);

  async function fetchExamData() {
    try {
      setLoading(true);
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      // 1. Get Student Data
      const { data: student } = await supabase
        .from("students")
        .select("full_name, class_name, section")
        .eq("id", childId)
        .single();

      if (!student) return;
      setStudentInfo(student);

      // Clean formats for matching (e.g., "10th" or "10-A")
      const classRaw = student.class_name;
      const sectionLetter = student.section.split('-').pop()?.trim() || student.section;

      // 2. Fetch Timetable AND Syllabus concurrently
      const [timetableRes, syllabusRes] = await Promise.all([
        supabase
          .from("exam_timetables")
          .select(`*, exams:exam_id (exam_name), subjects:subject_id (name)`)
          .or(`class_name.eq.${classRaw},class_name.eq.${classRaw.replace(/\D/g, '')}-${sectionLetter}`)
          .order("exam_date", { ascending: true }),
        supabase
          .from("exam_syllabus")
          .select("*")
          .eq("class_name", classRaw)
          .eq("section", sectionLetter)
      ]);

      if (timetableRes.error) throw timetableRes.error;

      // 3. Map Syllabus to Timetable rows
      const timetableWithSyllabus = timetableRes.data.map((item: any) => {
        const syllabus = syllabusRes.data?.find(
          (s: any) => s.subject_id === item.subject_id && s.exam_name === item.exams?.exam_name
        );
        return { ...item, syllabus_details: syllabus };
      });

      // 4. Group by Exam Name
      const grouped = timetableWithSyllabus.reduce((acc: any, curr: any) => {
        const examTitle = curr.exams?.exam_name || "Official Examination";
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

  const downloadImage = async () => {
    if (tableRef.current) {
      const canvas = await html2canvas(tableRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `Syllabus_Schedule_${studentInfo?.full_name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-[#a63d93] animate-pulse">GENERATING STUDY PLAN...</div>;

  return (
    <div className="p-4 md:p-10 bg-[#fcfaff] min-h-screen">
      
      <div className="max-w-6xl mx-auto flex justify-end mb-8">
        <button onClick={downloadImage} className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a63d93] shadow-2xl transition-all">
          <FiDownload size={18}/> Download Full Plan
        </button>
      </div>

      <div ref={tableRef} className="max-w-6xl mx-auto bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* TOP BRANDED HEADER */}
        <div className="bg-[#a63d93] p-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-6">Exam & Syllabus</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-2xl">
                <p className="text-[8px] uppercase font-black opacity-60">Academic Year</p>
                <p className="text-xs font-bold uppercase tracking-widest">2026 Season</p>
              </div>
              <div className="bg-white text-[#a63d93] px-6 py-3 rounded-2xl">
                <p className="text-[8px] uppercase font-black opacity-60">Student Name</p>
                <p className="text-xs font-bold uppercase tracking-widest">{studentInfo?.full_name}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md border border-white/30 px-6 py-3 rounded-2xl">
                <p className="text-[8px] uppercase font-black opacity-60">Class / Section</p>
                <p className="text-xs font-bold uppercase tracking-widest">{studentInfo?.class_name} — {studentInfo?.section}</p>
              </div>
            </div>
          </div>
          <FiBookOpen className="absolute right-[-20px] bottom-[-20px] text-white/5 size-80 -rotate-12" />
        </div>

        <div className="p-8 md:p-14">
          {exams.length > 0 ? (
            exams.map(([examName, schedules]: any) => (
              <div key={examName} className="mb-20 last:mb-0">
                <h3 className="text-xs font-black text-[#a63d93] uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                  {examName} <div className="h-px flex-1 bg-pink-100"></div>
                </h3>

                <div className="space-y-8">
                  {schedules.map((item: any) => (
                    <div key={item.id} className="group grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500">
                      
                      {/* Left Side: Schedule (4 Cols) */}
                      <div className="lg:col-span-4 bg-slate-50/50 p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[70px]">
                              <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(item.exam_date).toLocaleDateString('en-US', {month: 'short'})}</p>
                              <p className="text-3xl font-black text-[#a63d93]">{new Date(item.exam_date).getDate()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.exam_date).toLocaleDateString('en-US', {weekday: 'long'})}</p>
                              <h4 className="text-xl font-black text-slate-800 uppercase leading-tight">{item.subjects?.name}</h4>
                           </div>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 text-slate-500">
                              <FiClock className="text-[#a63d93]" size={14}/>
                              <span className="text-xs font-bold uppercase tracking-tighter">{item.start_time.slice(0,5)} — {item.end_time.slice(0,5)}</span>
                           </div>
                           <div className="flex items-center gap-3 text-slate-500">
                              <FiMapPin className="text-[#a63d93]" size={14}/>
                              <span className="text-xs font-bold uppercase tracking-tighter italic">Room {item.room_no || "TBA"}</span>
                           </div>
                        </div>
                      </div>

                      {/* Right Side: Syllabus (8 Cols) */}
                      <div className="lg:col-span-8 bg-white p-8">
                        <div className="flex items-center gap-2 mb-4">
                           <FiInfo className="text-pink-400" size={16} />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapters / Syllabus</span>
                        </div>
                        
                        {item.syllabus_details ? (
                           <div className="flex flex-wrap gap-2">
                              {item.syllabus_details.chapters.map((chapter: string, idx: number) => (
                                 <div key={idx} className="flex items-center gap-2 bg-[#fcfaff] border border-pink-50 px-4 py-3 rounded-xl hover:bg-white hover:border-[#a63d93] transition-all cursor-default">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#a63d93]"></div>
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{chapter}</span>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-slate-300">
                              <p className="text-[10px] font-black uppercase tracking-widest italic text-center">Syllabus update pending from department</p>
                           </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-32 bg-slate-50/50 rounded-[3.5rem] border-2 border-dashed border-slate-100">
               <FiCalendar size={60} className="mx-auto mb-4 text-slate-200" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No academic schedules found</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Prashanthi School Document</p>
           <p className="text-[9px] font-black text-[#a63d93] uppercase tracking-[0.4em]">Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}