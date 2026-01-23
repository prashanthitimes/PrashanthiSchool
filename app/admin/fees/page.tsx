"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, Edit, Trash2, Search, X, Shield,
  ReceiptIndianRupee, Wallet, Calendar, User, BookOpen
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
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

export default function FeesPage() {
// To this:
const [classFees, setClassFees] = useState<any[]>([]);
const [studentFees, setStudentFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [classForm, setClassForm] = useState({ class: "", fee_type: "", amount: "" });
  const [studentForm, setStudentForm] = useState({
    student_name: "", roll_no: "", class: "", fee_type: "", total_amount: "", paid_amount: "", payment_method: "",
  });
  const ACADEMIC_CLASSES = [
    "Pre-Nursery", "Nursery", "LKG", "UKG",
    "1st", "2nd", "3rd", "4th", "5th",
    "6th", "7th", "8th", "9th", "10th"
  ];
  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const { data: cf } = await supabase.from("class_fees").select("*").order('created_at', { ascending: false });
    const { data: sf } = await supabase.from("student_fees").select("*").order('created_at', { ascending: false });
    setClassFees(cf || []);
    setStudentFees(sf || []);
  }

  /* ---------------- ACTIONS ---------------- */

  const handleSaveClassFee = async (e) => {
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

  const handleSaveStudentFee = async (e) => {
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

  const deleteRecord = async (table, id) => {
    if (confirm("Are you sure you want to delete this?")) {
      await supabase.from(table).delete().eq("id", id);
      fetchAll();
      toast.success("Record deleted!");
    }
  };

  const openEdit = (type, item) => {
    setEditingId(item.id);
    if (type === 'class') {
      setClassForm({ class: item.class, fee_type: item.fee_type, amount: item.amount });
      setIsClassModalOpen(true);
    } else {
      setStudentForm(item);
      setIsStudentModalOpen(true);
    }
  };

  const closeModals = () => {
    setIsClassModalOpen(false);
    setIsStudentModalOpen(false);
    setEditingId(null);
    setClassForm({ class: "", fee_type: "", amount: "" });
    setStudentForm({ student_name: "", roll_no: "", class: "", fee_type: "", total_amount: "", paid_amount: "", payment_method: "" });
  };

  const filteredStudents = studentFees.filter(s =>
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

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
            <Plus size={16} className="inline mr-2" /> CLass Fees Structure
          </button>
          <button onClick={() => setIsStudentModalOpen(true)} className="bg-brand text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-brand-dark active:scale-95 shadow-lg shadow-brand/30">
            <Plus size={18} className="inline mr-2" /> New Student Fees Entry
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Class Fees Summary Section (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-brand/10 overflow-hidden">
            <div className="p-6 border-b border-brand/5 bg-brand-accent/30">
              <h2 className="font-bold text-brand-dark flex items-center gap-2">
                <BookOpen size={18} /> Fee Structures
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {classFees.length === 0 && <p className="p-6 text-sm text-slate-400 italic">No fee structures defined.</p>}
              {classFees.map((f) => (
                <div key={f.id} className="p-5 flex items-center justify-between hover:bg-brand-soft/20 transition">
                  <div>
                    <p className="font-bold text-slate-800">{f.class}</p>
                    <p className="text-[10px] text-brand font-bold uppercase tracking-widest mt-0.5">{f.fee_type}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-brand text-lg">₹{f.amount}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit('class', f)} className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:bg-brand-soft hover:text-brand transition"><Edit size={14} /></button>
                      <button onClick={() => deleteRecord('class_fees', f.id)} className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Student Fees Table Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand group-focus-within:text-brand-dark transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by student name or class..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-transparent shadow-sm focus:border-brand-soft focus:ring-4 focus:ring-brand/5 outline-none transition-all text-lg"
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
                    <th className="p-5 font-bold">Payment Status</th>
                    <th className="p-5 font-bold text-right">Outstanding</th>
                    <th className="p-5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">No student records found.</td></tr>
                  )}
                  {filteredStudents.map((s) => {
                    const balance = s.total_amount - s.paid_amount;
                    return (
                      <tr key={s.id} className="hover:bg-brand-soft/10 transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold">
                              {s.student_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">{s.student_name}</p>
                              <p className="text-xs text-slate-500">Roll: {s.roll_no || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <p className="text-slate-700 font-medium">Class {s.class}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{s.fee_type}</p>
                        </td>
                        <td className="p-5">
                          {balance <= 0 ? (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Fully Paid</span>
                          ) : (
                            <span className="bg-brand-soft text-brand-dark px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Balance Due</span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <p className={`font-mono font-bold text-lg ${balance > 0 ? 'text-brand' : 'text-emerald-600'}`}>
                            ₹{balance.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openEdit('student', s)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-brand hover:text-white transition-all"><Edit size={16} /></button>
                            <button onClick={() => deleteRecord('student_fees', s.id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL COMPONENT */}
      {(isClassModalOpen || isStudentModalOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-brand to-brand-dark text-white">
              <div>
                <h3 className="text-2xl font-black">{editingId ? 'Edit' : 'Create'} Record</h3>
                <p className="text-brand-soft/80 text-xs uppercase tracking-widest mt-1">Fees Department</p>
              </div>
              <button onClick={closeModals} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={isClassModalOpen ? handleSaveClassFee : handleSaveStudentFee} className="p-8 space-y-6">
              {isClassModalOpen ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Class</label>
                    <select
                      className="modal-input"
                      value={classForm.class}
                      onChange={e => setClassForm({ ...classForm, class: e.target.value })} // Corrected: set classForm
        required
                    >
                      <option value="">Select Class</option>
                      {ACADEMIC_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Category</label>
                    <select className="modal-input" value={classForm.fee_type} onChange={e => setClassForm({ ...classForm, fee_type: e.target.value })} required>
                      <option value="">Select Fee Type</option>
                      <option>Tuition Fee</option><option>Transport Fee</option><option>Exam Fee</option><option>Library Fee</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Standard Amount</label>
                    <input className="modal-input" type="number" placeholder="₹ 0.00" value={classForm.amount} onChange={e => setClassForm({ ...classForm, amount: e.target.value })} required />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Student Name</label>
                    <input className="modal-input" placeholder="Enter Full Name" value={studentForm.student_name} onChange={e => setStudentForm({ ...studentForm, student_name: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Roll No</label>
                      <input className="modal-input" placeholder="101" value={studentForm.roll_no} onChange={e => setStudentForm({ ...studentForm, roll_no: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Class</label>
                      <input className="modal-input" placeholder="10th" value={studentForm.class} onChange={e => setStudentForm({ ...studentForm, class: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Payment For</label>
                    <select className="modal-input" value={studentForm.fee_type} onChange={e => setStudentForm({ ...studentForm, fee_type: e.target.value })} required>
                      <option value="">Select Fee Type</option>
                      <option>Tuition Fee</option><option>Transport Fee</option><option>Exam Fee</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Total Due</label>
                      <input className="modal-input" type="number" value={studentForm.total_amount} onChange={e => setStudentForm({ ...studentForm, total_amount: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Amount Paid</label>
                      <input className="modal-input" type="number" value={studentForm.paid_amount} onChange={e => setStudentForm({ ...studentForm, paid_amount: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Method</label>
                    <select className="modal-input" value={studentForm.payment_method} onChange={e => setStudentForm({ ...studentForm, payment_method: e.target.value })} required>
                      <option value="">Select Method</option>
                      <option>Cash</option><option>UPI / PhonePe</option><option>Bank Transfer</option>
                    </select>
                  </div>
                </>
              )}

              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand to-brand-dark text-white py-4 rounded-2xl font-bold hover:from-brand-dark hover:to-brand transition-all disabled:opacity-50 mt-6 shadow-xl shadow-brand/20 active:scale-[0.98]"
              >
                {loading ? "Saving to Database..." : editingId ? "Save Changes" : "Confirm Record"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-input {
          width: 100%;
          border: 2px solid #f1f5f9;
          background-color: #f8fafc;
          padding: 14px;
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
        select.modal-input {
          appearance: none;
        }
      `}</style>
    </div>
  );
}