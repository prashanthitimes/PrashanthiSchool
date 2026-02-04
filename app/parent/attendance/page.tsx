"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiActivity, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, FiFileText, FiCalendar } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from "date-fns";

export default function ParentAttendance() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const [subRes, attRes] = await Promise.all([
        supabase.from("subjects").select("id, name"),
        supabase.from("attendance").select(`*, subjects (id, name)`).eq("student_id", childId)
      ]);

      setSubjects(subRes.data || []);
      setAttendanceLog(attRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = useMemo(() => {
    if (selectedSubject === "all") return attendanceLog;
    return attendanceLog.filter(log => log.subjects?.id === selectedSubject);
  }, [attendanceLog, selectedSubject]);

  const stats = useMemo(() => {
    // Totals for the selected subject (Academic Year)
    const p = filteredLogs.filter(l => l.status === 'present').length;
    const l = filteredLogs.filter(l => l.status === 'leave').length;
    const a = filteredLogs.filter(l => l.status === 'absent').length;
    return { present: p, leave: l, totalAbsent: a + l };
  }, [filteredLogs]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayData = (day: Date) => {
    return filteredLogs.find(log => isSameDay(new Date(log.date), day));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand">Loading...</div>;

  return (
    <div className="min-h-screen bg-brand-accent/30 pb-12 font-sans">

      {/* --- MINIMAL HEADER --- */}
      <div className="bg-brand p-6 md:p-10 rounded-b-[2rem] md:rounded-b-[3rem] shadow-lg shadow-brand/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <FiActivity className="text-white text-xl" />
            </div>
            <h1 className="text-white font-bold text-lg md:text-xl uppercase tracking-wider">Attendance</h1>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-white/80 text-xs font-medium">Vyshnavi</span>
            <div className="w-8 h-8 bg-brand-soft text-brand-dark rounded-full flex items-center justify-center font-bold text-sm">V</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">

        {/* --- DESKTOP/MOBILE RESPONSIVE GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT SIDE: SUBJECT & STATS (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Subject Selector Card */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-brand-soft">
              <label className="text-[10px] font-black text-brand uppercase tracking-widest block mb-3 opacity-60 px-1">Subject Analysis</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-4 bg-brand-soft/30 rounded-2xl font-bold text-brand-dark border-none outline-none appearance-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
              <StatTile label="Present" value={stats.present} color="text-slate-800" icon={<FiCheckCircle />} />
              <StatTile label="Absent" value={stats.totalAbsent} color="text-red-500" icon={<FiXCircle />} />
            </div>

            {/* Legend for Holidays */}
            <div className="hidden lg:block bg-brand-soft/20 p-5 rounded-3xl border border-brand-soft/50">
              <h4 className="text-[10px] font-black text-brand uppercase mb-3">Calendar Guide</h4>
              <div className="space-y-2">
                <LegendRow color="bg-red-500" label="Absent/Leave" />
                <LegendRow color="bg-slate-800" label="Present" />
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: CALENDAR (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-brand/5 border border-brand-soft overflow-hidden">

              {/* Calendar Header */}
              <div className="bg-brand-soft/30 p-6 flex justify-between items-center border-b border-brand-soft/50">
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-brand-light" />
                  <h2 className="text-xl font-bold text-brand-dark">{format(currentMonth, "MMMM yyyy")}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-white rounded-xl hover:bg-brand-light hover:text-white transition-colors"><FiChevronLeft /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-white rounded-xl hover:bg-brand-light hover:text-white transition-colors"><FiChevronRight /></button>
                </div>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 text-center pt-6 pb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d} className="text-[10px] font-black text-brand/40 uppercase tracking-widest">{d}</span>
                ))}
              </div>

              {/* Calendar Days */}
           {/* Calendar Days */}
<div className="grid grid-cols-7 gap-3 p-6 pt-2">
  {calendarDays.map((day, idx) => {
    const record = getDayData(day);
    const isCurrentMonth = isSameMonth(day, monthStart);

    const getBgColor = () => {
      if (!isCurrentMonth) return "bg-transparent";

      if (record?.status === "present") return "bg-emerald-500/20 border-emerald-500";
      if (record?.status === "absent") return "bg-red-500/20 border-red-500";
      if (record?.status === "leave") return "bg-yellow-500/20 border-yellow-500";
      if (record?.status === "holiday") return "bg-slate-500/20 border-slate-400";

      return "bg-white border-brand-soft/50";
    };

    const getTextColor = () => {
      if (!isCurrentMonth) return "text-slate-300";
      if (record?.status === "absent") return "text-red-600";
      if (record?.status === "present") return "text-emerald-700";
      if (record?.status === "leave") return "text-yellow-700";
      if (record?.status === "holiday") return "text-slate-600";
      return "text-slate-800";
    };

    return (
      <div
        key={idx}
        className={`h-14 md:h-20 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-all hover:scale-[1.03] ${getBgColor()}`}
      >
        <span className={`text-base md:text-xl font-bold ${getTextColor()}`}>
          {format(day, "d")}
        </span>

        {isCurrentMonth && record?.status && (
          <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">
            {record.status}
          </span>
        )}
      </div>
    );
  })}
</div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Sub-components to maintain code cleanliness
function StatTile({ label, value, color, icon }: any) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl border border-brand-soft shadow-sm flex flex-col items-center justify-center text-center">
      <div className={`text-lg mb-1 ${color}`}>{icon}</div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function LegendRow({ color, label }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-brand/60 uppercase">{label}</span>
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
    </div>
  );
}