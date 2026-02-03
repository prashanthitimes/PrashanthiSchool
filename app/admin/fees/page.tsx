"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Edit, Trash2, Search, X, Shield,
  BookOpen
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx"; // Add this import at the top
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
  roll_no: number;
  class: string;
  fee_type: string;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
}

interface DBStudent {
  student_id: string;
  full_name: string;
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
  const exportToExcel = () => {
    if (studentFees.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // 1. Prepare and Clean the Data for Excel
    const dataToExport = filteredStudents.map((fee) => ({
      "Student Name": fee.student_name,
      "Roll No": fee.roll_no,
      "Class": fee.class,
      "Fee Type": fee.fee_type,
      "Total Amount (₹)": fee.total_amount,
      "Paid Amount (₹)": fee.paid_amount,
      "Remaining Balance (₹)": fee.total_amount - fee.paid_amount,
      "Payment Method": fee.payment_method,
      "Status": (fee.total_amount - fee.paid_amount) <= 0 ? "Fully Paid" : "Pending"
    }));

    // 2. Create a Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // 3. Create a Workbook and add the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Fees");

    // 4. Generate the Excel file and trigger download
    // Filename includes timestamp for uniqueness
    const fileName = `Fees_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success("Excel file downloaded successfully!");
  };
  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Cascading Selection States
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [availableStudents, setAvailableStudents] = useState<DBStudent[]>([]);

  const [classForm, setClassForm] = useState({ class: "", fee_type: "", amount: "" });
  const [studentForm, setStudentForm] = useState({
    student_name: "", roll_no: "", class: "", fee_type: "", total_amount: "", paid_amount: "", payment_method: "",
  });

  // Calculate live balance for the modal
  const remainingBalance = Number(studentForm.total_amount || 0) - Number(studentForm.paid_amount || 0);

  const ACADEMIC_CLASSES = [
    "Pre-Nursery", "Nursery", "LKG", "UKG",
    "1st", "2nd", "3rd", "4th", "5th",
    "6th", "7th", "8th", "9th", "10th"
  ];

  const SECTIONS = ["A", "B", "C", "D"];

  useEffect(() => { fetchAll(); }, []);
  // Inside FeesPage component
  useEffect(() => {
    async function autoFetchFeeAmount() {
      // We need both the class and the fee type to find the correct price
      // Note: your studentForm.class looks like "1st-A", so we split it to get "1st"
      const className = studentForm.class.split('-')[0];
      const feeType = studentForm.fee_type;

      if (className && feeType) {
        const { data, error } = await supabase
          .from("class_fees")
          .select("amount")
          .eq("class", className)
          .eq("fee_type", feeType)
          .single();

        if (data && !error) {
          setStudentForm(prev => ({
            ...prev,
            total_amount: data.amount.toString()
          }));
        }
      }
    }
    autoFetchFeeAmount();
  }, [studentForm.fee_type, studentForm.class]);

  useEffect(() => {
    async function fetchStudentsFromDB() {
      if (selectedClass && selectedSection) {
        const { data, error } = await supabase
          .from("students")
          .select("student_id, full_name, roll_number, class_name, section")
          .eq("class_name", selectedClass)
          .eq("section", selectedSection)
          .eq("status", "active");

        if (!error) setAvailableStudents(data || []);
      } else {
        setAvailableStudents([]);
      }
    }
    fetchStudentsFromDB();
  }, [selectedClass, selectedSection]);

  async function fetchAll() {
    const { data: cf } = await supabase.from("class_fees").select("*").order('created_at', { ascending: false });
    const { data: sf } = await supabase.from("student_fees").select("*").order('created_at', { ascending: false });
    setClassFees(cf || []);
    setStudentFees(sf || []);
  }

  const handleStudentSelection = (studentId: string) => {
    const student = availableStudents.find(s => s.student_id === studentId);
    if (student) {
      setStudentForm({
        ...studentForm,
        student_name: student.full_name,
        roll_no: student.roll_number?.toString() || "",
        class: `${student.class_name}-${student.section}`
      });
    }
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
    const payload = {
      ...studentForm,
      roll_no: studentForm.roll_no ? Number(studentForm.roll_no) : null,
      total_amount: Number(studentForm.total_amount),
      paid_amount: Number(studentForm.paid_amount || 0),
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

  const openEdit = (type: 'class' | 'student', item: any) => {
    setEditingId(item.id);
    if (type === 'class') {
      setClassForm({ class: item.class, fee_type: item.fee_type, amount: item.amount.toString() });
      setIsClassModalOpen(true);
    } else {
      setStudentForm({
        ...item,
        roll_no: item.roll_no?.toString() || "",
        total_amount: item.total_amount.toString(),
        paid_amount: item.paid_amount.toString(),
      });
      setIsStudentModalOpen(true);
    }
  };

  const closeModals = () => {
    setIsClassModalOpen(false);
    setIsStudentModalOpen(false);
    setEditingId(null);
    setSelectedClass("");
    setSelectedSection("");
    setClassForm({ class: "", fee_type: "", amount: "" });
    setStudentForm({
      student_name: "", roll_no: "", class: "", fee_type: "", total_amount: "", paid_amount: "", payment_method: "",
    });
  };

  const filteredStudents = studentFees.filter(s =>
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Fees Registry</h1>
            <p className="text-[10px] font-bold text-brand tracking-[0.25em] uppercase mt-1.5 opacity-80">Financial Ledger Archive</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button onClick={() => setIsClassModalOpen(true)} className="bg-white border-2 border-brand-soft text-brand-dark px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-brand-soft active:scale-95">
            <Plus size={16} className="inline mr-2" /> Class Fees Structure
          </button>
          <button onClick={() => setIsStudentModalOpen(true)} className="bg-brand text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-brand-dark active:scale-95 shadow-lg shadow-brand/30">
            <Plus size={18} className="inline mr-2" /> New Student Fees Entry
          </button>
          {/* Add this button to your <header> inside the flex div */}
          <button
            onClick={exportToExcel}
            className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald/20"
          >
            <BookOpen size={16} className="inline mr-2" /> Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Fee Structures */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-brand/10 overflow-hidden">
            <div className="p-6 border-b border-brand/5 bg-brand-accent/30">
              <h2 className="font-bold text-brand-dark flex items-center gap-2">
                <BookOpen size={18} /> Fee Structures
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {classFees.length === 0 && <p className="p-6 text-sm text-slate-400 italic">No fee structures.</p>}
              {classFees.map((f) => (
                <div key={f.id} className="p-5 flex items-center justify-between hover:bg-brand-soft/20 transition">
                  <div>
                    <p className="font-bold text-slate-800">{f.class}</p>
                    <p className="text-[10px] text-brand font-bold uppercase mt-0.5">{f.fee_type}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-brand text-lg">₹{f.amount}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit('class', f)} className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-brand transition"><Edit size={14} /></button>
                      <button onClick={() => deleteRecord('class_fees', f.id)} className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:text-red-600 transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Student Fees Table */}
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
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">No records found.</td></tr>
                  )}
                  {filteredStudents.map((s) => {
                    const balance = s.total_amount - s.paid_amount;
                    return (
                      <tr key={s.id} className="hover:bg-brand-soft/10 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold uppercase">{s.student_name.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">{s.student_name}</p>
                              <p className="text-xs text-slate-500">Roll: {s.roll_no}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <p className="text-slate-700 font-medium">Class {s.class}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{s.fee_type}</p>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${balance <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-soft text-brand-dark'}`}>
                            {balance <= 0 ? "Fully Paid" : "Balance Due"}
                          </span>
                        </td>
                        <td className="p-5 text-right font-mono font-bold text-lg text-brand">₹{balance.toLocaleString()}</td>
                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openEdit('student', s)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-brand hover:text-white transition-all"><Edit size={16} /></button>
                            <button onClick={() => deleteRecord('student_fees', s.id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
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
      {/* MODAL COMPONENT - HORIZONTAL DESIGN */}
      {(isClassModalOpen || isStudentModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">

            <div className="flex flex-col md:flex-row h-full">

              {/* Left Sidebar: Context & Summary (Brand Side) */}
              <div className="md:w-1/3 bg-gradient-to-br from-brand-dark via-brand to-brand-light p-10 text-white flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-xl">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-3xl font-black leading-tight">
                    {editingId ? 'Update' : 'New'} <br />Entry
                  </h3>
                  <p className="text-brand-soft/70 text-xs uppercase tracking-[0.2em] mt-4 font-bold">
                    Fees Management System
                  </p>
                </div>

                {!isClassModalOpen && studentForm.student_name && (
                  <div className="bg-black/10 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                    <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Live Calculation</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-80">Remaining</p>
                        <p className="text-2xl font-mono font-bold">₹{remainingBalance.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                          {remainingBalance <= 0 ? 'CLEARED' : 'PENDING'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Form Fields */}
              <div className="md:w-2/3 p-10 bg-slate-50/50">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Transaction Details</h4>
                  <button onClick={closeModals} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={isClassModalOpen ? handleSaveClassFee : handleSaveStudentFee} className="space-y-6">
                  {isClassModalOpen ? (
                    <div className="grid grid-cols-1 gap-6">
                      {/* Class Fee Form Logic Here... */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Class</label>
                          <select className="modal-input" value={classForm.class} onChange={e => setClassForm({ ...classForm, class: e.target.value })} required>
                            <option value="">Select Class</option>
                            {ACADEMIC_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fee Category</label>
                          <select className="modal-input" value={classForm.fee_type} onChange={e => setClassForm({ ...classForm, fee_type: e.target.value })} required>
                            <option value="">Select Type</option>
                            <option>Tuition Fee</option><option>Transport Fee</option><option>Exam Fee</option>
                            <option>Certificate fee</option><option>Application fee</option><option>Evening Class fee</option><option>Special Development fee</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Standard Amount</label>
                        <input className="modal-input text-lg font-bold" type="number" value={classForm.amount} onChange={e => setClassForm({ ...classForm, amount: e.target.value })} required />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 1. Student Identification Section */}
                      <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="col-span-2 mb-2 flex items-center gap-2">
                          <div className="w-1 h-4 bg-brand rounded-full"></div>
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">1. Select Student</span>
                        </div>
                        <select className="modal-input text-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                          <option value="">Class</option>
                          {ACADEMIC_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                        <select className="modal-input text-sm" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                          <option value="">Section</option>
                          {SECTIONS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                        </select>
                        <select
                          className="modal-input col-span-2 bg-brand/5 border-brand/10 text-brand-dark"
                          onChange={e => handleStudentSelection(e.target.value)}
                          required={!editingId}
                        >
                          <option value="">{availableStudents.length ? "Choose Student..." : "No Students Found"}</option>
                          {availableStudents.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name}</option>)}
                        </select>
                      </div>

                      {/* 2. Payment Section */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Payment For</label>
                          <select className="modal-input" value={studentForm.fee_type} onChange={e => setStudentForm({ ...studentForm, fee_type: e.target.value })} required>
                            <option value="">Select Fee Type</option>
                            <option>Tuition Fee</option><option>Transport Fee</option><option>Exam Fee</option>
                            <option>Certificate fee</option><option>Application fee</option><option>Evening Class fee</option><option>Special Development fee</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Total Due (Auto)</label>
                          <input className="modal-input bg-slate-100 font-bold" type="number" value={studentForm.total_amount} readOnly />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Paid Now</label>
                          <input className="modal-input border-brand-soft focus:ring-2 ring-brand/20 font-bold text-brand" type="number" value={studentForm.paid_amount} onChange={e => setStudentForm({ ...studentForm, paid_amount: e.target.value })} required />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Payment Method</label>
                          <div className="flex gap-2">
                            {['Cash', 'UPI', 'Bank'].map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setStudentForm({ ...studentForm, payment_method: method })}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${studentForm.payment_method === method ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20' : 'bg-white text-slate-500 border-slate-200'}`}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand transition-all disabled:opacity-50 shadow-xl active:scale-[0.98] mt-4"
                  >
                    {loading ? "Processing..." : editingId ? "Save Changes" : "Submit Payment Record"}
                  </button>
                </form>
              </div>
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