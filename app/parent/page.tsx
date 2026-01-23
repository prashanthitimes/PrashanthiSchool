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

  // Get localStorage values in client-side effect
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

  if (!childId) return <p>Loading...</p>; // avoid render before localStorage is loaded

  return (
    <div className="space-y-10 p-6 pt-10 bg-white min-h-screen animate-in fade-in duration-700">
      {/* --- SOFT BRAND PARENT BANNER --- */}
      <section className="relative overflow-hidden bg-brand-soft/40 rounded-[2.5rem] p-10 md:p-14 border border-brand-soft">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-light/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-brand-light mb-4 tracking-tighter uppercase">
              Hello, {parentName?.split(' ')[0] || "Parent"}!
            </h1>
            <p className="text-brand-light/70 text-lg font-bold leading-relaxed">
              Tracking progress for <span className="text-brand-light underline decoration-2 underline-offset-4">{childData?.full_name || "Student"}</span>.
              Class {childData?.class_name}-{childData?.section} systems are updated.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/parent/marks" className="bg-brand-light text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-soft hover:scale-105 transition-all">
                View Report Card
              </Link>
              <Link href="/parent/contact" className="bg-white border border-brand-soft text-brand-light px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-soft/20 transition-all">
                Contact Teacher
              </Link>
            </div>
          </div>
          <div className="hidden lg:block bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-brand-soft shadow-sm text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-light/60 mb-2 font-black">Term Progress</p>
            <p className="text-3xl font-black text-brand-light italic">65% DONE</p>
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
            <Link href={stat.path} key={index} className="bg-white p-8 rounded-[2.5rem] border border-brand-soft hover:bg-brand-soft/20 transition-all group flex flex-col gap-4">
              <div className="text-brand-light group-hover:scale-110 transition-transform duration-300"><stat.icon size={28} />

              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-brand-light/40 tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-black text-brand-light mt-1 tracking-tighter">
                  {loading ? "..." : stat.count}
                </p>
              </div>
            </Link>
          ))}
      </div>

      {/* --- MANAGEMENT COMMAND CENTER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Academic Overview */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-light">
            <FiBookOpen size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Academic Track</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Exam Marks", path: "/parent/marks" },
              { label: "Homework Status", path: "/parent/homework" },
              { label: "Class Timetable", path: "/parent/exams" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-brand-soft/10 text-brand-light font-bold text-[11px] uppercase hover:bg-brand-soft/30 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Services & Support */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand-light">
            <FiBriefcase size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Support</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Fee Statements", path: "/parent/fees" },
              { label: "Transport Details", path: "/parent/transport" },
              { label: "Profile Settings", path: "/parent/profile" }
            ].map((item) => (
              <Link href={item.path} key={item.label} className="w-full text-left p-4 rounded-2xl bg-brand-soft/10 text-brand-light font-bold text-[11px] uppercase hover:bg-brand-soft/30 transition-all flex justify-between items-center group">
                {item.label} <FiChevronRight className="opacity-40 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Communication Block (High Contrast) */}
        <div className="bg-brand-light rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-brand-soft">
          <div className="flex items-center gap-3">
            <FiBell size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest text-white/80">Updates</h3>
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
                className="w-full text-left p-4 rounded-2xl bg-white/10 text-white font-bold text-[11px] uppercase hover:bg-white/20 transition-all flex justify-between items-center group"
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