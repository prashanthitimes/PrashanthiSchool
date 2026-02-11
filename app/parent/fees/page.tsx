"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, History, CheckCircle, Clock, Upload, Bus, Calendar, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast, Toaster } from "sonner";

export default function ParentFees() {
  const [activeTab, setActiveTab] = useState<"pay" | "history">("pay");
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [classFees, setClassFees] = useState<any[]>([]);
  
  const [verifiedFees, setVerifiedFees] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  
  const [selectedFeeTypes, setSelectedFeeTypes] = useState<string[]>([]);
  const [utr, setUtr] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      const { data: student } = await supabase.from("students").select("*").eq("id", childId).single();
      setStudentInfo(student);

      const normalizedClass = student.class_name.replace(/(st|nd|rd|th)$/i, "");

      const { data: config } = await supabase.from("payment_configs")
        .select("*").or(`class_name.cs.{"${student.class_name}"},class_name.cs.{"${normalizedClass}"}`).maybeSingle();
      setPaymentConfig(config);

      const { data: cFees } = await supabase.from("class_fees").select("*").eq("class", student.class_name);
      let combinedFees = cFees || [];

      const { data: transport } = await supabase
        .from("transport_assignments")
        .select("monthly_fare, status")
        .eq("student_id", childId)
        .eq("status", "active")
        .maybeSingle();

      if (transport) {
        combinedFees.push({
          id: 'transport-fee-id',
          fee_type: "Transport Fee",
          amount: transport.monthly_fare,
          is_transport: true
        });
      }

      setClassFees(combinedFees);
      const { data: verified } = await supabase.from("student_fees").select("*").eq("student_id", childId);
      setVerifiedFees(verified || []);
      const { data: pending } = await supabase.from("fee_submissions").select("*").eq("student_id", childId).eq("status", "pending");
      setPendingSubmissions(pending || []);

    } catch (err) { 
      console.error(err); 
      toast.error("Failed to load fee data");
    } finally { 
      setLoading(false); 
    }
  }

  const getFeeStatus = (feeType: string) => {
    const isVerified = verifiedFees.some(item => item.fee_type.toLowerCase().includes(feeType.toLowerCase()));
    if (isVerified) return "verified";
    const isPending = pendingSubmissions.some(item => item.fee_types?.toLowerCase().includes(feeType.toLowerCase()));
    if (isPending) return "pending";
    return "available";
  };

  const calculatedTotal = classFees
    .filter(f => selectedFeeTypes.includes(f.fee_type))
    .reduce((sum, f) => sum + Number(f.amount), 0);

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !utr || selectedFeeTypes.length === 0) return toast.error("Complete all fields");

    setUploading(true);
    try {
      const childId = localStorage.getItem("childId");
      const { data: dupPending } = await supabase.from("fee_submissions").select("id").eq("utr_number", utr).maybeSingle();
      const { data: dupVerified } = await supabase.from("student_fees").select("id").eq("utr_number", utr).maybeSingle();

      if (dupPending || dupVerified) {
        setUploading(false);
        return toast.error("UTR already exists");
      }

      const fileName = `${childId}-${Date.now()}`;
      const { error: upErr } = await supabase.storage.from('payments').upload(`proofs/${fileName}`, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`);

      const { error: dbErr } = await supabase.from("fee_submissions").insert([{
        student_id: childId,
        amount_paid: calculatedTotal,
        utr_number: utr,
        payment_date: payDate,
        proof_url: publicUrl,
        fee_types: selectedFeeTypes.join(", "),
        status: 'pending'
      }]);

      if (dbErr) throw dbErr;
      toast.success("Submitted!");
      setUtr(""); setFile(null); setSelectedFeeTypes([]);
      fetchData(); 
    } catch (err: any) { 
      toast.error("Submission failed"); 
    } finally { 
      setUploading(false); 
    }
  }

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-400">LOADING...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-2 pb-10 space-y-6 bg-transparent">
      <Toaster position="top-center" richColors />

      {/* --- HEADER (RESPONSIVE) --- */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-white/80 backdrop-blur-md p-4 md:px-8 md:py-6 rounded-3xl md:rounded-[2rem] border border-brand-soft shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-soft text-brand-light rounded-xl md:rounded-2xl flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase leading-none">Fee Portal</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-brand-light tracking-widest uppercase mt-1">
              {studentInfo?.full_name} • Class {studentInfo?.class_name}
            </p>
          </div>
        </div>

        <div className="flex w-full md:w-auto items-center bg-brand-soft/30 p-1 rounded-xl border border-brand-soft">
          <TabButton active={activeTab === "pay"} onClick={() => setActiveTab("pay")} label="Pay" icon={<CreditCard size={12}/>} />
          <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} label="History" icon={<History size={12}/>} />
        </div>
      </header>

      {activeTab === "pay" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* BANK INFO (ACCORDION STYLE ON MOBILE HINT) */}
            <div className="bg-white border border-brand-soft rounded-3xl p-6 md:p-8 h-fit">
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Payment Destination</h3>
                {paymentConfig?.qr_url && (
                    <div className="flex justify-center md:block">
                        <img src={paymentConfig.qr_url} className="w-48 md:w-full rounded-2xl border-4 border-brand-soft mb-6 p-2" alt="QR" />
                    </div>
                )}
                <div className="grid grid-cols-1 gap-2 text-[11px]">
                    <BankRow label="Bank" value={paymentConfig?.bank_name} />
                    <BankRow label="A/C" value={paymentConfig?.account_number} />
                    <BankRow label="IFSC" value={paymentConfig?.ifsc_code} />
                </div>
            </div>

            {/* FORM */}
            <div className="lg:col-span-2 bg-slate-900 rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-white shadow-2xl">
                <h2 className="text-xl md:text-2xl font-black italic mb-6">Make a Payment</h2>
                
                <div className="mb-8">
                    <label className="text-[10px] font-black uppercase opacity-40 mb-4 block">Select Fee Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {classFees.map(f => {
                            const status = getFeeStatus(f.fee_type);
                            const isDisabled = status !== "available";
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => setSelectedFeeTypes(prev => prev.includes(f.fee_type) ? prev.filter(t => t !== f.fee_type) : [...prev, f.fee_type])}
                                    className={`relative p-4 md:p-5 rounded-2xl border-2 text-left transition-all ${
                                        isDisabled ? 'opacity-30 grayscale cursor-not-allowed bg-white/5 border-transparent' :
                                        selectedFeeTypes.includes(f.fee_type) ? 'bg-brand-light border-brand-light scale-[0.98]' : 'bg-white/5 border-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 max-w-[70%]">
                                          {f.is_transport && <Bus size={12} className="shrink-0 text-brand-light" />}
                                          <span className="text-[9px] md:text-[10px] font-black uppercase truncate">{f.fee_type}</span>
                                        </div>
                                        {status !== "available" && (
                                            <span className={`text-[8px] px-2 py-0.5 rounded font-black text-white ${status === 'verified' ? 'bg-green-500' : 'bg-amber-500'}`}>
                                                {status.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg md:text-xl font-black">₹{Number(f.amount).toLocaleString()}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* INPUTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase">UTR Number</label>
                        <input value={utr} onChange={e => setUtr(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm outline-none focus:border-brand-light" placeholder="12 Digit ID" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black opacity-40 uppercase">Payment Date</label>
                        <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm outline-none focus:border-brand-light" />
                    </div>
                </div>

                {/* UPLOAD */}
                <div className="mb-8 border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 active:bg-white/10 transition-colors">
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="fileUp" accept="image/*" />
                    <label htmlFor="fileUp" className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload size={24} className="text-brand-light" />
                        <span className="text-xs font-bold opacity-70 break-all">{file ? file.name : "Tap to Upload Screenshot"}</span>
                    </label>
                </div>

                {/* BOTTOM BAR (STICKY HINT FOR MOBILE) */}
                <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-6 gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black opacity-40 uppercase">Total Amount</p>
                        <p className="text-3xl md:text-4xl font-black text-brand-light italic">₹{calculatedTotal.toLocaleString()}</p>
                    </div>
                    <button 
                      disabled={uploading || calculatedTotal === 0} 
                      onClick={handlePaymentSubmit} 
                      className="w-full md:w-auto bg-white text-slate-900 px-10 py-4 rounded-xl font-black uppercase text-[11px] shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        {uploading ? "SUBMITTING..." : "CONFIRM PAYMENT"}
                    </button>
                </div>
            </div>
        </div>
      ) : (
        /* --- HISTORY TAB (MOBILE OPTIMIZED CARDS) --- */
        <div className="space-y-8">
            {/* PENDING SECTION */}
            <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Clock size={16} className="text-amber-500" />
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Pending Verification</h3>
                </div>
                <div className="space-y-3">
                    {pendingSubmissions.map(item => <HistoryCard key={item.id} item={item} status="pending" />)}
                    {pendingSubmissions.length === 0 && <EmptyState msg="No pending requests" />}
                </div>
            </section>

            {/* VERIFIED SECTION */}
            <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Payment Ledger</h3>
                </div>
                <div className="space-y-3">
                    {verifiedFees.map(item => <HistoryCard key={item.id} item={item} status="verified" />)}
                    {verifiedFees.length === 0 && <EmptyState msg="No verified records found" />}
                </div>
            </section>
        </div>
      )}
    </div>
  );
}

/** HELPER COMPONENTS **/

function TabButton({ active, onClick, label, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[10px] font-black uppercase transition-all ${active ? "bg-brand-light text-white shadow-md" : "text-brand-light"}`}
        >
            {icon} {label}
        </button>
    );
}

function BankRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-bold">{label}</span>
            <span className="text-slate-900 font-black">{value || '---'}</span>
        </div>
    );
}

function HistoryCard({ item, status }: { item: any, status: 'pending' | 'verified' }) {
    const isPending = status === 'pending';
    return (
        <div className="bg-white border border-brand-soft p-4 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className="max-w-[70%]">
                    <p className="text-[10px] font-black text-slate-800 uppercase leading-tight mb-1">{isPending ? item.fee_types : item.fee_type}</p>
                    <p className="text-[9px] font-bold text-slate-400">{isPending ? item.payment_date : new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <p className={`text-sm font-black ${isPending ? 'text-amber-600' : 'text-slate-900'}`}>
                    ₹{Number(isPending ? item.amount_paid : item.paid_amount).toLocaleString()}
                </p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <code className="text-[9px] text-slate-400 font-mono">UTR: {item.utr_number}</code>
                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {isPending ? 'Pending Approval' : 'Verified'}
                </span>
            </div>
        </div>
    );
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div className="py-8 text-center bg-white/40 rounded-2xl border border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg}</p>
        </div>
    );
}