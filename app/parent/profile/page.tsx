"use client";

import React, { useState, useEffect } from "react";
import {
  FiUser, FiHash, FiCalendar, FiPhone,
  FiMail, FiActivity, FiShield, FiInfo, FiHeart
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { IconType } from "react-icons";

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);
  const [parent, setParent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileAndParent();
  }, []);

  async function fetchProfileAndParent() {
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      // 1. Fetch Student Data
      const { data: studentData, error: sError } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .single();

      if (sError) throw sError;
      setStudent(studentData);

      // 2. Fetch Parent Data linked to this child
      const { data: parentData, error: pError } = await supabase
        .from("parents")
        .select("*")
        .eq("child_id", childId)
        .single();

      if (!pError) setParent(parentData);

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
    </div>
  );

  return (
    /* Main Canvas: bg-[#fffcfd] | dark:bg-slate-950 */
<div className="space-y-7 p-6 pt-10 bg-[#fffcfd] dark:bg-slate-950 animate-in fade-in duration-700 transition-colors">
      {/* --- SOFT BRAND PROFILE BANNER --- */}
      {/* Banner Background: bg-brand-soft/40 -> Adjusting for dark mode transparency */}
      <section className="relative overflow-hidden bg-brand/10 dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-[#e9d1e4] dark:border-slate-800">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">

          <div className="relative">
            {/* Avatar Container: bg-white | dark:bg-slate-800 */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl shadow-brand/10 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FiUser size={50} />
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-brand dark:bg-brand-soft rounded-full border-4 border-white dark:border-slate-800"></div>
          </div>

          <div className="max-w-2xl">
            <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.25em] mb-1">Student Profile</p>
            {/* Primary Name: text-slate-800 | dark:text-slate-100 */}
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tighter uppercase">
              {student?.full_name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-[#e9d1e4] dark:border-slate-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Class {student?.class_name}-{student?.section}
              </span>
              <span className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                {student?.status || 'Active'}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-3 gap-2 md:gap-6">
        {[
          { label: "Roll Number", value: student?.roll_number || "N/A", icon: FiHash },
          { label: "System ID", value: student?.student_id, icon: FiShield },
          { label: "Academic Year", value: student?.academic_year, icon: FiCalendar },
        ].map((stat, index) => (
          <div
            key={index}
            /* Card: bg-white | dark:bg-slate-900 */
            /* Border: border-[#e9d1e4] | dark:border-slate-800 */
            className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
          >
            <div className="text-brand dark:text-brand-soft transition-colors mb-2 md:mb-4">
              {(() => {
                const Icon = stat.icon as IconType;
                return <Icon className="w-5 h-5 md:w-6 md:h-6" />;
              })()}
            </div>

            <p className="text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-[0.1em] md:tracking-[0.2em]">
              {stat.label}
            </p>
            <p className="text-sm md:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 tracking-tight truncate">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* --- ACADEMIC RECORDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Reduced gap from 8 to 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#e9d1e4] dark:border-slate-800 p-4 md:p-6 space-y-4"> {/* Reduced padding and space-y */}
          <div className="flex items-center gap-2 text-brand dark:text-brand-soft">
            <FiInfo size={18} />
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-800 dark:text-slate-100">
              Student Information
            </h3>
          </div>

          <div className="space-y-2"> {/* Reduced spacing between rows */}
            {[
              { label: "Full Name", value: student?.full_name },
              { label: "Joining Date", value: new Date(student?.created_at).toLocaleDateString() },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-[#e9d1e4]/50 dark:border-slate-800/50"
              >
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  {item.label}
                </span>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}