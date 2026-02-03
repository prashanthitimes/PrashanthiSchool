"use client";

import React, { useState, useEffect } from "react";
import { FiBarChart2, FiCalendar, FiActivity, FiClock } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentAttendance() {
  const [subjectStats, setSubjectStats] = useState<any[]>([]);
  const [attendanceLog, setAttendanceLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const { data, error } = await supabase
        .from("attendance")
        .select(`*, subjects (name)`)
        .eq("student_id", childId)
        .order('date', { ascending: false });

      if (error) throw error;

      const statsMap: { [key: string]: any } = {};
      data?.forEach((record) => {
        const subjectName = record.subjects?.name || "General";
        if (!statsMap[subjectName]) {
          statsMap[subjectName] = { name: subjectName, total: 0, present: 0 };
        }
        statsMap[subjectName].total += 1;
        if (record.status === 'present' || record.status === 'late') {
          statsMap[subjectName].present += 1;
        }
      });

      const formattedStats = Object.values(statsMap).map((s: any) => ({
        ...s,
        percentage: Math.round((s.present / s.total) * 100)
      }));

      setSubjectStats(formattedStats);
      setAttendanceLog(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    // Reduced padding on mobile (p-4) vs desktop (p-6/p-8)
    <div className="space-y-6 md:space-y-8 p-4 md:p-6 bg-white min-h-screen animate-in fade-in duration-700 pb-20 md:pb-8">
      
      {/* --- HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiActivity size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-brand-light tracking-tighter uppercase leading-none mb-1">Attendance</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">Session 2026-27 Analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-brand-soft text-[9px] md:text-[10px] font-black text-brand-light uppercase tracking-widest">
                {subjectStats.length} Subjects
            </div>
            <div className="bg-brand-light px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest">
                Term Active
            </div>
        </div>
      </header>

      {/* --- SUBJECT-WISE PROGRESS GRID --- */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-28 md:h-32 bg-brand-soft/10 animate-pulse rounded-[1.5rem] md:rounded-[2rem] border border-brand-soft/20"></div>)
        ) : subjectStats.map((sub) => (
          <div key={sub.name} className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-brand-soft hover:bg-brand-soft/20 transition-all shadow-sm">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <span className="text-[9px] md:text-[10px] font-black text-brand-light/40 uppercase tracking-widest truncate max-w-[70%]">{sub.name}</span>
              <span className={`text-xs font-black ${sub.percentage < 75 ? 'text-rose-500' : 'text-brand-light'}`}>
                {sub.percentage}%
              </span>
            </div>
            <div className="w-full bg-brand-soft/30 h-1.5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${sub.percentage < 75 ? 'bg-rose-400' : 'bg-brand-light'}`} 
                    style={{ width: `${sub.percentage}%` }}
                ></div>
            </div>
          </div>
        ))}
      </div>

      {/* --- LOG SECTION --- */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-brand-soft overflow-hidden shadow-sm">
        <div className="p-5 md:p-8 border-b border-brand-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="text-brand-light" size={20} />
            <h3 className="text-xs md:text-sm font-black text-brand-light uppercase tracking-widest">History Log</h3>
          </div>
        </div>

        {/* Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-soft/10">
                <th className="px-8 py-4 text-[9px] font-black uppercase text-brand-light/50 tracking-widest">Date</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-brand-light/50 tracking-widest">Subject</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-brand-light/50 tracking-widest text-center">Period</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-brand-light/50 tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/20">
              {attendanceLog.map((record) => (
                <tr key={record.id} className="hover:bg-brand-accent/30 transition-colors">
                  <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <FiCalendar size={14} className="text-brand-light/40" />
                        <span className="text-xs font-bold text-brand-light italic">{record.date}</span>
                      </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-brand-light uppercase tracking-tight">{record.subjects?.name}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-[10px] font-black text-brand-light/40">P{record.period}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List - Shown only on Mobile */}
        <div className="md:hidden divide-y divide-brand-soft/20">
          {attendanceLog.map((record) => (
            <div key={record.id} className="p-5 flex flex-col gap-3 hover:bg-brand-soft/5 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black text-brand-light uppercase tracking-tight">{record.subjects?.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-brand-light/50 font-bold">
                    <FiCalendar size={12} />
                    <span>{record.date}</span>
                  </div>
                </div>
                <StatusBadge status={record.status} />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-brand-light/40 uppercase">
                <FiClock size={12} />
                <span>Period {record.period}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper Component for Status Badges to keep code clean
function StatusBadge({ status }: { status: string }) {
  const styles = {
    present: 'bg-emerald-50 text-emerald-600',
    absent: 'bg-rose-50 text-rose-600',
    late: 'bg-amber-50 text-amber-600'
  }[status] || 'bg-slate-50 text-slate-600';

  return (
    <span className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest ${styles}`}>
      {status}
    </span>
  );
}