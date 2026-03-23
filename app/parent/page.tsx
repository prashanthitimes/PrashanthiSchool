"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUser, FiCheckSquare, FiBookOpen, FiActivity,
  FiCalendar, FiArrowRight, FiCreditCard, FiAlertCircle,
  FiChevronRight, FiBriefcase, FiBell, FiTruck
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [childData, setChildData] = useState<any>(null);
  const [recentMarks, setRecentMarks] = useState<any[]>([]);
  const [parentName, setParentName] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    attendance: "0%",
    homeworkPending: 0,
    upcomingExams: 0,
    feeStatus: "Paid",
  });

  useEffect(() => {
    setParentName(localStorage.getItem('parentName'));
    setChildId(localStorage.getItem('childId'));
  }, []);

  useEffect(() => {
    if (childId) {
      fetchParentDashboardData();
    }
  }, [childId]);

  async function fetchParentDashboardData() {
    setLoading(true);
    try {
      if (!childId) return;

      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .single();

      if (student) {
        setChildData(student);
        const { data: marks } = await supabase
          .from("marks")
          .select(`*, subjects(name)`)
          .eq("student_id", childId)
          .order('created_at', { ascending: false })
          .limit(3);

        setRecentMarks(marks || []);
        setStats({
          attendance: "94%",
          homeworkPending: 2,
          upcomingExams: 1,
          feeStatus: "Up to date",
        });
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!childId) return <p className="p-10 dark:text-slate-100">Loading...</p>;

  return (
    <div className="space-y-10 p-6 bg-[#fffcfd] dark:bg-slate-950 animate-in fade-in duration-700 pt-[calc(env(safe-area-inset-top)+2.5rem)] transition-colors">
      
      {/* --- BRAND PARENT BANNER --- */}
      <section className="relative overflow-hidden bg-brand/10 dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-14 border border-[#e9d1e4] dark:border-slate-800">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tighter uppercase">
              Hello, {parentName?.split(' ')[0] || "Parent"}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-bold leading-relaxed">
              Tracking progress for <span className="text-brand dark:text-brand-soft underline decoration-2 underline-offset-4">{childData?.full_name || "Student"}</span>.
              Class {childData?.class_name}-{childData?.section} systems are updated.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/parent/marks" className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:scale-105 transition-all">
                View Report Card
              </Link>
              <Link href="/parent/contact" className="bg-white dark:bg-slate-800 border border-[#e9d1e4] dark:border-slate-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                Contact Teacher
              </Link>
            </div>
          </div>
          <div className="hidden lg:block bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8 rounded-[2rem] border border-[#e9d1e4] dark:border-slate-700 shadow-sm text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2 font-black">Term Progress</p>
            <p className="text-3xl font-black text-brand dark:text-brand-soft italic">65% DONE</p>
          </div>
        </div>
      </section>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Attendance", count: stats.attendance, icon: FiActivity, path: "/parent/attendance" },
          { label: "Homework", count: stats.homeworkPending, icon: FiBookOpen, path: "/parent/homework" },
          { label: "Exams", count: stats.upcomingExams, icon: FiCalendar, path: "/parent/exams" },
          { label: "Fees", count: stats.feeStatus, icon: FiCreditCard, path: "/parent/fees" },
        ]
          .map((stat, index) => (
            <Link href={stat.path} key={index} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex flex-col gap-4">
              <div className="text-brand dark:text-brand-soft group-hover:scale-110 transition-transform duration-300">
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1 tracking-tighter">
                  {loading ? "..." : stat.count}
                </p>
              </div>
            </Link>
          ))}
      </div>

      {/* --- MANAGEMENT COMMAND CENTER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Academic Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand dark:text-brand-soft">
            <FiBookOpen size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 dark:text-slate-100">Academic Track</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Exam Marks", path: "/parent/marks" },
              { label: "Homework Status", path: "/parent/homework" },
              { label: "Class Timetable", path: "/parent/exams" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase hover:bg-brand/5 dark:hover:bg-brand-soft/10 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Services & Support */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand dark:text-brand-soft">
            <FiBriefcase size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 dark:text-slate-100">Support</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Fee Statements", path: "/parent/fees" },
              { label: "Transport Details", path: "/parent/transport" },
              { label: "Profile Settings", path: "/parent/profile" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase hover:bg-brand/5 dark:hover:bg-brand-soft/10 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Communication Block - This one stays dark/colored to act as a Focal Point */}
        <div className="bg-brand dark:bg-brand-soft rounded-[2.5rem] p-8 text-white dark:text-slate-950 space-y-6 shadow-xl shadow-brand/20">
          <div className="flex items-center gap-3">
            <FiBell size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest opacity-80">Updates</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "School Notices", icon: FiBell, path: "/parent/notices" },
              { label: "Transport Alerts", icon: FiTruck, path: "/parent/transport" },
              { label: "Upcoming Events", icon: FiCalendar, path: "/parent/exams" },
            ].map((item) => (
              <Link
                href={item.path}
                key={item.label}
                className="w-full text-left p-4 rounded-2xl bg-white/10 dark:bg-slate-950/10 font-bold text-[11px] uppercase hover:bg-white/20 transition-all flex justify-between items-center group"
              >
                {item.label}
                <span className="opacity-50 group-hover:opacity-100">
                  <item.icon size={18} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}