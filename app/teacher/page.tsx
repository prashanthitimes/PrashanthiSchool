"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUsers, FiLayers, FiBriefcase, 
  FiArrowRight, FiChevronRight, FiBell, FiEdit3, FiCalendar, FiBookOpen 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    assignedClasses: 0,
    department: "Assigning...", // Default placeholder
  });

  useEffect(() => {
    fetchTeacherDashboardData();
  }, []);

  async function fetchTeacherDashboardData() {
    setLoading(true);
    try {
      const userEmail = localStorage.getItem('teacherEmail');
      if (!userEmail) return;

      // 1. FETCH TEACHER PROFILE
      const { data: teacher, error: tError } = await supabase
        .from("teachers")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (tError) throw tError;

      if (teacher) {
        setTeacherData(teacher);

        // 2. FETCH SUBJECT ASSIGNMENTS
        const { data: assignments } = await supabase
          .from("subject_assignments")
          .select(`class_name, section`)
          .eq("teacher_id", teacher.id);

        let studentCount = 0;
        let classCount = 0;

        if (assignments && assignments.length > 0) {
          // Get unique class-section combinations
          const uniqueClasses = Array.from(
            new Set(assignments.map(a => `${a.class_name}|${a.section}`))
          );
          classCount = uniqueClasses.length;

          // 3. FETCH STUDENT COUNT FOR ASSIGNED CLASSES
          for (const item of uniqueClasses) {
            const [cName, cSection] = item.split('|');
            const { count } = await supabase
              .from("students")
              .select("*", { count: "exact", head: true })
              .eq("class_name", cName)
              .eq("section", cSection)
              .eq("status", "active");
            
            studentCount += (count || 0);
          }
        }

        // 4. UPDATE STATS WITH REAL DATA
        setStats({
          totalStudents: studentCount,
          assignedClasses: classCount,
          department: teacher.department || "Not Set", // Fetches from your DB
        });
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-10 p-4 md:p-6 pt-6 md:pt-10 bg-[#fffcfd] dark:bg-slate-950 animate-in fade-in duration-700 transition-colors">

      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden bg-brand-soft/20 dark:bg-brand/10 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-14 border border-[#e9d1e4] dark:border-slate-800">
        <div className="absolute -top-10 -right-10 w-48 md:w-64 h-48 md:h-64 bg-brand/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="max-w-3xl text-center md:text-left">
            <p className="text-brand font-black text-[10px] tracking-[0.3em] uppercase mb-2">Teacher Dashboard</p>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tighter uppercase leading-tight">
              Hello, {teacherData?.full_name || "Teacher"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm md:text-lg">
              Authorized personnel for the <span className="text-brand underline decoration-2 underline-offset-4">{stats.department}</span> department.
            </p>

            <div className="mt-6 md:mt-8 flex flex-row gap-2 md:gap-4 items-center justify-center md:justify-start">
              <Link href="/teacher/attendance" className="flex-1 sm:flex-none bg-brand text-white px-5 sm:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
                Mark Attendance <FiArrowRight className="hidden sm:block" />
              </Link>
              <Link href="/teacher/profile" className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-[#e9d1e4] dark:border-slate-800 text-slate-800 dark:text-slate-100 px-5 sm:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-slate-50 transition-all text-center">
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- RECTIFIED STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full">
        {[
          { label: "My Students", value: stats.totalStudents, Icon: FiUsers, color: "text-blue-500", bg: "bg-blue-500/5" },
          { label: "Department", value: stats.department, Icon: FiBriefcase, color: "text-brand", bg: "bg-brand/5" },
          { label: "Total Classes", value: stats.assignedClasses, Icon: FiLayers, color: "text-purple-500", bg: "bg-purple-500/5" },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 flex flex-row sm:flex-col items-center sm:items-start gap-4 shadow-sm">
            <div className={`${stat.bg} ${stat.color} p-3 md:p-4 rounded-2xl`}>
              <stat.Icon size={24} />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">
                {stat.label}
              </p>
              <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
                {loading ? "..." : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

     

      {/* --- COMMAND CENTER --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-4 md:p-8 space-y-4 md:space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand">
            <FiEdit3 size={18} />
            <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest text-slate-800 dark:text-slate-100">Academic</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[{ label: "Exam Marks", path: "/teacher/marks" }, { label: "Assignments", path: "/teacher/homework" }, { label: "Class Roster", path: "/teacher/students" }].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 font-bold text-[9px] md:text-[11px] uppercase hover:bg-brand/10 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-4 md:p-8 space-y-4 md:space-y-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand">
            <FiCalendar size={18} />
            <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest text-slate-800 dark:text-slate-100">Operations</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[{ label: "Timetable", path: "/teacher/timetable" }, { label: "Daily Attendance", path: "/teacher/attendance" }, { label: "Syllabus Track", path: "/teacher/syllabus" }].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 font-bold text-[9px] md:text-[11px] uppercase hover:bg-brand/10 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-brand rounded-[1.2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white space-y-4 shadow-xl shadow-brand/20">
          <div className="flex items-center gap-2">
            <FiBell size={18} />
            <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest opacity-80">School Portal</h3>
          </div>
          <div className="space-y-3">
            <Link href="/teacher/notices" className="block p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1">Notice Board</p>
              <p className="text-[11px] opacity-80 font-medium">View official circulars and holiday updates.</p>
            </Link>
            <Link href="/teacher/profile" className="block p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-wider mb-1">Settings</p>
              <p className="text-[11px] opacity-80 font-medium">Update profile and contact information.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}