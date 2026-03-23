"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiBookOpen, FiActivity, FiCalendar,
  FiCreditCard, FiChevronRight, FiBriefcase,
  FiBell, FiTruck
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [childData, setChildData] = useState<any>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>("");

  const [stats, setStats] = useState({
    attendance: "0%",
    homeworkPending: 0,
    upcomingExams: 0,
    feeStatus: "Checking...",
  });

  useEffect(() => {
    const storedChildId = localStorage.getItem("childId");
    setChildId(storedChildId);
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

      // 1. FETCH STUDENT
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .single();

      if (!student) return;

      setChildData(student);
      setParentName(student.father_name || "Parent");

      const today = new Date().toISOString().split('T')[0];

      // --- DATA NORMALIZATION ---
      // This turns "10th" or "10-A" into just "10" for the homework table
      const classNumOnly = student.class_name.replace(/\D/g, ""); 
      // This creates "10-A" to match your Exams ARRAY format
      const classSectionTag = `${classNumOnly}-${student.section}`;

      // --- 2. ATTENDANCE ---
      const { data: attData } = await supabase
        .from("daily_attendance")
        .select("status")
        .eq("student_id", childId);

      let attendancePercentage = "0%";
      if (attData && attData.length > 0) {
        const presentCount = attData.filter(a => ['present', 'late'].includes(a.status)).length;
        attendancePercentage = Math.round((presentCount / attData.length) * 100) + "%";
      }

      // --- 3. HOMEWORK COUNT ---
      // Uses 'classNumOnly' (10) and 'section' (A)
      const { count: hwCount } = await supabase
        .from("homework")
        .select("*", { count: 'exact', head: true })
        .eq("class_name", classNumOnly)
        .eq("section", student.section)
        .gte("due_date", today);

      // --- 4. UPCOMING EXAMS COUNT ---
      // Matches the string "10-A" inside the ARRAY in the exams table
      const { count: exCount } = await supabase
        .from("exams")
        .select("*", { count: 'exact', head: true })
        .contains("classes", [classSectionTag]) 
        .gte("end_date", today);

      // --- 5. FEE STATUS CALCULATION ---
      // Note: If class_fees table uses "10th", use student.class_name. 
      // If it uses "10", use classNumOnly.
      const { data: classFees } = await supabase
        .from("class_fees")
        .select("fee_type")
        .eq("class", student.class_name);

      const { data: transport } = await supabase
        .from("transport_assignments")
        .select("id")
        .eq("student_id", childId)
        .eq("status", "active")
        .maybeSingle();

      const { data: verified } = await supabase.from("student_fees").select("fee_type").eq("student_id", childId);
      const { data: pending } = await supabase.from("fee_submissions").select("fee_types").eq("student_id", childId).eq("status", "pending");

      let allRequired = (classFees || []).map(f => f.fee_type.toLowerCase());
      if (transport) allRequired.push("transport fee");

      const doneTypes = [
        ...(verified || []).map(v => v.fee_type.toLowerCase()),
        ...(pending || []).flatMap(p => p.fee_types ? p.fee_types.toLowerCase().split(", ") : [])
      ];

      const remainingCount = allRequired.filter(type => !doneTypes.includes(type)).length;

      // 6. UPDATE STATE
      setStats({
        attendance: attendancePercentage,
        homeworkPending: hwCount || 0,
        upcomingExams: exCount || 0,
        feeStatus: remainingCount > 0 ? `${remainingCount} Pending` : "Fully Paid",
      });

    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }
  if (!childId) return <div className="p-20 text-center font-black animate-pulse">LOADING PROFILE...</div>;

  return (
    <div className="space-y-10 p-6 bg-[#fffcfd] dark:bg-slate-950 animate-in fade-in duration-700 pt-[calc(env(safe-area-inset-top)+2.5rem)] transition-colors">

      {/* --- HERO BANNER --- */}
      <section className="relative overflow-hidden bg-brand/10 dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-14 border border-[#e9d1e4] dark:border-slate-800">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tighter uppercase leading-none">
              Welcome back, {parentName?.split(' ')[0] || "Parent"}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-bold leading-relaxed">
              Monitoring <span className="text-brand dark:text-brand-soft underline decoration-2 underline-offset-4">{childData?.full_name}</span> in Class {childData?.class_name}-{childData?.section}.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/parent/marks" className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all">
                Report Card
              </Link>
              <Link href="/parent/fees" className="bg-white dark:bg-slate-800 border border-[#e9d1e4] dark:border-slate-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                Pay Fees
              </Link>
            </div>
          </div>
          
        </div>
      </section>

      {/* --- DYNAMIC STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Attendance", count: stats.attendance, icon: FiActivity, path: "/parent/attendance", color: "text-blue-500" },
          { label: "Pending Homework", count: stats.homeworkPending, icon: FiBookOpen, path: "/parent/homework", color: "text-purple-500" },
          { label: "Active Exams", count: stats.upcomingExams, icon: FiCalendar, path: "/parent/exams", color: "text-orange-500" },
          { label: "Fees Due", count: stats.feeStatus, icon: FiCreditCard, path: "/parent/fees", color: "text-brand" },
        ].map((stat, index) => (
          <Link href={stat.path} key={index} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group flex flex-col gap-4">
            <div className={`${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 tracking-tighter">
                {loading ? "---" : stat.count}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* --- MANAGEMENT CENTER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand">
            <FiBookOpen size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 dark:text-slate-100">Academic Track</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {["Exam Marks", "Homework Status", "Class Timetable"].map((label) => (
              <button key={label} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase hover:bg-brand/5 transition-all flex justify-between items-center group">
                {label} <FiChevronRight className="opacity-40 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-8 space-y-6">
          <div className="flex items-center gap-3 text-brand">
            <FiBriefcase size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 dark:text-slate-100">Services</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {["Fee Statements", "Transport Details", "Profile Settings"].map((label) => (
              <button key={label} className="w-full text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold text-[11px] uppercase hover:bg-brand/5 transition-all flex justify-between items-center group">
                {label} <FiChevronRight className="opacity-40 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-brand dark:bg-brand-soft rounded-[2.5rem] p-8 text-white dark:text-slate-950 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <FiBell size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest opacity-80">Quick Alerts</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/10 text-[11px] font-bold uppercase leading-relaxed">
              New Exam Schedule has been posted for {childData?.class_name}.
            </div>
            <div className="p-4 rounded-2xl bg-white/10 text-[11px] font-bold uppercase leading-relaxed">
              Transport Route #4 is running 10 mins late.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}