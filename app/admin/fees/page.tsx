"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Search, X, Shield, CheckCircle, Info, Filter, BookOpen } from "lucide-react";
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
interface StudentFormType {
  student_id: string;
  student_name: string;
  father_name: string;
  roll_no: string;
  class: string;
  section: string;
  fee_type_id: string;   // ✅ required
  fee_type: string;
  total_amount: string;
  already_paid: string;
  paying_now: string;
  payment_method: string;
  utr_number: string;
  remarks: string;
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
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
const [feeTypes, setFeeTypes] = useState<{ id: string; name: string }[]>([]);
  // Student Search State
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState<DBStudent[]>([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [isSelectingStudent, setIsSelectingStudent] = useState(false);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);
  const [classForm, setClassForm] = useState({ class: "", fee_type: "", amount: "" });

  const [studentForm, setStudentForm] = useState({
    student_id: "",
    student_name: "",
    father_name: "",
    roll_no: "",
    class: "",
    section: "",
   fee_type_id: "",   
    total_amount: "",
    already_paid: "",     // ✅ NEW
    paying_now: "",       // ✅ NEW (installment)
    payment_method: "",
    utr_number: "", remarks: "",  // ✅ NEW
  });
useEffect(() => {
  async function fetchFeeTypes() {
    const { data, error } = await supabase
      .from("fee_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error) setFeeTypes(data || []);
  }

  fetchFeeTypes();
}, []);


  const isFullyPaid =
    Number(studentForm.total_amount || 0) -
    Number(studentForm.already_paid || 0) <= 0;
  const isFirstPayment =
    Number(studentForm.already_paid || 0) === 0;

  const remainingBalance =
    Number(studentForm.total_amount || 0) -
    Number(studentForm.already_paid || 0) -
    Number(studentForm.paying_now || 0);

  const ACADEMIC_CLASSES = [
    "Pre-KG", "LKG", "UKG",
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

    if (!feeType || !studentId) return; // early return if incomplete

    let standardAmount = 0;

    // 1️⃣ Fetch standard amount
    if (feeType === "Transport Fee") {
      const { data } = await supabase
        .from("transport_assignments")
        .select("monthly_fare")
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        standardAmount = Number(data.monthly_fare);
      }
    } else {
      const { data } = await supabase
        .from("class_fees")
        .select("amount")
        .eq("class", className)
        .eq("fee_type", feeType)
        .maybeSingle();

      if (data) {
        standardAmount = Number(data.amount);
      }
    }

    // 2️⃣ Fetch already paid amount
    const { data: payments } = await supabase
      .from("student_fees")
      .select("paid_amount")
      .eq("student_id", studentId)
      .eq("fee_type", feeType);

    const alreadyPaid =
      payments?.reduce((sum, p) => sum + Number(p.paid_amount), 0) || 0;

    // 3️⃣ Update form state
    setStudentForm((prev) => ({
      ...prev,
      total_amount: standardAmount.toString(),
      already_paid: alreadyPaid.toString(),
      paying_now: "", // reset on selection
    }));
  }

  autoFetchFeeAmount();
}, [studentForm.fee_type, studentForm.class, studentForm.student_id]);

  // FETCH STUDENT SUGGESTIONS BASED ON SEARCH INPUT
  useEffect(() => {
    async function fetchStudentSuggestions() {

      // 🚫 stop fetching if student just selected
      if (isSelectingStudent) {
        setIsSelectingStudent(false);
        return;
      }

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
    setIsSelectingStudent(true);   // 👈 add this

    setStudentForm((prev) => ({
      ...prev,
      student_id: student.id,
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

    const payload = {
      class: classForm.class,
      fee_type: classForm.fee_type,
      amount: Number(classForm.amount),
    };

    const { error } = editingId
      ? await supabase.from("class_fees").update(payload).eq("id", editingId)
      : await supabase.from("class_fees").insert([payload]);

    if (!error) {
      closeModals();
      fetchAll();
      toast.success(
        editingId ? "Fee structure updated!" : "Fee structure added!"
      );
    } else {
      toast.error(error.message);
    }

    setLoading(false);
  };

  const handleSaveStudentFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isFullyPaid) {
      toast.error("This fee is already fully paid.");
      setLoading(false);
      return;
    }

    const remaining =
      Number(studentForm.total_amount || 0) -
      Number(studentForm.already_paid || 0);

    if (Number(studentForm.paying_now || 0) > remaining) {
      toast.error("Payment exceeds remaining balance.");
      setLoading(false);
      return;
    }

    const payAmount = Number(studentForm.paying_now || 0);

    // 🔍 Check if record already exists
    const { data: existingRecord } = await supabase
      .from("student_fees")
      .select("*")
      .eq("student_id", studentForm.student_id)
      .eq("fee_type", studentForm.fee_type)
      .maybeSingle();

   if (existingRecord) {
  const newPaidAmount = Number(existingRecord.paid_amount) + payAmount;

  const { error } = await supabase
    .from("student_fees")
    .update({
      paid_amount: newPaidAmount,
      fee_type_id: studentForm.fee_type_id,
      utr_number: studentForm.utr_number || null,
      payment_method: studentForm.payment_method,
        remarks: studentForm.remarks || "",
    })
    .eq("id", existingRecord.id);

  if (error) {
    toast.error(error.message);
    setLoading(false);
    return;
  }

  toast.success("Installment added successfully!");
} else {
  const { error } = await supabase.from("student_fees").insert([
    {
      student_id: studentForm.student_id,
      student_name: studentForm.student_name,
      roll_no: Number(studentForm.roll_no),
      class: studentForm.class,
      fee_type_id: studentForm.fee_type_id, // ✅ save fee type ID
      fee_type: studentForm.fee_type,       // optional for display
      total_amount: Number(studentForm.total_amount),
      paid_amount: payAmount,
      payment_method: studentForm.payment_method,
      utr_number: studentForm.utr_number || null, // ✅ save UTR
     remarks: studentForm.remarks || "",
    },
  ]);

  if (error) {
    toast.error(error.message);
    setLoading(false);
    return;
  }

  toast.success("Fee added successfully!");
}

    closeModals();
    fetchAll();
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
  student_id: item.student_id || "",
  student_name: item.student_name || "",
  father_name: item.father_name || "",
  roll_no: item.roll_no?.toString() || "",
  class: item.class || "",
  section: item.section || "",
  fee_type_id: item.fee_type_id || "",   // ✅ ADD
  fee_type: item.fee_type || "",
  total_amount: item.total_amount?.toString() || "",
  already_paid: "",
  paying_now: "",
  payment_method: item.payment_method || "",
  utr_number: item.utr_number || "",
  remarks: item.remarks || "",
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
      student_id: "",
      student_name: "",
      father_name: "",
      roll_no: "",
      class: "",
      section: "",
       fee_type_id: "", 
      total_amount: "",
      already_paid: "",
      paying_now: "",
      payment_method: "",
      utr_number: "",  remarks: "",  // ✅ NEW
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
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-8xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-500">
        <Toaster position="top-right" />

        {/* Header */}
        <header className="flex flex-col gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-6 md:px-8 md:py-6 rounded-[2rem] md:rounded-[2.5rem] border border-brand/10 dark:border-brand/20 shadow-sm">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-soft dark:bg-brand/20 text-brand rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none">
                  Fees Management
                </h1>
                <p className="text-[9px] md:text-[10px] font-bold text-brand tracking-[0.2em] md:tracking-[0.25em] uppercase mt-1.5 opacity-80">
                  Financial Ledger Archive
                </p>
              </div>
            </div>

            {/* Mobile Export Button */}
            <button onClick={exportToExcel} className="md:hidden p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BookOpen size={20} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap md:flex-row items-center gap-2 md:gap-3">
          

            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="flex-[1.5] md:flex-none bg-brand text-white px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand/20"
            >
              <Plus size={16} className="inline mr-1" /> New Entry
            </button>

            <button
              onClick={exportToExcel}
              className="hidden md:block bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg shadow-emerald/20"
            >
              <BookOpen size={16} className="inline mr-2" /> Export Excel
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">

      

          {/* Main Table Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={20} />
              <input
                type="text"
                placeholder="Search by student name or class..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-transparent dark:border-slate-800 shadow-sm focus:border-brand-soft dark:focus:border-brand/40 outline-none transition-all text-lg dark:text-slate-200"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-brand/10 dark:border-brand/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-accent/30 dark:bg-brand/10 text-brand-dark dark:text-brand-soft text-xs uppercase tracking-widest">
                      <th className="p-5 font-bold">Student Details</th>
                      <th className="p-5 font-bold">Type / Class</th>
                      <th className="p-5 font-bold">Status</th>
                      <th className="p-5 font-bold text-right">Outstanding</th>
                      <th className="p-5 font-bold text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-slate-400">No records found.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const balance = s.total_amount - s.paid_amount;
                        return (
                          <tr key={s.id} className="hover:bg-brand-soft/10 dark:hover:bg-brand/5 transition-colors">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-brand-soft dark:bg-brand/20 text-brand flex items-center justify-center font-bold uppercase">
                                  {s.student_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">{s.student_name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Roll: {s.roll_no}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <p className="text-slate-700 dark:text-slate-300 font-medium">{s.fee_type}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Class {s.class}</p>
                            </td>
                            <td className="p-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${balance <= 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-brand-soft dark:bg-brand/20 text-brand-dark dark:text-brand-soft"
                                }`}>
                                {balance <= 0 ? "Fully Paid" : "Balance Due"}
                              </span>
                            </td>
                            <td className="p-5 text-right font-mono font-bold text-lg text-brand">
                              ₹{balance.toLocaleString()}
                            </td>
                            <td className="p-5">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => openEdit("student", s)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:bg-brand hover:text-white transition-all">
                                  <Edit size={16} />
                                </button>
                                <button onClick={() => deleteRecord("student_fees", s.id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden bg-white dark:bg-slate-900 rounded-3xl border border-brand/10 dark:border-brand/20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((s) => {
                const balance = s.total_amount - s.paid_amount;
                return (
                  <div key={s.id} className="p-5 space-y-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-soft dark:bg-brand/20 text-brand flex items-center justify-center font-bold">{s.student_name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-200 leading-none">{s.student_name}</p>
                          <p className="text-[10px] text-slate-400 uppercase mt-1">Roll: {s.roll_no} • Class {s.class}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${balance <= 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-brand-soft dark:bg-brand/20 text-brand-dark dark:text-brand-soft"}`}>
                        {balance <= 0 ? "Paid" : "Due"}
                      </span>
                    </div>
                    <div className="flex items-end justify-between bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Fee Category</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.fee_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Outstanding</p>
                        <p className="text-lg font-black text-brand leading-none">₹{balance.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit("student", s)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-brand hover:text-white transition-all">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => deleteRecord("student_fees", s.id)} className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL */}
        {(isClassModalOpen || isStudentModalOpen) && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 border border-white/20 dark:border-slate-800 flex flex-col md:flex-row min-h-[500px]">

              {/* Left Sidebar */}
              <div className="md:w-[35%] p-10 bg-brand text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-xl border border-white/20 shadow-inner">
                    <Shield size={22} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black leading-tight tracking-tighter">
                    {editingId ? "Update" : "New"} <br />
                    <span className="text-white/80 italic font-medium text-2xl">Entry</span>
                  </h3>
                  <div className="h-1 w-12 bg-white/40 rounded-full mt-4"></div>
                </div>

                {!isClassModalOpen && (
                  <div className="relative z-10 bg-white/10 p-5 rounded-[2rem] border border-white/20 backdrop-blur-2xl shadow-2xl">
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Live Balance
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs opacity-80 font-medium">Remaining Amount</p>
                      <div className="flex justify-between items-end">
                        <p className="text-3xl font-mono font-bold tracking-tighter">₹{Number(remainingBalance).toLocaleString()}</p>
                        <span className={`text-[9px] px-2 py-1 rounded-lg font-black tracking-tighter ${remainingBalance <= 0 ? "bg-emerald-500/20 text-emerald-200" : "bg-orange-500/20 text-orange-200"}`}>
                          {remainingBalance <= 0 ? "SETTLED" : "DUE"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <p className="relative z-10 text-[9px] font-bold opacity-50 uppercase tracking-[0.3em]">Finance Ledger v2.0</p>
              </div>

              {/* Right Side Form */}
              <div className="flex-1 p-8 bg-slate-50/50 dark:bg-slate-900/50 relative flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-brand rounded-full"></div>
                    <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase text-[11px] tracking-widest">
                      {isClassModalOpen ? "Class Fee Configuration" : "Student Payment Portal"}
                    </h4>
                  </div>
                  <button onClick={closeModals} className="group p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                    <X size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>

                <form onSubmit={isClassModalOpen ? handleSaveClassFee : handleSaveStudentFee} className="space-y-5 flex-1">
                  {isClassModalOpen ? (
                    <div className="grid grid-cols-1 gap-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class</label>
                          <select className="modal-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" value={classForm.class} onChange={(e) => setClassForm({ ...classForm, class: e.target.value })} required>
                            <option value="">Select Class</option>
                            {ACADEMIC_CLASSES.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                          <select className="modal-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" value={classForm.fee_type} onChange={(e) => setClassForm({ ...classForm, fee_type: e.target.value })} required>
                            <option value="">Select Type</option>
                            {["Tuition Fee", "Exam Fee", "Certificate fee", "Application fee", "Evening Class fee", "Special Development fee"].map(fee => (<option key={fee}>{fee}</option>))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-brand uppercase ml-1">Standard Amount (₹)</label>
                        <input className="modal-input text-xl font-black text-slate-800 dark:text-slate-100 dark:bg-slate-800 dark:border-brand/20 focus:border-brand" type="number" placeholder="0.00" value={classForm.amount} onChange={(e) => setClassForm({ ...classForm, amount: e.target.value })} required />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Student Search */}
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Search size={16} className="text-slate-400 group-focus-within:text-brand transition-colors" />
                        </div>
                        <input type="text" value={studentSearch} onChange={(e) => { setIsSelectingStudent(false); setStudentSearch(e.target.value); setHighlightIndex(-1); }}
                          placeholder="Search student name..." className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-brand outline-none font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm" />
                        {studentSuggestions.length > 0 && (
                          <div className="absolute top-[110%] left-0 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2 space-y-1">
                            {studentSuggestions.map((s, index) => (
                              <button key={s.id} type="button" onClick={() => handleStudentPick(s)} className={`w-full text-left px-4 py-3 rounded-xl transition flex justify-between items-center ${highlightIndex === index ? "bg-brand text-white" : "hover:bg-brand/5 dark:hover:bg-brand/10 dark:text-slate-300"}`}>
                                <div><p className="font-bold text-sm">{s.full_name}</p><p className="text-[10px] opacity-70">Parent: {s.father_name}</p></div>
                                <span className="text-[9px] font-black px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700">{s.class_name}-{s.section}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[{ label: 'Father', val: studentForm.father_name }, { label: 'Roll', val: studentForm.roll_no }, { label: 'Class', val: studentForm.class }, { label: 'Sec', val: studentForm.section }].map((item, idx) => (
                          <div key={idx} className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{item.label}</p>
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">{item.val || '--'}</p>
                          </div>
                        ))}
                      </div>

                      {/* Payment Inputs */}
                      <div className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Payment For</label>
                          <select
  className="modal-input dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
  value={studentForm.fee_type_id}
  onChange={(e) => {
    const selectedFee = feeTypes.find(f => f.id === e.target.value);
    setStudentForm({
      ...studentForm,
      fee_type_id: e.target.value,
      fee_type: selectedFee?.name || "",
    });
  }}
  required
>
  <option value="">Select Fee Type</option>
  {feeTypes.map(f => (
    <option key={f.id} value={f.id}>
      {f.name}
    </option>
  ))}
</select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-brand uppercase ml-1">Pay Now</label>
                            <input className="modal-input border-brand-soft dark:border-brand/30 dark:bg-slate-800 dark:text-slate-100 font-black text-brand text-lg" type="number" value={studentForm.paying_now} onChange={(e) => setStudentForm({ ...studentForm, paying_now: e.target.value })} disabled={isFullyPaid} required />
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="flex gap-2">
                          {["Cash", "UPI", "Bank"].map((method) => (
                            <button key={method} type="button" onClick={() => setStudentForm({ ...studentForm, payment_method: method })}
                              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${studentForm.payment_method === method ? "bg-slate-900 dark:bg-brand text-white border-slate-900 shadow-lg" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                              {method}
                            </button>
                          ))}
                        </div>

                     {(studentForm.payment_method === "UPI" || studentForm.payment_method === "Bank") && (
  <div className="animate-in slide-in-from-top-2 space-y-2">
    <input
      className="modal-input border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-sm"
      placeholder="ENTER UTR / TRANSACTION ID"
      value={studentForm.utr_number}
      onChange={(e) => setStudentForm({ ...studentForm, utr_number: e.target.value })}
      required
    />
    <input
      className="modal-input border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-sm"
      placeholder="Enter remarks / notes"
      value={studentForm.remarks}
      onChange={(e) => setStudentForm({ ...studentForm, remarks: e.target.value })}
    />
  </div>
)}
                      </div>
                    </div>
                  )}

                  <button disabled={loading} className="w-full bg-slate-900 dark:bg-brand text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-brand dark:hover:bg-brand-dark transition-all disabled:opacity-50 shadow-xl mt-auto">
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
          :global(.dark) .modal-input {
            border-color: #1e293b;
            background-color: #0f172a;
            color: #f1f5f9;
          }
          .modal-input:focus {
            background-color: white;
            border-color: #8f1e7a;
            box-shadow: 0 0 0 4px rgba(143, 30, 122, 0.05);
          }
          :global(.dark) .modal-input:focus {
            background-color: #1e293b;
            border-color: #8f1e7a;
          }
        `}</style>
      </div>
    </div>
  );
}
