"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUsers, FiCheckSquare, FiBookOpen, FiClock,
  FiCalendar, FiArrowRight, FiChevronRight, FiBell, FiEdit3
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    myStudents: 0,
    pendingAssignments: 0,
    classesToday: 0,
    attendanceRate: "96%",
  });
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState<any>(null);

  useEffect(() => {
    fetchTeacherDashboardData();
  }, []);

  async function fetchTeacherDashboardData() {
    setLoading(true);
    try {
      const userEmail = localStorage.getItem('teacherEmail');
      if (!userEmail) return;

      const { data: teacher } = await supabase
        .from("teachers")
        .select("*")
        .eq("email", userEmail)
        .single();

      if (teacher) {
        setTeacherData(teacher);
        const { data: assignments } = await supabase
          .from("subject_assignments")
          .select(`*, subjects(name)`)
          .eq("teacher_id", teacher.id);

        if (assignments && assignments.length > 0) {
          let totalStudents = 0;
          for (const item of assignments) {
            const { count } = await supabase
              .from("students")
              .select("*", { count: "exact", head: true })
              .eq("class_name", item.class_name)
              .eq("section", item.section);
            totalStudents += (count || 0);
          }

          const { count: pendingSyllabus } = await supabase
            .from("exam_syllabus")
            .select("*", { count: "exact", head: true })
            .eq("teacher_id", teacher.id);

          setStats({
            myStudents: totalStudents,
            pendingAssignments: pendingSyllabus || 0,
            classesToday: assignments.length,
            attendanceRate: "98%",
          });
        }
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-10 p-4 md:p-6 pt-6 md:pt-10 bg-[#fffcfd] dark:bg-slate-950 min-h-screen animate-in fade-in duration-700 transition-colors duration-300">

      {/* --- SOFT BRAND TEACHER BANNER --- */}
      <section className="relative overflow-hidden bg-brand-soft/20 dark:bg-brand/10 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-14 border border-[#e9d1e4] dark:border-slate-800 transition-colors duration-300">
        {/* Decorative Background Element */}
        <div className="absolute -top-10 -right-10 w-48 md:w-64 h-48 md:h-64 bg-brand/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="max-w-3xl text-center md:text-left">

            {/* WELCOME TEXT - Single line forced by removing <br/> and adding whitespace-nowrap if needed */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100 mb-3 md:mb-4 tracking-tighter uppercase leading-tight">
              Welcome, {teacherData?.full_name?.split(' ')[0] || "Teacher"}
            </h1>

            <p className="text-slate-400 dark:text-slate-400 text-sm md:text-lg font-bold leading-relaxed">
              System active for <span className="text-brand dark:text-brand-soft underline decoration-2 underline-offset-4">{stats.classesToday} assigned classes</span>.
            </p>

            {/* BUTTONS - Forced into one line using flex-row and smaller padding/text on mobile */}
            <div className="mt-6 md:mt-8 flex flex-row gap-2 md:gap-4 items-center justify-center md:justify-start">
              <Link
                href="/teacher/attendance"
                className="flex-1 sm:flex-none bg-brand text-white px-3 sm:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-tighter sm:tracking-[0.2em] shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap"
              >
                Attendance <FiArrowRight className="hidden sm:block" />
              </Link>

              <Link
                href="/teacher/marks"
                className="flex-1 sm:flex-none bg-white dark:bg-slate-900 border border-[#e9d1e4] dark:border-slate-800 text-slate-800 dark:text-slate-100 px-3 sm:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-tighter sm:tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center whitespace-nowrap"
              >
                Grades
              </Link>
            </div>
          </div>

          {/* Desktop/Tablet Date Card */}
          <div className="hidden md:block bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-[#e9d1e4] dark:border-slate-800 shadow-sm text-center min-w-[160px]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2 font-black">Today's Date</p>
            <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 italic">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
            </p>
          </div>
        </div>
      </section>

      {/* --- QUICK STATS GRID (3 ITEMS JUSTIFIED) --- */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 w-full">
        {[
          { label: "Students", count: stats.myStudents, Icon: FiUsers, path: '/teacher/students' },
          { label: "Syllabus", count: stats.pendingAssignments, Icon: FiCheckSquare, path: '/teacher/syllabus' },
          { label: "Attendance", count: stats.attendanceRate, Icon: FiBookOpen, path: '/teacher/attendance' },
        ].map((stat, index) => (
          <Link
            href={stat.path}
            key={index}
            className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.2rem] md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 hover:border-brand dark:hover:border-brand-soft transition-all group flex flex-col items-center md:items-start gap-1 md:gap-4 shadow-sm"
          >
            {/* Icon: Brand color in light, soft brand in dark */}
            <div className="text-brand dark:text-brand-soft group-hover:scale-110 transition-transform duration-300">
              <stat.Icon size={18} className="md:w-[28px] md:h-[28px]" />
            </div>

            <div className="text-center md:text-left overflow-hidden w-full">
              {/* Label: Metadata color text-slate-400 */}
              <p className="text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-tight md:tracking-[0.2em] truncate">
                {stat.label}
              </p>
              {/* Count: Primary heading colors */}
              <p className="text-base md:text-4xl font-black text-slate-800 dark:text-slate-100 mt-0.5 md:mt-1 tracking-tighter">
                {loading ? "..." : stat.count}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* --- TEACHER COMMAND CENTER (2 COLUMNS ON MOBILE) --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">

        {/* Academic Management */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-4 md:p-8 space-y-3 md:space-y-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 md:gap-3 text-brand dark:text-brand-soft">
            <FiEdit3 size={16} className="md:w-[18px]" />
            <h3 className="font-black uppercase text-[8px] md:text-xs tracking-widest text-slate-800 dark:text-slate-100 truncate">Academic</h3>
          </div>
          <div className="grid grid-cols-1 gap-1.5 md:gap-2">
            {[
              { label: "Exam Marks", path: "/teacher/marks" },
              { label: "Assignments", path: "/teacher/homework" },
              { label: "Syllabus", path: "/teacher/syllabus" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-2.5 md:p-4 rounded-lg md:rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 font-bold text-[8px] md:text-[11px] uppercase hover:bg-brand/10 dark:hover:bg-brand/20 transition-all flex justify-between items-center group">
                <span className="truncate">{item.label}</span>
                <FiChevronRight className="text-slate-400 group-hover:translate-x-1 transition-all hidden md:block" />
              </Link>
            ))}
          </div>
        </div>

        {/* My Schedule & Roster */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] md:rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-4 md:p-8 space-y-3 md:space-y-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 md:gap-3 text-brand dark:text-brand-soft">
            <FiCalendar size={16} className="md:w-[18px]" />
            <h3 className="font-black uppercase text-[8px] md:text-xs tracking-widest text-slate-800 dark:text-slate-100 truncate">Schedule</h3>
          </div>
          <div className="grid grid-cols-1 gap-1.5 md:gap-2">
            {[
              { label: "Timetable", path: "/teacher/timetable" },
              { label: "Directory", path: "/teacher/students" },
              { label: "Attendance", path: "/teacher/attendance" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-2.5 md:p-4 rounded-lg md:rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 font-bold text-[8px] md:text-[11px] uppercase hover:bg-brand/10 dark:hover:bg-brand/20 transition-all flex justify-between items-center group">
                <span className="truncate">{item.label}</span>
                <FiChevronRight className="text-slate-400 group-hover:translate-x-1 transition-all hidden md:block" />
              </Link>
            ))}
          </div>
        </div>

        {/* Staff Portal - Occupies full width on mobile if items are odd, or stays in grid */}
        <div className="col-span-2 md:col-span-1 bg-brand dark:bg-brand rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 text-white space-y-3 md:space-y-6 shadow-xl shadow-brand/20">
          <div className="flex items-center gap-2 md:gap-3">
            <FiBell size={16} className="md:w-[18px]" />
            <h3 className="font-black uppercase text-[8px] md:text-xs tracking-widest text-white/80">Staff Portal</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5 md:gap-2">
            {[
              { label: "Notices", path: "/teacher/notices", Icon: FiBell },
              { label: "Calendar", path: "/teacher/calendar", Icon: FiCalendar },
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-2.5 md:p-4 rounded-lg md:rounded-2xl bg-white/10 text-white font-bold text-[8px] md:text-[11px] uppercase hover:bg-white/20 transition-all flex justify-between items-center group">
                <span className="truncate">{item.label}</span>
                <item.Icon size={12} className="opacity-50 md:size-[16px]" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}