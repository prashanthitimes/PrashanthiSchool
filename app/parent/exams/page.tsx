"use client";

import React, { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiInfo, FiChevronRight, FiAlertCircle, FiLayers } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentExamCalendar() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);
    try {
      const studentId = localStorage.getItem('childId');
      if (!studentId) return;

      // 1. Fetch Student Profile to get Class and Section
      const { data: student } = await supabase
        .from('students')
        .select('class_name, section')
        .eq('id', studentId)
        .single();

      if (student) {
        // Normalize class names: "10th" -> "10", "A" -> "A"
        const cleanClass = student.class_name.toLowerCase().replace("th", ""); 
        const section = student.section.toUpperCase();

        // Create variations to match your ARRAY["10A", "10-A"] etc.
        const classVariations = [
          `${cleanClass}${section}`,          // "10A"
          `${cleanClass}-${section}`,         // "10-A"
          `${student.class_name}${section}`,    // "10thA"
          `${student.class_name}-${section}`,   // "10th-A"
          student.class_name                   // "10th"
        ];

        // 2. Fetch Exams and Order by Date (Upcoming first)
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("*")
          .overlaps('classes', classVariations)
          .order('start_date', { ascending: true });

        if (examError) throw examError;
        setExams(examData || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getDayStatus = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: "Starting Today", color: "bg-emerald-500" };
    if (diffDays < 0) return { label: "Ongoing", color: "bg-amber-500" };
    return { label: `In ${diffDays} Days`, color: "bg-brand-light" };
  };

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- COMPACT SMALL HEADER (EXACT MATCH) --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiCalendar size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase">Exam Schedule</h1>
            <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">Academic Session 2026-27</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest">
                {exams.length} Upcoming
            </div>
            <div className="bg-brand-light px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                Active
            </div>
        </div>
      </header>

      {/* --- EXAM CARDS GRID --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-brand-soft/10 animate-pulse rounded-[2.5rem] border border-brand-soft/20"></div>)}
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const status = getDayStatus(exam.start_date);
            return (
              <div key={exam.id} className="group bg-white border border-brand-soft p-8 rounded-[2.5rem] hover:bg-brand-accent/5 transition-all flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-brand-soft/20">
                
                {/* Card Header: Status and Marks */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`${status.color} text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-brand-soft/30`}>
                    {status.label}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest leading-none mb-1">Total Marks</p>
                    <p className="text-xl font-black text-brand-light leading-none">{exam.total_marks}</p>
                  </div>
                </div>

                {/* Exam Info */}
                <div className="flex-1 mb-8">
                  <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest mb-1">
                    {exam.exam_type}
                  </p>
                  <h3 className="text-2xl font-black text-brand-light uppercase tracking-tighter leading-tight">
                    {exam.exam_name}
                  </h3>
                  {exam.instructions && (
                    <p className="mt-3 text-[11px] font-medium italic text-brand-light/60 line-clamp-2">
                      "{exam.instructions}"
                    </p>
                  )}
                </div>

                {/* Date and Action Footer */}
                <div className="pt-6 border-t border-brand-soft/60">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <FiClock className="text-brand-light/40" size={14} />
                            <span className="text-[10px] font-black text-brand-light uppercase tracking-widest">
                                {new Date(exam.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                                <span className="mx-1 opacity-30">—</span>
                                {new Date(exam.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    </div>
                    
                    <button className="w-full bg-brand-soft/50 group-hover:bg-brand-light group-hover:text-white text-brand-light py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                        View Syllabus <FiChevronRight />
                    </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-brand-soft rounded-[3rem] py-20 text-center">
          <FiCalendar size={40} className="mx-auto text-brand-light/20 mb-4" />
          <h3 className="text-xl font-black text-brand-light uppercase tracking-tight">No Upcoming Exams</h3>
          <p className="text-brand-light/50 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">
            We couldn't find any exams for your class and section.
          </p>
        </div>
      )}
    </div>
  );
}