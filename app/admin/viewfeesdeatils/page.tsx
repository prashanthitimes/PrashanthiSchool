"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search, Eye, X, IndianRupee, AlertCircle,
  CheckCircle2, Filter, FileSpreadsheet
} from "lucide-react";

const CLASSES = [
  "Pre-Nursery", "Nursery", "LKG", "UKG",
  "1st", "2nd", "3rd", "4th", "5th",
  "6th", "7th", "8th", "9th", "10th"
];

export default function PrincipalFeesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [feesPayments, setFeesPayments] = useState<any[]>([]); // Replaces student_fees_entries
  const [feesOB, setFeesOB] = useState<any[]>([]);
  const [classStandards, setClassStandards] = useState<any[]>([]);
  const [transportAssignments, setTransportAssignments] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [studentsRes, paymentsRes, obRes, standardsRes, transportRes] = await Promise.all([
        supabase.from("students").select("*").eq("status", "active"),
        supabase.from("student_fees").select("*"), // Fetching from our new single transactional table
        supabase.from("student_fees_ob").select("*"),
        supabase.from("class_fees").select("*"),
        supabase.from("transport_assignments").select("*").eq("status", "active")
      ]);

      setStudents(studentsRes.data || []);
      setFeesPayments(paymentsRes.data || []);
      setFeesOB(obRes.data || []);
      setClassStandards(standardsRes.data || []);
      setTransportAssignments(transportRes.data || []);
    } catch (err) {
      console.error("Failed to sync financial ledgers cleanly:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate clean grouped balance metrics for the simple table view
  const studentData = useMemo(() => {
    return students
      .map((student: any) => {
        // 1. Base structural tuition standard configuration
        const standards = classStandards.filter(s => s.class === student.class_name);
        const coreTuitionRequired = standards.reduce((sum, s) => sum + Number(s.amount), 0);

        // 2. Transport structural assignment
        const transport = transportAssignments.find(t => t.student_id === student.id);
        const transportAmount = transport ? Number(transport.monthly_fare) : 0;

        // 3. Historical setup Old Balances Dues
        const openingBalanceRecord = feesOB.find(o => o.student_id === student.id);
        const openingBalancePayable = openingBalanceRecord ? Number(openingBalanceRecord.opening_balance) : 0;

        // 4. Fetch dynamic transactional rows linked to student_fees table
        const studentPayments = feesPayments.filter(f => f.student_id === student.id);
        
        // Summing up total required/allocated across your system 
        // Note: For custom/dynamic dynamic rows added strictly into student_fees directly 
        // (like alternate activities/exams not tracked under master class_fees or transport), 
        // we isolate them to sum up custom base costs.
        const dynamicFeesRequired = studentPayments
          .filter(f => !["Tution Fee", "Opening Balance", "Transport Fee"].includes(f.fee_type))
          .reduce((sum, f) => sum + Number(f.total_amount || 0), 0);
        
        // Comprehensive absolute actual payment collection receipts from the new database table
        const totalPaidFromEntries = studentPayments.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);

        const balanceTotalRequired = coreTuitionRequired + transportAmount + openingBalancePayable + dynamicFeesRequired;
        const totalDueCalculated = Math.max(balanceTotalRequired - totalPaidFromEntries, 0);

        return {
          id: student.id,
          name: student.full_name,
          class: student.class_name,
          balanceRequired: balanceTotalRequired,
          paidAmount: totalPaidFromEntries,
          totalDue: totalDueCalculated,
          status: totalPaidFromEntries >= balanceTotalRequired ? "FULLY PAID" : "PENDING"
        };
      })
      .filter((s: any) => {
        const matchClass = selectedClass ? s.class === selectedClass : true;
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        return matchClass && matchSearch;
      });
  }, [students, feesPayments, feesOB, classStandards, transportAssignments, selectedClass, search]);

  const overallStats = useMemo(() => {
    return studentData.reduce(
      (acc, s) => {
        acc.collected += s.paidAmount;
        acc.outstanding += s.totalDue;
        return acc;
      },
      { collected: 0, outstanding: 0 }
    );
  }, [studentData]);

  const exportToCSV = () => {
    const headers = ["Student Name", "Class", "Total Balance Required", "Total Paid Amount", "Net Due", "Status"];
    const rows = studentData.map(s => [
      s.name,
      s.class,
      s.balanceRequired,
      s.paidAmount,
      s.totalDue,
      s.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Fee_Summary_Report_${selectedClass || 'All_Classes'}.csv`;
    link.click();
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fffcfd] dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-brand-soft border-t-brand rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-[#fffcfd] dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <div className="max-w-9xl mx-auto py-6 md:py-10 px-4 md:px-6 space-y-6 md:space-y-8">

        {/* HEADER SECTION */}
        <header className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[2rem] md:rounded-[3rem] border border-[#e9d1e4] dark:border-slate-800 shadow-sm transition-all">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:gap-5 w-full lg:w-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#fdfafc] to-[#f5e6f1] dark:from-slate-800 dark:to-slate-950 text-brand rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center border border-[#e9d1e4] dark:border-slate-700 shadow-inner shrink-0">
                <IndianRupee size={30} className="md:w-[38px] md:h-[38px] dark:text-brand-light" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                  FEE<span className="text-brand">LEDGER</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-brand dark:text-brand-soft font-bold text-[8px] md:text-[10px] tracking-[0.2em] uppercase opacity-80">
                    2026-27
                  </p>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden md:block"></span>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">
                    {studentData.length} Records
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-around sm:justify-end px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:bg-transparent md:border-r md:border-slate-100 dark:md:border-slate-800 md:mr-4 md:px-6">
                <div className="text-center sm:text-right">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Collected</p>
                  <p className="text-sm md:text-lg font-black text-emerald-600 dark:text-emerald-400">₹{overallStats.collected.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Outstanding</p>
                  <p className="text-sm md:text-lg font-black text-orange-500 dark:text-orange-400">₹{overallStats.outstanding.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={exportToCSV}
                  className="flex-1 sm:flex-none bg-[#fdfafc] dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-2 border-[#e9d1e4]/30 dark:border-slate-700 px-4 py-3.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-brand transition-all"
                >
                  <FileSpreadsheet size={16} className="text-brand" /> CSV
                </button>

                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-8 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest outline-none transition-all cursor-pointer"
                  >
                    <option value="">Classes</option>
                    {CLASSES.map(c => <option key={c} value={c} className="dark:bg-slate-900">{c}</option>)}
                  </select>
                  <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* SEARCH BAR */}
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 text-[#d487bd] dark:text-slate-500 group-focus-within:text-brand transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search student..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-[#e9d1e4]/50 dark:border-slate-800 pl-14 md:pl-16 pr-6 py-4 md:py-5 rounded-2xl md:rounded-[2rem] outline-none text-slate-700 dark:text-slate-200 font-bold shadow-sm focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-sm md:text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* DATA CONTAINER */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] border border-[#e9d1e4] dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fdfafc] dark:bg-slate-800/50 text-[#d487bd] dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#e9d1e4] dark:border-slate-800">
                  <th className="p-6">Student Detail</th>
                  <th className="p-6">Grade</th>
                  <th className="p-6 text-right">Balance Amount (Required)</th>
                  <th className="p-6 text-right">Paid Amount (Received)</th>
                  <th className="p-6 text-center">Net Outstanding Due</th>
                  <th className="p-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9d1e4]/30 dark:divide-slate-800">
                {studentData.map((student: any) => (
                  <tr key={student.id} className="hover:bg-brand/5 dark:hover:bg-brand/10 transition-all group">
                    <td className="p-6">
                      <p className="font-black text-slate-800 dark:text-slate-200 text-base uppercase">{student.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest">ID: {student.id?.slice(0, 8)}</p>
                    </td>
                    <td className="p-6">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">
                        {student.class}
                      </span>
                    </td>
                    <td className="p-6 text-right font-black text-slate-700 dark:text-slate-300">
                      ₹{student.balanceRequired.toLocaleString('en-IN')}
                    </td>
                    <td className="p-6 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ₹{student.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-6 text-center">
                      {student.totalDue <= 0 ? (
                        <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> SETTLED
                        </span>
                      ) : (
                        <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                          <AlertCircle size={12} /> ₹{student.totalDue.toLocaleString('en-IN')} DUE
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <button
                        onClick={() => setSelectedStudent({ id: student.id, name: student.name })}
                        className="p-3 bg-[#fdfafc] dark:bg-slate-800 border border-[#e9d1e4] dark:border-slate-700 rounded-xl text-brand group-hover:bg-brand group-hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW */}
          <div className="md:hidden divide-y divide-[#e9d1e4]/30 dark:divide-slate-800">
            {studentData.map((student: any) => (
              <div key={student.id} className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-200 text-base uppercase">{student.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: {student.id?.slice(0, 8)}</p>
                  </div>
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                    {student.class}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Balance Required</p>
                    <p className="font-black text-slate-700 dark:text-slate-300 text-sm">₹{student.balanceRequired.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-emerald-500 font-bold uppercase">Total Paid</p>
                    <p className="font-black text-emerald-600 text-sm">₹{student.paidAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#fdfafc] dark:bg-slate-900 p-3 rounded-xl border border-[#e9d1e4]/40">
                  <div>
                    {student.totalDue <= 0 ? (
                      <span className="text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1">
                        <CheckCircle2 size={12} /> Settled
                      </span>
                    ) : (
                      <span className="text-orange-600 text-[10px] font-black uppercase flex items-center gap-1">
                        <AlertCircle size={12} /> ₹{student.totalDue.toLocaleString('en-IN')} Due
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent({ id: student.id, name: student.name })}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#fdfafc] dark:bg-slate-800 border border-[#e9d1e4] dark:border-slate-700 rounded-xl text-brand font-black text-[10px] uppercase tracking-widest"
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
    </div>
  );
}

function StudentDetailsModal({ student, onClose }: { student: { id: string; name: string }; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDetails() {
      setLoading(true);

      const [feesTableRes, obRes, studentInfo, transportRes] = await Promise.all([
        supabase.from("student_fees").select("*").eq("student_id", student.id),
        supabase.from("student_fees_ob").select("*").eq("student_id", student.id).maybeSingle(),
        supabase.from("students").select("class_name").eq("id", student.id).single(),
        supabase.from("transport_assignments").select("monthly_fare").eq("student_id", student.id).eq("status", "active").maybeSingle()
      ]);

      const studentClass = studentInfo.data?.class_name;

      const { data: standards } = await supabase
        .from("class_fees")
        .select("*")
        .eq("class", studentClass);

      const paymentsData = feesTableRes.data || [];
      const mergedRecords: any[] = [];

      // Helper function to dynamically collect all paid data for specific target fee types from your records
      const getPaidAmountForType = (typeNames: string[]) => {
        return paymentsData
          .filter(p => typeNames.some(t => p.fee_type?.toLowerCase() === t.toLowerCase()))
          .reduce((sum, curr) => sum + Number(curr.paid_amount || 0), 0);
      };

      // 1. Core Tuition Standards Processing (Matches "Tution Fee" from database rows)
      const totalTuitionPaid = getPaidAmountForType(["Tution Fee", "Tuition Fee"]);
      if (standards && standards.length > 0) {
        let remainingTuitionPaidPool = totalTuitionPaid;

        standards.forEach(st => {
          const standardCost = Number(st.amount || 0);
          const allocatedPaid = Math.min(standardCost, remainingTuitionPaidPool);
          remainingTuitionPaidPool -= allocatedPaid;

          mergedRecords.push({
            type: st.fee_type,
            standard: standardCost,
            paid: allocatedPaid,
            due: Math.max(standardCost - allocatedPaid, 0)
          });
        });
      }

      // 2. Opening Balance Mapping Row Setup (Matches "Opening Balance")
      if (obRes.data && Number(obRes.data.opening_balance) > 0) {
        const obCost = Number(obRes.data.opening_balance);
        const totalObPaid = getPaidAmountForType(["Opening Balance"]);
        mergedRecords.push({
          type: "Old Balances Due",
          standard: obCost,
          paid: totalObPaid,
          due: Math.max(obCost - totalObPaid, 0)
        });
      }

      // 3. Transport Fee Mapping Row Setup (Matches "Transport Fee")
      if (transportRes.data && Number(transportRes.data.monthly_fare) > 0) {
        const transportCost = Number(transportRes.data.monthly_fare);
        const totalTransportPaid = getPaidAmountForType(["Transport Fee"]);
        mergedRecords.push({
          type: "Transport Fee",
          standard: transportCost,
          paid: totalTransportPaid,
          due: Math.max(transportCost - totalTransportPaid, 0)
        });
      }

      // 4. Custom Unique Dynamic / Other Collections Row Setup
      // Any transaction types like "Entries Fee", "Exam Fee", "Uniform Fee" etc.
      const handledTypes = ["tution fee", "tuition fee", "opening balance", "transport fee"];
      const outsidePayments = paymentsData.filter(p => !handledTypes.includes(p.fee_type?.toLowerCase()));

      if (outsidePayments.length > 0) {
        // Group individual dynamic fees cleanly into lines inside our modal itemization
        outsidePayments.forEach(op => {
          mergedRecords.push({
            type: op.fee_type || "Other Fee",
            standard: Number(op.total_amount || 0),
            paid: Number(op.paid_amount || 0),
            due: Math.max(Number(op.total_amount || 0) - Number(op.paid_amount || 0), 0)
          });
        });
      }

      setDetails({
        name: student.name,
        class: studentClass,
        records: mergedRecords
      });

      setLoading(false);
    }
    getDetails();
  }, [student]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl shadow-2xl rounded-t-[2rem] md:rounded-3xl border border-transparent dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden">
        
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-10 md:h-12 w-1 border-l-4 border-slate-900 dark:border-brand-soft" />
            <div>
              <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase truncate">
                {student.name}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                Itemized Audit Statement • Class {details?.class}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 dark:bg-brand-light text-white hover:bg-slate-800 font-bold text-xs rounded-xl">
              PRINT
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 dark:bg-slate-900">
          {loading ? (
            <div className="p-20 text-center font-bold text-slate-300 dark:text-slate-700 animate-pulse text-xs uppercase tracking-widest">
              Syncing Ledger Itemization Dues...
            </div>
          ) : (
            <>
              {/* DESKTOP AUDIT BREAKDOWN */}
              <div className="hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="p-6">Fee Category Structure</th>
                      <th className="p-6">Assigned Cost Balance</th>
                      <th className="p-6">Allocated Paid Amount</th>
                      <th className="p-6">Remaining Due</th>
                      <th className="p-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details?.records.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-6 font-bold text-slate-800 dark:text-slate-200">
                          {r.type}
                        </td>
                        <td className="p-6 text-slate-600 dark:text-slate-400 font-medium">₹{r.standard.toLocaleString('en-IN')}</td>
                        <td className="p-6 text-emerald-600 dark:text-emerald-400 font-black">₹{r.paid.toLocaleString('en-IN')}</td>
                        <td className={`p-6 font-black ${r.due > 0 ? 'text-orange-500' : 'text-slate-300'}`}>
                          ₹{r.due.toLocaleString('en-IN')}
                        </td>
                        <td className="p-6">
                          {r.due <= 0 ? (
                            <span className="text-emerald-500 text-[10px] font-bold">SETTLED</span>
                          ) : (
                            <span className="text-orange-500 text-[10px] font-bold">OUTSTANDING</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE AUDIT CARD BREAKDOWN */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {details?.records.map((r: any, i: number) => (
                  <div key={i} className="p-5 space-y-3 dark:bg-slate-900">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {r.type}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-1 rounded ${r.due <= 0 ? 'text-emerald-500 bg-emerald-50' : 'text-orange-500 bg-orange-50'}`}>
                        {r.due <= 0 ? 'SETTLED' : 'DUE'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Cost Base</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">₹{r.standard.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Paid Allocation</p>
                        <p className="text-xs font-black text-emerald-600">₹{r.paid.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Due Balance</p>
                        <p className={`text-xs font-black ${r.due > 0 ? 'text-orange-600' : 'text-slate-300'}`}>₹{r.due.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* COMPREHENSIVE PORTFOLIO TOTALS */}
        {!loading && (
          <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:flex-wrap gap-4 bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Balanced Dues</p>
              <p className="text-sm md:text-xl font-bold text-slate-700 dark:text-slate-300">₹{details?.records.reduce((a: number, b: any) => a + b.standard, 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collections Paid</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{details?.records.reduce((a: number, b: any) => a + b.paid, 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="md:ml-auto flex items-center justify-between md:block pt-3 md:pt-0 border-t md:border-0 border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Outstanding Balance</p>
              <p className="text-2xl md:text-3xl font-black text-orange-600 tracking-tighter leading-none">
                ₹{details?.records.reduce((a: number, b: any) => a + b.due, 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}