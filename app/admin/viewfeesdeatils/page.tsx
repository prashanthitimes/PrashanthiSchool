"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Search, Eye, X, IndianRupee, AlertCircle, 
  CheckCircle2, Download, Printer, GraduationCap,
  Filter, FileSpreadsheet 
} from "lucide-react";

const CLASSES = [
  "Pre-Nursery", "Nursery", "LKG", "UKG",
  "1st", "2nd", "3rd", "4th", "5th",
  "6th", "7th", "8th", "9th", "10th"
];

export default function PrincipalFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [classStandards, setClassStandards] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    const [feesRes, standardsRes] = await Promise.all([
      supabase.from("student_fees").select("*"),
      supabase.from("class_fees").select("*")
    ]);
    setFees(feesRes.data || []);
    setClassStandards(standardsRes.data || []);
  }

  // Calculate grouped data for table and stats
  const studentData = useMemo(() => {
    const grouped = fees.reduce((acc: any, fee) => {
      const key = fee.student_id || `name-${fee.student_name}`;
      if (!acc[key]) {
        acc[key] = { id: fee.student_id, name: fee.student_name, class: fee.class, paid: 0 };
      }
      acc[key].paid += Number(fee.paid_amount || 0);
      return acc;
    }, {});

    return Object.values(grouped).map((student: any) => {
      const standards = classStandards.filter(s => s.class === student.class);
      const totalRequired = standards.reduce((sum, s) => sum + Number(s.amount), 0);
      const totalDue = totalRequired - student.paid;

      return {
        ...student,
        totalRequired,
        totalDue: totalDue > 0 ? totalDue : 0,
        status: (totalRequired > 0 && student.paid >= totalRequired) ? "FULLY PAID" : "PENDING"
      };
    }).filter((s: any) => {
      const matchClass = selectedClass ? s.class === selectedClass : true;
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [fees, classStandards, selectedClass, search]);

  // Export CSV Function
  const exportToCSV = () => {
    const headers = ["Student Name", "Class", "Total Paid", "Total Due", "Status"];
    const rows = studentData.map(s => [
      s.name,
      s.class,
      s.paid,
      s.totalDue,
      s.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Fee_Report_${selectedClass || 'All_Classes'}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
      
      {/* --- ENHANCED HEADER SECTION (MATCHING YOUR REGISTRY) --- */}
      <header className="bg-white p-6 lg:p-8 rounded-[3rem] border border-[#e9d1e4] shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

          {/* Branding & Stats Group */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-[#fdfafc] to-[#f5e6f1] text-brand rounded-[2rem] flex items-center justify-center border border-[#e9d1e4] shadow-inner">
              <IndianRupee size={38} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                FEE<span className="text-brand">LEDGER</span>
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-brand font-bold text-[10px] tracking-[0.2em] uppercase opacity-80">
                  Financial Session 2026-27
                </p>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  {studentData.length} Records Found
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Quick Stats Integrated in Header */}
            <div className="hidden xl:flex items-center gap-4 mr-4 px-6 border-r border-slate-100">
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Collected</p>
                    <p className="text-lg font-black text-emerald-600">₹{studentData.reduce((a, b) => a + b.paid, 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Outstanding</p>
                    <p className="text-lg font-black text-orange-500">₹{studentData.reduce((a, b) => a + b.totalDue, 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="bg-[#fdfafc] text-slate-600 border-2 border-[#e9d1e4]/30 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:border-brand transition-all"
            >
              <FileSpreadsheet size={18} className="text-brand" /> Export CSV
            </button>

            {/* Class Filter Dropdown */}
            <div className="relative">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="appearance-none bg-white border-2 border-slate-100 text-slate-600 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-[#e9d1e4] outline-none transition-all cursor-pointer"
              >
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" />
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="relative group max-w-2xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#d487bd] group-focus-within:text-brand transition-colors" size={22} />
        <input 
          type="text" 
          placeholder="Search by student name..." 
          className="w-full bg-white border-2 border-[#e9d1e4]/50 pl-16 pr-6 py-5 rounded-[2rem] outline-none text-slate-700 font-bold shadow-sm focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[3rem] border border-[#e9d1e4] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fdfafc] text-[#d487bd] text-[11px] font-black uppercase tracking-[0.2em] border-b border-[#e9d1e4]">
              <th className="p-8">Student Detail</th>
              <th className="p-8">Grade</th>
              <th className="p-8">Fee Status</th>
              <th className="p-8 text-right">Paid Amount</th>
              <th className="p-8 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9d1e4]/30">
            {studentData.map((student: any) => (
              <tr key={student.id || student.name} className="hover:bg-brand/5 transition-all group">
                <td className="p-8">
                    <p className="font-black text-slate-800 text-lg tracking-tight uppercase">{student.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">ID: {student.id?.slice(0,8) || 'N/A'}</p>
                </td>
                <td className="p-8">
                    <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[11px] font-black uppercase">
                        {student.class}
                    </span>
                </td>
                <td className="p-8">
                  {student.status === "FULLY PAID" ? (
                    <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-1 w-fit border border-emerald-100">
                      <CheckCircle2 size={12} /> SETTLED
                    </span>
                  ) : (
                    <span className="bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-[10px] font-black flex items-center gap-1 w-fit border border-orange-100">
                      <AlertCircle size={12} /> ₹{student.totalDue.toLocaleString()} DUE
                    </span>
                  )}
                </td>
                <td className="p-8 text-right">
                    <p className="font-black text-brand text-xl tracking-tighter">₹{student.paid.toLocaleString()}</p>
                </td>
                <td className="p-8 text-center">
                  <button 
                    onClick={() => setSelectedStudent({ id: student.id, name: student.name })} 
                    className="p-4 bg-[#fdfafc] border border-[#e9d1e4] rounded-2xl text-brand group-hover:bg-brand group-hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <StudentDetailsModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
}

function StudentDetailsModal({ student, onClose }: { student: { id: string; name: string }; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDetails() {
      setLoading(true);
      const query = supabase.from("student_fees").select("*");
      if (student.id) query.eq("student_id", student.id);
      else query.eq("student_name", student.name);

      const { data: payments } = await query;
      if (!payments || payments.length === 0) { setLoading(false); return; }

      const studentClass = payments[0].class;
      const { data: standards } = await supabase.from("class_fees").select("*").eq("class", studentClass);

      // --- LOGIC FIX: COMBINE BOTH TABLES ---
      // 1. Start with class standards
      const standardMap = new Map();
      standards?.forEach(st => {
        standardMap.set(st.fee_type, { type: st.fee_type, standard: Number(st.amount), paid: 0 });
      });

      // 2. Overlay student payments and ADD non-standard fees (like Transport)
      payments.forEach(p => {
        if (standardMap.has(p.fee_type)) {
          const existing = standardMap.get(p.fee_type);
          existing.paid = Number(p.paid_amount);
        } else {
          // It's a fee not in the "Standards" (like Transport or a specific fine)
          standardMap.set(p.fee_type, { 
            type: p.fee_type, 
            standard: Number(p.total_amount), 
            paid: Number(p.paid_amount) 
          });
        }
      });

      const merged = Array.from(standardMap.values()).map(item => ({
        ...item,
        due: item.standard - item.paid
      }));

      setDetails({ name: student.name, class: studentClass, records: merged });
      setLoading(false);
    }
    getDetails();
  }, [student]);

  const handlePrint = () => {
    window.print();
  };

return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0">
      {/* Increased max-width to 5xl for a horizontal look */}
      <div className="bg-white w-full max-w-5xl shadow-2xl rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-300 print:shadow-none print:w-full">
        
        {/* TOP BAR */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className="h-12 w-1 border-l-4 border-slate-900" />
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{student.name}</h2>
              <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">Student Financial Statement • Class {details?.class}</p>
            </div>
          </div>
          
          <div className="flex gap-3 print:hidden">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-xs"
            >
              <Printer size={14} /> PRINT STATEMENT
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* HORIZONTAL TABLE */}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-6">Fee Category</th>
                <th className="p-6">Standard Amount</th>
                <th className="p-6">Paid Amount</th>
                <th className="p-6">Balance Due</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center font-bold text-slate-300 animate-pulse">LOADING LEDGER DATA...</td>
                </tr>
              ) : details?.records.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 font-bold text-slate-800">
                    {r.type}
                    {r.type === 'Transport Fee' && <span className="ml-2 text-[8px] bg-blue-100 text-blue-600 px-1 rounded">ADD-ON</span>}
                  </td>
                  <td className="p-6 text-slate-600 font-medium">₹{r.standard.toLocaleString()}</td>
                  <td className="p-6 text-emerald-600 font-black">₹{r.paid.toLocaleString()}</td>
                  <td className={`p-6 font-black ${r.due > 0 ? 'text-orange-500' : 'text-slate-200'}`}>
                    ₹{r.due.toLocaleString()}
                  </td>
                  <td className="p-6">
                    {r.due <= 0 ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                        <CheckCircle2 size={12} /> SETTLED
                      </span>
                    ) : (
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-400 h-full" 
                          style={{ width: `${(r.paid / r.standard) * 100}%` }}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* HORIZONTAL FOOTER STATS */}
        {!loading && (
          <div className="p-8 border-t border-slate-100 flex flex-wrap gap-12 bg-slate-50/30">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
              <p className="text-xl font-bold text-slate-700">₹{details?.records.reduce((a:any, b:any) => a + b.standard, 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
              <p className="text-xl font-bold text-emerald-600">₹{details?.records.reduce((a:any, b:any) => a + b.paid, 0).toLocaleString()}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Outstanding</p>
              <p className="text-3xl font-black text-orange-600 tracking-tighter">
                ₹{details?.records.reduce((a:any, b:any) => a + b.due, 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-white text-center border-t border-slate-50">
          <p className="text-[9px] font-medium text-slate-300">This document is an internal ledger summary. All amounts are in INR.</p>
        </div>
      </div>
    </div>
  );
}