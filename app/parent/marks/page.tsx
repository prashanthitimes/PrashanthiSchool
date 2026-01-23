"use client";

import React, { useState, useEffect } from "react";
import { FiAward, FiBookOpen, FiBarChart, FiCheckCircle, FiStar } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentMarks() {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  async function fetchMarks() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const { data, error } = await supabase
        .from("exam_marks")
        .select(`
          *,
          subjects (name),
          exam_syllabus (exam_name)
        `)
        .eq("student_id", childId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMarks(data || []);
    } catch (err) {
      console.error("Marks Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const getGrade = (obtained: number, total: number) => {
    const percent = (obtained / total) * 100;
    if (percent >= 90) return { label: 'A+', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bar: 'bg-emerald-500' };
    if (percent >= 80) return { label: 'A', color: 'text-brand-light bg-brand-soft border-brand-soft', bar: 'bg-brand-light' };
    if (percent >= 40) return { label: 'B', color: 'text-amber-600 bg-amber-50 border-amber-100', bar: 'bg-amber-500' };
    return { label: 'F', color: 'text-rose-600 bg-rose-50 border-rose-100', bar: 'bg-rose-500' };
  };

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- COMPACT SMALL HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiAward size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase">Exam Results</h1>
            <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">Academic Session 2026-27</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest">
                {marks.length} Subjects
            </div>
            <div className="bg-brand-light px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                Released
            </div>
        </div>
      </header>

      {/* --- MARKS 3-IN-ROW GRID --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-brand-soft/10 animate-pulse rounded-[2.5rem] border border-brand-soft/20"></div>)}
        </div>
      ) : marks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {marks.map((item) => {
            const grade = getGrade(item.marks_obtained, item.total_marks);
            const percentage = Math.round((item.marks_obtained / item.total_marks) * 100);

            return (
              <div key={item.id} className="group bg-white border border-brand-soft p-6 rounded-[2.5rem] hover:bg-brand-accent/20 transition-all flex flex-col h-full">
                
                {/* Grade and Exam Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-2 rounded-2xl border text-sm font-black uppercase tracking-tighter ${grade.color}`}>
                    Grade {grade.label}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest leading-none mb-1">Score</p>
                    <p className="text-xl font-black text-brand-light leading-none">{percentage}%</p>
                  </div>
                </div>

                {/* Subject Info */}
                <div className="flex-1 mb-6">
                  <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest mb-1">
                    {item.exam_syllabus?.exam_name || 'Internal Test'}
                  </p>
                  <h3 className="text-xl font-black text-brand-light uppercase tracking-tight leading-tight">
                    {item.subjects?.name}
                  </h3>
                  {item.remarks && (
                    <p className="mt-2 text-[11px] font-medium italic text-brand-light/60 line-clamp-2">
                      "{item.remarks}"
                    </p>
                  )}
                </div>

                {/* Score Bar & Fraction */}
                <div className="pt-5 border-t border-brand-soft/40">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-brand-light uppercase tracking-widest">
                            {item.marks_obtained} / {item.total_marks}
                        </span>
                        <FiStar size={12} className="text-brand-light/30" />
                    </div>
                    <div className="w-full bg-brand-soft/30 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${grade.bar}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-brand-soft rounded-[3rem] py-20 text-center">
          <FiAward size={40} className="mx-auto text-brand-light/20 mb-4" />
          <h3 className="text-xl font-black text-brand-light uppercase tracking-tight">No Marks Found</h3>
          <p className="text-brand-light/50 text-[10px] font-bold uppercase tracking-widest mt-2">Scorecards will appear once published.</p>
        </div>
      )}
    </div>
  );
}