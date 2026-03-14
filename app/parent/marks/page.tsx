"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiAward, FiDownload, FiUser, FiBookOpen } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

export default function ParentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initFetch();
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

  const downloadImage = async () => {
    if (reportRef.current) {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#f8fafc",
        scale: 2, // Higher quality
      });
      const link = document.createElement("a");
      link.download = `${student?.full_name}_Marksheet.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-brand">LOADING...</div>;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-10">


      <div ref={reportRef} className="max-w-[1400px] mx-auto bg-white dark:bg-slate-900 shadow-2xl md:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800">

        {/* HEADER */}
        <div className="bg-brand p-6 md:p-10 text-white relative">
          <div className="relative z-10">
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter">Academic Performance</h1>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2">
                <FiUser className="opacity-70" />
                <span className="text-xs md:text-sm font-bold uppercase">{student?.full_name}</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2">
                <FiBookOpen className="opacity-70" />
                <span className="text-xs md:text-sm font-bold uppercase">Class {student?.class_name}-{student?.section}</span>
              </div>
              {/* ACTION BAR */}
              <div className="max-w-[1400px] mx-auto p-4 flex justify-end">
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform"
                >
                  <FiDownload /> DOWNLOAD Report Card
                </button>
              </div>
            </div>
          </div>
          <FiAward className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl md:text-9xl opacity-10" />
        </div>

        {/* TABLE CONTAINER */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 md:p-4 text-left text-[10px] uppercase font-black sticky left-0 bg-slate-900 z-20 min-w-[80px] md:min-w-[150px]">
                  Sub
                </th>
                {availableExams.map(ex => (
                  <th key={ex.id} className="p-3 md:p-4 text-center text-[10px] uppercase font-black border-l border-white/10 min-w-[60px]">
                    <span className="md:hidden">{ex.exam_name.substring(0, 2)}</span>
                    <span className="hidden md:inline">{ex.exam_name}</span>
                  </th>
                ))}
                <th className="p-3 md:p-4 text-center text-[10px] uppercase font-black bg-brand min-w-[60px]">
                  Avg
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((asgn) => {
                const subId = asgn.subjects?.id;
                let subjectTotal = 0;
                let examCount = 0;

                return (
                  <tr key={subId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3 md:p-4 font-black text-[10px] md:text-xs uppercase text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">
                      <span className="md:hidden">{asgn.subjects?.name.substring(0, 3)}..</span>
                      <span className="hidden md:inline">{asgn.subjects?.name}</span>
                    </td>

                    {availableExams.map(ex => {
                      const m = getMark(subId, ex.id);
                      if (m) {
                        subjectTotal += (m.marks_obtained / m.total_marks) * 100;
                        examCount++;
                      }

                      return (
                        <td key={ex.id} className="p-3 md:p-4 text-center border-l border-slate-100 dark:border-slate-800">
                          {m ? (
                            <div className="flex flex-col">
                              <span className="font-black text-xs md:text-sm text-slate-900 dark:text-white">{m.marks_obtained}</span>
                              <span className="text-[8px] md:text-[9px] text-slate-400 hidden md:block">/ {m.total_marks}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">--</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-3 md:p-4 text-center bg-slate-50 dark:bg-slate-800/30 font-black text-brand text-xs md:text-sm">
                      {examCount > 0 ? Math.round(subjectTotal / examCount) + "%" : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white uppercase text-[9px] md:text-[10px]">
                <td className="p-3 md:p-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">Total</td>
                {availableExams.map(ex => {
                  const totalForExam = marks
                    .filter(m => m.exam_syllabus?.exam_id === ex.id)
                    .reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
                  return (
                    <td key={ex.id} className="p-3 md:p-4 text-center border-l border-white/20">
                      {totalForExam}
                    </td>
                  );
                })}
                <td className="bg-brand text-white p-3 md:p-4 text-center">---</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* FOOTER INFO (VISIBLE IN DOWNLOAD) */}
        <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            Generated via School Portal • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}