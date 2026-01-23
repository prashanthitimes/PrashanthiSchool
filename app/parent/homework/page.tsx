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
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- REDUCED COMPACT HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 md:p-8 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase">
            {studentDetails?.full_name?.split(' ')[0]}'s Tasks
          </h1>
          <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">
            Class {studentDetails?.class_name} • Section {studentDetails?.section}
          </p>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest">
                {homework.length} Assignments
            </div>
            <div className="bg-brand-light px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                Term 1
            </div>
        </div>
      </header>

      {/* --- HOMEWORK 3-IN-ROW GRID --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-brand-soft/10 rounded-[2.5rem] animate-pulse border border-brand-soft/20" />
          ))}
        </div>
      ) : homework.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homework.map((item) => (
            <div key={item.id} className="group bg-white border border-brand-soft p-6 rounded-[2.5rem] hover:bg-brand-accent/30 transition-all flex flex-col h-full">
              
              {/* Card Top */}
              <div className="flex justify-between items-start mb-4">
                <span className="bg-brand-light text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {item.subjects?.name || 'General'}
                </span>
                <div className="text-right">
                    <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest">Period</p>
                    <p className="text-lg font-black text-brand-light leading-none">{item.period || '—'}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 space-y-2 mb-6">
                <h3 className="text-lg font-black text-brand-light tracking-tight uppercase leading-tight group-hover:text-brand transition-colors">
                  {item.title}
                </h3>
                <p className="text-brand-light/70 text-xs font-medium leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              {/* Card Bottom Meta */}
              <div className="pt-4 border-t border-brand-soft/40 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand-light/60">
                        <FiCalendar size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider italic">{item.due_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-light/40">
                        <FiUser size={14} />
                        <span className="text-[10px] font-bold">{item.teachers?.full_name?.split(' ')[0]}</span>
                    </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-brand-soft rounded-[3rem] py-20 text-center">
          <FiCheckCircle size={40} className="mx-auto text-brand-light/20 mb-4" />
          <h3 className="text-xl font-black text-brand-light uppercase tracking-tight">All Caught Up</h3>
          <p className="text-brand-light/50 text-[10px] font-bold uppercase tracking-widest mt-2">No active assignments found.</p>
        </div>
      )}
    </div>
  );
}