"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import {
  UserPlus, ChevronRight, GraduationCap, Search, Users,
  X, Edit3, Trash2, Download, Upload, FileSpreadsheet,
  AlertCircle, CheckCircle2, Loader2, RotateCcw, Phone, Mail, User, Hash
} from "lucide-react";

import {
  FiSearch, FiEye,
  FiUserPlus,
  FiDownload,
  FiUpload,
  FiInfo,
  FiAlertTriangle,
  FiXCircle,
  FiUsers // Add this if you used it in the branding section
} from 'react-icons/fi';
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

  const [mode, setMode] = useState<'add' | 'edit' | 'view'>('add'); // <-- move this up
  const isReadOnly = mode === 'view'; // <-- now this works

  const lastAction = useRef<{ type: 'delete' | 'import', data: any[] | any } | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const [selectedClass, setSelectedClass] = useState("10th");
  const [selectedSection, setSelectedSection] = useState("A");


  const classes = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
  const sections = ["A", "B", "C", "D"];


const [formData, setFormData] = useState({
  student_id: "", // ✅ ADD THIS
  full_name: "",
  email: "",
  parent_phone: "",
  dob: "",
  father_name: "",
  mother_name: "",
  caste: "",
  mobile_no: "",
  sats_no: "",
  pen_no: "",
  birth_certificate_no: "",
  aadhar_no: "",
  village: "",
  class_name: "",
  section: "",
  roll_number: "",
  academic_year: "2026-27"
});



  const fetchStudents = useCallback(async () => {
    setLoading(true);

    let query = supabase.from("students").select("*");

    if (selectedClass !== "All") {
      query = query.eq("class_name", selectedClass);
    }

    if (selectedSection !== "All") {
      query = query.eq("section", selectedSection);
    }

    const { data, error } = await query.order("roll_number", { ascending: true });

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
      full_name: "Rahul Kumar",
      dob: "2013-05-18",
      father_name: "Suresh Kumar",
      mother_name: "Lakshmi Devi",
      caste: "OBC",
      mobile_no: "9876543210",
      sats_no: "SATS123",
      pen_no: "PEN456",
      birth_certificate_no: "BC789",
      aadhar_no: "123456789012",
      village: "Kolar",
      class_name: selectedClass,
      section: selectedSection,
      roll_number: 1,
      academic_year: "2026-27"
    }];

    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
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
              student_id: `STU-${Date.now().toString().slice(-6)}`,
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

    const payload = {
      ...formData,
      email: formData.email || null,
      student_id: isEditing
        ? formData.student_id
        : `STU-${Date.now().toString().slice(-6)}`
    };

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
    setMode('add');
setFormData({
  student_id: "", // ✅ RESET
  full_name: "",
  email: "",
  parent_phone: "",
  dob: "",
  father_name: "",
  mother_name: "",
  caste: "",
  mobile_no: "",
  sats_no: "",
  pen_no: "",
  birth_certificate_no: "",
  aadhar_no: "",
  village: "",
  class_name: selectedClass,
  section: selectedSection,
  roll_number: "",
  academic_year: "2026-27"
});

  };
  // ✅ PLACE THIS OUTSIDE YOUR MAIN COMPONENT FUNCTION
  // 1. MUST be outside the main component
  const Input = ({ label, value, onChange, disabled, type = "text", placeholder = "" }: any) => {
    return (
      <div className="space-y-1">
        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">
          {label}
        </label>
        <input
          type={type}
          // Use value or empty string to keep it "controlled"
          value={value || ""}
          disabled={disabled}
          placeholder={placeholder}
          // Use e.target.value directly in the callback
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fdfafc] p-6 lg:p-10 font-sans">
      <Toaster position="top-center" richColors />

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

        {/* HEADER SECTION */}
        {/* --- ENHANCED HEADER SECTION --- */}
        <header className="bg-white p-6 lg:p-8 rounded-[3rem] border border-[#e9d1e4] shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

            {/* Branding & Stats Group */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-[#fdfafc] to-[#f5e6f1] text-[#d487bd] rounded-[2rem] flex items-center justify-center border border-[#e9d1e4] shadow-inner">
                <GraduationCap size={38} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                  STUDENT<span className="text-[#d487bd]">REGISTRY</span>
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[#d487bd] font-bold text-[10px] tracking-[0.2em] uppercase opacity-80">
                    Academic Session 2026-27
                  </p>
                  <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    {students.length} Enrolled
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Group */}
            <div className="flex flex-wrap items-center justify-center gap-3">

              {/* Hidden File Input for Import */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              {/* Undo Recent - Conditional Action */}
              {canUndo && (
                <button
                  onClick={handleUndo}
                  className="group bg-orange-50 text-orange-600 border border-orange-100 p-4 rounded-2xl hover:bg-orange-500 hover:text-white transition-all duration-300 active:scale-95"
                  title="Undo Recent Action"
                >
                  <RotateCcw size={20} />
                </button>
              )}

              {/* Sample Download */}
              <button
                onClick={downloadSample}
                className="bg-[#fdfafc] text-slate-600 border-2 border-[#e9d1e4]/30 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:border-[#d487bd] transition-all"
              >
                <Download size={18} className="text-[#d487bd]" /> Sample
              </button>

              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 hover:border-[#e9d1e4] transition-all"
              >
                {isImporting ? (
                  <Loader2 className="animate-spin text-emerald-500" size={18} />
                ) : (
                  <Upload size={18} className="text-emerald-500" />
                )}
                Import
              </button>

              {/* Primary Action: Enroll Student */}
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#d487bd] text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[#d487bd]/20 hover:bg-[#c36fa8] transition-all flex items-center gap-2 active:scale-95"
              >
                <UserPlus size={18} /> Enroll Student
              </button>
            </div>
          </div>
        </header>

        {/* LOADING INDICATOR */}
        {isImporting && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-pulse">
            <Loader2 size={18} className="text-blue-500 animate-spin" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verifying Row Data & Duplicates...</span>
          </div>
        )}

        {/* --- SCREEN-SAFE UNIFIED CONTROL CENTER --- */}
        <div className="space-y-4 max-w-full overflow-hidden">

          {/* TOP ROW: SEARCH & QUICK STATS */}
          <div className="flex flex-col xl:flex-row gap-3 items-stretch">

            {/* Search - Shrinks on mobile, grows on desktop */}
            <div className="flex-1 relative group min-w-0">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#d487bd] group-focus-within:scale-110 transition-transform">
                <FiSearch size={18} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-[#e9d1e4] rounded-3xl outline-none focus:ring-4 focus:ring-[#fdfafc] focus:border-[#d487bd] transition-all text-sm text-slate-600 font-bold shadow-sm"
              />
            </div>

            {/* Stats & Export - Wraps to prevent overflow */}
            <div className="flex gap-2 h-full">
              <div className="bg-white px-5 py-2 rounded-3xl border-2 border-[#e9d1e4] flex flex-col justify-center flex-1 sm:flex-none sm:min-w-[120px] shadow-sm">
                <span className="text-[8px] font-black text-[#d487bd] uppercase tracking-wider mb-0.5">Strength</span>
                <span className="text-lg font-black text-slate-800 leading-none">{students.length}</span>
              </div>

              <button
                onClick={exportToExcel}
                className="bg-white border-2 border-[#e9d1e4] px-4 rounded-3xl text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* BOTTOM ROW: ADVANCED FILTERS */}
          {/* Note: changed rounded-[3rem] to 3xl for better fit on mobile */}
          <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-[2rem] border border-[#e9d1e4] shadow-sm flex flex-col lg:flex-row items-center">

            {/* Grade Selection - Crucial: min-w-0 and overflow-hidden prevent pushing screen wide */}
            <div className="flex-1 w-full min-w-0 px-4 py-2 overflow-hidden">
              <p className="text-[8px] font-black text-[#d487bd] uppercase tracking-widest mb-2 ml-1">Grade</p>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mask-fade-right">
                {classes.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedClass === c
                      ? "bg-[#d487bd] text-white shadow-md shadow-[#d487bd]/20"
                      : "bg-white text-slate-400 border border-slate-100"
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Selection */}
            <div className="w-full lg:w-auto px-4 py-2 flex items-center justify-between lg:justify-start gap-4 border-t lg:border-t-0 lg:border-l border-[#e9d1e4]/40 mt-1 lg:mt-0">
              <div>
                <p className="text-[8px] font-black text-[#d487bd] uppercase tracking-widest mb-2">Section</p>
                <div className="flex gap-2">
                  {sections.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSection(s)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all border-2 ${selectedSection === s
                        ? "bg-slate-800 border-slate-800 text-white shadow-sm"
                        : "bg-white border-slate-100 text-slate-400"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset only shows if active - pushes to the right on mobile */}
              {(selectedClass !== 'All' || selectedSection !== 'All' || search !== '') && (
                <button
                  onClick={() => { setSelectedClass('All'); setSelectedSection('All'); setSearch(''); }}
                  className="lg:ml-2 p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Reset Filters"
                >
                  <FiXCircle size={20} />
                </button>
              )}
            </div>
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
                students.filter(s =>
                  (s.full_name || "").toLowerCase().includes(search.toLowerCase())
                )
                  .map((s) => (
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
                          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm"><Phone size={12} className="text-[#d487bd]" /> {s.mobile_no}</div>
                          <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
                            <Users size={12} className="text-slate-400" />
                            {s.father_name}
                          </div>                        </div>
                      </td>


                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setIsEditing(true); setCurrentStudentId(s.id); setFormData(s); setShowModal(true); }} className="p-3 text-blue-400 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                          <button
                            onClick={() => {
                              setMode('view');      // View mode
                              setCurrentStudentId(s.id);
                              setFormData(s);       // Load student data
                              setShowModal(true);

                            }}
                            className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-xl"
                          >
                            <FiEye size={18} />
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm("Revoke student enrollment?")) {
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

      {/* MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">

          {/* MODAL CONTAINER */}
          <div className="bg-white rounded-[2rem] w-full max-w-6xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] border border-white overflow-hidden flex flex-col max-h-[90vh]">

            {/* HEADER */}
            <div className="px-10 py-8 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-2 h-8 bg-[#d487bd] rounded-full" />
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {isEditing ? "Modify Enrollment" : "Student Profile"}
                  </h2>
                </div>
                <p className="text-xs font-bold text-[#d487bd] uppercase tracking-[0.25em] ml-5">
                  Academic Session 2026-27
                </p>
              </div>

              <button onClick={closeModal} className="group p-3 bg-white hover:bg-rose-50 border border-slate-100 rounded-2xl transition-all shadow-sm">
                <X size={20} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="px-10 py-10 overflow-y-auto custom-scrollbar bg-[#fcfaff]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* COLUMN 1: PERSONAL IDENTITY */}
                <div className="space-y-8">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Personal Info</h3>
                  </div>

                  <div className="space-y-4">
                    {/* STYLED DIRECT INPUT: This fixes the focus issue while looking great */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                      <input
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="John Doe"
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dob || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Father's Name</label>
                        <input
                          value={formData.father_name || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                          placeholder="Father's Full Name"
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Mother's Name</label>
                        <input
                          value={formData.mother_name || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, mother_name: e.target.value }))}
                          placeholder="Mother's Full Name"
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: ACADEMIC & CONTACT */}
                <div className="space-y-8">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Schooling</h3>
                  </div>

                  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Class</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-[#d487bd]/10 focus:border-[#d487bd] transition-all"
                          value={formData.class_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, class_name: e.target.value }))}
                          disabled={isReadOnly}
                        >
                          {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Section</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-[#d487bd]/10 focus:border-[#d487bd] transition-all"
                          value={formData.section}
                          onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                          disabled={isReadOnly}
                        >
                          {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Mobile Number</label>
                      <input
                        value={formData.mobile_no || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile_no: e.target.value }))}
                        placeholder="+91 00000 00000"
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Village/Address</label>
                      <input
                        value={formData.village || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                        placeholder="Enter full address"
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: GOVERNMENT IDS */}
                <div className="space-y-8">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Identifiers</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Roll No</label>
                        <input
                          type="number"
                          value={formData.roll_number || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, roll_number: e.target.value }))}
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Caste</label>
                        <input
                          value={formData.caste || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, caste: e.target.value }))}
                          disabled={isReadOnly}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">SATS Number</label>
                      <input
                        value={formData.sats_no || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, sats_no: e.target.value }))}
                        placeholder="Unique SATS ID"
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">Aadhaar Number</label>
                      <input
                        value={formData.aadhar_no || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, aadhar_no: e.target.value }))}
                        placeholder="0000 0000 0000"
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider ml-1">PEN Number</label>
                      <input
                        value={formData.pen_no || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pen_no: e.target.value }))}
                        disabled={isReadOnly}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#d487bd] focus:ring-4 focus:ring-[#d487bd]/10 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-end items-center gap-4">
              <button onClick={closeModal} className="px-6 py-3 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">
                Cancel
              </button>

              {(mode === 'add' || mode === 'edit') && (
                <button
                  onClick={handleSubmit}
                  className="px-10 py-4 bg-[#d487bd] hover:bg-[#c376ab] text-white rounded-2xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-[#d487bd]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  {mode === 'add' ? 'Enroll Student' : 'Save Changes'}
                </button>
              )}
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