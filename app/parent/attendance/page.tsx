"use client";

import React, { useState, useEffect } from "react";
import { FiBook, FiBarChart2, FiCalendar, FiActivity } from "react-icons/fi";
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
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- SMALL COMPACT HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiActivity size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase">Attendance</h1>
            <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">Session 2026-27 Analysis</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest">
                {subjectStats.length} Subjects
            </div>
            <div className="bg-brand-light px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
                Term Active
            </div>
        </div>
      </header>

      {/* --- SUBJECT-WISE PROGRESS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-brand-soft/10 animate-pulse rounded-[2rem] border border-brand-soft/20"></div>)
        ) : subjectStats.map((sub) => (
          <div key={sub.name} className="bg-white p-6 rounded-[2.5rem] border border-brand-soft hover:bg-brand-soft/20 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-brand-light/40 uppercase tracking-widest">{sub.name}</span>
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

      {/* --- LOG TABLE --- */}
      <div className="bg-white rounded-[2.5rem] border border-brand-soft overflow-hidden">
        <div className="p-8 border-b border-brand-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBarChart2 className="text-brand-light" size={20} />
            <h3 className="text-sm font-black text-brand-light uppercase tracking-widest">History Log</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                      record.status === 'absent' ? 'bg-rose-50 text-rose-600' : 
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}