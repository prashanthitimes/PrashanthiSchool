"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FiActivity,
  FiChevronLeft, FiBookOpen, FiChevronDown,
  FiChevronRight,
  FiCheckCircle,
  FiXCircle
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths
} from "date-fns";

export default function ParentAttendance() {

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const childId = localStorage.getItem("childId");
    if (!childId) return;

    const [subRes, attRes] = await Promise.all([
      supabase.from("subjects").select("id,name"),
      supabase
        .from("attendance")
        .select(`*, subjects(id,name)`)
        .eq("student_id", childId)
    ]);

    setSubjects(subRes.data || []);
    setAttendanceLog(attRes.data || []);
    setLoading(false);
  }

  const filteredLogs = useMemo(() => {
    if (selectedSubject === "all") return attendanceLog;
    return attendanceLog.filter(l => l.subjects?.id === selectedSubject);
  }, [attendanceLog, selectedSubject]);

  const stats = useMemo(() => {
    const present = filteredLogs.filter(l => l.status === "present").length;
    const absent = filteredLogs.filter(l => l.status === "absent").length;
    return {
      present,
      absent,
      total: filteredLogs.length
    };
  }, [filteredLogs]);

  const dailyAttendance = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredLogs.forEach(log => {
      const d = log.date;

      if (!groups[d]) {
        groups[d] = { present: 0, absent: 0, periods: [] };
      }

      groups[d][log.status]++;
      groups[d].periods.push(log);
    });

    return groups;
  }, [filteredLogs]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);

  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  if (loading)
    return (
      <div className="flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    /* MAIN CANVAS: bg-[#fffcfd] | dark:bg-slate-950 */
    <div className=" bg-[#fffcfd] dark:bg-slate-950 pb-12 transition-colors duration-300">

      {/* HEADER: bg-slate-50 | dark:bg-slate-900 */}
      <div className="bg-slate-50 dark:bg-slate-900 p-6 md:p-10 rounded-b-[3rem] shadow-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FiActivity className="text-emerald-500 dark:text-emerald-400 text-xl" />
            <h1 className="font-bold text-lg md:text-xl text-slate-800 dark:text-slate-100">
              Student Portal
            </h1>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Attendance Tracking
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Academic Year 2025-26
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDE: FILTERS & STATS */}
          <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">

            {/* SUBJECT FILTER CARD */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">

              {/* Header with Icon */}
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-brand/10 dark:bg-brand-soft/10 rounded-lg">
                  <FiBookOpen size={14} className="text-brand dark:text-brand-soft" />
                </div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Subject Filter
                </label>
              </div>

              {/* Select Wrapper for custom arrow */}
              <div className="relative group">
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full appearance-none p-3.5 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 outline-none text-slate-800 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all cursor-pointer"
                >
                  <option value="all">Total School Attendance</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-900">
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* Custom Chevron Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                  <FiChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* STAT TILES: Ensure these use the dark mode version of StatTile */}
            {/* --- ATTENDANCE STATS ROW --- */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {/* Total Periods Tile */}
              <StatTile
                label="Total"
                value={stats.total}
                color="text-slate-600 dark:text-slate-400"
                bgColor="bg-slate-100 dark:bg-slate-900"
              // Note: If your StatTile supports custom classes, 
              // ensure it uses text-sm on mobile and text-2xl on desktop
              />

              {/* Present Tile */}
              <StatTile
                label="Present"
                value={stats.present}
                color="text-emerald-600 dark:text-emerald-400"
                bgColor="bg-emerald-50 dark:bg-emerald-950/30"
                icon={<FiCheckCircle size={14} />}
              />

              {/* Absent Tile */}
              <StatTile
                label="Absent"
                value={stats.absent}
                color="text-red-600 dark:text-red-400"
                bgColor="bg-red-50 dark:bg-red-950/30"
                icon={<FiXCircle size={14} />}
              />
            </div>
          </div>

          {/* CALENDAR SECTION */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">

              {/* COMPACT CALENDAR HEADER */}
              <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600"
                  >
                    <FiChevronLeft size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* WEEKDAYS (Reduced padding) */}
              <div className="grid grid-cols-7 text-center py-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-800/20">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* COMPACT DAYS GRID (Reduced h-16/20 to h-10/12) */}
              <div className="grid grid-cols-7 gap-1 p-2 md:p-3">
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayData = dailyAttendance[dateStr];
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  const isAbsent = dayData?.absent > 0;
                  const isPresent = dayData?.present > 0 && !isAbsent;

                  return (
                    <div
                      key={i}
                      /* REDUCED HEIGHT: Changed from h-16/20 to h-10/12 */
                      className={`h-16 md:h-19 rounded-lg flex flex-col items-center justify-center border transition-all duration-200
            ${!isCurrentMonth ? "opacity-20 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-default"}
            ${isAbsent
                          ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30"
                          : isPresent
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30"
                            : "bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800"}
            `}
                    >
                      <span className={`font-black text-[11px] ${isAbsent ? "text-red-600" : isPresent ? "text-emerald-700" : "text-slate-700 dark:text-slate-300"}`}>
                        {format(day, "d")}
                      </span>

                      {/* Compact period indicators */}
                      {dayData && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayData.periods.slice(0, 4).map((p: any, i: number) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${p.status === "present" ? "bg-emerald-500" : "bg-red-500"}`}
                            />
                          ))}
                        </div>
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

function StatTile({ label, value, color, bg, icon }: any) {
  return (
    <div className={`${bg} p-3 md:p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center transition-all hover:scale-[1.02] shadow-sm`}>

      {/* Icon: Smaller and more subtle */}
      {icon && (
        <div className={`mb-1 opacity-80 ${color}`}>
{React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })}
        </div>
      )}

      {/* Value: Balanced size with tabular-nums for alignment */}
      <span className={`text-xl md:text-2xl font-black tracking-tight tabular-nums ${color}`}>
        {value}
      </span>

      {/* Label: Smaller, high-letter spacing for a premium look */}
      <span className="text-[9px] md:text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.1em] mt-0.5">
        {label}
      </span>

    </div>
  );
}