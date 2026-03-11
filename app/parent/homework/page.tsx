"use client";

import React, { useState, useEffect } from "react";
import { FiBook, FiClock, FiCalendar, FiUser, FiCheckCircle } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentHomework() {
  const [homework, setHomework] = useState<any[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const { data: student } = await supabase
        .from("students")
        .select("class_name, section, full_name")
        .eq("id", childId)
        .single();

      if (!student) return;
      setStudentDetails(student);

      const cleanedClass = student.class_name.replace(/(st|nd|rd|th)$/i, "").trim();
      const today = new Date().toISOString().split('T')[0];

      const { data: hw } = await supabase
        .from("homework")
        .select(`*, subjects (name), teachers (full_name)`)
        .or(`class_name.eq."${student.class_name}",class_name.eq."${cleanedClass}"`)
        .eq("section", student.section)
        .lte("assigned_date", today)
        .gte("due_date", today)
        .order('due_date', { ascending: true });

      setHomework(hw || []);
    } catch (error) {
      console.error("Fetch process error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Main Page Canvas: bg-[#fffcfd] | dark:bg-slate-950 */
    <div className="space-y-8 p-6 bg-[#fffcfd] dark:bg-slate-950  animate-in fade-in duration-700 transition-colors duration-300">

      {/* --- REDUCED COMPACT HEADER --- */}
      {/* bg-slate-50 / dark:bg-slate-800/50 for secondary backgrounds */}
      <header className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 md:p-8 border border-[#e9d1e4] dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          {/* Primary Headings: text-slate-800 | dark:text-slate-100 */}
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
            {studentDetails?.full_name?.split(' ')[0]}'s Tasks
          </h1>
          {/* Secondary Metadata: text-slate-400 */}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Class {studentDetails?.class_name} • Section {studentDetails?.section}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/60 dark:bg-slate-900/60 px-4 py-2 rounded-xl border border-[#e9d1e4] dark:border-slate-700 text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
            {homework.length} Assignments
          </div>
          {/* Branding Highlights: bg-brand | dark:text-brand-soft */}
          <div className="bg-brand dark:bg-brand-soft px-4 py-2 rounded-xl text-[10px] font-black text-white dark:text-slate-950 uppercase tracking-widest">
            Term 1
          </div>
        </div>
      </header>

      {/* --- HOMEWORK 3-IN-ROW GRID --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-[#e9d1e4] dark:border-slate-800" />
          ))}
        </div>
      ) : homework.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homework.map((item) => (
            /* Card Background: bg-white | dark:bg-slate-900 */
            /* Card Border: border-[#e9d1e4] | dark:border-slate-800 */
            <div key={item.id} className="group bg-white dark:bg-slate-900 border border-[#e9d1e4] dark:border-slate-800 p-6 rounded-[2.5rem] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col h-full shadow-sm">

              {/* Card Top */}
              <div className="flex justify-between items-start mb-4">
                <span className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {item.subjects?.name || 'General'}
                </span>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Period</p>
                  <p className="text-lg font-black text-brand dark:text-brand-soft leading-none">{item.period || '—'}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 space-y-2 mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-tight group-hover:text-brand dark:group-hover:text-brand-soft transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Card Bottom Meta */}
              <div className="pt-4 border-t border-[#e9d1e4] dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Due Date
                    </span>
                    <FiCalendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-wider italic">{item.due_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <FiUser size={14} />
                    <span className="text-[10px] font-bold">
                      {item.teachers?.full_name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Empty State Background */
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-[#e9d1e4] dark:border-slate-800 rounded-[3rem] py-20 text-center">
          <FiCheckCircle size={40} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">All Caught Up</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">No active assignments found.</p>
        </div>
      )}
    </div>
  );
}