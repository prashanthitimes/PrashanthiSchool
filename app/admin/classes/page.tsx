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

  const [selectedClass, setSelectedClass] = useState("Pre-KG");
  const [selectedSection, setSelectedSection] = useState("A");


  const classes = ["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
  const sections = ["A", "B", "C", "D"];

  // This filters the students list in real-time as you type
  const filteredStudents = students.filter((s) => {
    const searchTerm = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(searchTerm) ||
      s.student_id?.toLowerCase().includes(searchTerm) ||
      s.mobile_no?.includes(searchTerm) ||
      s.father_name?.toLowerCase().includes(searchTerm)
    );
  });
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
    if (filteredStudents.length === 0) return toast.error("No data to export");
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

    // Fix: Convert roll_number to integer or null
    const rollNumberInt = formData.roll_number === "" ? null : parseInt(formData.roll_number.toString());

    const payload = {
      ...formData,
      roll_number: rollNumberInt,
      email: formData.email || null,
      // Note: We don't usually send the 'id' (UUID) inside the update payload
    };

    if (mode === 'edit') {
      if (!currentStudentId) {
        return toast.error("Error: Missing Student ID for update");
      }

      const { error } = await supabase
        .from("students")
        .update(payload)
        .eq("id", currentStudentId); // Ensure this is the UUID from your table

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile Updated");
        closeModal();
        fetchStudents();
      }
    } else {
      // Add logic
      const newPayload = {
        ...payload,
        student_id: `STU-${Date.now().toString().slice(-6)}`
      };

      const { error } = await supabase.from("students").insert([newPayload]);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Student Enrolled");
        closeModal();
        fetchStudents();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setMode('add'); setCurrentStudentId(null);
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
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
    <div className="min-h-screen bg-[#fdfafc] dark:bg-slate-950 p-4 lg:p-10 font-sans transition-colors duration-300">
      <Toaster position="top-center" richColors />

      <div className="max-w-9xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-500">

        {/* --- ENHANCED HEADER SECTION --- */}
        <header className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[2rem] lg:rounded-[3rem] border border-[#e9d1e4] dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">

            {/* Branding & Stats Group */}
            <div className="flex items-center gap-4 lg:gap-5 w-full lg:w-auto">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#fdfafc] to-[#f5e6f1] dark:from-slate-800 dark:to-slate-900 text-[#d487bd] dark:text-[#e9d1e4] rounded-2xl lg:rounded-[2rem] flex items-center justify-center border border-[#e9d1e4] dark:border-slate-700 shadow-inner shrink-0">
                <GraduationCap size={32} />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
                  STUDENT<span className="text-[#d487bd] dark:text-[#e9d1e4]">REGISTRY</span>
                </h1>
                <div className="flex items-center gap-2 lg:gap-3 mt-1">
                  <p className="text-[#d487bd] dark:text-[#e9d1e4] font-bold text-[9px] lg:text-[10px] tracking-[0.1em] lg:tracking-[0.2em] uppercase opacity-80">
                    Session 2026-27
                  </p>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-[9px] lg:text-[10px] uppercase tracking-widest">
                    {students.length} Enrolled
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Group */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />

              <button
                onClick={downloadSample}
                className="bg-[#fdfafc] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-[#e9d1e4]/30 dark:border-slate-700 px-3 py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-700 hover:border-[#d487bd] transition-all"
              >
                <Download size={16} className="text-[#d487bd] dark:text-[#e9d1e4]" /> <span className="hidden xs:inline">Sample</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#e9d1e4] transition-all"
              >
                {isImporting ? <Loader2 className="animate-spin text-emerald-500" size={16} /> : <Upload size={16} className="text-emerald-500" />}
                <span className="hidden xs:inline">Import</span>
              </button>

              <button
                onClick={() => {
                  setMode('add');
                  setFormData({
                    student_id: "", full_name: "", email: "", parent_phone: "", dob: "",
                    father_name: "", mother_name: "", caste: "", mobile_no: "", sats_no: "",
                    pen_no: "", birth_certificate_no: "", aadhar_no: "", village: "",
                    class_name: selectedClass, section: selectedSection, roll_number: "", academic_year: "2026-27"
                  });
                  setShowModal(true);
                }} className="col-span-2 bg-[#d487bd] dark:bg-[#a63d93] text-white px-6 py-4 rounded-xl lg:rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[#d487bd]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <UserPlus size={18} /> Enroll Student
              </button>
            </div>
          </div>
        </header>

        {/* --- CONTROL CENTER --- */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#d487bd] dark:text-[#e9d1e4]">
                <FiSearch size={18} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-[#e9d1e4] dark:border-slate-800 rounded-2xl lg:rounded-3xl outline-none focus:border-[#d487bd] dark:focus:border-[#a63d93] transition-all text-sm font-bold shadow-sm dark:text-slate-200"
              />
            </div>

            <div className="flex gap-2">
              <div className="bg-white dark:bg-slate-900 px-6 py-2 rounded-2xl border-2 border-[#e9d1e4] dark:border-slate-800 flex flex-col justify-center flex-1 shadow-sm">
                <span className="text-[8px] font-black text-[#d487bd] dark:text-[#e9d1e4] uppercase tracking-wider">Total</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">{students.length}</span>
              </div>
              <button onClick={exportToExcel} className="bg-white dark:bg-slate-900 border-2 border-[#e9d1e4] dark:border-slate-800 px-5 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
                <FileSpreadsheet size={20} />
              </button>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-3xl border border-[#e9d1e4] dark:border-slate-800 shadow-sm">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 p-2 overflow-hidden">
                <p className="text-[8px] font-black text-[#d487bd] dark:text-[#e9d1e4] uppercase tracking-widest mb-2 ml-1">Select Grade</p>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
                  {classes.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedClass(c)}
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shrink-0 ${selectedClass === c
                        ? "bg-[#d487bd] dark:bg-[#a63d93] text-white shadow-md"
                        : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:border-l border-[#e9d1e4]/40 dark:border-slate-800 p-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black text-[#d487bd] dark:text-[#e9d1e4] uppercase tracking-widest mb-2">Section</p>
                  <div className="flex gap-2">
                    {sections.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSection(s)}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black transition-all border-2 ${selectedSection === s
                          ? "bg-slate-800 dark:bg-slate-700 border-slate-800 dark:border-slate-600 text-white"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {(selectedClass !== 'All' || selectedSection !== 'All' || search !== '') && (
                  <button onClick={() => { setSelectedClass('All'); setSelectedSection('All'); setSearch(''); }} className="p-2 text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl lg:mt-5">
                    <FiXCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- RESPONSIVE TABLE/LIST --- */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[3rem] border border-[#e9d1e4] dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Mobile List View */}
          <div className="block lg:hidden divide-y divide-slate-50 dark:divide-slate-800">
            {filteredStudents.length === 0 ? (
              <div className="p-20 text-center opacity-30 flex flex-col items-center dark:text-slate-400">
                <GraduationCap size={48} className="mb-2" />
                <p className="font-black uppercase text-[10px]">No Records Found</p>
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div key={s.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <span className="w-10 h-10 flex items-center justify-center bg-[#fdfafc] dark:bg-slate-800 border border-[#e9d1e4] dark:border-slate-700 rounded-xl font-black text-[#d487bd] dark:text-[#e9d1e4] text-xs">
                        {s.roll_number || "--"}
                      </span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.full_name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{s.student_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setMode('view'); setFormData(s); setShowModal(true); }} className="p-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><FiEye size={16} /></button>
                      <button onClick={() => { setMode('edit'); setFormData(s); setCurrentStudentId(s.id); setShowModal(true); }} className="p-2 text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><Edit3 size={16} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-[#fdfafc] dark:bg-slate-800/50 p-3 rounded-2xl border border-[#e9d1e4]/50 dark:border-slate-700">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Contact</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.mobile_no}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">Father's Name</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.father_name}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fdfafc] dark:bg-slate-800/50 border-b border-[#e9d1e4] dark:border-slate-800">
                <tr>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-[#d487bd] dark:text-[#e9d1e4] tracking-widest">Roll</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-[#d487bd] dark:text-[#e9d1e4] tracking-widest">Student Details</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-[#d487bd] dark:text-[#e9d1e4] tracking-widest">Contact Information</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-[#d487bd] dark:text-[#e9d1e4] tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#fdfafc] dark:divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fdfafc]/80 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="w-10 h-10 flex items-center justify-center bg-[#fdfafc] dark:bg-slate-800 border border-[#e9d1e4] dark:border-slate-700 rounded-xl font-black text-[#d487bd] dark:text-[#e9d1e4] text-xs shadow-sm">{s.roll_number || "--"}</span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-none mb-1">{s.full_name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{s.student_id}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-sm"><Phone size={12} className="text-[#d487bd] dark:text-[#e9d1e4]" /> {s.mobile_no}</div>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-medium text-xs"><Users size={12} /> {s.father_name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setMode('edit'); setFormData(s); setCurrentStudentId(s.id); setShowModal(true); }} className="p-3 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"><Edit3 size={18} /></button>
                        <button onClick={() => { setMode('view'); setFormData(s); setShowModal(true); }} className="p-3 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"><FiEye size={18} /></button>
                        <button className="p-3 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL - Fully Responsive Dark Mode */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-6xl shadow-2xl border border-white dark:border-slate-800 overflow-hidden flex flex-col h-[95vh] sm:h-auto max-h-[95vh]">

            {/* MODAL HEADER */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                  {mode === 'add' ? 'New Enrollment' : mode === 'edit' ? 'Modify Profile' : 'Student Record'}
                </h2>
                <p className="text-[9px] font-bold text-[#d487bd] dark:text-[#e9d1e4] uppercase tracking-widest">Academic Session 2026-27</p>
              </div>
              <button onClick={closeModal} className="p-3 bg-slate-50 dark:bg-slate-800 dark:text-slate-300 rounded-2xl"><X size={20} /></button>
            </div>
            {/* MODAL CONTENT */}
            <div className="px-6 py-6 sm:px-10 sm:py-10 overflow-y-auto bg-[#fcfaff] dark:bg-slate-950/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">

                {/* SECTION 1: Identity */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Identity Details</h3>
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      value={formData.full_name}
                      onChange={(val: string) => handleInputChange('full_name', val)}
                      disabled={mode === 'view'}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={formData.dob}
                        onChange={(val: string) => handleInputChange('dob', val)}
                        disabled={mode === 'view'}
                      />
                      <Input
                        label="Roll No"
                        type="number"
                        value={formData.roll_number}
                        onChange={(val: string) => handleInputChange('roll_number', val)}
                        disabled={mode === 'view'}
                      />
                    </div>
                    <Input
                      label="Father's Name"
                      value={formData.father_name}
                      onChange={(val: string) => handleInputChange('father_name', val)}
                      disabled={mode === 'view'}
                    />
                    <Input
                      label="Mother's Name"
                      value={formData.mother_name}
                      onChange={(val: string) => handleInputChange('mother_name', val)}
                      disabled={mode === 'view'}
                    />
                  </div>
                </div>

                {/* SECTION 2: Academic & Contact */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Academic & Contact</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase ml-1">Grade</label>
                        <select
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold dark:text-slate-200 outline-none focus:border-[#d487bd]"
                          value={formData.class_name || ""}
                          onChange={(e) => handleInputChange('class_name', e.target.value)}
                          disabled={mode === 'view'}
                        >
                          <option value="">Select Grade</option>
                          {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase ml-1">Section</label>
                        <select
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold dark:text-slate-200 outline-none focus:border-[#d487bd]"
                          value={formData.section || ""}
                          onChange={(e) => handleInputChange('section', e.target.value)}
                          disabled={mode === 'view'}
                        >
                          <option value="">Select Section</option>
                          {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input
                      label="Mobile No"
                      value={formData.mobile_no}
                      onChange={(val: string) => handleInputChange('mobile_no', val)}
                      disabled={mode === 'view'}
                    />
                    <Input
                      label="Village / Address"
                      value={formData.village}
                      onChange={(val: string) => handleInputChange('village', val)}
                      disabled={mode === 'view'}
                    />
                  </div>
                </div>

                {/* SECTION 3: Documentation */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b dark:border-slate-800 pb-2">Documentation</h3>
                  <div className="space-y-4">
                    <Input
                      label="Aadhaar Number"
                      value={formData.aadhar_no}
                      onChange={(val: string) => handleInputChange('aadhar_no', val)}
                      disabled={mode === 'view'}
                    />
                    <Input
                      label="SATS ID"
                      value={formData.sats_no}
                      onChange={(val: string) => handleInputChange('sats_no', val)}
                      disabled={mode === 'view'}
                    />
                    <Input
                      label="Caste"
                      value={formData.caste}
                      onChange={(val: string) => handleInputChange('caste', val)}
                      disabled={mode === 'view'}
                    />
                    <Input
                      label="PEN Number"
                      value={formData.pen_no}
                      onChange={(val: string) => handleInputChange('pen_no', val)}
                      disabled={mode === 'view'}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* MODAL FOOTER - Make sure the Save button has an onClick! */}
            <div className="px-6 py-6 sm:px-10 sm:py-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end items-center gap-3 shrink-0">
              <button onClick={closeModal} className="w-full sm:w-auto px-8 py-3 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">Close</button>
              {mode !== 'view' && (
                <button
                  onClick={handleSubmit} // Added this so it actually saves
                  className="w-full sm:w-auto px-10 py-4 bg-[#d487bd] dark:bg-[#a63d93] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
                >
                  {mode === 'add' ? 'Enroll Student' : 'Save Changes'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Custom Global Mobile Styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 640px) {
          input, select { font-size: 16px !important; } 
        }
        .dark input::placeholder { color: #64748b; }
      `}</style>
    </div>
  );
}