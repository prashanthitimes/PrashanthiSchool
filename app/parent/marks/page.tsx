"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiAward, FiDownload, FiUser, FiBookOpen, FiChevronRight } from "react-icons/fi";
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
  const reportRef = useRef<HTMLDivElement>(null);
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(window.innerWidth < 640);
}, []);

  useEffect(() => {
    initFetch();


  }, []);

 useEffect(() => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    // Use saved theme
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  } else {
    // Optional fallback (ONLY if you want system theme initially)
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }
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
          .select(`*, subjects (id, name)`)
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
    return marks.find(m => m.subject_id === subjectId && m.exam_id === examId);
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

  const downloadImage = async () => {
    if (reportRef.current) {
      // Check current mode for canvas background
      const isDark = document.documentElement.classList.contains('dark');
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
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
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand font-black text-[10px] uppercase tracking-widest">Building Report Card...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 font-sans bg-slate-50 dark:bg-slate-950 transition-colors">

      {/* 1. TOP ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 top-0 z-[100] shadow-sm max-w-7xl mx-auto md:mt-4 md:rounded-2xl flex justify-between items-center transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
            <FiAward className="text-brand" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-brand uppercase leading-none">Student Portal</h2>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Academic Records</p>
          </div>
        </div>

        <button
          onClick={downloadImage}
          className="bg-brand text-white px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all text-[10px] font-black uppercase flex items-center gap-2"
        >
          <FiDownload /> <span>Save Image</span>
        </button>
      </div>

      {/* 2. THE MAIN REPORT CARD CONTAINER */}
      <div
        ref={reportRef}
        className="max-w-[100vw] md:max-w-7xl mx-auto bg-white dark:bg-slate-900 overflow-hidden shadow-2xl mt-6 md:rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors"
      >
        {/* BRANDED HEADER */}
        <div className="bg-brand p-6 md:p-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-4 italic underline decoration-white/30">Result Analysis</h1>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <FiUser size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{student?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <FiBookOpen size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Class {student?.class_name}-{student?.section}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-black uppercase opacity-60 leading-none">Session</p>
              <p className="text-xl md:text-2xl font-black tracking-tighter">2025 - 2026</p>
            </div>
          </div>
        </div>

        {/* 3. SCROLLABLE TABLE AREA */}
        <div className="relative">
          <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  {/* Sticky Subject Header */}
                  <th className="p-4 md:p-6 text-left text-[10px] md:text-xs uppercase font-black sticky left-0 bg-slate-900 z-30 min-w-[140px] md:min-w-[200px] border-b border-white/5 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                    Subject
                  </th>

                  {availableExams.map(ex => (
                    <th key={ex.id} className="p-4 text-center text-[9px] md:text-[11px] uppercase font-black border-l border-white/5 border-b border-white/5">
                      {ex.exam_name}
                    </th>
                  ))}

                  {/* Sticky Average Header */}
                  <th className="p-4 text-center text-[10px] md:text-xs uppercase font-black bg-brand sticky right-0 z-30 min-w-[80px] md:min-w-[100px] border-b border-white/5 shadow-[-2px_0_5px_rgba(0,0,0,0.2)]">
                    Avg
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.map((asgn, idx) => {
                  const subId = asgn.subjects?.id;
                  let subjectTotal = 0;
                  let examCount = 0;

                  return (
                    <tr key={subId} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/20'} transition-colors`}>
                      {/* Sticky Subject Cell */}
                      <td className="p-4 md:p-6 font-black text-[11px] md:text-sm uppercase text-slate-800 dark:text-slate-200 sticky left-0 bg-inherit z-20 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-brand rounded-full shrink-0"></div>
                          <span className="truncate">{asgn.subjects?.name}</span>
                        </div>
                      </td>

                      {availableExams.map(ex => {
                        const m = getMark(subId, ex.id);
                        if (m) {
                          subjectTotal += (m.marks_obtained / m.total_marks) * 100;
                          examCount++;
                        }
                        return (
                          <td key={ex.id} className="p-4 text-center">
                            {m ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-black text-sm md:text-lg text-slate-900 dark:text-white leading-none">{m.marks_obtained}</span>
                                <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-700 my-1"></div>
                                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">{m.total_marks}</span>
                              </div>
                            ) : (
                              <span className="opacity-10">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Sticky Average Cell */}
                      <td className="p-4 text-center bg-brand/5 dark:bg-brand/10 font-black text-brand dark:text-brand-light text-sm md:text-lg sticky right-0 z-20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] backdrop-blur-sm">
                        {examCount > 0 ? Math.round(subjectTotal / examCount) + "%" : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Swipe Indicator for mobile */}
          <div className="flex md:hidden items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50">
            <FiChevronRight className="text-brand animate-bounce-x" />
            <span className="text-[9px] font-black uppercase text-slate-500">Swipe table for more</span>
          </div>
        </div>

        {/* 📊 CHART SECTION */}
        <div className="p-6 md:p-10 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-lg md:text-2xl font-black text-center mb-8 text-slate-800 dark:text-white uppercase tracking-tight">
            Performance Trend
          </h2>
          <div className="w-full h-[280px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getExamChartData()} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="value"
                  fill="#7c3aed"
                  radius={[6, 6, 0, 0]}
                  barSize={isMobile ? 25 : 45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-[0.3em] uppercase text-center">
            Digital Marksheet • Prashanti Vidyalaya Official Records
          </p>
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
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Prevent scroll chaining on mobile table */
        .overflow-x-auto {
          overscroll-behavior-x: contain;
        }
      `}</style>
    </div>
  );
}