"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiCalendar, FiClock, FiMapPin, FiBookOpen, FiDownload, FiInfo, FiChevronRight } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";
type Schedule = {
  id: string | number
  title: string
  date: string
  teacher: string
}
type Student = {
  full_name: string
  class_name: string
  section: string
}

type Syllabus = {
  id: string | number
  subject_id: string | number
  exam_name: string
  chapters: string[]
  class_name: string
  section: string
}

type Exam = {
  id: string | number
  exam_date: string
  start_time: string
  end_time: string
  room_no?: string
  subjects?: {
    name: string
  }
  exams?: {
    exam_name: string
  }
  syllabus_details?: Syllabus
}

type ExamGroup = [string, Exam[]] // [examName, schedules]
export default function ExamTimetable() {
  const [exams, setExams] = useState<ExamGroup[]>([])
  const [loading, setLoading] = useState(true)
  const tableRef = useRef<HTMLDivElement>(null)
  const [studentInfo, setStudentInfo] = useState<Student | null>(null)
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
    <div className="p-3 md:p-6 bg-[#fffcfd] dark:bg-slate-950 ">

      {/* Action Bar */}
      <div className="max-w-8xl mx-auto flex justify-end mb-4 md:mb-6">
        <button
          onClick={downloadImage}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#a63d93] transition"
        >
          <FiDownload size={14} /> Download Plan
        </button>
      </div>

      <div
        ref={tableRef}
        className="max-w-8xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-[#e9d1e4] dark:border-slate-800 overflow-hidden"
      >

        {/* HEADER */}
        <div className="bg-[#a63d93] p-5 md:p-7 text-white relative overflow-hidden">
          <div className="relative z-10">

            <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase mb-3">
              Exam Syllabus
            </h2>

            <div className="flex flex-col md:flex-row gap-2 md:gap-3">

              <div className="bg-white/20 border border-white/30 px-3 py-1.5 rounded-lg">
                <p className="text-[7px] uppercase font-black opacity-60">Academic Year</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">2026 Season</p>
              </div>

              <div className="bg-white text-[#a63d93] px-3 py-1.5 rounded-lg">
                <p className="text-[7px] uppercase font-black opacity-60">Student</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {studentInfo?.full_name}
                </p>
              </div>

              <div className="bg-white/20 border border-white/30 px-3 py-1.5 rounded-lg">
                <p className="text-[7px] uppercase font-black opacity-60">Class</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  {studentInfo?.class_name} — {studentInfo?.section}
                </p>
              </div>

            </div>
          </div>

          <FiBookOpen className="absolute right-[-20px] bottom-[-20px] text-white/5 size-28 md:size-48 -rotate-12" />
        </div>


        {/* CONTENT */}
        <div className="p-4 md:p-6">

          {exams.length > 0 ? (
            exams.map(([examName, schedules]) => (

              <div key={examName} className="mb-8 md:mb-10">

                {/* Section Header */}
                <h3 className="text-[9px] md:text-[10px] font-black text-[#a63d93] dark:text-brand-soft uppercase tracking-[0.25em] mb-4 flex items-center gap-3">
                  <span>{examName}</span>
                  <div className="h-px flex-1 bg-pink-100 dark:bg-slate-800"></div>
                </h3>

                <div className="space-y-4">

                  {schedules.map((item: Exam) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 lg:grid-cols-12 border border-[#e9d1e4] dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition"
                    >

                      {/* LEFT INFO */}
                      <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/50 p-4 border-b lg:border-b-0 lg:border-r border-[#e9d1e4] dark:border-slate-800">

                        <div className="flex items-center gap-3 mb-3">

                          <div className="bg-white dark:bg-slate-900 border border-[#e9d1e4] dark:border-slate-800 rounded-lg text-center px-3 py-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase">
                              {new Date(item.exam_date).toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className="text-xl font-black text-[#a63d93] dark:text-brand-soft">
                              {new Date(item.exam_date).getDate()}
                            </p>
                          </div>

                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              {new Date(item.exam_date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>

                            <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase">
                              {item.subjects?.name}
                            </h4>
                          </div>

                        </div>

                        <div className="flex gap-4 text-slate-400">

                          <div className="flex items-center gap-1">
                            <FiClock size={12} />
                            <span className="text-[9px] font-bold uppercase">
                              {item.start_time.slice(0, 5)} — {item.end_time.slice(0, 5)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <FiMapPin size={12} />
                            <span className="text-[9px] font-bold uppercase">
                              Room {item.room_no || "TBA"}
                            </span>
                          </div>

                        </div>

                      </div>


                      {/* SYLLABUS */}
                      <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4">

                        <div className="flex items-center gap-2 mb-3">
                          <FiInfo className="text-pink-400" size={12} />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Chapters
                          </span>
                        </div>

                        {item.syllabus_details ? (

                          <div className="flex flex-wrap gap-2">

                            {item.syllabus_details.chapters.map((chapter, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-[#fcfaff] dark:bg-slate-800 border border-pink-50 dark:border-slate-700 px-2 py-1 rounded-lg"
                              >

                                <div className="w-1 h-1 rounded-full bg-[#a63d93]"></div>

                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                                  {chapter}
                                </span>

                              </div>
                            ))}

                          </div>

                        ) : (

                          <div className="text-center py-6 text-slate-400 text-[9px] font-bold uppercase">
                            Syllabus update pending
                          </div>

                        )}

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            ))
          ) : (

            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-[#e9d1e4] dark:border-slate-800">
              <FiCalendar size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                No schedules found
              </p>
            </div>

          )}

        </div>


        {/* FOOTER */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-[#e9d1e4] dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-2">

          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">
            Official Prashanti Vidyalaya & High School
          </p>

          <p className="text-[8px] font-black text-[#a63d93] dark:text-brand-soft uppercase tracking-[0.25em]">
            Generated: {new Date().toLocaleDateString()}
          </p>

        </div>

      </div>

    </div>
  )
}