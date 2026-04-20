"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FiCalendar, FiClock, FiMapPin, FiBookOpen, 
  FiDownload, FiInfo, FiFileText, FiExternalLink, FiUser 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

type Student = {
  full_name: string;
  class_name: string;
  section: string;
  image_url?: string;
};

type Syllabus = {
  id: string | number;
  subject_id: string | number;
  exam_name: string;
  chapters: string[];
  pdf_url?: string;
};

type Exam = {
  id: string | number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no?: string;
  subjects?: { name: string };
  exams?: { exam_name: string };
  syllabus_details?: Syllabus;
};

type ExamGroup = [string, Exam[]];

export default function ExamTimetable() {
  const [exams, setExams] = useState<ExamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);

  useEffect(() => {
    fetchExamData();
  }, []);

  async function fetchExamData() {
    try {
      setLoading(true);
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      // 1. Fetch Student with Photo
      const { data: student } = await supabase
        .from("students")
        .select("full_name, class_name, section, image_url")
        .eq("id", childId)
        .single();

      if (!student) return;
      setStudentInfo(student);

      const classRaw = student.class_name;
      const sectionLetter = student.section.split('-').pop()?.trim() || student.section;

      // 2. Fetch Timetable and Syllabus (including pdf_url)
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

      const timetableWithSyllabus = timetableRes.data.map((item: any) => {
        const syllabus = syllabusRes.data?.find(
          (s: any) => s.subject_id === item.subject_id && s.exam_name === item.exams?.exam_name
        );
        return { ...item, syllabus_details: syllabus };
      });

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
      const canvas = await html2canvas(tableRef.current, { 
        scale: 2, 
        backgroundColor: "#ffffff",
        useCORS: true // Allows downloading external images (profile photos)
      });
      const link = document.createElement("a");
      link.download = `Exam_Plan_${studentInfo?.full_name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-[#a63d93] animate-pulse">LOADING ACADEMIC PLAN...</div>;

  return (
    <div className="p-3 md:p-6 bg-[#fffcfd] dark:bg-slate-950 min-h-screen">
      
      <div className="max-w-7xl mx-auto flex justify-end mb-4">
        <button
          onClick={downloadImage}
          className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a63d93] transition shadow-lg"
        >
          <FiDownload size={14} /> Download Schedule
        </button>
      </div>

      <div ref={tableRef} className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-[#e9d1e4] dark:border-slate-800 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#a63d93] p-6 md:p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            
            {/* Student Photo */}
            <div className="w-24 h-24 rounded-2xl border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
              
                <FiUser size={32} className="opacity-40" />
             
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-3">Exam Syllabus</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  {studentInfo?.full_name}
                </span>
                <span className="bg-white text-[#a63d93] px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  Class: {studentInfo?.class_name} — {studentInfo?.section}
                </span>
              </div>
            </div>
          </div>
          <FiBookOpen className="absolute right-[-20px] bottom-[-20px] text-white/5 size-48 -rotate-12" />
        </div>

        {/* EXAM LIST */}
        <div className="p-4 md:p-8 space-y-10">
          {exams.map(([examName, schedules]) => (
            <div key={examName}>
              <h3 className="text-[10px] font-black text-[#a63d93] uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                {examName} <div className="h-px flex-1 bg-pink-50 dark:bg-slate-800"></div>
              </h3>

              <div className="space-y-4">
                {schedules.map((item: Exam) => (
                  <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 border border-[#e9d1e4] dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-md transition">
                    
                    {/* Time/Subject Info */}
                    <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/40 p-5 border-b lg:border-b-0 lg:border-r border-[#e9d1e4] dark:border-slate-800">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white dark:bg-slate-900 border border-[#e9d1e4] rounded-xl p-2 text-center min-w-[60px]">
                          <p className="text-[8px] font-black text-slate-400 uppercase">{new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short' })}</p>
                          <p className="text-xl font-black text-[#a63d93]">{new Date(item.exam_date).getDate()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">{new Date(item.exam_date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                          <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase">{item.subjects?.name}</h4>
                        </div>
                      </div>
                      <div className="flex gap-4 text-slate-400 text-[9px] font-black uppercase">
                        <span className="flex items-center gap-1"><FiClock /> {item.start_time.slice(0, 5)}</span>
                        <span className="flex items-center gap-1"><FiMapPin /> {item.room_no || "TBA"}</span>
                      </div>
                    </div>

                    {/* Syllabus & PDF */}
                    <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <FiInfo size={12} className="text-[#a63d93]" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Chapters</span>
                        </div>
                        
                        {/* PDF View Button */}
                        {item.syllabus_details?.pdf_url && (
                          <button 
                            onClick={() => window.open(item.syllabus_details?.pdf_url, '_blank')}
                            className="flex items-center gap-2 bg-pink-50 hover:bg-[#a63d93] text-[#a63d93] hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-pink-100"
                          >
                            <FiFileText size={12} /> View Full PDF <FiExternalLink size={10} />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.syllabus_details?.chapters.map((chapter, idx) => (
                          <span key={idx} className="bg-[#fcfaff] dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-pink-50 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                            {chapter}
                          </span>
                        )) || <p className="text-[9px] text-slate-300 uppercase font-bold italic">Syllabus details pending</p>}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Prashanti Vidyalaya Portal</p>
        </footer>
      </div>
    </div>
  );
}