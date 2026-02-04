"use client";



import { useEffect, useState, useMemo } from "react";

import { supabase } from "@/lib/supabase";

import { 

  FiCreditCard, FiSearch, FiArrowUpRight, FiCheckCircle, 

  FiXCircle, FiClock, FiDownload, FiCalendar, FiRefreshCw 

} from "react-icons/fi";

import toast, { Toaster } from "react-hot-toast";



export default function OnlinePaymentsPage() {

  const [payments, setPayments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");

  

  // DATE FILTERS

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");



  useEffect(() => {

    fetchPayments();

  }, []);



  async function fetchPayments() {

    setLoading(true);

    try {

      const { data, error } = await supabase

        .from("student_payments")

        .select(`*, students (full_name, class_name, section)`)

        .order("created_at", { ascending: false });



      if (error) throw error;

      setPayments(data || []);

    } catch (err: any) {

      toast.error("Failed to load: " + err.message);

    } finally {

      setLoading(false);

    }

  }



  // --- IMPROVED FILTERING LOGIC ---

  const filteredPayments = useMemo(() => {

    return payments.filter((p) => {

      // 1. Name/ID Search

      const name = p.students?.full_name?.toLowerCase() || "";

      const payId = p.razorpay_payment_id?.toLowerCase() || "";

      const search = searchTerm.toLowerCase();

      const matchesSearch = name.includes(search) || payId.includes(search);

      

      // 2. Status Search (Fixes the filtering issue)

      const dbStatus = p.payment_status?.toLowerCase().trim() || "";

      const selectedStatus = filterStatus.toLowerCase();

      const matchesStatus = selectedStatus === "all" || dbStatus === selectedStatus;

      

      // 3. Date Range

      const paymentDate = new Date(p.created_at).toISOString().split('T')[0];

      const matchesStart = !startDate || paymentDate >= startDate;

      const matchesEnd = !endDate || paymentDate <= endDate;

      

      return matchesSearch && matchesStatus && matchesStart && matchesEnd;

    });

  }, [searchTerm, filterStatus, startDate, endDate, payments]);



  const resetFilters = () => {

    setSearchTerm("");

    setFilterStatus("all");

    setStartDate("");

    setEndDate("");

    toast.success("Filters Cleared");

  };



  const handleExport = () => {

    if (filteredPayments.length === 0) return toast.error("No data to export");

    const headers = ["Date", "Student", "Class", "Amount", "Status", "Payment ID"];

    const rows = filteredPayments.map(p => [

      new Date(p.created_at).toLocaleDateString(),

      p.students?.full_name,

      `${p.students?.class_name}-${p.students?.section}`,

      p.paid_amount,

      p.payment_status,

      p.razorpay_payment_id || "N/A"

    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `Payments_Report_${new Date().toISOString().split('T')[0]}.csv`;

    a.click();

  };



  return (

    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <Toaster />



      {/* HEADER */}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">

        <div className="flex items-center gap-4">

          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">

            <FiCreditCard size={24} />

          </div>

          <div>

            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Payment Ledger</h1>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Transactions</p>

          </div>

        </div>

        

        <div className="flex gap-2 w-full md:w-auto">

          <button onClick={resetFilters} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all">

            <FiRefreshCw />

          </button>

          <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">

            <FiDownload /> Export CSV

          </button>

        </div>

      </div>



      {/* FILTER BAR */}

{/* FILTER BAR */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm items-center">

  {/* Search */}
  <div className="relative flex items-center h-[55px] bg-slate-50 rounded-xl ring-1 ring-slate-100">
    <FiSearch className="absolute left-4 text-slate-400 text-sm" />

    <input
      type="text"
      placeholder="Search name or ID..."
      className="w-full h-full pl-11 pr-4 bg-transparent rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  {/* Start Date */}
  <div className="flex items-center justify-between h-[55px] px-4 bg-slate-50 rounded-xl ring-1 ring-slate-100">
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-400 uppercase">
        From Date
      </span>
      <input
        type="date"
        className="bg-transparent text-xs font-bold outline-none cursor-pointer"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
    </div>
  </div>

  {/* End Date */}
  <div className="flex items-center justify-between h-[55px] px-4 bg-slate-50 rounded-xl ring-1 ring-slate-100">
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-400 uppercase">
        To Date
      </span>
      <input
        type="date"
        className="bg-transparent text-xs font-bold outline-none cursor-pointer"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
    </div>
  </div>

</div>



      {/* DATA TABLE */}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-slate-50 border-b border-slate-100">

              <tr>

                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>

                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>

                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>

                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-50">

              {loading ? (

                <tr><td colSpan={4} className="py-20 text-center text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Loading...</td></tr>

              ) : filteredPayments.map((p) => (

                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">

                  <td className="px-6 py-5">

                    <span className="text-xs font-bold text-slate-600">{new Date(p.created_at).toLocaleDateString('en-GB')}</span>

                  </td>

                  <td className="px-6 py-5">

                    <p className="text-xs font-black text-slate-800 uppercase">{p.students?.full_name}</p>

                    <p className="text-[9px] font-bold text-slate-400">ID: {p.razorpay_payment_id || '---'}</p>

                  </td>

                  <td className="px-6 py-5">

                    <span className="text-xs font-black text-slate-800">₹{p.paid_amount}</span>

                  </td>

                  <td className="px-6 py-5 text-right">

                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${

                      p.payment_status?.toLowerCase().trim() === 'captured' || p.payment_status?.toLowerCase().trim() === 'success'

                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 

                      p.payment_status?.toLowerCase().trim() === 'pending' 

                        ? 'bg-amber-50 text-amber-600 border-amber-100' : 

                      'bg-rose-50 text-rose-600 border-rose-100'

                    }`}>

                      {p.payment_status}

                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {!loading && filteredPayments.length === 0 && (

            <div className="py-20 text-center flex flex-col items-center gap-2">

              <FiXCircle className="text-slate-200" size={40} />

              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching records found</p>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

