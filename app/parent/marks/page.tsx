"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiPrinter, FiAward, FiFileText, FiChevronDown, FiAlertCircle } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initFetch();
  }, []);

  async function initFetch() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      // 1. Fetch Student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .maybeSingle();

      if (studentError) throw studentError;
      setStudent(studentData);

      if (studentData) {
        // --- MATCHING LOGIC ---
        // Converts "10th" to "10", "1st" to "1", etc.
        const cleanClassName = studentData.class_name.replace(/(th|st|nd|rd)/gi, "");
        const matchString = `${cleanClassName}-${studentData.section}`; // Result: "10-A"

        // 2. Fetch Exams - Using simple .contains
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .contains("classes", [matchString]);

        if (examError) console.error("Exam Fetch Error:", examError);

        if (examData && examData.length > 0) {
          setAvailableExams(examData);
          setSelectedExamId(examData[0].id);
        }

        // 3. Fetch Assignments
        const { data: asgn } = await supabase
          .from("subject_assignments")
          .select(`*, subjects (id, name)`)
          .eq("class_name", studentData.class_name)
          .eq("section", studentData.section);
        setAssignments(asgn || []);
      }

      // 4. Fetch Marks - REMOVED !inner to fix the 400 Bad Request error
      const { data: marksData, error: marksError } = await supabase
        .from("exam_marks")
        .select(`
          *,
          subjects (id, name),
          exam_syllabus (
            id, 
            exam_name, 
            exam_id
          )
        `)
        .eq("student_id", childId);

      if (marksError) {
        console.error("Marks Fetch Error:", marksError);
      } else {
        setMarks(marksData || []);
      }

    } catch (err) {
      console.error("Critical System Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredMarksMap = useMemo(() => {
    const map: any = {};
    marks.forEach(m => {
      // Logic: Link marks to the exam through the syllabus table
      if (m.exam_syllabus?.exam_id === selectedExamId) {
        map[m.subject_id] = m;
      }
    });
    return map;
  }, [marks, selectedExamId]);

  const calculateGrade = (obtained: number, total: number) => {
    if (!total || total === 0) return "-";
    const p = (obtained / total) * 100;
    if (p >= 90) return "A+";
    if (p >= 80) return "A";
    if (p >= 65) return "B";
    if (p >= 45) return "C";
    return "D";
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-brand font-black animate-pulse">
      LOADING RESULTS...
    </div>
  );

  return (
    <div className=" bg-slate-50 dark:bg-slate-950 p-3 pb-10">

      {/* HEADER */}
      <div className="max-w-8xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <h2 className="text-slate-800 dark:text-white font-black uppercase tracking-tight text-lg">
          Report Card
        </h2>

        <button
          onClick={() => window.print()}
          className="bg-brand text-white px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase shadow"
        >
          Print
        </button>
      </div>


      {/* SELECT EXAM */}
      <div className="max-w-8xl mx-auto mb-4 print:hidden">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow">

          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block tracking-wider">
            Select Exam
          </label>

          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl appearance-none font-black text-slate-800 dark:text-white outline-none border border-transparent focus:border-brand transition text-sm"
            >

              {availableExams.length > 0 ? (
                availableExams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.exam_name}</option>
                ))
              ) : (
                <option>No Exams Found for Class {student?.class_name}</option>
              )}

            </select>

            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

        </div>
      </div>


      {/* REPORT CARD */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-brand text-white py-6 text-center relative">
          <h1 className="text-xl font-black uppercase tracking-tight">
            Marks Statement
          </h1>

          <FiAward className="absolute right-6 top-1/2 -translate-y-1/2 size-12 opacity-20" />
        </div>


        <div className="p-4 md:p-6">

          {/* STUDENT INFO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">

            {[
              { label: "Student", value: student?.full_name },
              { label: "Class", value: `${student?.class_name}-${student?.section}` },
              { label: "Roll No", value: student?.roll_number },
              { label: "Type", value: availableExams.find(e => e.id === selectedExamId)?.exam_type || "N/A" }
            ].map((item, i) => (

              <div
                key={i}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
              >

                <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">
                  {item.label}
                </span>

                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">
                  {item.value || "---"}
                </p>

              </div>

            ))}

          </div>


          {/* MARKS TABLE */}
          <div className="border border-slate-900 rounded-xl overflow-hidden">

            {/* TABLE HEADER */}
            <div className="grid grid-cols-12 bg-slate-900 text-white p-3 text-[9px] font-black uppercase text-center">

              <div className="col-span-6 text-left">
                Subject
              </div>

              <div className="col-span-3">
                Marks
              </div>

              <div className="col-span-3">
                Grade
              </div>

            </div>


            {/* SUBJECT ROWS */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">

              {assignments.map((asgn) => {

                const subId = asgn.subjects?.id
                const markRecord = filteredMarksMap[subId]

                return (

                  <div
                    key={subId}
                    className="grid grid-cols-12 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >

                    <div className="col-span-6 p-3 font-black text-[11px] uppercase border-r border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      {asgn.subjects?.name}
                    </div>

                    <div className="col-span-3 p-3 text-center border-r border-slate-100 dark:border-slate-800">

                      {markRecord ? (

                        <div className="font-black text-brand text-sm">

                          {markRecord.marks_obtained}

                          <span className="text-[9px] text-slate-400 ml-1">
                            / {markRecord.total_marks}
                          </span>

                        </div>

                      ) : (

                        <span className="text-[8px] font-bold text-slate-300 italic uppercase">
                          Not Posted
                        </span>

                      )}

                    </div>

                    <div className="col-span-3 p-3 text-center font-black text-[10px] text-slate-600 dark:text-slate-400">

                      {markRecord
                        ? calculateGrade(markRecord.marks_obtained, markRecord.total_marks)
                        : "--"}

                    </div>

                  </div>

                )

              })}

            </div>


            {/* TOTAL */}
            <div className="grid grid-cols-12 bg-slate-900 text-white font-black">

              <div className="col-span-6 p-4 text-right text-[9px] uppercase tracking-widest border-r border-white/10">
                Aggregate Total
              </div>

              <div className="col-span-6 p-4 text-center bg-brand text-xl tracking-tight">

                {Object.values(filteredMarksMap).reduce(
                  (sum: number, m: any) => sum + (Number(m.marks_obtained) || 0),
                  0
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}