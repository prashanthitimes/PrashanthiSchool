"use client";

import React, { useState, useEffect } from "react";
import {
  FiUser, FiHash, FiCalendar, FiShield, FiInfo, FiHeart, FiMapPin, FiCreditCard, FiBookOpen
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { IconType } from "react-icons";

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="space-y-7 p-6 pt-10 bg-[#fffcfd] dark:bg-slate-950 animate-in fade-in duration-700 transition-colors">
      
      {/* --- BRAND PROFILE BANNER --- */}
      <section className="relative overflow-hidden bg-brand/10 dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-[#e9d1e4] dark:border-slate-800">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FiUser size={50} />
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-brand dark:bg-brand-soft rounded-full border-4 border-white dark:border-slate-800"></div>
          </div>

          <div className="max-w-2xl">
            <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.25em] mb-1">Official Student Record</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tighter uppercase">
              {student?.full_name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-[#e9d1e4] dark:border-slate-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Class {student?.class_name} - {student?.section}
              </span>
              <span className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                {student?.status}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- IDENTIFICATION GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "SATS NO", value: student?.sats_no, icon: FiBookOpen },
          { label: "PEN NO", value: student?.pen_no, icon: FiShield },
          { label: "Roll No", value: student?.roll_number, icon: FiHash },
          { label: "Aadhar", value: student?.aadhar_no ? `XXXX-XXXX-${student.aadhar_no.slice(-4)}` : 'N/A', icon: FiCreditCard },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-[#e9d1e4] dark:border-slate-800">
             <stat.icon className="text-brand dark:text-brand-soft mb-3" size={18} />
             <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest">{stat.label}</p>
             <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase truncate">{stat.value || '---'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- PERSONAL DETAILS --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand dark:text-brand-soft border-b border-slate-50 dark:border-slate-800 pb-4">
            <FiUser size={18} />
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-800 dark:text-slate-100">Personal Profile</h3>
          </div>
          <div className="space-y-3">
            <InfoRow label="Father's Name" value={student?.father_name} />
            <InfoRow label="Mother's Name" value={student?.mother_name} />
            <InfoRow label="Date of Birth" value={student?.dob} />
            <InfoRow label="Caste/Category" value={student?.caste} />
            <InfoRow label="Village/Area" value={student?.village} />
          </div>
        </div>

        {/* --- ACADEMIC & CONTACT --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand dark:text-brand-soft border-b border-slate-50 dark:border-slate-800 pb-4">
            <FiInfo size={18} />
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-800 dark:text-slate-100">School Records</h3>
          </div>
          <div className="space-y-3">
            <InfoRow label="Academic Year" value={student?.academic_year} />
            <InfoRow label="Admission ID" value={student?.student_id} />
            <InfoRow label="Contact No" value={student?.mobile_no} />
            <InfoRow label="Birth Cert No" value={student?.birth_certificate_no} />
            <InfoRow label="Joined On" value={new Date(student?.created_at).toLocaleDateString()} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Row Component for cleaner JSX
function InfoRow({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[#e9d1e4]/30 dark:border-slate-800/50">
      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
      <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">{value || '---'}</span>
    </div>
  );
}