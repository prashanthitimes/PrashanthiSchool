"use client";

import {
  Shield, Plus, Edit2, CheckCircle, X, Trash2, Search,
  GraduationCap, Wallet, Calendar, AlertTriangle, IndianRupee, FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import { useEffect, useState, Children, isValidElement, cloneElement } from "react";

export default function FeesEntriesRegistry() {
  // Primary States
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Search & Target Filtering States
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [targetRecord, setTargetRecord] = useState<any>(null);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [totals, setTotals] = useState({ totalRecords: 0, aggregateAmount: 0 });

  // System Settings State for Active Academic Year
  const [systemAcademicYear, setSystemAcademicYear] = useState("2026-27");

  // Error and Structured Form Management
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    student_uuid: "",
    amount_fees: "",
    description: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSchoolSettingsYear(),
        fetchFeeRecords(), 
        fetchActiveStudents()
      ]);
    } catch (err) {
      console.error("Error standardizing application loads:", err);
    }
    setLoading(false);
  };

  const fetchSchoolSettingsYear = async () => {
    try {
      const { data, error } = await supabase
        .from("school_settings")
        .select("academic_start_year, academic_end_year")
        .eq("id", 1)
        .single();

      if (!error && data && data.academic_start_year && data.academic_end_year) {
        const endYearShort = String(data.academic_end_year).slice(-2);
        setSystemAcademicYear(`${data.academic_start_year}-${endYearShort}`);
      }
    } catch (err) {
      console.error("Failed to read master school settings table details:", err);
    }
  };

  const fetchFeeRecords = async () => {
    const { data, error } = await supabase
      .from("student_fees_entries")
      .select(`
        *,
        student:students(id, student_id, full_name, class_name, section, academic_year)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFeeRecords(data);
      const totalAmount = data.reduce((sum, item) => sum + Number(item.amount_fees || 0), 0);
      setTotals({
        totalRecords: data.length,
        aggregateAmount: totalAmount
      });
    }
  };

  const fetchActiveStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, student_id, full_name, class_name, section, academic_year")
      .eq("status", "active");
    if (!error && data) setStudents(data);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.student_uuid) newErrors.student_uuid = "Please pinpoint a student profile";
    if (!formData.amount_fees.trim() || isNaN(Number(formData.amount_fees))) {
      newErrors.amount_fees = "Provide a valid numeric financial Special Development Fee amount";
    } else if (Number(formData.amount_fees) <= 0) {
      newErrors.amount_fees = "Special Development Fee must be greater than zero";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = (record: any = null) => {
    setErrors({});
    setStudentSearchTerm("");

    if (record) {
      setEditRecord(record);
      setFormData({
        student_uuid: record.student_id,
        amount_fees: String(record.amount_fees),
        description: record.description || ""
      });
    } else {
      setEditRecord(null);
      setFormData({
        student_uuid: "",
        amount_fees: "",
        description: ""
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      toast.error("Security Blocked", { description: "Elevated administrative rights missing." });
      return;
    }

    if (!validateForm()) return;

    const payload = {
      student_id: formData.student_uuid,
      academic_year: systemAcademicYear, 
      amount_fees: parseFloat(formData.amount_fees),
      description: formData.description
    };

    const toastId = toast.loading(editRecord ? "Adjusting system fee ledger..." : "Recording new entry payment...");

    try {
      let error;
      if (editRecord) {
        const { error: patchError } = await supabase
          .from("student_fees_entries")
          .update(payload)
          .eq("id", editRecord.id);
        error = patchError;
      } else {
        const { error: postError } = await supabase
          .from("student_fees_entries")
          .insert([payload]);
        error = postError;
      }

      if (error) {
        toast.error("Database Refusal", { description: error.message, id: toastId });
      } else {
        toast.success(editRecord ? "Special Development Fee updated smoothly!" : "Payment entry logged safely!", { id: toastId });
        setShowModal(false);
        fetchFeeRecords();
      }
    } catch (err) {
      toast.error("An unexpected breakdown compromised the process pipeline.", { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!targetRecord) return;
    const toastId = toast.loading("Voiding payment transaction log...");
    try {
      const { error } = await supabase.from("student_fees_entries").delete().eq("id", targetRecord.id);
      if (error) {
        toast.error("Action Refused", { description: error.message, id: toastId });
      } else {
        toast.success("Fee transaction entry purged cleanly", { id: toastId });
        setShowDeleteModal(false);
        fetchFeeRecords();
      }
    } catch (err) {
      toast.error("System structural error detected during recovery teardown.", { id: toastId });
    }
  };

  const matchedStudentFilteringList = studentSearchTerm.trim() === "" 
    ? [] 
    : students.filter(st => 
        st.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        st.student_id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        `${st.class_name} ${st.section}`.toLowerCase().includes(studentSearchTerm.toLowerCase())
      ).slice(0, 5);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-soft/20 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-8xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-center" richColors />

      {/* HEADER BAR */}
      <header className="flex flex-col sm:flex-row items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-6 sm:px-8 sm:py-6 rounded-[2rem] border border-brand-soft dark:border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 bg-brand-soft dark:bg-slate-800 text-brand-light rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner">
            <IndianRupee size={24} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Special Development Fee</h1>
            <p className="text-[10px] font-bold text-brand-light dark:text-brand-soft uppercase leading-none">Term: {systemAcademicYear} Payments Registry</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-brand-light hover:bg-brand text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-soft">
          <Plus size={18} className="inline mr-2" /> Collect Special Development Fee ({systemAcademicYear})
        </button>
      </header>

      {/* AGGREGATION BLOCKS */}
      <div className="grid grid-cols-2 gap-2 sm:gap-6">
        <StatCard title="Total Collections Logged" value={totals.totalRecords} icon={<GraduationCap size={18} />} />
        <StatCard title="Total Revenue Received" value={`₹${totals.aggregateAmount.toLocaleString('en-IN')}`} icon={<Wallet size={18} />} />
      </div>

      {/* MAIN DATA INTERFACE */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-brand-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-soft/30 dark:bg-slate-800/50">
              <tr>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Student Details</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Target Year</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Special Development FeeAmount</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/40 dark:divide-slate-800">
              {feeRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">No active Special Development Fee allocations located inside system registers.</td>
                </tr>
              ) : feeRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-brand-soft/10 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-brand-soft dark:bg-slate-800 text-brand-light flex items-center justify-center font-black">
                        {rec.student?.full_name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-none">{rec.student?.full_name || "Unknown Student"}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-mono">Class {rec.student?.class_name || "N/A"} - {rec.student?.section || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 align-middle">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[9px] font-black tracking-wider uppercase border border-slate-200/50 dark:border-slate-700">
                      {rec.academic_year}
                    </span>
                  </td>
                  <td className="p-6 align-middle">
                    <p className="font-black text-green-600 text-sm">₹{Number(rec.amount_fees).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    {rec.description && <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs mt-0.5">{rec.description}</p>}
                  </td>
                  <td className="p-6 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(rec)} className="p-2 text-brand-light hover:bg-brand-soft dark:hover:bg-slate-800 rounded-xl transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => { setTargetRecord(rec); setShowDeleteModal(true); }} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESPONSIVE MOBILE GRID PANELS */}
        <div className="md:hidden divide-y divide-brand-soft/40 dark:divide-slate-800">
          {feeRecords.length === 0 ? (
            <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">No entry items mapped currently.</div>
          ) : feeRecords.map((rec) => (
            <div key={rec.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-soft dark:bg-slate-800 text-brand-light flex items-center justify-center font-black text-sm">{rec.student?.full_name?.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{rec.student?.full_name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Class: {rec.student?.class_name}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-brand-soft dark:bg-slate-800 text-brand-light rounded-lg text-[8px] font-black uppercase">{rec.academic_year}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/60">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Special Development Fee Cleared</p>
                  <p className="text-sm font-black text-green-600 mt-1">₹{Number(rec.amount_fees).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(rec)} className="p-2.5 bg-brand-soft/50 dark:bg-slate-800 text-brand-light rounded-xl"><Edit2 size={14} /></button>
                  <button onClick={() => { setTargetRecord(rec); setShowDeleteModal(true); }} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN DATA MUTATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-brand-soft dark:border-slate-800 flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh]">
            
            <div className="p-6 sm:p-8 border-b border-brand-soft dark:border-slate-800 flex justify-between items-center bg-brand-soft/20 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{editRecord ? "Adjust Collection Details" : "Log Fee Allocation Entry"}</h2>
                <p className="hidden sm:block text-[10px] text-brand-light dark:text-brand-soft font-black uppercase tracking-[0.3em] mt-1">Auto-assigned to system year: {systemAcademicYear}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-brand-soft dark:hover:bg-slate-700 rounded-full text-brand-light border border-brand-soft dark:border-slate-700"><X size={20} /></button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* STUDENT ASSIGNMENT SEARCH SECTION */}
              {!editRecord ? (
                <div className="space-y-2 relative">
                  <InputGroup label="Search & Pair Student Profile *" icon={<Search size={16} />} error={errors.student_uuid}>
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      placeholder="Type Name, Unique Student ID, or Class Details..."
                    />
                  </InputGroup>

                  {/* Context Search List Container */}
                  {matchedStudentFilteringList.length > 0 && (
                    <div className="absolute top-[100%] left-0 w-full bg-white dark:bg-slate-900 rounded-2xl border border-brand-soft dark:border-slate-800 mt-2 shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {matchedStudentFilteringList.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, student_uuid: st.id });
                            setStudentSearchTerm(`${st.full_name} (${st.student_id}) - Class ${st.class_name}`);
                          }}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-soft/20 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">{st.full_name}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">UID: {st.student_id} | Class: {st.class_name} {st.section}</p>
                          </div>
                          <span className="text-[9px] font-black bg-brand-soft text-brand-light dark:bg-slate-800 px-3 py-1.5 rounded-xl uppercase">Select Profile</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.student_uuid && !studentSearchTerm.includes('(') && (
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider ml-4">✓ Profile lock successful</p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-brand-soft/20 dark:bg-slate-800/40 border border-brand-soft/40 dark:border-slate-700 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Locked Profile Context</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">{editRecord.student?.full_name}</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">System ID Key: {editRecord.student?.student_id}</p>
                </div>
              )}

              {/* OUTSTANDING METRICS LAYOUT BLOCKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <InputGroup label="Special Development FeeAmount (INR) *" icon={<IndianRupee size={16} />} error={errors.amount_fees}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount_fees}
                    onChange={(e) => setFormData({ ...formData, amount_fees: e.target.value })}
                    className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="0.00"
                  />
                </InputGroup>

                <div className="space-y-1.5 w-full flex flex-col opacity-75">
                  <span className="text-[9px] font-black text-brand-light/60 dark:text-slate-500 uppercase tracking-widest ml-4">Target Year (Locked)</span>
                  <div className="h-[54px] rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 px-5 flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    Current Term: {systemAcademicYear}
                  </div>
                </div>
              </div>

              <InputGroup label="Collection Entry Notes / Context Description" icon={<FileText size={16} />}>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white min-h-[100px] py-3 resize-none"
                  placeholder="Optional notations such as payment reference details or term context..."
                />
              </InputGroup>
            </div>

            <div className="p-6 bg-brand-soft/20 dark:bg-slate-800 border-t border-brand-soft dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button onClick={() => setShowModal(false)} className="order-2 sm:order-1 text-[11px] font-black text-slate-400 uppercase tracking-widest py-2">Cancel</button>
              <button onClick={handleSubmit} className="order-1 sm:order-2 bg-brand-light text-white w-full sm:w-auto px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]">
                {editRecord ? "Modify Entry" : "Log Special Development Fee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-brand-dark/60 dark:bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-brand-soft dark:border-slate-800 overflow-hidden relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase dark:text-slate-100">Void Fee Transaction?</h3>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 px-4 leading-relaxed">
                  You are removing an entry log record for <span className="text-red-500">{targetRecord?.student?.full_name}</span>. This eliminates historical tracking parameters.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button onClick={handleDelete} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-red-200">Void Entry Record</button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Keep Record</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-brand-soft dark:border-slate-800 flex flex-col sm:flex-row items-center sm:gap-6 text-center sm:text-left transition-colors">
      <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-brand-soft dark:bg-slate-800 text-brand-light flex-shrink-0 mb-2 sm:mb-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400 dark:text-slate-500 truncate">{title}</p>
        <h3 className="text-base sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">{value}</h3>
      </div>
    </div>
  );
}

function InputGroup({ label, children, icon, error }: any) {
  return (
    <div className="space-y-1.5 w-full flex flex-col group">
      <label className="text-[9px] font-black text-brand-light/60 dark:text-slate-500 uppercase tracking-widest ml-4 group-focus-within:text-brand-light transition-colors">
        {label}
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-4 z-10 pointer-events-none text-brand-light/50 group-focus-within:text-brand-light transition-colors flex items-center justify-center w-5 h-5">
          {icon}
        </div>

        {Children.map(children, (child) => {
          if (isValidElement<any>(child)) {
            return cloneElement(child, {
              style: { paddingLeft: '3rem' },
              className: `${child.props.className ?? ""} w-full`.trim(),
            });
          }
          return child;
        })}
      </div>
      {error && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 ml-4 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}