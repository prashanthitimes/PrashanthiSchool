"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiAward, FiFileText } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  async function fetchMarks() {
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
        const { data: asgn } = await supabase
          .from("subject_assignments")
          .select(`*, subjects (id, name)`)
          .eq("class_name", studentData.class_name)
          .eq("section", studentData.section);
        setAssignments(asgn || []);
      }

      const { data: marksData } = await supabase
        .from("exam_marks")
        .select(`*, subjects (id, name), exam_syllabus (exam_name)`)
        .eq("student_id", childId);

      setMarks(marksData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const examNames = useMemo(() => {
    const exams = marks.map(m => m.exam_syllabus?.exam_name).filter(Boolean);
    return Array.from(new Set(exams)).sort();
  }, [marks]);

  const marksMap = useMemo(() => {
    const map: any = {};
    marks.forEach(m => {
      if (!map[m.subject_id]) map[m.subject_id] = {};
      map[m.subject_id][m.exam_syllabus?.exam_name] = m;
    });
    return map;
  }, [marks]);

  const calculateGrade = (obtained: number, total: number) => {
    if (!total || total === 0) return "-";
    const p = (obtained / total) * 100;
    if (p >= 90) return "A+";
    if (p >= 80) return "A";
    if (p >= 65) return "B";
    if (p >= 45) return "C";
    return "D";
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-brand animate-pulse">GENERATING MARKS CARD...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 print:bg-white print:p-0">
      
      {/* --- ACTION BAR (Hidden on Print) --- */}
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/10 rounded-lg text-brand">
            <FiFileText size={24} />
          </div>
          <h2 className="text-slate-800 font-black uppercase tracking-tight text-xl">Academic Transcript</h2>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-brand text-white px-8 py-3 rounded-xl font-black uppercase text-xs hover:bg-brand-dark transition-all shadow-xl shadow-brand/20"
        >
          <FiPrinter /> Print Document
        </button>
      </div>

      {/* --- MARKS CARD CONTENT (Printable Container) --- */}
      <div className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-2xl print:shadow-none print:border-none rounded-[2rem] print:rounded-none overflow-hidden print:w-full print:max-w-none">
        
        {/* TOP HEADER (Hidden on Print) */}
        <div className="bg-brand text-white p-10 text-center border-b-[6px] border-brand-light print:hidden">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-1">Marks Statement</h1>
          <p className="text-brand-soft text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Academic Session 2026 - 2027</p>
        </div>

        <div className="p-8 md:p-12 print:p-4">
          
          {/* STUDENT INFO - Always Visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 print:mb-6">
            {[
              { label: "Student Name", value: student?.full_name },
              { label: "Class & Section", value: `${student?.class_name} - ${student?.section}` },
              { label: "Roll Number", value: `#${student?.roll_number}` },
              { label: "Student ID", value: student?.student_id }
            ].map((item, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 print:bg-transparent print:border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{item.label}</span>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.value || 'N/A'}</p>
              </div>
            ))}
          </div>

          {/* THE TABLE - The core print content */}
          <div className="overflow-hidden border-2 border-slate-900 rounded-xl print:rounded-none">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white print:bg-black">
                  <th className="p-5 text-left text-[10px] font-black uppercase tracking-widest border-r border-white/10">Subject</th>
                  {examNames.map(exam => (
                    <th key={exam} className="p-5 text-center text-[10px] font-black uppercase tracking-widest border-r border-white/10">{exam}</th>
                  ))}
                  <th className="p-5 text-center text-[10px] font-black uppercase bg-brand text-white print:bg-black">Total & Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((asgn) => {
                  const subId = asgn.subjects?.id;
                  let subObt = 0;
                  let subMax = 0;

                  return (
                    <tr key={subId} className="group hover:bg-brand-soft/5 transition-colors">
                      <td className="p-5 font-black text-slate-700 text-xs border-r-2 border-slate-900 uppercase bg-slate-50/50">
                        {asgn.subjects?.name}
                      </td>
                      {examNames.map(exam => {
                        const m = marksMap[subId]?.[exam];
                        if (m) { subObt += m.marks_obtained; subMax += m.total_marks; }
                        return (
                          <td key={exam} className="p-5 text-center border-r border-slate-100">
                            <span className="font-black text-slate-800 text-sm">{m ? m.marks_obtained : '--'}</span>
                          </td>
                        );
                      })}
                      {/* Unified Marks and Grade Column */}
                      <td className="p-5 text-center font-black bg-brand/5 text-brand text-sm print:bg-transparent">
                        <div className="flex flex-col items-center">
                          <span>{subObt} <span className="text-slate-400 font-medium text-[10px]">/ {subMax}</span></span>
                          <span className="text-[10px] text-red-600 italic mt-1">Grade: {calculateGrade(subObt, subMax)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black border-t-2 border-slate-900 print:bg-black">
                <tr>
                  <td className="p-5 text-[10px] uppercase tracking-widest">Grand Totals</td>
                  {examNames.map(exam => {
                    const examTotal = marks
                      .filter(m => m.exam_syllabus?.exam_name === exam)
                      .reduce((sum, m) => sum + m.marks_obtained, 0);
                    return (
                      <td key={exam} className="p-5 text-center text-sm">{examTotal}</td>
                    );
                  })}
                  <td className="p-5 text-center bg-brand text-white text-lg print:bg-black">
                    {marks.reduce((sum, m) => sum + m.marks_obtained, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SIGNATURES (Only visible on print for official look) */}
          <div className="hidden print:grid grid-cols-3 gap-16 mt-20 px-4">
            {["Class Teacher", "Parent Signature", "Principal"].map((sig, i) => (
              <div key={i} className="text-center border-t border-black pt-2">
                <p className="text-[9px] font-black uppercase text-black">{sig}</p>
              </div>
            ))}
          </div>
          
        </div>

        {/* BOTTOM ACCENT (Hidden on Print) */}
        <div className="h-3 bg-brand print:hidden"></div>
      </div>

      <div className="mt-8 text-center print:hidden">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
          <FiAward className="text-brand" /> Official School Management System Document
        </p>
      </div>
    </div>
  );
}