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
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

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

        setTodayClasses(assignments || []);

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
    <div className="space-y-10 p-6 pt-10 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- SOFT BRAND TEACHER BANNER --- */}
      <section className="relative overflow-hidden bg-brand-soft/40 rounded-[2.5rem] p-10 md:p-14 border border-brand-soft">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-light/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-brand-light mb-4 tracking-tighter uppercase">
              Welcome, {teacherData?.full_name?.split(' ')[0] || "Teacher"}
            </h1>
            <p className="text-brand-light/70 text-lg font-bold leading-relaxed">
              System active for <span className="text-brand-light underline decoration-2 underline-offset-4">{stats.classesToday} assigned classes</span>. 
              Academic session 2026-27 is currently in progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/teacher/attendance" className="bg-brand-light text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-soft hover:scale-105 transition-all flex items-center gap-2">
                Mark Attendance <FiArrowRight />
              </Link>
              <Link href="/teacher/marks" className="bg-white border border-brand-soft text-brand-light px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-soft/20 transition-all">
                Enter Grades
              </Link>
            </div>
          </div>
          <div className="hidden lg:block bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-brand-soft shadow-sm text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-light/60 mb-2 font-black">Today's Date</p>
            <p className="text-3xl font-black text-brand-light italic">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
            </p>
          </div>
        </div>
      </section>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { label: "Total Students", count: stats.myStudents, icon: <FiUsers />, path: '/teacher/students' },
            { label: "Syllabus Status", count: stats.pendingAssignments, icon: <FiCheckSquare />, path: '/teacher/syllabus' },
            { label: "Class Load", count: stats.classesToday, icon: <FiClock />, path: '/teacher/timetable' },
            { label: "Attendance Rate", count: stats.attendanceRate, icon: <FiBookOpen />, path: '/teacher/attendance' },
        ].map((stat, index) => (
          <Link href={stat.path} key={index} className="bg-white p-8 rounded-[2.5rem] border border-brand-soft hover:bg-brand-soft/20 transition-all group flex flex-col gap-4">
            <div className="text-brand-light group-hover:scale-110 transition-transform duration-300">
              {React.cloneElement(stat.icon as React.ReactElement, { size: 28 })}
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-brand-light/40 tracking-[0.2em]">{stat.label}</p>
              <p className="text-4xl font-black text-brand-light mt-1 tracking-tighter">
                {loading ? "..." : stat.count}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* --- TEACHER COMMAND CENTER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Academic Management */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-light">
            <FiEdit3 size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Academic Entry</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
                { label: "Submit Exam Marks", path: "/teacher/marks" },
                { label: "Post Assignments", path: "/teacher/homework" },
                { label: "Update Syllabus", path: "/teacher/syllabus" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-brand-soft/10 text-brand-light font-bold text-[11px] uppercase hover:bg-brand-soft/30 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* My Schedule & Roster */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-light">
            <FiCalendar size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">My Schedule</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
                { label: "My Time Table", path: "/teacher/timetable" },
                { label: "Student Directory", path: "/teacher/students" },
                { label: "Class Attendance", path: "/teacher/attendance" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-brand-soft/10 text-brand-light font-bold text-[11px] uppercase hover:bg-brand-soft/30 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Teacher Communication (High Contrast) */}
        <div className="bg-brand-light rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-brand-soft">
          <div className="flex items-center gap-3">
            <FiBell size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest text-white/80">Staff Portal</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {// To this:
[
  { label: "Total Students", count: stats.myStudents, Icon: FiUsers, path: '/teacher/students' },
  { label: "Syllabus Status", count: stats.pendingAssignments, Icon: FiCheckSquare, path: '/teacher/syllabus' },
  { label: "Class Load", count: stats.classesToday, Icon: FiClock, path: '/teacher/timetable' },
  { label: "Attendance Rate", count: stats.attendanceRate, Icon: FiBookOpen, path: '/teacher/attendance' },
].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-white/10 text-white font-bold text-[11px] uppercase hover:bg-white/20 transition-all flex justify-between items-center group">
                {item.label} <span className="opacity-50 group-hover:opacity-100">{item.icon}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}