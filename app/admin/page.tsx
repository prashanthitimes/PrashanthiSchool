"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Import Link for navigation
import {
  FiUsers, FiUserCheck, FiBookOpen, FiTrendingUp,
  FiLayers, FiSettings, FiBriefcase, FiTruck, FiBell, FiCalendar, FiBook, FiChevronRight
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

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

  return (
    <div className="space-y-10 p-6 pt-20 bg-white min-h-screen">

      {/* --- SOFT BRAND BANNER --- */}
      <section className="relative overflow-hidden bg-brand-soft/40 rounded-[2.5rem] p-10 md:p-14 border border-brand-soft">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-light/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-brand-light mb-4 tracking-tighter uppercase">
              Welcome Back, Admin
            </h1>
            <p className="text-brand-light/70 text-lg font-bold leading-relaxed">
              Academic systems are online. You have <span className="text-brand-light underline decoration-2 underline-offset-4">{counts.students} students</span> synced for the 2026-27 session.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/admin/notices" className="bg-brand-light text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-soft hover:scale-105 transition-all">
                Publish Notice
              </Link>
              <Link href="/admin/settings" className="bg-white border border-brand-soft text-brand-light px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-soft/20 transition-all">
                System Config
              </Link>
            </div>
          </div>
          <div className="hidden lg:block bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-brand-soft shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-light/60 mb-2 font-black text-center">Current Term</p>
            <p className="text-3xl font-black text-brand-light italic">JAN - JUN</p>
          </div>
        </div>
      </section>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { label: "Students", count: counts.students, icon: <FiUsers />, path: '/admin/students' },
            { label: "Faculty", count: counts.teachers, icon: <FiUserCheck />, path: '/admin/teachers' },
            { label: "Bus Routes", count: counts.transport_routes, icon: <FiTruck />, path: '/admin/transport' },
            { label: "Subjects", count: counts.subjects, icon: <FiBook />, path: '/admin/subjects' },
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

      {/* --- MANAGEMENT COMMAND CENTER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Academics Block */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-light">
            <FiBookOpen size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Academics</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
                { label: "Classes & Sections", path: "/admin/classes" },
                { label: "Subjects Management", path: "/admin/subjects" },
                { label: "Master Time Table", path: "/admin/timetable" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-brand-soft/10 text-brand-light font-bold text-[11px] uppercase hover:bg-brand-soft/30 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Operations Block */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-light">
            <FiBriefcase size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Operations</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
                { label: "Attendance Logs", path: "/admin/attendance" },
                { label: "Exams & Grading", path: "/admin/exams" },
                { label: "Fee Management", path: "/admin/fees" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-brand-soft/10 text-brand-light font-bold text-[11px] uppercase hover:bg-brand-soft/30 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Communication & Logistics */}
        <div className="bg-brand-light rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-brand-soft">
          <div className="flex items-center gap-3">
            <FiBell size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Logistics</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Transport Tracking", icon: <FiTruck />, path: "/admin/transport" },
              { label: "Notice Board", icon: <FiBell />, path: "/admin/notices" },
              { label: "Event Calendar", icon: <FiCalendar />, path: "/admin/calendar" }
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