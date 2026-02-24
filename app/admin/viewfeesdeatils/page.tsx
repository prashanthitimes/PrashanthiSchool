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
  <div className="max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-6 space-y-6 md:space-y-8 bg-[#fffcfd] min-h-screen">
    
    {/* --- ENHANCED HEADER SECTION --- */}
    <header className="bg-white p-6 lg:p-8 rounded-[2rem] md:rounded-[3rem] border border-[#e9d1e4] shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8">

        {/* Branding Group */}
        <div className="flex items-center gap-4 md:gap-5 w-full lg:w-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#fdfafc] to-[#f5e6f1] text-brand rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center border border-[#e9d1e4] shadow-inner shrink-0">
            <IndianRupee size={30} className="md:w-[38px] md:h-[38px]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase">
              FEE<span className="text-brand">LEDGER</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-brand font-bold text-[8px] md:text-[10px] tracking-[0.2em] uppercase opacity-80">
                2026-27
              </p>
              <span className="h-1 w-1 rounded-full bg-slate-300 hidden md:block"></span>
              <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">
                {studentData.length} Records
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Mobile Quick Stats */}
          <div className="flex xl:flex items-center gap-4 w-full sm:w-auto justify-around sm:justify-end px-4 py-3 bg-slate-50 rounded-2xl md:bg-transparent md:border-r md:border-slate-100 md:mr-4 md:px-6">
              <div className="text-center sm:text-right">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">Collected</p>
                  <p className="text-sm md:text-lg font-black text-emerald-600">₹{studentData.reduce((a, b) => a + b.paid, 0).toLocaleString()}</p>
              </div>
              <div className="text-center sm:text-right">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase">Outstanding</p>
                  <p className="text-sm md:text-lg font-black text-orange-500">₹{studentData.reduce((a, b) => a + b.totalDue, 0).toLocaleString()}</p>
              </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={exportToCSV}
              className="flex-1 sm:flex-none bg-[#fdfafc] text-slate-600 border-2 border-[#e9d1e4]/30 px-4 py-3.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-brand transition-all"
            >
              <FileSpreadsheet size={16} className="text-brand" /> CSV
            </button>

            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-slate-100 text-slate-600 px-8 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest outline-none transition-all cursor-pointer"
              >
                <option value="">Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* SEARCH BAR */}
    <div className="relative group max-w-2xl mx-auto">
      <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-[#d487bd] group-focus-within:text-brand transition-colors" size={20} />
      <input 
        type="text" 
        placeholder="Search student..." 
        className="w-full bg-white border-2 border-[#e9d1e4]/50 pl-14 md:pl-16 pr-6 py-4 md:py-5 rounded-2xl md:rounded-[2rem] outline-none text-slate-700 font-bold shadow-sm focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-sm md:text-base"
        value={search} 
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* DATA CONTAINER: Table (Desktop) / Cards (Mobile) */}
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-[#e9d1e4] shadow-sm overflow-hidden">
      
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
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
                    className="p-4 bg-[#fdfafc] border border-[#e9d1e4] rounded-2xl text-brand group-hover:bg-brand group-hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden divide-y divide-[#e9d1e4]/30">
        {studentData.map((student: any) => (
          <div key={student.id || student.name} className="p-5 flex flex-col gap-4 active:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-black text-slate-800 text-base uppercase tracking-tight">{student.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {student.id?.slice(0,8) || 'N/A'}</p>
              </div>
              <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">
                {student.class}
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase">Current Paid</p>
                <p className="font-black text-brand text-base">₹{student.paid.toLocaleString()}</p>
              </div>
              <div>
                {student.status === "FULLY PAID" ? (
                  <span className="text-emerald-600 text-[9px] font-black uppercase flex items-center gap-1">
                    <CheckCircle2 size={10} /> Settled
                  </span>
                ) : (
                  <span className="text-orange-600 text-[9px] font-black uppercase flex items-center gap-1">
                    <AlertCircle size={10} /> ₹{student.totalDue.toLocaleString()} Due
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={() => setSelectedStudent({ id: student.id, name: student.name })}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#fdfafc] border border-[#e9d1e4] rounded-xl text-brand font-black text-[10px] uppercase tracking-widest"
            >
              <Eye size={16} /> View Statement
            </button>
          </div>
        ))}
      </div>
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
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 print:p-0">
    <div className="bg-white w-full max-w-5xl shadow-2xl rounded-t-[2rem] md:rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-300 print:shadow-none print:w-full max-h-[95vh] flex flex-col">
      
      {/* TOP BAR */}
      <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-10 md:h-12 w-1 border-l-4 border-slate-900" />
          <div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight uppercase truncate max-w-[180px] md:max-w-none">
              {student.name}
            </h2>
            <p className="text-slate-500 text-[8px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase">
              Financial Statement • Class {details?.class}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-[10px] md:text-xs"
          >
            <Printer size={14} className="hidden sm:inline" /> PRINT
          </button>
          <button onClick={onClose} className="p-1 md:p-2 text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* CONTENT AREA: Table for Desktop / Cards for Mobile */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-20 text-center font-bold text-slate-300 animate-pulse text-xs md:text-base">
            LOADING LEDGER DATA...
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block">
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
{details?.records.map((r: any, i: number) => (
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

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden divide-y divide-slate-100">
{details?.records.map((r: any, i: number) => (
                  <div key={i} className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{r.type}</span>
                    {r.due <= 0 ? (
                      <span className="text-emerald-500 text-[9px] font-black bg-emerald-50 px-2 py-1 rounded">SETTLED</span>
                    ) : (
                      <span className="text-orange-500 text-[9px] font-black bg-orange-50 px-2 py-1 rounded">DUE</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Standard</p>
                      <p className="text-xs font-bold text-slate-600">₹{r.standard.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase">Paid</p>
                      <p className="text-xs font-black text-emerald-600">₹{r.paid.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Balance</p>
                      <p className={`text-xs font-black ${r.due > 0 ? 'text-orange-600' : 'text-slate-300'}`}>₹{r.due.toLocaleString()}</p>
                    </div>
                  </div>

                  {r.due > 0 && (
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-orange-400 h-full" 
                        style={{ width: `${(r.paid / r.standard) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER STATS */}
      {!loading && (
        <div className="p-6 md:p-8 border-t border-slate-100 flex flex-col md:flex-row md:flex-wrap gap-4 md:gap-12 bg-slate-50/30 shrink-0">
          <div className="flex justify-between md:block">
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payable</p>
              <p className="text-sm md:text-xl font-bold text-slate-700">₹{details?.records.reduce((a, b) => a + b.standard, 0).toLocaleString()}</p>
            </div>
            <div className="text-right md:text-left md:mt-0">
              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:hidden">Total Paid</p>
              <p className="text-sm md:text-xl font-bold text-emerald-600 md:hidden">₹{details?.records.reduce((a, b) => a + b.paid, 0).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-xl font-bold text-emerald-600">₹{details?.records.reduce((a, b) => a + b.paid, 0).toLocaleString()}</p>
          </div>

          <div className="md:ml-auto flex items-center justify-between md:block pt-3 md:pt-0 border-t border-slate-200 md:border-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Outstanding</p>
            <p className="text-2xl md:text-3xl font-black text-orange-600 tracking-tighter leading-none">
              ₹{details?.records.reduce((a, b) => a + b.due, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="p-3 md:p-4 bg-white text-center border-t border-slate-50 shrink-0">
        <p className="text-[8px] md:text-[9px] font-medium text-slate-300 uppercase tracking-tighter">Document Ledger • INR Summary</p>
      </div>
    </div>
  </div>
);
}