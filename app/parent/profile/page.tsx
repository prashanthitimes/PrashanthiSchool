"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FiUser, FiHash, FiShield, FiInfo, FiCreditCard, FiBookOpen, FiCamera, FiLoader
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";

export default function StudentProfile() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- PHOTO UPLOAD LOGIC ---
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file || !student) return;

      setUploading(true);
      
      // 1. Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${student.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      // 4. Update Student Record in DB
      const { error: updateError } = await supabase
        .from('students')
        .update({ image_url: publicUrl })
        .eq('id', student.id);

      if (updateError) throw updateError;

      // 5. Update local state
      setStudent({ ...student, image_url: publicUrl });
      toast.success("Profile photo updated!");

    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
    </div>
  );

  return (
    <div className="space-y-7 p-6 pt-10 bg-[#fffcfd] dark:bg-slate-950 animate-in fade-in duration-700 transition-colors">
      <Toaster position="top-center" richColors />

      {/* --- BRAND PROFILE BANNER --- */}
      <section className="relative overflow-hidden bg-brand/10 dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-[#e9d1e4] dark:border-slate-800">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          
          {/* AVATAR WITH UPLOAD OVERLAY */}
          <div className="relative group mx-auto md:mx-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              {student?.image_url ? (
                <img src={student.image_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FiUser size={60} />
              )}
            </div>

            {/* UPLOAD TRIGGER */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
            >
              {uploading ? (
                <FiLoader className="animate-spin" size={24} />
              ) : (
                <>
                  <FiCamera size={24} className="mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Update</span>
                </>
              )}
            </button>

            {/* HIDDEN INPUT */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
            />

            <div className="absolute bottom-3 right-3 w-7 h-7 bg-brand dark:bg-brand-soft rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg">
               <div className="w-1.5 h-1.5 bg-white dark:bg-slate-950 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="max-w-2xl text-center md:text-left">
            <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.25em] mb-1">Official Student Record</p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tighter uppercase">
              {student?.full_name}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-[#e9d1e4] dark:border-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm">
                Class {student?.class_name} - {student?.section}
              </span>
              <span className="bg-brand dark:bg-brand-soft text-white dark:text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">
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
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-[#e9d1e4] dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <stat.icon className="text-brand dark:text-brand-soft mb-4" size={20} />
              <p className="text-[8px] uppercase font-black text-slate-400 tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase truncate">{stat.value || '---'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard title="Personal Profile" icon={FiUser}>
          <InfoRow label="Father's Name" value={student?.father_name} />
          <InfoRow label="Mother's Name" value={student?.mother_name} />
          <InfoRow label="Date of Birth" value={student?.dob} />
          <InfoRow label="Caste/Category" value={student?.caste} />
          <InfoRow label="Village/Area" value={student?.village} />
        </InfoCard>

        <InfoCard title="School Records" icon={FiInfo}>
          <InfoRow label="Academic Year" value={student?.academic_year} />
          <InfoRow label="Admission ID" value={student?.student_id} />
          <InfoRow label="Contact No" value={student?.mobile_no} />
          <InfoRow label="Birth Cert No" value={student?.birth_certificate_no} />
          <InfoRow label="Joined On" value={student?.created_at ? new Date(student.created_at).toLocaleDateString() : '---'} />
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-[#e9d1e4] dark:border-slate-800 p-6 space-y-5">
      <div className="flex items-center gap-3 text-brand dark:text-brand-soft border-b border-slate-50 dark:border-slate-800 pb-5">
        <Icon size={20} />
        <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: any }) {
  return (
    <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-[#e9d1e4]/30 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group">
      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest group-hover:text-brand transition-colors">{label}</span>
      <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">{value || '---'}</span>
    </div>
  );
}