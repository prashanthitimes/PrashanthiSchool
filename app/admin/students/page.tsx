"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { 
  Search, UserPlus, Eye, Edit2, Trash2, 
  Download, X, Loader2, GraduationCap, Filter, RefreshCw
} from 'lucide-react';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email?: string;
  academic_year: string;
  class_name: string;
  section: string;
  roll_number: number;
  status: 'active' | 'transferred' | 'graduated';
  dob?: string;
  father_name?: string;
  mother_name?: string;
  caste?: string;
  mobile_no?: string;
  sats_no?: string;
  pen_no?: string;
  birth_certificate_no?: string;
  aadhar_no?: string;
  village?: string;
}

interface SchoolSettings {
  id: string;
  academic_start_year: number;
  academic_end_year: number;
}

export default function StudentAdminPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [formData, setFormData] = useState<Partial<Student>>({});

  const currentYearString = settings 
    ? `${settings.academic_start_year}-${settings.academic_end_year}` 
    : '2026-2027'; 

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: schoolData } = await supabase.from('school_settings').select('*').single();
      setSettings(schoolData);

      const yearFilter = schoolData 
        ? `${schoolData.academic_start_year}-${schoolData.academic_end_year}`
        : '2026-2027';

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('academic_year', yearFilter)
        .order('class_name', { ascending: true })
        .order('roll_number', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) { console.error("Fetch Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!formData.full_name || !formData.class_name) {
      alert("Name and Class are required.");
      return;
    }
    setLoading(true);
    try {
      if (mode === 'add') {
        const student_id = `STU-${Math.floor(100000 + Math.random() * 900000)}`;
        const { error } = await supabase.from('students').insert([{
          ...formData,
          student_id,
          academic_year: currentYearString,
          status: 'active'
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', formData.id);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handlePromotion = async () => {
    if (!settings || students.length === 0) return;
    
    const nextStart = settings.academic_start_year + 1;
    const nextEnd = settings.academic_end_year + 1;
    const nextYear = `${nextStart}-${nextEnd}`;

    const confirm = window.confirm(`Promote ${students.length} students to ${nextYear}? Classes will increment by 1.`);
    if (!confirm) return;

    setLoading(true);
    try {
      const promotedRecords = students.map(({ id, ...rest }) => {
        const currentClass = parseInt(rest.class_name) || 0;
        return {
          ...rest,
          academic_year: nextYear,
          class_name: (currentClass + 1).toString(),
          status: currentClass >= 10 ? 'graduated' : 'active'
        };
      });

      const { error: insertErr } = await supabase.from('students').insert(promotedRecords);
      if (insertErr) throw insertErr;

      // Automatically update the school settings to the new year
      await supabase.from('school_settings').update({
        academic_start_year: nextStart,
        academic_end_year: nextEnd
      }).eq('id', settings.id);

      alert("Bulk promotion successful! School session has been updated.");
      fetchData();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || s.class_name === classFilter;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name))).sort((a,b) => parseInt(a) - parseInt(b));

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-6 pt-16">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Student Registry</h1>
          <p className="text-brand font-bold text-xs uppercase tracking-[0.3em]">Current Session: {currentYearString}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchData} className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={handlePromotion} className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
            <GraduationCap size={16} /> Bulk Promotion
          </button>
         
        </div>
      </div>

      {/* FILTERS */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by student name..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-semibold focus:ring-4 focus:ring-brand/10 outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:w-64 relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-brand/10"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="All">All Classes</option>
            {uniqueClasses.map(c => <option key={c} value={c}>Grade {c}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-brand" size={40} /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Placement</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 uppercase text-sm tracking-tight">{student.full_name}</p>
                    <p className="text-[10px] font-bold text-brand uppercase">{student.student_id}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-block px-3 py-1 bg-brand-soft/30 text-brand text-[10px] font-black rounded-lg uppercase">
                      Class {student.class_name}-{student.section}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Roll No: {student.roll_number}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setFormData(student); setMode('view'); setShowModal(true); }} className="p-2.5 text-brand bg-brand/5 hover:bg-brand-soft rounded-xl transition-all"><Eye size={18} /></button>
                      <button onClick={() => handleDelete(student.id)} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/10">
            <div className="px-10 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">{mode === 'view' ? 'Student Profile' : mode === 'edit' ? 'Edit Record' : 'Admission Form'}</h2>
                <p className="text-brand font-bold text-[10px] uppercase tracking-widest">ID: {formData.student_id || 'NEW ADMISSION'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:rotate-90 transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="space-y-5">
                  <h4 className="text-[10px] font-black text-brand uppercase border-b border-brand-soft pb-2">Academic Info</h4>
                  <InputBox label="Full Name" value={formData.full_name} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, full_name: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputBox label="Class" value={formData.class_name} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, class_name: v})} />
                    <InputBox label="Section" value={formData.section} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, section: v})} />
                  </div>
                  <InputBox label="Roll Number" value={formData.roll_number?.toString()} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, roll_number: parseInt(v)})} />
                </div>

                <div className="space-y-5">
                  <h4 className="text-[10px] font-black text-brand uppercase border-b border-brand-soft pb-2">Identification</h4>
                  <InputBox label="Date of Birth" value={formData.dob} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, dob: v})} />
                  <InputBox label="SATS Number" value={formData.sats_no} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, sats_no: v})} />
                  <InputBox label="Aadhaar Card" value={formData.aadhar_no} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, aadhar_no: v})} />
                  <InputBox label="PEN Number" value={formData.pen_no} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, pen_no: v})} />
                </div>

                <div className="space-y-5">
                  <h4 className="text-[10px] font-black text-brand uppercase border-b border-brand-soft pb-2">Family & Contact</h4>
                  <InputBox label="Father's Name" value={formData.father_name} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, father_name: v})} />
                  <InputBox label="Mother's Name" value={formData.mother_name} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, mother_name: v})} />
                  <InputBox label="Mobile Number" value={formData.mobile_no} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, mobile_no: v})} />
                  <InputBox label="Village Address" value={formData.village} readOnly={mode==='view'} onChange={(v) => setFormData({...formData, village: v})} />
                </div>
              </div>
            </div>

            {mode !== 'view' && (
              <div className="px-10 py-6 border-t dark:border-slate-800 flex justify-end gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                <button onClick={() => setShowModal(false)} className="px-6 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                <button onClick={handleSave} className="px-10 py-4 bg-brand text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all">
                  Save Student Record
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InputBox({ label, value, readOnly, onChange }: { label: string, value?: string, readOnly: boolean, onChange?: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">{label}</label>
      <input 
        type="text"
        value={value || ''}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-5 py-3 rounded-2xl text-sm font-bold border transition-all ${
          readOnly 
          ? "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 cursor-not-allowed" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-brand outline-none"
        }`}
      />
    </div>
  );
}