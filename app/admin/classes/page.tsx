"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import {
  UserPlus, ChevronRight, GraduationCap, Search,
  X, Edit3, Trash2, Download, Upload, FileSpreadsheet,
  AlertCircle, CheckCircle2, Loader2, RotateCcw, Phone, Mail, User, Hash
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function StudentManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastAction = useRef<{ type: 'delete' | 'import', data: any[] | any } | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const [selectedClass, setSelectedClass] = useState("10th");
  const [selectedSection, setSelectedSection] = useState("A");

  const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
  const sections = ["A", "B", "C", "D"];

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    parent_phone: "",
    class_name: "10th",
    section: "A",
    roll_number: "",
    academic_year: "2026-27"
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("class_name", selectedClass)
      .eq("section", selectedSection)
      .order("roll_number", { ascending: true });

    if (!error) setStudents(data || []);
    setLoading(false);
  }, [selectedClass, selectedSection]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // --- EXCEL EXPORT & SAMPLE ---
  const exportToExcel = () => {
    if (students.length === 0) return toast.error("No data to export");
    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `Students_${selectedClass}_${selectedSection}.xlsx`);
  };

  const downloadSample = () => {
    const sample = [{
      full_name: "John Doe",
      email: "john@example.com",
      parent_phone: "9876543210",
      roll_number: 1,
      class_name: selectedClass,
      section: selectedSection,
      academic_year: "2026-27"
    }];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "student_import_sample.xlsx");
  };

  // --- UNDO LOGIC ---
  const handleUndo = async () => {
    if (!lastAction.current) return;
    try {
      if (lastAction.current.type === 'delete') {
        await supabase.from("students").insert([lastAction.current.data]);
        toast.success("Record Restored");
      } else if (lastAction.current.type === 'import') {
        const ids = lastAction.current.data.map((s: any) => s.student_id);
        await supabase.from("students").delete().in("student_id", ids);
        toast.success("Import Reverted");
      }
      setCanUndo(false);
      fetchStudents();
    } catch (e) {
      toast.error("Undo failed");
    }
  };

  // --- BULK IMPORT LOGIC WITH ERROR HANDLING ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        const validRecords: any[] = [];
        const errorLogs: string[] = [];

        data.forEach((row, index) => {
          const rowNum = index + 2; // Matches Excel Row Number
          if (!row.full_name) errorLogs.push(`Row ${rowNum}: Name is missing`);
          else {
            validRecords.push({
              ...row,
              student_id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
              academic_year: row.academic_year || "2026-27",
              class_name: selectedClass,
              section: selectedSection
            });
          }
        });

        if (errorLogs.length > 0) {
          errorLogs.slice(0, 3).forEach(err => toast.error(err));
          setIsImporting(false);
          return;
        }

        // Insert one by one to catch per-row errors
        const successfulInserts: any[] = [];
        for (let i = 0; i < validRecords.length; i++) {
          const record = validRecords[i];
          const rowNum = i + 2;
          try {
            const { error } = await supabase.from("students").insert([record]);
            if (error) {
              if (error.message.includes("duplicate key value violates unique constraint")) {
                errorLogs.push(`Row ${rowNum}: Duplicate email or other unique field`);
              } else {
                errorLogs.push(`Row ${rowNum}: ${error.message}`);
              }
            } else {
              successfulInserts.push(record);
            }
          } catch (err: any) {
            errorLogs.push(`Row ${rowNum}: ${err.message}`);
          }
        }

        if (errorLogs.length > 0) {
          errorLogs.slice(0, 5).forEach(err => toast.error(err));
          if (successfulInserts.length > 0) {
            toast.success(`${successfulInserts.length} records imported successfully`);
          }
        } else {
          toast.success("Import Successful");
        }

        if (successfulInserts.length > 0) {
          lastAction.current = { type: 'import', data: successfulInserts };
          setCanUndo(true);
          fetchStudents();
        }
      } catch (err: any) {
        toast.error("Import failed", { description: err.message });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- FORM LOGIC ---
  const handleSubmit = async () => {
    if (!formData.full_name) return toast.error("Name is required");

    const payload = isEditing ? formData : { ...formData, student_id: `STU-${Math.floor(1000 + Math.random() * 9000)}` };
    
    const query = isEditing 
      ? supabase.from("students").update(payload).eq("id", currentStudentId)
      : supabase.from("students").insert([payload]);

    const { error } = await query;
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? "Updated" : "Enrolled");
      closeModal();
      fetchStudents();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({ full_name: "", email: "", parent_phone: "", class_name: selectedClass, section: selectedSection, roll_number: "", academic_year: "2026-27" });
  };

  return (
    <div className="min-h-screen bg-[#fdfafc] p-6 lg:p-10 font-sans">
      <Toaster position="top-center" richColors />

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col lg:flex-row items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-[#e9d1e4] shadow-sm gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#fdfafc] text-[#d487bd] rounded-2xl flex items-center justify-center shadow-inner border border-[#e9d1e4]">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Student Registry</h1>
              <p className="text-[10px] font-bold text-[#d487bd] tracking-[0.2em] uppercase">Academic Session 2026-27</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canUndo && (
              <button onClick={handleUndo} className="flex items-center gap-2 bg-orange-50 text-orange-600 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-orange-100 hover:bg-orange-100 transition-all active:scale-95">
                <RotateCcw size={16} /> Undo Recent
              </button>
            )}
            
            <button onClick={downloadSample} className="action-btn-secondary">
              <Download size={18} /> Sample
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="action-btn-secondary">
              {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />} Import
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
            
            <button onClick={() => setShowModal(true)} className="bg-[#d487bd] hover:bg-[#c36fa8] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-[#e9d1e4] active:scale-95">
              <UserPlus size={18} className="inline mr-2" /> Enroll Student
            </button>
          </div>
        </header>

        {/* LOADING INDICATOR */}
        {isImporting && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-pulse">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verifying Row Data & Duplicates...</span>
          </div>
        )}

       {/* FILTERS CARD */}
<div className="bg-white p-6 rounded-[2.5rem] border border-[#e9d1e4] shadow-sm flex flex-col md:flex-row gap-8 items-center">
  <div className="flex-1 w-full">
    <p className="text-[10px] font-black text-[#d487bd] uppercase tracking-[0.2em] mb-4 ml-2">Select Grade</p>
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 w-full">
      {classes.map((c) => (
        <button
          key={c}
          onClick={() => setSelectedClass(c)}
          className={`filter-chip ${selectedClass === c ? "active" : ""}`}
        >
          {c}
        </button>
      ))}
    </div>
  </div>

  <div className="hidden md:block h-12 w-[2px] bg-gradient-to-b from-transparent via-[#e9d1e4] to-transparent" />

  <div className="w-full md:w-auto">
    <p className="text-[10px] font-black text-[#d487bd] uppercase tracking-[0.2em] mb-4 ml-2">Section</p>
    <div className="flex gap-4">
      {sections.map((s) => (
        <button
          key={s}
          onClick={() => setSelectedSection(s)}
          className={`section-chip ${selectedSection === s ? "active" : ""}`}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
</div>

        {/* SEARCH & STATS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#d487bd]" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or roll..."
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-[#e9d1e4] rounded-[2.5rem] outline-none focus:ring-4 focus:ring-[#fdfafc] transition-all text-slate-600 font-bold"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-4">
             <div className="bg-white px-6 py-4 rounded-2xl border border-[#e9d1e4] flex-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength</span>
                <span className="text-xl font-black text-slate-800">{students.length}</span>
             </div>
             <button onClick={exportToExcel} className="p-4 bg-white border border-[#e9d1e4] rounded-2xl text-slate-400 hover:text-green-600 transition-colors">
               <FileSpreadsheet size={24} />
             </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-[3rem] border border-[#e9d1e4] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#fdfafc] border-b border-[#e9d1e4]">
              <tr>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-[#d487bd] tracking-widest">Roll</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-[#d487bd] tracking-widest">Student Details</th>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-[#d487bd] tracking-widest">Contact Information</th>
                <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-[#d487bd] tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#fdfafc]">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic animate-pulse">Synchronizing Records...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="p-24 text-center">
                  <div className="flex flex-col items-center opacity-30">
                    <GraduationCap size={64} className="mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">No Records in {selectedClass}-{selectedSection}</p>
                  </div>
                </td></tr>
              ) : (
                students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase())).map((s) => (
                  <tr key={s.id} className="hover:bg-[#fdfafc]/80 transition-colors group">
                    <td className="px-10 py-6">
                      <span className="w-10 h-10 flex items-center justify-center bg-[#fdfafc] border border-[#e9d1e4] rounded-xl font-black text-[#d487bd] text-xs shadow-sm">{s.roll_number || "--"}</span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="font-bold text-slate-800 leading-none mb-1">{s.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{s.student_id}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Phone size={12} className="text-[#d487bd]"/> {s.parent_phone}</div>
                        <div className="flex items-center gap-2 text-slate-400 font-medium text-xs"><Mail size={12}/> {s.email}</div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setIsEditing(true); setCurrentStudentId(s.id); setFormData(s); setShowModal(true); }} className="p-3 text-blue-400 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                        <button 
                          onClick={async () => {
                            if(confirm("Revoke student enrollment?")) {
                              lastAction.current = { type: 'delete', data: s };
                              setCanUndo(true);
                              await supabase.from("students").delete().eq("id", s.id);
                              fetchStudents();
                            }
                          }}
                          className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md mx-4 shadow-2xl border border-[#e9d1e4]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{isEditing ? "Edit Student" : "Enroll Student"}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="compact-input"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="compact-input"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Parent Phone</label>
                <input
                  type="text"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  className="compact-input"
                  placeholder="Enter parent phone"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Class</label>
                  <select
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="compact-input"
                  >
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="compact-input"
                  >
                    {sections.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Roll Number</label>
                <input
                  type="number"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  className="compact-input"
                  placeholder="Enter roll number"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSubmit} className="flex-1 bg-[#d487bd] text-white py-3 rounded-xl font-bold hover:bg-[#c36fa8] transition-all active:scale-95">
                {isEditing ? "Update" : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .action-btn-primary { @apply flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95; }
        .action-btn-secondary { @apply flex items-center gap-2 bg-white border border-[#e9d1e4] text-slate-600 px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#fdfafc] transition-all active:scale-95 shadow-sm; }
        .filter-chip { @apply px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all; }
        .filter-chip.active { @apply bg-[#d487bd] text-white shadow-lg shadow-[#e9d1e4] scale-105; }
        .section-chip { @apply w-12 h-12 flex items-center justify-center rounded-xl text-xs font-black text-slate-400 border-2 border-[#e9d1e4] transition-all; }
        .section-chip.active { @apply bg-white border-[#d487bd] text-[#d487bd] shadow-md scale-110; }
        .compact-input { @apply w-full bg-slate-50 border border-[#e9d1e4] p-3 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-[#fdfafc] font-semibold text-slate-600 transition-all; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .filter-chip { 
  @apply px-7 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest 
  text-slate-400 border-2 border-transparent transition-all duration-300 ease-out
  hover:bg-[#fdfafc] hover:text-[#d487bd] hover:border-[#e9d1e4] hover:shadow-inner; 
}

.filter-chip.active { 
  @apply bg-[#d487bd] text-white shadow-xl shadow-[#e9d1e4] scale-105 border-transparent; 
  background-image: linear-gradient(135deg, #d487bd 0%, #c36fa8 100%);
}

.section-chip { 
  @apply w-14 h-14 flex items-center justify-center rounded-2xl text-sm font-black 
  text-slate-400 border-2 border-[#fdfafc] bg-white transition-all duration-300
  hover:border-[#d487bd] hover:text-[#d487bd] hover:bg-[#fdfafc] hover:scale-110; 
}

.section-chip.active { 
  @apply bg-white border-[#d487bd] text-[#d487bd] shadow-lg scale-110 ring-4 ring-[#fdfafc]; 
}
      `}</style>
    </div>
  );
}