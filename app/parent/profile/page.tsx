"use client";

import React, { useState, useEffect } from "react";
import {
  FiUser, FiHash, FiCalendar, FiPhone,
  FiMail, FiActivity, FiShield, FiInfo, FiHeart
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { IconType } from "react-icons";

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);
  const [parent, setParent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileAndParent();
  }, []);

  async function fetchProfileAndParent() {
    try {
      const childId = localStorage.getItem('childId');
      if (!childId) return;

      // 1. Fetch Student Data
      const { data: studentData, error: sError } = await supabase
        .from("students")
        .select("*")
        .eq("id", childId)
        .single();

      if (sError) throw sError;
      setStudent(studentData);

      // 2. Fetch Parent Data linked to this child
      const { data: parentData, error: pError } = await supabase
        .from("parents")
        .select("*")
        .eq("child_id", childId)
        .single();

      if (!pError) setParent(parentData);

    } catch (error) {
      console.error("Error fetching profile:", error);
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
    <div className="space-y-10 p-6 pt-10 bg-white min-h-screen animate-in fade-in duration-700">

      {/* --- SOFT BRAND PROFILE BANNER --- */}
      <section className="relative overflow-hidden bg-brand-soft/40 rounded-[2.5rem] p-10 md:p-14 border border-brand-soft">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-light/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">

          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl shadow-brand-soft/50 overflow-hidden bg-brand-accent flex items-center justify-center text-brand-light/30">
              <FiUser size={60} />
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-brand-light rounded-full border-4 border-white"></div>
          </div>

          <div className="max-w-2xl">
            <p className="text-[10px] uppercase font-black text-brand-light/60 tracking-[0.3em] mb-2">Student Profile</p>
            <h1 className="text-4xl md:text-5xl font-black text-brand-light mb-4 tracking-tighter uppercase">
              {student?.full_name}
            </h1>
            <div className="flex flex-wrap gap-3">
              <span className="bg-white/60 backdrop-blur-md border border-brand-soft px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-light">
                Class {student?.class_name}-{student?.section}
              </span>
              <span className="bg-brand-light text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                {student?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- QUICK STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Roll Number", value: student?.roll_number || "N/A", icon: FiHash },
          { label: "System ID", value: student?.student_id, icon: FiShield },
          { label: "Academic Year", value: student?.academic_year, icon: FiCalendar },
          { label: "Parent Linked", value: parent ? "Verified" : "Pending", icon: FiHeart },
        ]
          .map((stat, index) => (
            <div key={index} className="bg-white p-8 rounded-[2.5rem] border border-brand-soft hover:bg-brand-soft/10 transition-all group">
              <div className="text-brand-light/40 group-hover:text-brand-light transition-colors mb-4">
                {(() => {
                  const Icon = stat.icon as IconType;
                  return <Icon size={24} />;
                })()}
              </div>

              <p className="text-[10px] uppercase font-black text-brand-light/40 tracking-[0.2em]">{stat.label}</p>
              <p className="text-2xl font-black text-brand-light mt-1 tracking-tight">{stat.value}</p>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* --- ACADEMIC RECORDS --- */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-10 space-y-8">
          <div className="flex items-center gap-3 text-brand-light">
            <FiInfo size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Student Information</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: "Full Name", value: student?.full_name },
              { label: "Blood Group", value: student?.blood_group || "Not Provided" },
              { label: "Joining Date", value: new Date(student?.created_at).toLocaleDateString() },
              { label: "House/Section", value: student?.section }
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-4 rounded-2xl bg-brand-soft/10 border border-brand-soft/20">
                <span className="text-[10px] font-black uppercase text-brand-light/60 tracking-widest">{item.label}</span>
                <span className="text-[11px] font-black text-brand-light uppercase">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- PARENT/GUARDIAN DETAILS --- */}
        <div className="bg-white rounded-[2.5rem] border border-brand-soft p-10 space-y-8">
          <div className="flex items-center gap-3 text-brand-light">
            <FiHeart size={20} />
            <h3 className="font-black uppercase text-xs tracking-widest">Guardian Details</h3>
          </div>

          {parent ? (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-brand-accent/40 border border-brand-soft">
                <p className="text-[10px] font-black text-brand-light/40 uppercase tracking-widest mb-1">Full Name & Relation</p>
                <p className="text-lg font-black text-brand-light uppercase">{parent.full_name} <span className="text-[10px] opacity-60 ml-2">({parent.relation})</span></p>
              </div>

              <div className="flex items-center gap-6 p-5 rounded-3xl bg-brand-accent/40 border border-brand-soft">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-brand-light shadow-sm">
                  <FiPhone />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-light/40 uppercase tracking-widest">Primary Phone</p>
                  <p className="text-sm font-bold text-brand-light">{parent.phone_number || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-5 rounded-3xl bg-brand-accent/40 border border-brand-soft">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-brand-light shadow-sm">
                  <FiActivity />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-light/40 uppercase tracking-widest">Account Status</p>
                  <p className="text-sm font-bold text-brand-light uppercase">{parent.is_account_active ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center border-2 border-dashed border-brand-soft rounded-3xl">
              <p className="text-brand-light/40 font-black text-[10px] uppercase tracking-widest">No Parent Record Found</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}