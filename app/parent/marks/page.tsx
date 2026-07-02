"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiAward, FiDownload, FiUser, FiBookOpen, FiChevronRight, FiPrinter } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
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
  const [isDownloading, setIsDownloading] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const printTemplateRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    initFetch();

    // Theme Sync
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  async function initFetch() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const { data: studentData } = await supabase.from("students").select("*").eq("id", childId).maybeSingle();
      setStudent(studentData);

      if (studentData) {
        const cleanClassName = studentData.class_name.replace(/(th|st|nd|rd)/gi, "");
        const matchString = `${cleanClassName}-${studentData.section}`;

        const { data: examData } = await supabase.from("exams").select("*").contains("classes", [matchString]);
        setAvailableExams(examData || []);

        const { data: asgn } = await supabase.from("subject_assignments").select(`*, subjects (id, name)`).eq("class_name", studentData.class_name).eq("section", studentData.section);
        setAssignments(asgn || []);

        const { data: marksData } = await supabase.from("exam_marks").select(`*, subjects (id, name)`).eq("student_id", childId);
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

  const downloadOfficialCard = async () => {
    if (!printTemplateRef.current) return;
    setIsDownloading(true);

    const element = printTemplateRef.current;
    element.style.display = "block";

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    element.style.display = "none";

    const dataUrl = canvas.toDataURL("image/png");
    const fileName = `Official_Marks_Card_${student?.full_name || "student"}.png`;

    if (Capacitor.isNativePlatform()) {
      // Running inside the APK -> use native filesystem + share sheet
      try {
        const base64Data = dataUrl.split(",")[1];

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache, // writable without special permission
        });

        // Opens Android's native "Save to / Share" sheet
        // user can pick "Save to Downloads", WhatsApp, Drive, etc.
        await Share.share({
          title: "Marks Card",
          text: "Official Marks Card",
          url: savedFile.uri,
          dialogTitle: "Save or Share Marks Card",
        });
      } catch (err) {
        console.error("Native save failed:", err);
        alert("Could not save file: " + err);
      }
    } else {
      // Running in a normal browser -> old behavior works fine
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    }

    setIsDownloading(false);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-brand font-black text-[10px] uppercase tracking-widest">Generating Report...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 font-sans bg-slate-50 dark:bg-slate-950 transition-colors">

      {/* --- HIDDEN PRINT TEMPLATE (This is what downloads) --- */}
      <div
        ref={printTemplateRef}
        style={{ display: 'none', width: '800px', padding: '60px', backgroundColor: 'white' }}
      >
        <div style={{ border: '12px double #1e293b', padding: '40px', position: 'relative' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>Prashanti Vidyalaya</h1>
            <p style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', color: '#64748b' }}>OFFICIAL ACADEMIC PROGRESS REPORT</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            <div style={{ fontSize: '12px' }}><strong>STUDENT:</strong> {student?.full_name?.toUpperCase()}</div>
            <div style={{ fontSize: '12px' }}><strong>CLASS:</strong> {student?.class_name}-{student?.section}</div>
            <div style={{ fontSize: '12px' }}><strong>ACADEMIC YEAR:</strong> 2025-2026</div>
            <div style={{ fontSize: '12px' }}><strong>DATE:</strong> {new Date().toLocaleDateString()}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left', fontSize: '11px' }}>SUBJECT</th>
                {availableExams.map(ex => (
                  <th key={ex.id} style={{ border: '1px solid #000', padding: '10px', fontSize: '11px' }}>{ex.exam_name}</th>
                ))}
                <th style={{ border: '1px solid #000', padding: '10px', fontSize: '11px' }}>AVG %</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(asgn => {
                let total = 0, count = 0;
                return (
                  <tr key={asgn.subjects?.id}>
                    <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold', fontSize: '11px' }}>{asgn.subjects?.name}</td>
                    {availableExams.map(ex => {
                      const m = getMark(asgn.subjects?.id, ex.id);
                      if (m) { total += (m.marks_obtained / m.total_marks) * 100; count++; }
                      return (
                        <td key={ex.id} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '11px' }}>
                          {m ? `${m.marks_obtained}/${m.total_marks}` : '-'}
                        </td>
                      );
                    })}
                    <td style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: '900', fontSize: '11px' }}>
                      {count > 0 ? Math.round(total / count) + "%" : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', width: '150px', borderTop: '1px solid #000', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold' }}>CLASS TEACHER</div>
            <div style={{ textAlign: 'center', width: '150px', borderTop: '1px solid #000', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold' }}>PRINCIPAL</div>
          </div>
        </div>
      </div>

      {/* --- DASHBOARD VIEW (What the user sees) --- */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-[100] shadow-sm max-w-7xl mx-auto md:mt-4 md:rounded-2xl flex justify-between items-center transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
            <FiAward className="text-brand" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-brand uppercase leading-none">Student Portal</h2>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Interactive Dashboard</p>
          </div>
        </div>

        <button
          onClick={downloadOfficialCard}
          disabled={isDownloading}
          className="bg-brand text-white px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all text-[10px] font-black uppercase flex items-center gap-2"
        >
          {isDownloading ? "Generating..." : <><FiDownload /> <span>Official Marks Card</span></>}
        </button>
      </div>

      <div className="max-w-[100vw] md:max-w-7xl mx-auto bg-white dark:bg-slate-900 overflow-hidden shadow-2xl mt-6 md:rounded-3xl border border-slate-100 dark:border-slate-800 transition-colors">
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

        {/* INTERACTIVE TABLE */}
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-4 md:p-6 text-left text-[10px] md:text-xs uppercase font-black sticky left-0 bg-slate-900 z-30 min-w-[140px] md:min-w-[200px]">Subject</th>
                  {availableExams.map(ex => (
                    <th key={ex.id} className="p-4 text-center text-[9px] md:text-[11px] uppercase font-black border-l border-white/5">{ex.exam_name}</th>
                  ))}
                  <th className="p-4 text-center text-[10px] md:text-xs uppercase font-black bg-brand sticky right-0 z-30">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.map((asgn, idx) => {
                  const subId = asgn.subjects?.id;
                  let subjectTotal = 0;
                  let examCount = 0;
                  return (
                    <tr key={subId} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/20'}`}>
                      <td className="p-4 md:p-6 font-black text-[11px] md:text-sm uppercase sticky left-0 bg-inherit z-20 border-r dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-brand rounded-full"></div>
                          {asgn.subjects?.name}
                        </div>
                      </td>
                      {availableExams.map(ex => {
                        const m = getMark(subId, ex.id);
                        if (m) { subjectTotal += (m.marks_obtained / m.total_marks) * 100; examCount++; }
                        return (
                          <td key={ex.id} className="p-4 text-center">
                            {m ? <span className="font-bold text-slate-800 dark:text-white">{m.marks_obtained}/{m.total_marks}</span> : <span className="opacity-20">—</span>}
                          </td>
                        );
                      })}
                      <td className="p-4 text-center bg-brand/5 dark:bg-brand/10 font-black text-brand sticky right-0 z-20 backdrop-blur-sm">
                        {examCount > 0 ? Math.round(subjectTotal / examCount) + "%" : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PERFORMANCE CHART */}
        <div className="p-6 md:p-10 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-lg md:text-xl font-black mb-8 text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-2 h-6 bg-brand rounded-full"></div> Progress Summary
          </h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getExamChartData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
                <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .overflow-x-auto { overscroll-behavior-x: contain; }
      `}</style>
    </div>
  );
}