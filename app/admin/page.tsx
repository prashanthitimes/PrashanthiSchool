"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUsers, FiUserCheck, FiBookOpen, FiTruck, FiBell, FiCalendar, FiBook, FiChevronRight, FiBriefcase
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

interface QuickStat {
  label: string;
  count: number;
  Icon: React.ElementType;
  path: string;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ 
    students: 0, 
    teachers: 0, 
    transport_routes: 0, 
    subjects: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [
          { count: sCount }, 
          { count: tCount }, 
          { count: rCount }, 
          { count: subCount }
        ] = await Promise.all([
          supabase.from("students").select("*", { count: "exact", head: true }),
          supabase.from("teachers").select("*", { count: "exact", head: true }),
          supabase.from("transport_routes").select("*", { count: "exact", head: true }),
          supabase.from("subjects").select("*", { count: "exact", head: true }),
        ]);

        setCounts({ 
          students: sCount || 0, 
          teachers: tCount || 0, 
          transport_routes: rCount || 0, 
          subjects: subCount || 0 
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const stats: QuickStat[] = [
    { label: "Students", count: counts.students, Icon: FiUsers, path: '/admin/students' },
    { label: "Teachers", count: counts.teachers, Icon: FiUserCheck, path: '/admin/teachers' },
    { label: "Bus Routes", count: counts.transport_routes, Icon: FiTruck, path: '/admin/transport' },
    { label: "Subjects", count: counts.subjects, Icon: FiBook, path: '/admin/subjects' },
  ];

return (
  <div className="space-y-6 md:space-y-10 p-4 md:p-6 pt-12 md:pt-20 min-h-screen transition-colors duration-500
    bg-[#fffcfd] dark:bg-slate-950 text-slate-900 dark:text-slate-200">
    
    {/* --- BRAND BANNER --- */}
    <section className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-14 border transition-all duration-300
      bg-brand-soft/40 border-brand-soft 
      dark:bg-slate-900 dark:border-slate-800 shadow-2xl dark:shadow-none">
      
      {/* Decorative Glow - Adjusted for Dark Mode */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-light/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-5xl font-black mb-2 md:mb-4 tracking-tighter uppercase
            text-brand-light dark:text-white">
            Welcome Back, <span className="dark:text-brand-light">Admin</span>
          </h1>
          <p className="text-sm md:text-lg font-bold leading-tight md:leading-relaxed
            text-brand-light/70 dark:text-slate-400">
            Academic systems are online. <br className="md:hidden" />
            <span className="underline decoration-2 underline-offset-4 text-brand-light font-black">
              {counts.students} students
            </span> synced.
          </p>
          
          <div className="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
            <Link href="/admin/notices" className="bg-brand-light text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-soft/50 dark:shadow-brand-light/10 active:scale-95 transition-all">
              Publish Notice
            </Link>
            <Link href="/admin/settings" className="px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all
              bg-white border border-brand-soft text-brand-light
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              Config
            </Link>
          </div>
        </div>
        
        {/* Term Info Box */}
        <div className="hidden md:block backdrop-blur-md p-8 rounded-[2rem] border transition-all
          bg-white/60 border-brand-soft
          dark:bg-slate-950/60 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2 font-black text-center text-brand-light/60">Current Term</p>
          <p className="text-3xl font-black text-brand-light italic">JAN - JUN</p>
        </div>
      </div>
    </section>

    {/* --- QUICK STATS GRID --- */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.Icon;
        return (
          <Link href={stat.path} key={index} className="p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border transition-all group flex flex-col gap-2 md:gap-4 shadow-sm
            bg-white border-brand-soft active:bg-brand-soft/20
            dark:bg-slate-900 dark:border-slate-800 dark:hover:border-brand-light/30">
            <div className="text-brand-light group-hover:scale-110 transition-transform duration-300">
              <Icon size={22} className="md:w-[28px]" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.15em]
                text-brand-light/40 dark:text-slate-500">
                {stat.label}
              </p>
              <p className="text-xl md:text-4xl font-black mt-1 tracking-tighter
                text-brand-light dark:text-white">
                {loading ? "..." : stat.count}
              </p>
            </div>
          </Link>
        );
      })}
    </div>

    {/* --- MANAGEMENT COMMAND CENTER --- */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
      {/* Academics Block */}
      <div className="rounded-[1.8rem] md:rounded-[2.5rem] border p-6 md:p-8 space-y-4 md:space-y-6 transition-all
        bg-white border-brand-soft 
        dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 text-brand-light">
          <FiBookOpen size={18} />
          <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest text-brand-light dark:text-slate-300">Academics</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: "Classes & Sections", path: "/admin/classes" },
            { label: "Subjects Management", path: "/admin/subjects" },
            { label: "Master Time Table", path: "/admin/timetable" }
          ].map((item) => (
            <Link href={item.path} key={item.label} className="w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[11px] uppercase transition-all flex justify-between items-center group
              bg-brand-soft/10 text-brand-light active:bg-brand-soft/30
              dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:border dark:border-slate-800/50">
              {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 group-hover:text-brand-light transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Operations Block */}
      <div className="rounded-[1.8rem] md:rounded-[2.5rem] border p-6 md:p-8 space-y-4 md:space-y-6 transition-all
        bg-white border-brand-soft 
        dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 text-brand-light">
          <FiBriefcase size={18} />
          <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest text-brand-light dark:text-slate-300">Operations</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: "Attendance Logs", path: "/admin/attendance" },
            { label: "Exams & Grading", path: "/admin/exams" },
            { label: "Fee Management", path: "/admin/fees" }
          ].map((item) => (
            <Link href={item.path} key={item.label} className="w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[11px] uppercase transition-all flex justify-between items-center group
              bg-brand-soft/10 text-brand-light active:bg-brand-soft/30
              dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:border dark:border-slate-800/50">
              {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 group-hover:text-brand-light transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Logistics Block - Static Brand Color for Contrast */}
      <div className="bg-brand-light rounded-[1.8rem] md:rounded-[2.5rem] p-6 md:p-8 text-white space-y-4 md:space-y-6 shadow-xl shadow-brand-soft/50 dark:shadow-brand-light/10">
        <div className="flex items-center gap-3">
          <FiBell size={18} />
          <h3 className="font-black uppercase text-[10px] md:text-xs tracking-widest">Logistics</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            { label: "Transport Tracking", icon: <FiTruck size={14} />, path: "/admin/transport" },
            { label: "Notice Board", icon: <FiBell size={14} />, path: "/admin/notices" },
            { label: "Event Calendar", icon: <FiCalendar size={14} />, path: "/admin/calendar" }
          ].map((item) => (
            <Link href={item.path} key={item.label} className="w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/10 text-white font-bold text-[10px] md:text-[11px] uppercase active:bg-white/20 transition-all flex justify-between items-center group">
              {item.label} <span className="opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">{item.icon}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  </div>
);
}