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
    <div className="p-4 md:p-10 bg-white min-h-screen font-sans pb-24">

      {/* Action Header - Optimized for Mobile */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight uppercase">Academic Registry</h1>
          <p className="text-[10px] md:text-xs text-brand-light font-bold uppercase tracking-widest opacity-60">Exam Timetable & Schedule</p>
        </div>
        <button
          onClick={downloadImage}
          className="flex items-center justify-center gap-3 px-6 py-3.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all active:scale-95"
        >
          <FiDownload size={16} /> Export Image
        </button>
      </div>

      <div ref={tableRef} className="max-w-5xl mx-auto bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-brand-soft">

        {/* Brand Header - Responsive Layout */}
        <div className="bg-brand p-8 md:p-14 text-white relative">
          <div className="relative z-10">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/30">
                Official Document
              </span>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 gap-8 items-center md:items-end text-center md:text-left">
              <div>
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter leading-none mb-6 uppercase">
                  Schedule<br /><span className="text-brand-soft/50">Statement</span>
                </h2>
                <div className="flex justify-center md:justify-start gap-2">
                  <div className="px-3 py-1.5 bg-brand-dark/40 rounded-lg border border-white/10 text-[10px] font-bold">
                    Class {studentInfo?.class_name}
                  </div>
                  <div className="px-3 py-1.5 bg-brand-dark/40 rounded-lg border border-white/10 text-[10px] font-bold">
                    Section {studentInfo?.section}
                  </div>
                </div>
              </div>

              <div className="w-full md:text-right border-t md:border-t-0 md:border-l border-white/20 pt-6 md:pt-0 md:pl-10">
                <p className="text-brand-soft text-[8px] font-black uppercase tracking-widest mb-1">Student Record</p>
                <h3 className="text-lg md:text-2xl font-bold tracking-tight uppercase truncate">{studentInfo?.full_name}</h3>
                <p className="text-brand-soft/60 text-[10px] mt-1 italic uppercase font-bold">Session 2026-27</p>
              </div>
            </div>
          </div>
          <FiCalendar className="absolute -right-10 -bottom-10 text-white/5 size-40 md:size-64 -rotate-12 pointer-events-none" />
        </div>

        <div className="p-5 md:p-12">
          {exams.length > 0 ? (
            exams.map(([examName, schedules]: any) => (
              <div key={examName} className="mb-12 md:mb-16 last:mb-0">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <span className="text-brand font-black text-[10px] md:text-xs uppercase tracking-[0.3em] whitespace-nowrap">{examName}</span>
                  <div className="h-px flex-1 bg-brand-soft/50"></div>
                </div>

                <div className="space-y-4">
                  {schedules.map((item: any) => (
                    <div key={item.id} className="group flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 hover:border-brand-soft hover:bg-brand-soft/5 transition-all duration-300">

                      {/* Date Block - Horizontal on mobile, Square on desktop */}
                      <div className="flex md:flex-col items-center justify-between md:justify-center w-full md:w-28 h-auto md:h-24 bg-brand-soft/20 rounded-xl md:rounded-2xl p-3 md:p-0 border border-brand-soft/30 group-hover:bg-brand group-hover:text-white transition-all">
                        <span className="text-[10px] font-black uppercase opacity-60 md:mb-1">
                          {new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl md:text-3xl font-black tracking-tighter">
                          {new Date(item.exam_date).getDate()}
                        </span>
                        <span className="hidden md:block text-[8px] font-bold uppercase tracking-widest mt-1 opacity-60">
                          {new Date(item.exam_date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>

                      {/* Info Block */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FiHash className="text-brand text-[10px]" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subject</span>
                        </div>
                        <h4 className="text-lg md:text-2xl font-black text-brand-dark uppercase tracking-tight leading-tight">
                          {item.subjects?.name}
                        </h4>
                      </div>

                      {/* Logistics Block - Grid on Mobile */}
                      <div className="grid grid-cols-2 md:flex gap-4 md:gap-8 py-4 md:py-0 md:pl-8 border-t md:border-t-0 md:border-l border-slate-100">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-[8px] font-black text-brand-light uppercase">
                            <FiClock size={10} /> Time
                          </p>
                          <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-[8px] font-black text-brand-light uppercase">
                            <FiMapPin size={10} /> Venue
                          </p>
                          <p className="text-xs font-bold text-slate-700">
                            Hall {item.room_no || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-brand-accent/10 rounded-3xl border-2 border-dashed border-brand-soft">
              <FiBookOpen size={32} className="mx-auto text-brand-soft/50 mb-3" />
              <h3 className="text-brand-dark text-xs font-black uppercase tracking-widest">No Records Found</h3>
            </div>
          )}

          {/* Footer Notice - Mobile Friendly Flex */}
          <div className="mt-10 p-6 bg-brand-dark rounded-2xl text-white flex flex-col sm:flex-row items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <FiInfo className="text-brand-soft" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-black text-brand-soft uppercase tracking-widest mb-1">Important Regulation</p>
              <p className="text-[9px] leading-relaxed text-brand-accent/70 uppercase font-bold">
                Report 30 mins early. No electronic gadgets. Carry original School ID Card.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Prashanthi School Management • Session 2026-27
          </p>
        </div>
      </div>
    </div>
  );
}