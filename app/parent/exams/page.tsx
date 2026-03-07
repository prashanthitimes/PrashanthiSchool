"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiCalendar, FiClock, FiMapPin, FiBookOpen, FiDownload, FiInfo, FiHash, FiArrowRight } from "react-icons/fi";
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

      const { data: student } = await supabase
        .from("students")
        .select("full_name, class_name, section")
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

  const downloadImage = async () => {
    if (tableRef.current) {
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const link = document.createElement("a");
      link.download = `Exam_Schedule_${studentInfo?.full_name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4"></div>
      <p className="text-brand text-xs font-black uppercase tracking-widest animate-pulse">Syncing Schedule...</p>
    </div>
  );

  return (
  <div className="p-4 md:p-10 bg-[#fffcfd] dark:bg-slate-950 min-h-screen font-sans pb-24 transition-colors duration-300">

    {/* Action Header - Optimized for Mobile */}
    <div className="max-w-8xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="text-left">
        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
          Exam Schedule
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Academic Year 2026-27</p>
      </div>
      
      <button
        onClick={downloadImage}
        className="flex items-center justify-center gap-3 px-6 py-3 bg-brand dark:bg-brand-soft text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all active:scale-95"
      >
        <FiDownload size={14} /> Export Image
      </button>
    </div>

    {/* Main Schedule Card */}
    <div ref={tableRef} className="max-w-8xl mx-auto bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2.5rem] shadow-xl overflow-hidden border border-[#e9d1e4] dark:border-slate-800">

      {/* Brand Header - High Contrast */}
      <div className="bg-brand dark:bg-slate-800/80 p-5 md:p-8 text-white relative">
        <div className="relative z-10">
          <div className="flex items-center justify-start gap-2 mb-3">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-white/20">
              Official Statement
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-none mb-3 uppercase">
                Schedule <span className="opacity-50">Report</span>
              </h2>
              <div className="flex gap-2">
                <div className="px-2.5 py-1 bg-black/20 rounded-md border border-white/10 text-[9px] font-bold">
                  Class {studentInfo?.class_name}
                </div>
                <div className="px-2.5 py-1 bg-black/20 rounded-md border border-white/10 text-[9px] font-bold">
                  Section {studentInfo?.section}
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <p className="text-brand-soft/80 text-[8px] font-black uppercase tracking-widest mb-1">Student Name</p>
              <h3 className="text-lg md:text-xl font-bold tracking-tight uppercase truncate text-white">
                {studentInfo?.full_name}
              </h3>
              <p className="text-white/40 text-[8px] mt-1 italic uppercase font-bold">ID: {studentInfo?.id || '2026-REG-01'}</p>
            </div>
          </div>
        </div>
        <FiCalendar className="absolute -right-4 -bottom-4 text-white/5 size-24 md:size-40 -rotate-12 pointer-events-none" />
      </div>

      {/* Content Area */}
      <div className="p-4 md:p-8 bg-white dark:bg-slate-900">
        {exams.length > 0 ? (
          exams.map(([examName, schedules]: any) => (
            <div key={examName} className="mb-8 last:mb-0">
              
              {/* Exam Category Divider */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-brand dark:text-brand-soft font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                  {examName}
                </span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>

              {/* Subject List */}
              <div className="space-y-3">
                {schedules.map((item: any) => (
                  <div
                    key={item.id}
                    className="group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-4 rounded-2xl border border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20 hover:border-brand/30 dark:hover:border-brand-soft/30 transition-all"
                  >
                    {/* Date Block - Mobile Row / Desktop Square */}
                    <div className="flex md:flex-col items-center justify-between md:justify-center w-full md:w-20 h-auto md:h-16 bg-white dark:bg-slate-800 rounded-xl p-3 md:p-0 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:bg-brand dark:group-hover:bg-brand-soft transition-all">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 group-hover:text-white/70 dark:group-hover:text-slate-900/70">
                        {new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-black tracking-tighter text-slate-800 dark:text-slate-100 group-hover:text-white dark:group-hover:text-slate-950">
                        {new Date(item.exam_date).getDate()}
                      </span>
                      <span className="hidden md:block text-[7px] font-bold uppercase opacity-60 group-hover:text-white/70 dark:group-hover:text-slate-900/70">
                        {new Date(item.exam_date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Subject Info */}
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Subject Name</p>
                      <h4 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase leading-tight">
                        {item.subjects?.name}
                      </h4>
                    </div>

                    {/* Logistics - Responsive Grid */}
                    <div className="grid grid-cols-2 md:flex gap-6 md:gap-8 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-8">
                      <div>
                        <p className="flex items-center gap-1.5 text-[8px] font-black text-brand dark:text-brand-soft uppercase mb-1">
                          <FiClock size={10} /> Time
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                          {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-[8px] font-black text-brand dark:text-brand-soft uppercase mb-1">
                          <FiMapPin size={10} /> Venue
                        </p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Room {item.room_no || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <FiBookOpen size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">No Exam Records</h3>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white flex flex-col sm:flex-row items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <FiInfo className="text-brand-soft" size={16} />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-black text-brand-soft uppercase tracking-widest mb-0.5">Examination Conduct Rules</p>
            <p className="text-[9px] text-slate-400 uppercase font-bold leading-tight">
              Arrival: 30m prior. Required: Valid School ID Card. Prohibited: All smart devices & bags.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 text-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
          Prashanti Vidyalaya • Digital Academic Portal • 2026
        </p>
      </div>
    </div>
  </div>
);
}