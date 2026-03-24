"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiAward, FiDownload, FiUser, FiBookOpen, FiChevronRight, FiSun, FiMoon } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
export default function ParentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initFetch();
    // Initialize theme based on system preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  async function initFetch() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .maybeSingle();

      setStudent(studentData);

      if (studentData) {
        const cleanClassName = studentData.class_name.replace(/(th|st|nd|rd)/gi, "");
        const matchString = `${cleanClassName}-${studentData.section}`;

        const { data: examData } = await supabase
          .from("exams")
          .select("*")
          .contains("classes", [matchString]);

        setAvailableExams(examData || []);

        const { data: asgn } = await supabase
          .from("subject_assignments")
          .select(`*, subjects (id, name)`)
          .eq("class_name", studentData.class_name)
          .eq("section", studentData.section);
        setAssignments(asgn || []);

        const { data: marksData } = await supabase
          .from("exam_marks")
          .select(`
            *,
            subjects (id, name),
            exam_syllabus (id, exam_id)
          `)
          .eq("student_id", childId);

        setMarks(marksData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getMark = (subjectId: string, examId: string) => {
    return marks.find(m => m.subject_id === subjectId && m.exam_syllabus?.exam_id === examId);
  };

  const getExamChartData = () => {
    if (!availableExams.length || !assignments.length) return [];

    return availableExams.map((exam) => {
      let total = 0;
      let count = 0;

      assignments.forEach((asgn) => {
        const subId = asgn.subjects?.id;
        const m = getMark(subId, exam.id);

        if (m) {
          total += (m.marks_obtained / m.total_marks) * 100;
          count++;
        }
      });

      return {
        name: exam.exam_name,
        value: count > 0 ? Math.round(total / count) : 0,
      };
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const downloadImage = async () => {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${student?.full_name}_Marksheet.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-soft/20 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand font-black text-[10px] uppercase tracking-widest">Building Report Card...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 font-sans bg-slate-50 dark:bg-slate-950 transition-colors duration-500">

      {/* 1. TOP RESPONSIVE ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-brand-soft dark:border-slate-800 p-4 sticky top-0 z-[60] shadow-sm max-w-7xl mx-auto md:mt-4 md:rounded-2xl flex justify-between items-center transition-colors">
        <div className="flex items-center gap-3">

          <div className="hidden sm:block">
            <h2 className="text-[10px] font-black text-brand uppercase leading-none">Student Portal</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Academic Records</p>
          </div>
        </div>

        <button
          onClick={downloadImage}
          className="bg-brand text-white px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all text-[10px] font-black uppercase flex items-center gap-2"
        >
          <FiDownload /> <span className="hidden sm:inline">Save Image</span>
        </button>
      </div>

      {/* 2. THE MAIN REPORT CARD CONTAINER */}
      <div
        ref={reportRef}
        className="max-w-md md:max-w-7xl mx-auto bg-white dark:bg-slate-900 overflow-hidden shadow-2xl mt-6 md:rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors"
      >

        {/* BRANDED HEADER SECTION */}
        <div className="bg-brand p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4 italic underline decoration-brand-light/30">Result Analysis</h1>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-brand-light/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <FiUser size={12} className="text-brand-soft" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{student?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 bg-brand-light/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <FiBookOpen size={12} className="text-brand-soft" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Class {student?.class_name}-{student?.section}</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black uppercase opacity-60">Session</p>
              <p className="text-2xl font-black tracking-tighter">2025 - 2026</p>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -right-10 -top-10 w-60 h-60 bg-brand-light rounded-full opacity-10"></div>
          <FiAward className="absolute right-10 bottom-10 text-9xl opacity-10 hidden md:block" />
        </div>

        {/* 3. RESPONSIVE HYBRID TABLE */}
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                {/* STICKY SUBJECT (Left side) */}
                <th className="p-4 md:p-6 text-left text-[10px] md:text-xs uppercase font-black sticky left-0 bg-slate-900 z-50 min-w-[140px] md:min-w-[200px] shadow-[4px_0_10px_rgba(0,0,0,0.3)] border-b border-white/5">
                  Subject
                </th>

                {/* SCROLLABLE EXAMS */}
                {availableExams.map(ex => (
                  <th key={ex.id} className="p-4 text-center text-[9px] md:text-[11px] uppercase font-black border-l border-white/5 whitespace-nowrap min-w-[100px] border-b border-white/5">
                    {ex.exam_name}
                  </th>
                ))}

                {/* STICKY AVERAGE (Right side) */}
                <th className="p-4 text-center text-[10px] md:text-xs uppercase font-black bg-brand sticky right-0 z-50 min-w-[80px] md:min-w-[100px] shadow-[-4px_0_10px_rgba(0,0,0,0.2)] border-b border-brand-light">
                  Average
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-soft/20 dark:divide-slate-800">
              {assignments.map((asgn, idx) => {
                const subId = asgn.subjects?.id;
                let subjectTotal = 0;
                let examCount = 0;

                return (
                  <tr key={subId} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-brand-soft/5 dark:bg-slate-800/30'} hover:bg-brand-soft/10 dark:hover:bg-brand/10 transition-all`}>

                    {/* STICKY SUBJECT NAME */}
                    <td className="p-4 md:p-6 font-black text-[11px] md:text-sm uppercase text-slate-800 dark:text-slate-200 sticky left-0 bg-inherit z-40 border-r border-brand-soft/10 dark:border-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-5 bg-brand rounded-full"></div>
                        {asgn.subjects?.name}
                      </div>
                    </td>

                    {/* DYNAMIC MARKS */}
                    {availableExams.map(ex => {
                      const m = getMark(subId, ex.id);
                      if (m) {
                        subjectTotal += (m.marks_obtained / m.total_marks) * 100;
                        examCount++;
                      }

                      return (
                        <td key={ex.id} className="p-4 text-center border-l border-brand-soft/10 dark:border-slate-800">
                          {m ? (
                            <div className="flex flex-col items-center">
                              <span className="font-black text-sm md:text-lg text-slate-900 dark:text-white leading-none">{m.marks_obtained}</span>
                              <div className="w-4 h-[1px] bg-slate-200 dark:bg-slate-700 my-1"></div>
                              <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{m.total_marks}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-black opacity-10 dark:opacity-20">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* STICKY AVERAGE PERCENTAGE */}
                    <td className="p-4 text-center bg-brand-soft dark:bg-brand/20 font-black text-brand dark:text-brand-light text-sm md:text-lg sticky right-0 z-40 shadow-[-4px_0_8px_rgba(0,0,0,0.04)] border-l border-brand-soft dark:border-brand/30 backdrop-blur-sm">
                      {examCount > 0 ? Math.round(subjectTotal / examCount) + "%" : "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>


        </div>


        {/* 📊 EXAM PERFORMANCE GRAPH */}
        <div className="p-4 sm:p-6 md:p-10 bg-white dark:bg-slate-900 border-t border-brand-soft dark:border-slate-800">

          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-center mb-4 sm:mb-6 text-slate-800 dark:text-white">
            Exam Performance Overview
          </h2>

          <div className="w-full h-[260px] sm:h-[320px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getExamChartData()}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

                {/* ✅ MOBILE FRIENDLY X AXIS */}
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />

                {/* ✅ CLEAN Y AXIS */}
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  width={30}
                />

                {/* ✅ BETTER TOOLTIP */}
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />

                {/* ✅ RESPONSIVE BAR SIZE */}
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  barSize={window.innerWidth < 640 ? 18 : 30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* 4. FOOTER INFO */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-brand-soft/20 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[9px] md:text-[11px] text-slate-400 dark:text-slate-500 font-black tracking-[0.4em] uppercase text-center md:text-left">
              Verified Digital Certificate • Academic Performance Dashboard
            </p>
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-[9px] font-black text-brand animate-pulse uppercase">Swipe to see all exams</span>
              <FiChevronRight className="text-brand animate-bounce-x" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-x {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-bounce-x {
          animation: bounce-x 1s infinite;
        }
        /* Custom scrollbar for better look */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}