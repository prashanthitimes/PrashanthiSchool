"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FiActivity, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, FiCalendar, FiInfo } from "react-icons/fi";
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

  // 1. Filter logs based on subject
  const filteredLogs = useMemo(() => {
    if (selectedSubject === "all") return attendanceLog;
    return attendanceLog.filter(log => log.subjects?.id === selectedSubject);
  }, [attendanceLog, selectedSubject]);

  // 2. Stats Calculation (Counts every period recorded)
  const stats = useMemo(() => {
    const p = filteredLogs.filter(l => l.status === 'present').length;
    const a = filteredLogs.filter(l => l.status === 'absent').length;
    const l = filteredLogs.filter(l => l.status === 'late').length;
    return { present: p, absent: a, late: l, total: filteredLogs.length };
  }, [filteredLogs]);

  // 3. Calendar Aggregation (Groups multiple periods into one day view)
  const dailyAttendance = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredLogs.forEach(log => {
      const dateStr = log.date;
      if (!groups[dateStr]) {
        groups[dateStr] = { present: 0, absent: 0, late: 0, periods: [] };
      }
      groups[dateStr][log.status]++;
      groups[dateStr].periods.push(log);
    });

    return groups;
  }, [filteredLogs]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans">
      {/* --- HEADER --- */}
      <div className="bg-slate-900 p-6 md:p-10 rounded-b-[3rem] shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FiActivity className="text-emerald-400 text-xl" />
            </div>
            <h1 className="text-white font-bold text-lg md:text-xl uppercase tracking-tighter">Student Portal</h1>
          </div>
          <div className="text-right">
             <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Attendance Tracking</p>
             <p className="text-white font-bold text-sm">Academic Year 2025-26</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: SUBJECT & STATS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Subject Filter</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-2 border-transparent focus:border-slate-900 outline-none transition-all cursor-pointer"
              >
                <option value="all">Total School Attendance</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <StatTile label="Total Periods" value={stats.total} color="text-slate-400" bgColor="bg-slate-50" />
              <div className="grid grid-cols-2 gap-4">
                <StatTile label="Present" value={stats.present} color="text-emerald-600" bgColor="bg-emerald-50" icon={<FiCheckCircle />} />
                <StatTile label="Absent" value={stats.absent} color="text-red-600" bgColor="bg-red-50" icon={<FiXCircle />} />
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <FiInfo />
                <span className="text-xs font-black uppercase">Note</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Counts represent total periods attended. The calendar displays summarized daily status.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: CALENDAR */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-8 flex justify-between items-center border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-800">{format(currentMonth, "MMMM yyyy")}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-900 hover:text-white transition-all"><FiChevronLeft /></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-900 hover:text-white transition-all"><FiChevronRight /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center py-4 bg-slate-50/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 p-4 md:p-8">
                {calendarDays.map((day, idx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayData = dailyAttendance[dateStr];
                  const isCurrentMonth = isSameMonth(day, monthStart);

                  // Logic for visual indicator
                  // If absent for ANY period, we mark it red to alert the parent
                  const isAbsent = dayData?.absent > 0;
                  const isPresent = dayData?.present > 0 && dayData?.absent === 0;

                  return (
                    <div
                      key={idx}
                      className={`relative h-16 md:h-24 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                        !isCurrentMonth ? "opacity-0 pointer-events-none" : "hover:shadow-md"
                      } ${
                        isAbsent ? "bg-red-50 border-red-200" : 
                        isPresent ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"
                      }`}
                    >
                      <span className={`text-lg md:text-xl font-black ${
                        isAbsent ? "text-red-600" : isPresent ? "text-emerald-700" : "text-slate-300"
                      }`}>
                        {format(day, "d")}
                      </span>
                      
                      {dayData && (
                        <div className="flex gap-1 mt-1">
                          {/* Tiny dots representing periods */}
                          {dayData.periods.map((p: any, i: number) => (
                            <div 
                              key={i} 
                              title={`Period ${p.period}: ${p.status}`}
                              className={`w-1.5 h-1.5 rounded-full ${p.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`}
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

function StatTile({ label, value, color, bgColor, icon }: any) {
  return (
    <div className={`${bgColor} p-6 rounded-[2rem] border border-black/5 flex flex-col items-center justify-center text-center`}>
      {icon && <div className={`text-xl mb-2 ${color}`}>{icon}</div>}
      <span className={`text-3xl font-black ${color}`}>{value}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}