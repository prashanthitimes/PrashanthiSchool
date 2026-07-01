"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit, Trash2, Search, X, Shield, Calendar, BookOpen } from "lucide-react";
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
  student_id: string;
  student_name: string;
  father_name?: string;
  roll_no: number;
  class: string;
  section?: string;
  fee_type: string;
  total_amount: number;
  paid_amount: number;
  concession_amount: number;
  payment_method: string;
  payment_date?: string; // ✅ NEW
  utr_number?: string;
  remarks?: string;
  created_at?: string;
}

interface DBStudent {
  id: string;
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
  fee_type_id: string;
  fee_type: string;
  total_amount: string;
  already_paid: string;
  paying_now: string;
  concession_amount: string;
  payment_date: string; // ✅ NEW
  payment_method: string;
  utr_number: string;
  remarks: string;
}

export default function FeesPage() {
  const [classFees, setClassFees] = useState<ClassFee[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // ✅ NEW
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allFees, setAllFees] = useState<any[]>([]);

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

  // Form States
  const [classForm, setClassForm] = useState({ class: "", fee_type: "", amount: "" });
  const [studentForm, setStudentForm] = useState<StudentFormType>({
    student_id: "",
    student_name: "",
    father_name: "",
    roll_no: "",
    class: "",
    section: "",
    fee_type_id: "",
    fee_type: "",
    total_amount: "",
    already_paid: "",
    paying_now: "",
    concession_amount: "",
    payment_date: new Date().toISOString().split('T')[0], // ✅ NEW - Default to today
    payment_method: "",
    utr_number: "",
    remarks: "",
  });

  // ✅ FETCH FEE TYPES
  useEffect(() => {
    async function fetchFeeTypes() {
      const { data, error } = await supabase
        .from("fee_types")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!error && data) {
        setFeeTypes(data);
        const transport = data.find(f => f.name === "Transport Fee");
        if (transport) {
          setStudentForm(prev => ({
            ...prev,
            fee_type_id: transport.id,
            fee_type: transport.name,
          }));
        }
      }
    }
    fetchFeeTypes();
  }, []);

  // ✅ CALCULATIONS
  const liveRemaining =
    Number(studentForm.total_amount || 0)
    - Number(studentForm.already_paid || 0)
    - Number(studentForm.paying_now || 0)
    - Number(studentForm.concession_amount || 0);

  const isFullyPaid =
    Number(studentForm.total_amount || 0) -
    Number(studentForm.already_paid || 0) - Number(studentForm.concession_amount || 0) <= 0;

  const remainingBalance =
    Number(studentForm.total_amount || 0)
    - Number(studentForm.already_paid || 0)
    - Number(studentForm.concession_amount || 0);

  const ACADEMIC_CLASSES = [
    "Pre-KG", "LKG", "UKG",
    "1st", "2nd", "3rd", "4th", "5th",
    "6th", "7th", "8th", "9th", "10th"
  ];

  // ✅ FETCH ALL DATA
  useEffect(() => {
    fetchAll();
  }, []);

  // ✅ AUTO FETCH TOTAL AMOUNT FROM class_fees TABLE
  useEffect(() => {
    async function autoFetchFeeAmount() {
      const className = studentForm.class;
      const feeType = studentForm.fee_type;
      const studentId = studentForm.student_id;

      if (!feeType || !studentId) return;

      if (
        feeType === "Old Balances" ||
        feeType === "Special Development Fee" ||
        feeType === "Concession Fee"
      ) {
        return;
      }

      let standardAmount = 0;

      if (feeType === "Transport Fee") {
        const { data, error } = await supabase
          .from("transport_assignments")
          .select("*")
          .eq("student_id", studentId)
          .eq("status", "active");

        if (data && data.length > 0) {
          standardAmount = Number(data[0].monthly_fare);
        } else {
          standardAmount = 0;
          toast.error("No transport assigned for this student");
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

      const { data: payments } = await supabase
        .from("student_fees")
        .select("paid_amount, concession_amount")
        .eq("student_id", studentId)
        .eq("fee_type", feeType);

      const alreadyPaid =
        payments?.reduce((sum, p) => sum + Number(p.paid_amount), 0) || 0;

      setStudentForm((prev) => ({
        ...prev,
        total_amount: standardAmount.toString(),
        already_paid: alreadyPaid.toString(),
        paying_now: "",
        concession_amount: "",
      }));
    }

    autoFetchFeeAmount();
  }, [studentForm.fee_type, studentForm.class, studentForm.student_id]);

  // ✅ FETCH STUDENT SUGGESTIONS WITH PRE-KG, LKG, UKG, 9TH FIX
  useEffect(() => {
    async function fetchStudentSuggestions() {
      if (isSelectingStudent) {
        setIsSelectingStudent(false);
        return;
      }

      if (!studentSearch || studentSearch.length < 2) {
        setStudentSuggestions([]);
        return;
      }

      setFetchingStudents(true);

      // Fetch Pre-KG, LKG, UKG, 9th from any year
      const { data: earlyClassData, error: earlyError } = await supabase
        .from("students")
        .select("id, full_name, father_name, roll_number, class_name, section")
        .in('class_name', ['Pre-KG', 'LKG', 'UKG', '9th'])
        .ilike("full_name", `%${studentSearch}%`)
        .eq("status", "active")
        .limit(5);

      // Fetch other classes
      const { data: otherClassData, error: otherError } = await supabase
        .from("students")
        .select("id, full_name, father_name, roll_number, class_name, section")
        .notIn('class_name', ['Pre-KG', 'LKG', 'UKG', '9th'])
        .ilike("full_name", `%${studentSearch}%`)
        .eq("status", "active")
        .limit(5);

      const error = earlyError || otherError;
      const data = [...(earlyClassData || []), ...(otherClassData || [])];

      if (!error) {
        setStudentSuggestions(data || []);
      } else {
        setStudentSuggestions([]);
      }

      setFetchingStudents(false);
    }

    fetchStudentSuggestions();
  }, [studentSearch]);

  // ✅ FETCH ALL DATA
  async function fetchAll() {
    const { data: cf } = await supabase
      .from("class_fees")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: sf } = await supabase
      .from("student_fees")
      .select("*")
      .order("payment_date", { ascending: false }); // ✅ Sort by date

    setClassFees(cf || []);
    setStudentFees(sf || []);
  }

  // ✅ SELECT STUDENT FROM DROPDOWN
  const handleStudentPick = async (student: DBStudent) => {
    setIsSelectingStudent(true);

    setStudentForm((prev) => ({
      ...prev,
      student_id: student.id,
      student_name: student.full_name,
      father_name: student.father_name,
      roll_no: student.roll_number?.toString() || "",
      class: student.class_name,
      section: student.section,
      payment_date: new Date().toISOString().split('T')[0], // ✅ Reset to today
    }));

    let combinedFees: any[] = [];

    const { data: classFeesData } = await supabase
      .from("class_fees")
      .select("*")
      .eq("class", student.class_name);

    if (classFeesData) {
      classFeesData.forEach((fee) => {
        combinedFees.push({
          id: fee.id,
          fee_type_id: fee.id,
          label: fee.fee_type,
          fee_type: fee.fee_type,
          amount: Number(fee.amount),
        });
      });
    }

    const { data: transportData } = await supabase
      .from("transport_assignments")
      .select("*")
      .eq("student_id", student.id)
      .eq("status", "active")
      .maybeSingle();

    if (transportData) {
      combinedFees.push({
        id: "transport",
        label: "Transport Fee",
        fee_type: "Transport Fee",
        amount: Number(transportData.monthly_fare),
      });
    }

    const { data: obData } = await supabase
      .from("student_fees_ob")
      .select("*")
      .eq("student_id", student.id)
      .maybeSingle();

    if (obData && Number(obData.opening_balance) > 0) {
      combinedFees.push({
        id: obData.id,
        label: "Old Balance",
        fee_type: "Opening Balance",
        amount: Number(obData.opening_balance),
      });
    }

    const { data: entryData } = await supabase
      .from("student_fees_entries")
      .select("*")
      .eq("student_id", student.id);

    if (entryData) {
      entryData.forEach((entry) => {
        combinedFees.push({
          id: entry.id,
          label: "Special Development Fee",
          fee_type: "Special Development Fee",
          amount: Number(entry.amount_fees),
        });
      });
    }

    combinedFees.push({
      id: "concession",
      label: "Concession Fee",
      fee_type: "Concession Fee",
      amount: 0,
    });

    setAllFees(combinedFees);
    setStudentSearch(student.full_name);
    setStudentSuggestions([]);
  };

  // ✅ SAVE CLASS FEE
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

  // ✅ SAVE STUDENT FEE WITH DATE AND CONCESSION
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
      Number(studentForm.already_paid || 0) -
      Number(studentForm.concession_amount || 0);

    if (Number(studentForm.paying_now || 0) > remaining) {
      toast.error("Payment exceeds remaining balance.");
      setLoading(false);
      return;
    }

    const payAmount = Number(studentForm.paying_now || 0);
    const concessionAmount = Number(studentForm.concession_amount || 0);

    const matchedMasterFee = feeTypes.find(f => f.name === studentForm.fee_type);
    const correctFeeTypeId = matchedMasterFee ? matchedMasterFee.id : null;

    const { data: existingRecords } = await supabase
      .from("student_fees")
      .select("*")
      .eq("student_id", studentForm.student_id)
      .eq("fee_type", studentForm.fee_type);

    const { error } = await supabase
      .from("student_fees")
      .insert([
        {
          student_id: studentForm.student_id,
          student_name: studentForm.student_name,
          father_name: studentForm.father_name || null,
          roll_no: Number(studentForm.roll_no),
          class: studentForm.class,
          section: studentForm.section || null,
          fee_type_id: correctFeeTypeId,
          fee_type: studentForm.fee_type,
          total_amount: Number(studentForm.total_amount),
          paid_amount: payAmount,
          concession_amount: concessionAmount,
          payment_date: studentForm.payment_date, // ✅ Save date
          payment_method: studentForm.payment_method,
          utr_number: studentForm.utr_number || null,
          remarks: studentForm.remarks || "",
        },
      ]);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(
      existingRecords && existingRecords.length > 0
        ? "Installment added successfully!"
        : "Fee added successfully!"
    );

    closeModals();
    fetchAll();
    setLoading(false);
  };

  // ✅ DELETE RECORD
  const deleteRecord = async (table: string, id: string) => {
    if (confirm("Are you sure you want to delete this?")) {
      await supabase.from(table).delete().eq("id", id);
      fetchAll();
      toast.success("Record deleted!");
    }
  };

  // ✅ OPEN EDIT
  const openEdit = async (type: "class" | "student", item: any) => {
    setEditingId(item.id);

    if (type === "class") {
      setClassForm({
        class: item.class,
        fee_type: item.fee_type,
        amount: item.amount.toString(),
      });
      setIsClassModalOpen(true);
    } else {
      const student = await supabase
        .from("students")
        .select("*")
        .eq("id", item.student_id)
        .single();

      if (student.data) {
        const s = student.data;

        let combinedFees: any[] = [];

        const { data: classFeesData } = await supabase
          .from("class_fees")
          .select("*")
          .eq("class", s.class_name);

        if (classFeesData) {
          classFeesData.forEach((fee) => {
            combinedFees.push({
              id: fee.id,
              fee_type_id: fee.id,
              label: fee.fee_type,
              fee_type: fee.fee_type,
              amount: Number(fee.amount),
            });
          });
        }

        const { data: transportData } = await supabase
          .from("transport_assignments")
          .select("*")
          .eq("student_id", s.id)
          .eq("status", "active")
          .maybeSingle();

        if (transportData) {
          combinedFees.push({
            id: "transport",
            label: "Transport Fee",
            fee_type: "Transport Fee",
            amount: Number(transportData.monthly_fare),
          });
        }

        combinedFees.push({
          id: "concession",
          label: "Concession Fee",
          fee_type: "Concession Fee",
          amount: 0,
        });

        setAllFees(combinedFees);
      }

     setStudentForm({
  student_id: item.student_id || "",
  student_name: item.student_name || "",
  father_name: item.father_name || "",
  roll_no: item.roll_no?.toString() || "",
  class: item.class || "",
  section: item.section || "",
  fee_type_id: item.fee_type_id || "",
  fee_type: item.fee_type || "",
  total_amount: item.total_amount?.toString() || "0",
  already_paid: (item.total_amount - item.paid_amount - (item.concession_amount || 0)).toString() || "0", // ✅ SHOW REMAINING
  paying_now: item.paid_amount?.toString() || "0", // ✅ SHOW PAID AMOUNT
  concession_amount: (item.concession_amount || 0).toString() || "0", // ✅ SHOW CONCESSION
  payment_date: item.payment_date ? item.payment_date : new Date().toISOString().split('T')[0], // ✅ SHOW DATE
  payment_method: item.payment_method || "Cash",
  utr_number: item.utr_number || "",
  remarks: item.remarks || "",
});

      setStudentSearch(item.student_name);
      setIsStudentModalOpen(true);
    }
  };

  // ✅ CLOSE MODALS
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
      fee_type: "",
      total_amount: "",
      already_paid: "",
      paying_now: "",
      concession_amount: "",
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "",
      utr_number: "",
      remarks: "",
    });

    setStudentSearch("");
    setStudentSuggestions([]);
  };

  // ✅ FILTER BY DATE AND SEARCH
  const filteredStudents = studentFees.filter((s) => {
    const matchSearch =
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.class.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDate = dateFilter
      ? new Date(s.payment_date || s.created_at || "").toISOString().split("T")[0] === dateFilter
      : true;

    return matchSearch && matchDate;
  });

  // ✅ EXPORT TO EXCEL
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
      "Concession (₹)": fee.concession_amount || 0,
      "Remaining Balance (₹)": fee.total_amount - fee.paid_amount - (fee.concession_amount || 0),
      "Payment Date": fee.payment_date || fee.created_at?.split("T")[0] || "",
      "Payment Method": fee.payment_method,
      Status: fee.total_amount - fee.paid_amount - (fee.concession_amount || 0) <= 0 ? "Fully Paid" : "Pending",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Fees");

    const fileName = `Fees_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Excel file downloaded successfully!");
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300 min-h-screen">
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

            <button onClick={exportToExcel} className="md:hidden p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BookOpen size={20} />
            </button>
          </div>

          <div className="flex flex-wrap md:flex-row items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="flex-[1.5] md:flex-none bg-brand text-white px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand/20 hover:shadow-brand/40"
            >
              <Plus size={16} className="inline mr-1" /> New Entry
            </button>

            <button
              onClick={exportToExcel}
              className="hidden md:block bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg shadow-emerald-600/20"
            >
              <BookOpen size={16} className="inline mr-2" /> Export Excel
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Main Table Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search by Name/Class */}
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={20} />
                <input
                  type="text"
                  placeholder="Search by student name or class..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-transparent dark:border-slate-800 shadow-sm focus:border-brand-soft dark:focus:border-brand/40 outline-none transition-all text-base dark:text-slate-200"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
              </div>

              {/* Date Filter */}
              <div className="relative group md:w-48">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={20} />
                <input
                  type="date"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-transparent dark:border-slate-800 shadow-sm focus:border-brand-soft dark:focus:border-brand/40 outline-none transition-all dark:text-slate-200"
                  onChange={(e) => setDateFilter(e.target.value)}
                  value={dateFilter}
                />
              </div>

              {/* Clear Date Filter */}
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                >
                  ✕ Clear Date
                </button>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-brand/10 dark:border-brand/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-accent/30 dark:bg-brand/10 text-brand-dark dark:text-brand-soft text-xs uppercase tracking-widest">
                      <th className="p-5 font-bold">Student Details</th>
                      <th className="p-5 font-bold">Fee Type</th>
                      <th className="p-5 font-bold text-center">Total</th>
                      <th className="p-5 font-bold text-center">Paid</th>
                      <th className="p-5 font-bold text-center">Concession</th>
                      <th className="p-5 font-bold text-center">Payment Date</th>
                      <th className="p-5 font-bold text-right">Balance</th>
                      <th className="p-5 font-bold text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-400">No records found.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const balance = s.total_amount - s.paid_amount - (s.concession_amount || 0);
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
                            <td className="p-5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              ₹{s.total_amount.toLocaleString()}
                            </td>
                            <td className="p-5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{s.paid_amount.toLocaleString()}
                            </td>
                            <td className="p-5 text-center font-mono font-bold text-orange-600 dark:text-orange-400">
                              ₹{(s.concession_amount || 0).toLocaleString()}
                            </td>
                            <td className="p-5 text-center text-sm font-bold text-slate-600 dark:text-slate-400">
                              {s.payment_date ? new Date(s.payment_date).toLocaleDateString('en-IN') : new Date(s.created_at || "").toLocaleDateString('en-IN')}
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
                const balance = s.total_amount - s.paid_amount - (s.concession_amount || 0);
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
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Total</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">₹{s.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Paid</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{s.paid_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Concession</p>
                        <p className="text-sm font-black text-orange-600 dark:text-orange-400">₹{(s.concession_amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Balance</p>
                        <p className="text-sm font-black text-brand leading-none">₹{balance.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      📅 {s.payment_date ? new Date(s.payment_date).toLocaleDateString('en-IN') : new Date(s.created_at || "").toLocaleDateString('en-IN')}
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
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-5xl h-full max-h-[85vh] md:h-auto overflow-hidden animate-in zoom-in duration-300 border border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row">

              {/* Left Sidebar */}
              <div className="w-full md:w-[32%] p-6 md:p-8 bg-brand text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-xl border border-white/20 shadow-inner">
                    <Shield size={22} className="text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tighter">
                    {editingId ? "Update" : "New"} <br />
                    <span className="text-white/80 italic font-medium text-xl md:text-2xl">Entry</span>
                  </h3>
                  <div className="h-1 w-12 bg-white/40 rounded-full mt-4"></div>
                </div>

                {!isClassModalOpen && (
                  <div className="relative z-10 my-6 md:my-0 bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-2xl shadow-xl">
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Live Balance
                    </p>
                    <div className="flex justify-between items-center bg-slate-900/20 backdrop-blur-md p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-white/70 uppercase max-w-[60%] leading-tight">
                        Remaining After Payment
                      </p>
                      <p className={`text-base md:text-lg font-black ${liveRemaining < 0 ? "text-red-300" : "text-emerald-300"
                        }`}>
                        ₹{liveRemaining.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <p className="relative z-10 text-[9px] font-bold opacity-50 uppercase tracking-[0.3em] mt-auto">Finance Ledger v2.2</p>
              </div>

              {/* Right Side Form Content */}
              <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 relative flex flex-col overflow-hidden max-h-[65vh] md:max-h-[85vh]">

                {/* Header Fixed Area */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
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

                {/* Scrollable Form Body Container */}
                <form onSubmit={isClassModalOpen ? handleSaveClassFee : handleSaveStudentFee} className="flex flex-col flex-1 overflow-hidden">

                  <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {isClassModalOpen ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            placeholder="Search student name..." className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl focus:border-brand outline-none font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm text-sm" />

                          {studentSuggestions.length > 0 && (
                            <div className="absolute top-[110%] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-2 space-y-1">
                              {studentSuggestions.map((s, index) => (
                                <button key={s.id} type="button" onClick={() => handleStudentPick(s)} className={`w-full text-left px-4 py-2.5 rounded-lg transition flex justify-between items-center ${highlightIndex === index ? "bg-brand text-white" : "hover:bg-brand/5 dark:hover:bg-brand/10 dark:text-slate-300"}`}>
                                  <div><p className="font-bold text-xs">{s.full_name}</p><p className="text-[10px] opacity-70">Parent: {s.father_name}</p></div>
                                  <span className="text-[9px] font-black px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{s.class_name}-{s.section}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {[{ label: 'Father', val: studentForm.father_name }, { label: 'Roll', val: studentForm.roll_no }, { label: 'Class', val: studentForm.class }, { label: 'Sec', val: studentForm.section }].map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{item.label}</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{item.val || '--'}</p>
                            </div>
                          ))}
                        </div>

                        {/* Main Form Fields Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column */}
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select Fee Configuration</label>
                              <select className="modal-input text-sm" value={studentForm.fee_type} onChange={async (e) => {
                                const selected = allFees.find((f) => f.label === e.target.value);
                                if (!selected) return;
                                const { data: payments } = await supabase.from("student_fees").select("paid_amount, concession_amount").eq("student_id", studentForm.student_id).eq("fee_type", selected.fee_type);
                                const alreadyPaid = payments?.reduce((sum, item) => sum + Number(item.paid_amount), 0) || 0;
                                setStudentForm({
                                  ...studentForm,
                                  fee_type_id: ["Opening Balance", "Special Development Fee", "Concession Fee", "Transport Fee"].includes(selected.fee_type) ? null : selected.id,
                                  fee_type: selected.fee_type,
                                  total_amount: selected.amount.toString(),
                                  already_paid: alreadyPaid.toString(),
                                  paying_now: "",
                                  concession_amount: "",
                                });
                              }}>
                                <option value="">Select Fee</option>
                                {allFees.map((fee) => (
                                  <option key={fee.id} value={fee.label}>{fee.label} - ₹{fee.amount}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase ml-1">Amount Paid (₹)</label>
                              <input className="modal-input text-base font-black border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" type="number" placeholder="Enter paid amount" value={studentForm.paying_now} onChange={(e) => setStudentForm({ ...studentForm, paying_now: e.target.value })} required />
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase ml-1">Concession Amount (₹)</label>
                              <input className="modal-input text-base font-black border-orange-100 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-500/5 text-orange-700 dark:text-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500" type="number" placeholder="Enter concession amount" value={studentForm.concession_amount} onChange={(e) => setStudentForm({ ...studentForm, concession_amount: e.target.value })} />
                            </div>

                            {/* ✅ Payment Date Field - Shows Today by Default */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase ml-1">Payment Date (Today)</label>
                              <input 
                                type="date" 
                                className="modal-input text-sm border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-500/5 text-blue-700 dark:text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold" 
                                value={studentForm.payment_date}
                                onChange={(e) => setStudentForm({ ...studentForm, payment_date: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Payment Method</label>
                          <div className="flex gap-2">
                            {["Cash", "UPI", "Bank"].map((method) => (
                              <button key={method} type="button" onClick={() => setStudentForm({ ...studentForm, payment_method: method })}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${studentForm.payment_method === method ? "bg-slate-900 dark:bg-brand text-white border-slate-900 dark:border-brand shadow-md" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}>
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Transaction Metadata */}
                        {studentForm.payment_method && (
                          <div className="animate-in fade-in slide-in-from-top-3 duration-200 space-y-3 bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            {(studentForm.payment_method === "UPI" || studentForm.payment_method === "Bank") && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Transaction Ref / UTR Number</label>
                                <input className="modal-input border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs" placeholder="ENTER UTR / TRANSACTION ID" value={studentForm.utr_number} onChange={(e) => setStudentForm({ ...studentForm, utr_number: e.target.value })} required />
                              </div>
                            )}
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Internal Ledger Notes</label>
                              <input className="modal-input border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs" placeholder="Enter remarks / notes (optional)" value={studentForm.remarks} onChange={(e) => setStudentForm({ ...studentForm, remarks: e.target.value })} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Footer Button */}
                  <div className="p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button disabled={loading} className="w-full bg-slate-900 dark:bg-brand text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-brand dark:hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg">
                      {loading ? "Syncing..." : editingId ? "Save Changes" : "Confirm Transaction"}
                    </button>
                  </div>

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