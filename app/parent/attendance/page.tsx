"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FiChevronLeft, FiSun, FiMoon, FiChevronRight,
  FiCheckCircle, FiXCircle, FiCalendar, FiBarChart2
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
  subMonths,
  isToday
} from "date-fns";

export default function ResponsiveAttendance() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [academicYear, setAcademicYear] = useState(""); // New State
  const [selectedSession, setSelectedSession] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    fetchSchoolSettings(); // Fetch settings on load
  }, []);

  async function fetchSchoolSettings() {
    const { data, error } = await supabase
      .from("school_settings")
      .select("academic_start_year, academic_end_year")
      .eq("id", 1)
      .single();

    if (!error && data) {
      setAcademicYear(`${data.academic_start_year}-${data.academic_end_year}`);
    }
  }

  async function fetchInitialData() {
    const childId = localStorage.getItem("childId");
    if (!childId) return;

    const { data, error } = await supabase
      .from("daily_attendance")
      .select(`*`)
      .eq("student_id", childId)
      .order('date', { ascending: false });

    if (!error) {
      setAttendanceLog(data || []);
    }
    setLoading(false);
  }

  // Memoized stats and daily data
  const filteredLogs = useMemo(() => {
    if (selectedSession === "all") return attendanceLog;
    return attendanceLog.filter(l => l.session === selectedSession);
  }, [attendanceLog, selectedSession]);

  const stats = useMemo(() => {
    const present = filteredLogs.filter(l => l.status === "present").length;
    const absent = filteredLogs.filter(l => l.status === "absent").length;
    return { present, absent, total: filteredLogs.length };
  }, [filteredLogs]);

  const dailyAttendance = useMemo(() => {
    const groups: Record<string, any> = {};
    attendanceLog.forEach(log => {
      const d = log.date;
      if (!groups[d]) groups[d] = { morning: null, afternoon: null };
      if (log.session === 'morning') groups[d].morning = log.status;
      if (log.session === 'afternoon') groups[d].afternoon = log.status;
    });
    return groups;
  }, [attendanceLog]);

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  if (loading) return (
    <div className="flex  items-center justify-center bg-brand-soft/20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-light border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-brand-light animate-pulse tracking-widest text-xs">LOADING...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#fafafa] dark:bg-slate-950 pb-10">
      {/* --- RESPONSIVE HEADER & STATS --- */}
      <div className="bg-white dark:bg-slate-900 border-b border-brand-soft shadow-sm sticky top-0 z-30">
        <div className="max-w-8xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-brand-soft p-2 rounded-xl text-brand-dark shadow-sm">
                <FiCalendar size={20} />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-none text-brand-dark">Attendance</h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   Academic Year {academicYear || "Loading..."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:w-auto w-full">
              <StatBox label="Sessions" value={stats.total} color="text-slate-600" />
              <StatBox label="Present" value={stats.present} color="text-emerald-500" icon={<FiCheckCircle />} />
              <StatBox label="Absent" value={stats.absent} color="text-rose-500" icon={<FiXCircle />} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 mt-6">
        {/* --- SESSION FILTER --- */}
        <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['all', 'morning', 'afternoon'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSession(s)}
              className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap border-2 ${selectedSession === s
                ? "bg-brand-light border-brand-light text-white shadow-md shadow-brand-soft"
                : "bg-white border-brand-soft text-brand-light hover:bg-brand-soft/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* --- CALENDAR CARD --- */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-soft overflow-hidden shadow-lg shadow-brand-soft/5">
          {/* Calendar Nav */}
          <div className="bg-brand-soft/10 px-6 py-3 flex justify-between items-center border-b border-brand-soft">
            <h2 className="text-xs md:text-sm font-black text-brand-dark uppercase tracking-widest">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1.5">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 bg-white rounded-lg border border-brand-soft hover:text-brand-light transition-all shadow-sm"><FiChevronLeft size={16}/></button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 bg-white rounded-lg border border-brand-soft hover:text-brand-light transition-all shadow-sm"><FiChevronRight size={16}/></button>
            </div>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 text-center py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 bg-slate-50/30">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, index) => (
              <span key={`desktop-${index}`} className="hidden md:block">{d}</span>
            ))}
            {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
              <span key={`mobile-${index}`} className="block md:hidden">{d}</span>
            ))}
          </div>

          {/* COMPACT Grid */}
          <div className="grid grid-cols-7 bg-slate-100 gap-px">
            {calendarDays.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const data = dailyAttendance[dateStr];
              const isCurrent = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={i}
                  className={`relative aspect-square md:aspect-auto md:min-h-[75px] p-1 md:p-2 bg-white transition-all ${!isCurrent && "opacity-25"}`}
                >
                  <span className={`text-[10px] md:text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-md mb-1 ${isTodayDate ? 'bg-brand-light text-white' : 'text-slate-400'}`}>
                    {format(day, "d")}
                  </span>

                  <div className="hidden md:flex flex-col gap-1">
                    {data?.morning && <SessionBadge type="morning" status={data.morning} />}
                    {data?.afternoon && <SessionBadge type="afternoon" status={data.afternoon} />}
                  </div>

                  <div className="flex md:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 gap-0.5">
                    {data?.morning && <div className={`w-1 h-1 rounded-full ${data.morning === 'present' ? 'bg-emerald-400' : 'bg-rose-400'}`} />}
                    {data?.afternoon && <div className={`w-1 h-1 rounded-full ${data.afternoon === 'present' ? 'bg-emerald-400' : 'bg-rose-400'}`} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend for Mobile */}
        <div className="flex md:hidden justify-center gap-4 mt-6">
          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Present
          </div>
          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Absent
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }: any) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-brand-soft flex items-center gap-2 flex-1 md:min-w-[120px]">
      <div className={`p-1.5 rounded-lg bg-white shadow-sm ${color} hidden sm:block`}>
        {icon ? React.cloneElement(icon, { size: 14 }) : <FiBarChart2 size={14}/>}
      </div>
      <div className="text-center sm:text-left">
        <p className={`text-sm md:text-lg font-black leading-none ${color}`}>{value}</p>
        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SessionBadge({ type, status }: { type: 'morning' | 'afternoon', status: string }) {
  const isPresent = status === 'present';
  return (
    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-tighter ${isPresent
        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
        : 'bg-rose-50/50 border-rose-100 text-rose-600'
      }`}>
      {type === 'morning' ? <FiSun size={8} /> : <FiMoon size={8} />}
      <span className="truncate">{status}</span>
    </div>
  );
}