"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Search, X, Shield, CheckCircle, Info, BookOpen } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import React from 'react';

interface ClassFee {
  id: string;
  class: string;
  fee_type: string;
  amount: number;
  created_at?: string;
}

interface StudentFee {
  id: string;
  student_name: string;
  father_name?: string;
  roll_no: number;
  class: string;
  fee_type: string;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  utr_number?: string;
  created_at?: string;
}

interface DBStudent {
  id: string; // ✅ real UUID PK
  full_name: string;
  father_name: string;
  roll_number: number;
  class_name: string;
  section: string;
}


export default function FeesPage() {
  const [classFees, setClassFees] = useState<ClassFee[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Student Search State
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState<DBStudent[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  const [classForm, setClassForm] = useState({ class: "", fee_type: "", amount: "" });

  const [studentForm, setStudentForm] = useState({
    student_id: "",   // ✅ ADD THIS
    student_name: "",
    father_name: "",
    roll_no: "",
    class: "",
    section: "",
    fee_type: "",
    total_amount: "",
    paid_amount: "",
    payment_method: "",
    utr_number: "",
  });


  const remainingBalance =
    Number(studentForm.total_amount || 0) - Number(studentForm.paid_amount || 0);

  const ACADEMIC_CLASSES = [
    "Pre-Nursery", "Nursery", "LKG", "UKG",
    "1st", "2nd", "3rd", "4th", "5th",
    "6th", "7th", "8th", "9th", "10th"
  ];

  useEffect(() => {
    fetchAll();
  }, []);

  // AUTO FETCH TOTAL AMOUNT FROM class_fees TABLE
  useEffect(() => {
    async function autoFetchFeeAmount() {
      const className = studentForm.class;
      const feeType = studentForm.fee_type;
      const studentId = studentForm.student_id;

      if (!feeType) return;

      // ✅ Transport Fee fetch from transport_assignments
      if (feeType === "Transport Fee" && studentId) {
        const { data, error } = await supabase
          .from("transport_assignments")
          .select("monthly_fare")
          .eq("student_id", studentId)
          .eq("status", "active")
          .single();

        if (!error && data) {
          setStudentForm((prev) => ({
            ...prev,
            total_amount: data.monthly_fare.toString(),
          }));
        } else {
          setStudentForm((prev) => ({
            ...prev,
            total_amount: "0",
          }));
        }

        return;
      }

      // ✅ Other fees fetch from class_fees
      if (className && feeType) {
        const { data, error } = await supabase
          .from("class_fees")
          .select("amount")
          .eq("class", className)
          .eq("fee_type", feeType)
          .single();

        if (!error && data) {
          setStudentForm((prev) => ({
            ...prev,
            total_amount: data.amount.toString(),
          }));
        }
      }
    }

    autoFetchFeeAmount();
  }, [studentForm.fee_type, studentForm.class, studentForm.student_id]);

  // FETCH STUDENT SUGGESTIONS BASED ON SEARCH INPUT
  useEffect(() => {
    async function fetchStudentSuggestions() {
      if (!studentSearch || studentSearch.length < 2) {
        setStudentSuggestions([]);
        return;
      }

      setFetchingStudents(true);

      const { data, error } = await supabase
        .from("students")
.select("id, full_name, father_name, roll_number, class_name, section")
        .ilike("full_name", `%${studentSearch}%`)
        .eq("status", "active")
        .limit(10);

      if (!error) {
        setStudentSuggestions(data || []);
      } else {
        setStudentSuggestions([]);
      }

      setFetchingStudents(false);
    }

    fetchStudentSuggestions();
  }, [studentSearch]);

  async function fetchAll() {
    const { data: cf } = await supabase
      .from("class_fees")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: sf } = await supabase
      .from("student_fees")
      .select("*")
      .order("created_at", { ascending: false });

    setClassFees(cf || []);
    setStudentFees(sf || []);
  }

  // SELECT STUDENT FROM SEARCH DROPDOWN
  const handleStudentPick = (student: DBStudent) => {
    setStudentForm((prev) => ({
      ...prev,
student_id: student.id, // ✅ store students.id (UUID)
      student_name: student.full_name,
      father_name: student.father_name,
      roll_no: student.roll_number?.toString() || "",
      class: student.class_name,
      section: student.section,
    }));

    setStudentSearch(student.full_name);
    setStudentSuggestions([]);
  };


  const handleSaveClassFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...classForm, amount: Number(classForm.amount) };

    const { error } = editingId
      ? await supabase.from("class_fees").update(payload).eq("id", editingId)
      : await supabase.from("class_fees").insert([payload]);

    if (!error) {
      closeModals();
      fetchAll();
      toast.success(editingId ? "Fee structure updated!" : "Fee structure added!");
    } else {
      toast.error(error.message);
    }

    setLoading(false);
  };

  const handleSaveStudentFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

 const payload: any = {
  student_name: studentForm.student_name,
  roll_no: studentForm.roll_no ? Number(studentForm.roll_no) : null,
  class: studentForm.class,
  fee_type: studentForm.fee_type,
  total_amount: Number(studentForm.total_amount),
  paid_amount: Number(studentForm.paid_amount || 0),
  payment_method: studentForm.payment_method,
  remarks: `Father: ${studentForm.father_name} | Section: ${studentForm.section} | UTR: ${studentForm.utr_number || "-"}`,
};



    const { error } = editingId
      ? await supabase.from("student_fees").update(payload).eq("id", editingId)
      : await supabase.from("student_fees").insert([payload]);

    if (!error) {
      closeModals();
      fetchAll();
      toast.success(editingId ? "Student fee updated!" : "Student fee added!");
    } else {
      toast.error(error.message);
    }

    setLoading(false);
  };

  const deleteRecord = async (table: string, id: string) => {
    if (confirm("Are you sure you want to delete this?")) {
      await supabase.from(table).delete().eq("id", id);
      fetchAll();
      toast.success("Record deleted!");
    }
  };

  const openEdit = (type: "class" | "student", item: any) => {
    setEditingId(item.id);

    if (type === "class") {
      setClassForm({
        class: item.class,
        fee_type: item.fee_type,
        amount: item.amount.toString(),
      });
      setIsClassModalOpen(true);
    } else {
  setStudentForm({
    student_id: item.student_id || "",  // ✅ if stored in table
    student_name: item.student_name || "",
    father_name: item.father_name || "",
    roll_no: item.roll_no?.toString() || "",
    class: item.class || "",
    section: item.section || "",
    fee_type: item.fee_type || "",
    total_amount: item.total_amount?.toString() || "",
    paid_amount: item.paid_amount?.toString() || "",
    payment_method: item.payment_method || "",
    utr_number: item.utr_number || "",
  });

  setStudentSearch(item.student_name);
  setIsStudentModalOpen(true);
}

  };

  const closeModals = () => {
    setIsClassModalOpen(false);
    setIsStudentModalOpen(false);
    setEditingId(null);

    setClassForm({ class: "", fee_type: "", amount: "" });

setStudentForm({
  student_id: "",   // ✅ ADD THIS
  student_name: "",
  father_name: "",
  roll_no: "",
  class: "",
  section: "",
  fee_type: "",
  total_amount: "",
  paid_amount: "",
  payment_method: "",
  utr_number: "",
});


    setStudentSearch("");
    setStudentSuggestions([]);
  };

  const filteredStudents = studentFees.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    if (studentFees.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const dataToExport = filteredStudents.map((fee) => ({
      "Student Name": fee.student_name,
      "Roll No": fee.roll_no,
      Class: fee.class,
      "Fee Type": fee.fee_type,
      "Total Amount (₹)": fee.total_amount,
      "Paid Amount (₹)": fee.paid_amount,
      "Remaining Balance (₹)": fee.total_amount - fee.paid_amount,
      "Payment Method": fee.payment_method,
      Status: fee.total_amount - fee.paid_amount <= 0 ? "Fully Paid" : "Pending",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Fees");

    const fileName = `Fees_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Excel file downloaded successfully!");
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-brand/10 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-soft text-brand rounded-2xl flex items-center justify-center shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">
              Fees Registry
            </h1>
            <p className="text-[10px] font-bold text-brand tracking-[0.25em] uppercase mt-1.5 opacity-80">
              Financial Ledger Archive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="bg-white border-2 border-brand-soft text-brand-dark px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-brand-soft active:scale-95"
          >
            <Plus size={16} className="inline mr-2" /> Class Fees Structure
          </button>

          <button
            onClick={() => setIsStudentModalOpen(true)}
            className="bg-brand text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-brand-dark active:scale-95 shadow-lg shadow-brand/30"
          >
            <Plus size={18} className="inline mr-2" /> New Student Fees Entry
          </button>

          <button
            onClick={exportToExcel}
            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald/20"
          >
            <BookOpen size={16} className="inline mr-2" /> Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-brand/10 overflow-hidden">
            <div className="p-6 border-b border-brand/5 bg-brand-accent/30">
              <h2 className="font-bold text-brand-dark flex items-center gap-2">
                <BookOpen size={18} /> Fee Structures
              </h2>
            </div>

            <div className="divide-y divide-slate-50">
              {classFees.length === 0 && (
                <p className="p-6 text-sm text-slate-400 italic">
                  No fee structures.
                </p>
              )}

              {classFees.map((f) => (
                <div
                  key={f.id}
                  className="p-5 flex items-center justify-between hover:bg-brand-soft/20 transition"
                >
                  <div>
                    <p className="font-bold text-slate-800">{f.class}</p>
                    <p className="text-[10px] text-brand font-bold uppercase mt-0.5">
                      {f.fee_type}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-brand text-lg">₹{f.amount}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit("class", f)}
                        className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-brand transition"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deleteRecord("class_fees", f.id)}
                        className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-red-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={20} />
            <input
              type="text"
              placeholder="Search by student name or class..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent shadow-sm focus:border-brand-soft outline-none transition-all text-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-brand/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-accent/30 text-brand-dark text-xs uppercase tracking-widest">
                    <th className="p-5 font-bold">Student Details</th>
                    <th className="p-5 font-bold">Class / Type</th>
                    <th className="p-5 font-bold">Status</th>
                    <th className="p-5 font-bold text-right">Outstanding</th>
                    <th className="p-5 font-bold text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                        No records found.
                      </td>
                    </tr>
                  )}

                  {filteredStudents.map((s) => {
                    const balance = s.total_amount - s.paid_amount;

                    return (
                      <tr key={s.id} className="hover:bg-brand-soft/10 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold uppercase">
                              {s.student_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">
                                {s.student_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Roll: {s.roll_no}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-5">
                          <p className="text-slate-700 font-medium">
                            Class {s.class}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">
                            {s.fee_type}
                          </p>
                        </td>

                        <td className="p-5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${balance <= 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-brand-soft text-brand-dark"
                              }`}
                          >
                            {balance <= 0 ? "Fully Paid" : "Balance Due"}
                          </span>
                        </td>

                        <td className="p-5 text-right font-mono font-bold text-lg text-brand">
                          ₹{balance.toLocaleString()}
                        </td>

                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEdit("student", s)}
                              className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-brand hover:text-white transition-all"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => deleteRecord("student_fees", s.id)}
                              className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {/* MODAL */}
      {(isClassModalOpen || isStudentModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 border border-white/20 flex flex-col md:flex-row min-h-[500px]">

            {/* Left Sidebar: Context & Summary (35% Width) */}
            {/* Left Sidebar: Context & Summary (35% Width) */}
            <div className="md:w-[35%] p-10 bg-gradient-to-br bg-brand text-white flex flex-col justify-between relative overflow-hidden">

              {/* Subtle Background Pattern Decor */}
              <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-52 h-52 bg-white/5 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-xl border border-white/20 shadow-inner">
                  <Shield size={22} className="text-white" />
                </div>

                <h3 className="text-3xl font-black leading-tight tracking-tighter">
                  {editingId ? "Update" : "New"} <br />
                  <span className="text-white/80 italic font-medium text-2xl">
                    Entry
                  </span>
                </h3>

                <div className="h-1 w-12 bg-white/40 rounded-full mt-4"></div>
              </div>

              {/* Live Calculation Card - Only for Student Modal */}
              {!isClassModalOpen && (
                <div className="relative z-10 bg-white/10 p-5 rounded-[2rem] border border-white/20 backdrop-blur-2xl shadow-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-70">
                      Live Balance
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs opacity-80 font-medium">Remaining Amount</p>

                    <div className="flex justify-between items-end">
                      <p className="text-3xl font-mono font-bold tracking-tighter">
                        ₹{Number(remainingBalance).toLocaleString()}
                      </p>

                      <span
                        className={`text-[9px] px-2 py-1 rounded-lg font-black tracking-tighter ${remainingBalance <= 0
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-orange-500/20 text-orange-200"
                          }`}
                      >
                        {remainingBalance <= 0 ? "SETTLED" : "DUE"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="relative z-10 text-[9px] font-bold opacity-50 uppercase tracking-[0.3em]">
                Finance Ledger v2.0
              </p>
            </div>


            {/* Right Side: Form Content (65% Width) */}
            <div className="flex-1 p-8 bg-slate-50/50 relative flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-brand rounded-full"></div>
                  <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">
                    {isClassModalOpen ? "Class Fee Configuration" : "Student Payment Portal"}
                  </h4>
                </div>
                <button
                  onClick={closeModals}
                  className="group p-2 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              <form
                onSubmit={isClassModalOpen ? handleSaveClassFee : handleSaveStudentFee}
                className="space-y-5 flex-1"
              >
                {isClassModalOpen ? (
                  /* CLASS MODAL CONTENT */
                  <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class</label>
                        <select
                          className="modal-input bg-white border-slate-200 focus:border-brand"
                          value={classForm.class}
                          onChange={(e) => setClassForm({ ...classForm, class: e.target.value })}
                          required
                        >
                          <option value="">Select Class</option>
                          {ACADEMIC_CLASSES.map((cls) => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                        <select
                          className="modal-input bg-white border-slate-200"
                          value={classForm.fee_type}
                          onChange={(e) => setClassForm({ ...classForm, fee_type: e.target.value })}
                          required
                        >
                          <option value="">Select Type</option>
                          {["Tuition Fee", "Transport Fee", "Exam Fee", "Certificate fee", "Application fee", "Evening Class fee", "Special Development fee"].map(fee => (
                            <option key={fee}>{fee}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 text-brand">Standard Amount (₹)</label>
                      <input
                        className="modal-input text-xl font-black text-slate-800 bg-white border-2 border-brand/10 focus:border-brand"
                        type="number"
                        placeholder="0.00"
                        value={classForm.amount}
                        onChange={(e) => setClassForm({ ...classForm, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  /* STUDENT MODAL CONTENT (Horizontal Optimized) */
                  <div className="space-y-5">
                    {/* Search Box */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={16} className="text-slate-400 group-focus-within:text-brand transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search student name..."
                        className="w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none font-bold text-slate-700 transition-all shadow-sm"
                        required={!editingId}
                      />

                      {studentSuggestions.length > 0 && (
                        <div className="absolute top-[110%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2 space-y-1 animate-in slide-in-from-top-2">
                          {studentSuggestions.map((s) => (
                            <button
key={s.id}
                              type="button"
                              onClick={() => handleStudentPick(s)}
                              className="w-full text-left px-4 py-3 hover:bg-brand/5 rounded-xl transition flex justify-between items-center group"
                            >
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{s.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium tracking-tight">Parent: {s.father_name}</p>
                              </div>
                              <span className="text-[9px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500 group-hover:bg-brand group-hover:text-white transition-colors">
                                {s.class_name}-{s.section}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Data Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Father', val: studentForm.father_name },
                        { label: 'Roll', val: studentForm.roll_no },
                        { label: 'Class', val: studentForm.class },
                        { label: 'Sec', val: studentForm.section }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-slate-100/50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{item.label}</p>
                          <p className="text-[11px] font-bold text-slate-600 truncate">{item.val || '--'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Payment Section */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Payment For</label>
                          <select
                            className="modal-input bg-slate-50 border-transparent focus:bg-white"
                            value={studentForm.fee_type}
                            onChange={(e) => setStudentForm({ ...studentForm, fee_type: e.target.value })}
                            required
                          >
                            <option value="">Select Fee Type</option>
                            {["Tuition Fee", "Transport Fee", "Exam Fee", "Certificate fee", "Application fee", "Evening Class fee", "Special Development fee"].map(fee => (
                              <option key={fee}>{fee}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Due</label>
                          <input className="modal-input bg-slate-100 font-bold opacity-60" value={studentForm.total_amount} readOnly />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-brand uppercase ml-1">Paying Now</label>
                          <input
                            className="modal-input border-brand-soft focus:ring-4 ring-brand/10 font-black text-brand text-lg"
                            type="number"
                            value={studentForm.paid_amount}
                            onChange={(e) => setStudentForm({ ...studentForm, paid_amount: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {/* Method Toggles */}
                      <div className="flex gap-2">
                        {["Cash", "UPI", "Bank"].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setStudentForm({ ...studentForm, payment_method: method })}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${studentForm.payment_method === method
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                              }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {/* UTR Field (Slide down) */}
                      {(studentForm.payment_method === "UPI" || studentForm.payment_method === "Bank") && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <input
                            className="modal-input border-emerald-100 bg-emerald-50/50 text-emerald-700 font-mono text-sm placeholder:text-emerald-300"
                            placeholder="ENTER UTR / TRANSACTION ID"
                            value={studentForm.utr_number}
                            onChange={(e) => setStudentForm({ ...studentForm, utr_number: e.target.value })}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-brand transition-all disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-[0.98] mt-auto"
                >
                  {loading ? "Syncing..." : editingId ? "Save Changes" : "Confirm Transaction"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-input {
          width: 100%;
          border: 2px solid #f1f5f9;
          background-color: #f8fafc;
          padding: 12px;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s;
          font-weight: 500;
          color: #1e293b;
        }
        .modal-input:focus {
          background-color: white;
          border-color: #8f1e7a;
          box-shadow: 0 0 0 4px rgba(143, 30, 122, 0.05);
        }
      `}</style>
    </div>
  );
}