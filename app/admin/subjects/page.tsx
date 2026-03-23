"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";
import {
  Trash2, Download, BookOpen, Plus, X,
  GraduationCap, AlertTriangle, Filter,
  CheckCircle2, UserCheck, ShieldAlert
} from "lucide-react";
import * as XLSX from "xlsx";

export default function SubjectAllotmentPage() {
  const [activeTab, setActiveTab] = useState<"list" | "allot" | "class_teacher">("list");
  const [loading, setLoading] = useState(true);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
const [academicYear, setAcademicYear] = useState("");
  // Form States
  const [newSub, setNewSub] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [allotments, setAllotments] = useState([{ subject_id: "", class_name: "10th", section: "A" }]);
const [filterClass, setFilterClass] = useState("");
const [filterSubject, setFilterSubject] = useState("");
  // Class Teacher States
  const [ctTeacherId, setCtTeacherId] = useState("");
  const [ctClass, setCtClass] = useState("10th");
  const [ctSection, setCtSection] = useState("A");
const filteredAssignments = assignments.filter(a => {
  const matchesClass = filterClass === "" || a.class_name === filterClass;
  const matchesSubject = filterSubject === "" || a.subjects?.name.toLowerCase().includes(filterSubject.toLowerCase());
  return matchesClass && matchesSubject;
});
  // ---------------- FETCH DATA ----------------
 const fetchData = useCallback(async () => {
  setLoading(true);

  const { data: sub } = await supabase.from("subjects").select("*").order("name");

  const { data: tea } = await supabase
    .from("teachers")
    .select("id, full_name, department")
    .order("full_name");

  const { data: ass } = await supabase.from("subject_assignments")
    .select(`id, academic_year, class_name, section, teachers(full_name), subjects(name)`)
    .order("created_at", { ascending: false });

  const { data: ct } = await supabase.from("class_teacher_allotment")
    .select(`id, class_name, section, teachers(full_name)`)
    .order("class_name");

  // ✅ FETCH SCHOOL SETTINGS (ONLY ONE ROW)
  const { data: settings } = await supabase
    .from("school_settings")
    .select("academic_start_year, academic_end_year")
    .single();

  // ✅ FORMAT YEAR (2026-27)
  if (settings) {
    const start = settings.academic_start_year;
    const end = settings.academic_end_year;

    const formattedYear = `${start}-${String(end).slice(-2)}`;
    setAcademicYear(formattedYear);
  }

  setSubjects(sub || []);
  setTeachers(tea || []);
  setAssignments(ass || []);
  setClassTeachers(ct || []);
  setLoading(false);
}, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---------------- DUPLICATE CHECK LOGIC ----------------
  const isDuplicate = (teacher_id: string, subject_id: string, class_name: string, section: string) => {
    return assignments.some(a =>
      a.teacher_id === teacher_id &&
      a.subject_id === subject_id &&
      a.class_name === class_name &&
      a.section === section
    );
  };

  // ---------------- HANDLERS ----------------
  // ---------------- HANDLERS ----------------

  const handleAddSubject = async () => {
    if (!newSub.trim()) return toast.error("Input Required", { description: "Please enter a subject name." });

    // Local duplicate check
    if (subjects.some(s => s.name.toLowerCase() === newSub.toLowerCase())) {
      return toast.error("Duplicate Subject", { description: "This subject already exists in the registry." });
    }

    const { data, error } = await supabase
      .from("subjects")
      .insert([{ name: newSub.trim() }])
      .select();

    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Subject Added", { description: `${newSub} has been registered.` });
      setNewSub(""); // Clear input
      fetchData(); // Refresh list
    }
  };
  if (!academicYear) {
  return toast.error("Academic Year Missing", {
    description: "Please configure academic year in school settings."
  });
}

  const handleAllot = async () => {
    if (!teacherId) return toast.error("Selection Required", { description: "Please select a faculty member." });

    // Check for duplicates within the current entry or database
    for (const allot of allotments) {
      if (!allot.subject_id) return toast.error("Missing Subject", { description: "Please select subjects for all rows." });

      const exists = assignments.some(a =>
        a.teachers.full_name === teachers.find(t => t.id === teacherId)?.full_name &&
        a.subjects.name === subjects.find(s => s.id === allot.subject_id)?.name &&
        a.class_name === allot.class_name &&
        a.section === allot.section
      );

      if (exists) {
        return toast.error("Duplicate Found", {
          description: `This teacher is already assigned to ${allot.class_name}-${allot.section} for this subject.`
        });
      }
    }

    const payload = allotments.map(a => ({
      teacher_id: teacherId,
      subject_id: a.subject_id,
academic_year: academicYear,
      class_name: a.class_name,
      section: a.section
    }));

    const { error } = await supabase.from("subject_assignments").insert(payload);
    if (error) toast.error("Database Error", { description: error.message });
    else {
      toast.success("Allocation Successful");
      setTeacherId("");
      setAllotments([{ subject_id: "", class_name: "10th", section: "A" }]);
      fetchData();
    }
  };

  const handleClassTeacherAllot = async () => {
    if (!ctTeacherId) return toast.error("Select a Teacher");
if (!academicYear) {
  return toast.error("Academic Year Missing");
}
    // Check if class/section already has a teacher
    const conflict = classTeachers.find(c => c.class_name === ctClass && c.section === ctSection);
    if (conflict) return toast.error("Class Occupied", { description: `${ctClass}-${ctSection} already has a Class Teacher.` });

    const { error } = await supabase.from("class_teacher_allotment").insert([{
      teacher_id: ctTeacherId,
      class_name: ctClass,
      section: ctSection,
academic_year: academicYear
    }]);

    if (error) toast.error("Error", { description: error.message });
    else {
      toast.success("Class Teacher Assigned");
      fetchData();
    }
  };

  const deleteItem = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) {
      toast.success("Entry Removed");
      fetchData();
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-soft/10">
      <div className="w-12 h-12 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-9xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-700 bg-[#fffcfd] dark:bg-slate-950 transition-colors duration-300">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-brand-soft dark:border-slate-800 shadow-sm gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-soft dark:bg-brand/20 text-brand-light dark:text-brand rounded-2xl flex items-center justify-center shadow-inner">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Academic Allotment</h1>
            <p className="text-[10px] font-bold text-brand-light dark:text-brand tracking-[0.2em] uppercase">Registry & Mapping</p>
          </div>
        </div>

        <div className="flex items-center bg-brand-soft/30 dark:bg-slate-800 p-1.5 rounded-2xl border border-brand-soft dark:border-slate-700">
          {["list", "allot", "class_teacher"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                ? "bg-brand-light dark:bg-brand text-white shadow-lg"
                : "text-brand-light dark:text-slate-400 hover:bg-brand-soft/50 dark:hover:bg-slate-700"
                }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: SUBJECT BANK */}
      {/* TAB 1: SUBJECT BANK */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-brand-soft dark:border-slate-800 shadow-sm h-fit">
            <h3 className="text-[11px] font-black text-brand-light dark:text-brand uppercase tracking-[0.2em] mb-6">Subject Registry</h3>
            <input
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()} // Add on enter key
              placeholder="Enter Subject Name"
              className="soft-input mb-4"
            />
            <button
              onClick={handleAddSubject} // Updated this line
              className="w-full bg-brand-light dark:bg-brand text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
            >
              Add Subject
            </button>
          </div>
          {/* ... rest of the code */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-brand-soft dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 bg-brand-soft/20 dark:bg-slate-800/50 border-b border-brand-soft dark:border-slate-800 font-black text-[10px] text-brand-light dark:text-brand uppercase tracking-widest">Available Subjects</div>
            <div className="divide-y divide-brand-soft/30 dark:divide-slate-800">
              {subjects.map(s => (
                <div key={s.id} className="p-5 flex justify-between items-center hover:bg-brand-soft/5 dark:hover:bg-brand/5 transition-colors">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{s.name}</span>
                  <button onClick={() => deleteItem("subjects", s.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY MAPPING */}
      {activeTab === "allot" && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-brand-soft dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-brand-light dark:text-brand uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <CheckCircle2 size={18} /> Subject-Faculty Mapping
            </h3>
            {/* --- FACULTY SELECTION SECTION --- */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-brand-soft dark:border-slate-800 shadow-sm mb-8">
              <h3 className="text-[11px] font-black text-brand-light dark:text-brand uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <UserCheck size={18} /> 01. Select Faculty member
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">

                {/* Faculty Dropdown */}
                <div className="lg:col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-brand-light/60 dark:text-slate-500 uppercase ml-4 block">
                    Faculty Name
                  </label>
                  <div className="relative">
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="soft-input appearance-none pr-10"
                    >
                      <option value="" className="dark:bg-slate-900">Choose from registry...</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id} className="dark:bg-slate-900">
                          {t.full_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-light/40">
                      <Filter size={16} />
                    </div>
                  </div>
                </div>

                {/* Department Display */}
                <div className="lg:col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-brand-light/60 dark:text-slate-500 uppercase ml-4 block">
                    Department Assignment
                  </label>
                  <div className={`flex items-center gap-4 p-[11px] rounded-2xl border-2 border-dashed transition-all duration-300 ${teacherId
                      ? "bg-brand-soft/10 border-brand-soft dark:bg-brand/5 dark:border-brand/20"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-800/20 dark:border-slate-800"
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${teacherId ? "bg-brand text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                      }`}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-brand-light/50 dark:text-slate-500 uppercase leading-none mb-1">Current Dept</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                        {teachers.find(t => t.id === teacherId)?.department || "Waiting for selection..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* System Alert Block */}
                <div className="lg:col-span-1">
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
                    <div className="mt-0.5">
                      <ShieldAlert className="text-amber-500 dark:text-amber-400" size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase mb-0.5">Validation Active</p>
                      <p className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/60 leading-tight">
                        System prevents duplicate subject-class mapping for the same teacher.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {allotments.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-10 gap-3 mb-3 p-3 bg-brand-soft/5 dark:bg-slate-800/30 rounded-2xl border border-brand-soft dark:border-slate-800">
                <div className="md:col-span-4">
                  <select value={row.subject_id} onChange={e => {
                    const copy = [...allotments];
                    copy[i].subject_id = e.target.value;
                    setAllotments(copy);
                  }} className="soft-input !py-3 !text-xs">
                    <option value="" className="dark:bg-slate-900">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <select value={row.class_name} onChange={e => {
                    const copy = [...allotments];
                    copy[i].class_name = e.target.value;
                    setAllotments(copy);
                  }} className="soft-input !py-3 !text-xs">
                    {["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"].map(c => <option key={c} className="dark:bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select value={row.section} onChange={e => {
                    const copy = [...allotments];
                    copy[i].section = e.target.value;
                    setAllotments(copy);
                  }} className="soft-input !py-3 !text-xs">
                    {["A", "B", "C", "D"].map(s => <option key={s} className="dark:bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button onClick={() => setAllotments(allotments.filter((_, idx) => idx !== i))} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-xl transition-colors"><X size={18} /></button>
                </div>
              </div>
            ))}
            <div className="flex gap-4 mt-6">
              <button onClick={() => setAllotments([...allotments, { subject_id: "", class_name: "10th", section: "A" }])} className="flex-1 py-4 border-2 border-dashed border-brand-soft dark:border-slate-700 rounded-2xl font-black text-[10px] text-brand-light dark:text-slate-500 uppercase hover:border-brand transition-all">+ Add Row</button>
              <button onClick={handleAllot} className="flex-1 py-4 bg-slate-800 dark:bg-brand text-white rounded-2xl font-black text-[10px] uppercase shadow-lg hover:brightness-110 transition-all">Confirm Allotment</button>
            </div>
          </div>

          {/* List of current assignments */}
          {/* --- FILTER BAR --- */}
<div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-4">
  <h4 className="text-[10px] font-black text-brand-light dark:text-brand uppercase tracking-widest flex items-center gap-2">
    <Filter size={14} /> Active Assignments ({filteredAssignments.length})
  </h4>
  
  <div className="flex gap-3">
    {/* Filter by Subject */}
    <input 
      type="text"
      placeholder="Search Subject..."
      value={filterSubject}
      onChange={(e) => setFilterSubject(e.target.value)}
      className="soft-input !py-2 !px-4 !text-[10px] w-40"
    />
    
    {/* Filter by Class */}
    <select 
      value={filterClass} 
      onChange={(e) => setFilterClass(e.target.value)}
      className="soft-input !py-2 !px-4 !text-[10px] w-32"
    >
      <option value="">All Classes</option>
      {["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"].map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>

    {(filterClass || filterSubject) && (
      <button 
        onClick={() => { setFilterClass(""); setFilterSubject(""); }}
        className="text-[9px] font-black text-red-500 uppercase hover:underline"
      >
        Clear
      </button>
    )}
  </div>
</div>

{/* --- FILTERED LIST --- */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {filteredAssignments.length > 0 ? (
    filteredAssignments.map(a => (
      <div key={a.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-soft dark:border-slate-800 shadow-sm group hover:border-brand/50 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-brand-soft dark:bg-brand/10 rounded-xl flex items-center justify-center text-brand-light dark:text-brand">
            <GraduationCap size={20} />
          </div>
          <button onClick={() => deleteItem("subject_assignments", a.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
            <Trash2 size={14} />
          </button>
        </div>
        <p className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs mb-1">{a.teachers?.full_name}</p>
        <p className="text-[10px] font-bold text-brand-light dark:text-brand tracking-widest uppercase">
          {a.subjects?.name} • {a.class_name}-{a.section}
        </p>
      </div>
    ))
  ) : (
    <div className="col-span-full py-12 text-center bg-brand-soft/5 rounded-[2rem] border-2 border-dashed border-brand-soft/30">
       <p className="text-[10px] font-black text-brand-light/40 uppercase tracking-[0.2em]">No assignments found matching these filters</p>
    </div>
  )}
</div>
        </div>
      )}

      {/* TAB 3: CLASS TEACHER ALLOTMENT */}
      {activeTab === "class_teacher" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-brand-soft dark:border-slate-800 shadow-sm h-fit">
            <h3 className="text-[11px] font-black text-brand-light dark:text-brand uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <UserCheck size={18} /> Assign Class Teacher
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-brand-light/60 dark:text-slate-500 uppercase ml-4 mb-2 block">Teacher</label>
                <select value={ctTeacherId} onChange={e => setCtTeacherId(e.target.value)} className="soft-input">
                  <option value="" className="dark:bg-slate-900">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id} className="dark:bg-slate-900">{t.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-brand-light/60 dark:text-slate-500 uppercase ml-4 mb-2 block">Class</label>
                  <select value={ctClass} onChange={e => setCtClass(e.target.value)} className="soft-input">
                    {["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"].map(c => <option key={c} value={c} className="dark:bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-brand-light/60 dark:text-slate-500 uppercase ml-4 mb-2 block">Section</label>
                  <select value={ctSection} onChange={e => setCtSection(e.target.value)} className="soft-input">
                    {["A", "B", "C", "D"].map(s => <option key={s} value={s} className="dark:bg-slate-900">{s}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleClassTeacherAllot} className="w-full bg-brand-light dark:bg-brand text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Assign as Head</button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-brand-soft dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 bg-brand-soft/20 dark:bg-slate-800/50 border-b border-brand-soft dark:border-slate-800 font-black text-[10px] text-brand-light dark:text-brand uppercase tracking-widest">Active Class Teachers</div>
            <div className="divide-y divide-brand-soft/30 dark:divide-slate-800">
              {classTeachers.map(ct => (
                <div key={ct.id} className="p-6 flex justify-between items-center hover:bg-brand-soft/5 dark:hover:bg-brand/5 transition-colors">
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase">{ct.class_name} - {ct.section}</p>
                    <p className="text-[10px] font-bold text-brand-light dark:text-slate-500 uppercase">{ct.teachers?.full_name}</p>
                  </div>
                  <button onClick={() => deleteItem("class_teacher_allotment", ct.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
      .soft-input { 
        width: 100%; 
        background: #fdfafc; 
        border: 2px solid #e9d1e4; 
        padding: 0.8rem 1rem; 
        border-radius: 1.25rem; 
        font-weight: 700; 
        font-size: 13px;
        color: #334155; 
        outline: none; 
        transition: all 0.2s ease;
      }
      .soft-input:focus { border-color: #a63d93; background: white; }

      /* Dark Mode Overrides for soft-input */
      .dark .soft-input {
        background: #0f172a; /* slate-900 */
        border-color: #1e293b; /* slate-800 */
        color: #cbd5e1; /* slate-300 */
      }
      .dark .soft-input:focus {
        border-color: #a63d93;
        background: #020617; /* slate-950 */
      }
    `}</style>
    </div>
  );
}