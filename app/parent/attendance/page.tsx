"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FiActivity,
  FiChevronLeft, FiSun, FiMoon, FiChevronDown,
  FiChevronRight,
  FiCheckCircle,
  FiXCircle,
  FiCalendar
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
  const [selectedSession, setSelectedSession] = useState("all"); // 'all', 'morning', 'afternoon'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const childId = localStorage.getItem("childId");
    if (!childId) return;

    // Fetch from the NEW daily_attendance table
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

  // Filter logs based on Morning/Afternoon toggle
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
      if (!groups[d]) {
        groups[d] = { morning: null, afternoon: null };
      }
      // Store status per session
      if (log.session === 'morning') groups[d].morning = log.status;
      if (log.session === 'afternoon') groups[d].afternoon = log.status;
    });

    return groups;
  }, [attendanceLog]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd)
  });

  if (loading) return <div className="p-20 text-center font-black animate-pulse text-slate-400">LOADING RECORDS...</div>;

  return (
    <div className="min-h-screen bg-[#fffcfd] dark:bg-slate-950 pb-12 transition-colors">
      
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-b-[2rem] shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiCalendar className="text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Portal</span>
            </div>
            <h1 className="font-black text-2xl text-slate-800 dark:text-slate-100">Attendance History</h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase text-slate-400">Academic Year</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">2025-26</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT SIDE: STATS & SESSION FILTER */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* SESSION SELECTOR */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">View Session</label>
              <div className="grid grid-cols-3 gap-2">
                {['all', 'morning', 'afternoon'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSession(s)}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                      selectedSession === s 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* STAT TILES */}
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="Records" value={stats.total} color="text-slate-600" bg="bg-white" />
              <StatTile label="Present" value={stats.present} color="text-emerald-600" bg="bg-emerald-50/50" icon={<FiCheckCircle/>} />
              <StatTile label="Absent" value={stats.absent} color="text-rose-600" bg="bg-rose-50/50" icon={<FiXCircle/>} />
            </div>
          </div>

          {/* CALENDAR */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              
              <div className="flex justify-between items-center p-6 border-b border-slate-50 dark:border-slate-800">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl border hover:bg-slate-50 transition-colors"><FiChevronLeft/></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl border hover:bg-slate-50 transition-colors"><FiChevronRight/></button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <span key={d}>{d}</span>)}
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const data = dailyAttendance[dateStr];
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  // LOGIC: A day is marked RED if ANY session was 'absent'
                  const hasAbsence = data?.morning === 'absent' || data?.afternoon === 'absent';
                  const hasPresence = data?.morning === 'present' || data?.afternoon === 'present';

                  return (
                    <div key={i} className={`h-24 md:h-32 p-2 bg-white dark:bg-slate-900 transition-colors ${!isCurrentMonth && "opacity-20"}`}>
                      <span className="text-xs font-black text-slate-300 mb-2 block">{format(day, "d")}</span>
                      
                      {data && (
                        <div className="space-y-1">
                          {/* Morning Indicator */}
                          {data.morning && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${data.morning === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              <FiSun size={8}/> {data.morning}
                            </div>
                          )}
                          {/* Afternoon Indicator */}
                          {data.afternoon && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${data.afternoon === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              <FiMoon size={8}/> {data.afternoon}
                            </div>
                          )}
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
    <div className={`${bg} p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center`}>
      {icon && <div className={`${color} mb-1 opacity-60`}>{icon}</div>}
      <span className={`text-xl font-black ${color}`}>{value}</span>
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</span>
    </div>
  );
}