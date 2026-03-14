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
            const normalizedClass = student.class_name
                .toLowerCase()
                .replace(/(st|nd|rd|th)/g, "")
                .trim();

            console.log("Normalized class:", normalizedClass);

            const { data: config, error: configError } = await supabase
                .from("payment_configs")
                .select("*")
                .overlaps("class_name", [
                    `${normalizedClass} A`,
                    `${normalizedClass} B`,
                    `${normalizedClass} C`,
                    `${normalizedClass} D`
                ]).maybeSingle();

            console.log("Payment config:", config);
            console.log("Config error:", configError);

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
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-2 pb-10 space-y-6 bg-transparent dark:text-slate-200">

            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 md:px-8 md:py-6 rounded-3xl md:rounded-[2rem] border border-brand-soft dark:border-slate-700 shadow-sm gap-4">

                <div className="flex items-center gap-4 w-full md:w-auto">

                    <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-soft dark:bg-slate-800 text-brand-light rounded-xl md:rounded-2xl flex items-center justify-center">
                        <CreditCard size={20} />
                    </div>

                    <div>
                        <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase leading-none">
                            Fee Portal
                        </h1>

                        <p className="text-[9px] md:text-[10px] font-bold text-brand-light tracking-widest uppercase mt-1">
                            {studentInfo?.full_name} • Class {studentInfo?.class_name}
                        </p>
                    </div>

                </div>

                <div className="flex w-full md:w-auto items-center bg-brand-soft/30 dark:bg-slate-800 p-1 rounded-xl border border-brand-soft dark:border-slate-700">
                    <TabButton active={activeTab === "pay"} onClick={() => setActiveTab("pay")} label="Pay" icon={<CreditCard size={12} />} />
                    <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} label="History" icon={<History size={12} />} />
                </div>

            </header>


            {activeTab === "pay" ? (
                /* On Mobile: Flex-col with Order 1 (Form) and Order 2 (Bank)
                   On Desktop: lg:grid-cols-3 with natural order
                */
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
                    {/* --- NEW NOTICE HEADER --- */}
                    <div className="order-1 lg:col-span-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-3 rounded-2xl mb-2">
                        <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-[10px] md:text-xs font-bold text-amber-700 dark:text-amber-300 italic uppercase tracking-tight">
                            (Receipt will be generated after 24 hours of working day)
                        </p>
                    </div>
                    {/* 1. PAYMENT FORM (FEE DETAILS) - Appears FIRST on mobile */}
                    <div className="order-1 lg:order-2 lg:col-span-2 bg-slate-900 dark:bg-slate-950 rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-white shadow-2xl">

                        <h2 className="text-xl md:text-2xl font-black italic mb-6">
                            Make a Payment
                        </h2>

                        {/* FEE TYPES */}
                        <div className="mb-8">
                            <label className="text-[10px] font-black uppercase opacity-40 mb-4 block">
                                Select Fee Type
                            </label>

                            {/* Changed grid-cols-2/3/4 to grid-cols-1 or just a flex-col */}
                           <div className="flex flex-col gap-1.5"> {/* Smaller gap between rows */}
  {classFees.map((f) => {
    const status = getFeeStatus(f.fee_type)
    const isDisabled = status !== "available"

    return (
      <button
        key={f.id}
        type="button"
        disabled={isDisabled}
        onClick={() =>
          setSelectedFeeTypes((prev) =>
            prev.includes(f.fee_type)
              ? prev.filter((t) => t !== f.fee_type)
              : [...prev, f.fee_type]
          )
        }
        className={`relative w-full px-3 py-2 rounded-lg border text-left transition-all flex items-center justify-between
        ${
          isDisabled
            ? "opacity-40 grayscale cursor-not-allowed bg-white/5 border-transparent"
            : selectedFeeTypes.includes(f.fee_type)
            ? "bg-brand-light/20 border-brand-light" 
            : "bg-white/5 border-white/10"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {f.is_transport && (
              <Bus size={12} className="shrink-0 text-brand-light" />
            )}
            <span className="text-[9px] font-black uppercase tracking-tight">
              {f.fee_type}
            </span>
          </div>

          {status !== "available" && (
            <span
              className={`text-[7px] px-1 py-0.5 rounded-sm font-black text-white
              ${status === "verified" ? "bg-green-500" : "bg-amber-500"}`}
            >
              {status.toUpperCase()}
            </span>
          )}
        </div>

        <p className="text-sm font-black">
          ₹{Number(f.amount).toLocaleString()}
        </p>
      </button>
    )
  })}
</div>
                        </div>

                        {/* INPUTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black opacity-40 uppercase">
                                    UTR Number
                                </label>
                                <input
                                    value={utr}
                                    onChange={e => setUtr(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm outline-none focus:border-brand-light"
                                    placeholder="12 Digit ID"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black opacity-40 uppercase">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    value={payDate}
                                    onChange={e => setPayDate(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm outline-none focus:border-brand-light"
                                />
                            </div>
                        </div>

                        {/* UPLOAD */}
                        <div className="mb-8 border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 active:bg-white/10 transition-colors">
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="fileUp"
                                accept="image/*"
                            />
                            <label htmlFor="fileUp" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload size={24} className="text-brand-light" />
                                <span className="text-xs font-bold opacity-70 break-all">
                                    {file ? file.name : "Tap to Upload Screenshot"}
                                </span>
                            </label>
                        </div>

                        {/* TOTAL & SUBMIT */}
                        <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-6 gap-4">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black opacity-40 uppercase">
                                    Total Amount
                                </p>
                                <p className="text-3xl md:text-4xl font-black text-brand-light italic">
                                    ₹{calculatedTotal.toLocaleString()}
                                </p>
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

                    {/* 2. BANK INFO (QR CODE) - Appears BELOW the form on mobile */}
                    <div className="order-2 lg:order-1 bg-white dark:bg-slate-900 border border-brand-soft dark:border-slate-700 rounded-3xl p-6 md:p-8 h-fit">

                        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
                            Payment Destination
                        </h3>

                        {paymentConfig ? (
                            paymentConfig.qr_url && (
                                <div className="flex justify-center md:block">
                                    <img
                                        src={paymentConfig.qr_url}
                                        className="w-48 md:w-full rounded-2xl border-4 border-brand-soft dark:border-slate-700 mb-6 p-2"
                                        alt="QR"
                                    />
                                </div>
                            )
                        ) : (
                            <p className="text-xs text-red-500 font-bold">
                                Payment configuration not found
                            </p>
                        )}

                        <div className="grid grid-cols-1 gap-2 text-[11px]">
                            <BankRow label="Bank" value={paymentConfig?.bank_name} />
                            <BankRow label="A/C" value={paymentConfig?.account_number} />
                            <BankRow label="IFSC" value={paymentConfig?.ifsc_code} />
                        </div>

                    </div>

                </div>
            ) : (


                <div className="space-y-8">

                    <section>

                        <div className="flex items-center gap-2 mb-4 px-2">

                            <Clock size={16} className="text-amber-500" />

                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                                Pending Verification
                            </h3>

                        </div>

                        <div className="space-y-3">

                            {pendingSubmissions.map(item => (
                                <HistoryCard key={item.id} item={item} status="pending" />
                            ))}

                            {pendingSubmissions.length === 0 && <EmptyState msg="No pending requests" />}

                        </div>

                    </section>


                    <section>

                        <div className="flex items-center gap-2 mb-4 px-2">

                            <CheckCircle size={16} className="text-green-500" />

                            <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
                                Payment Ledger
                            </h3>

                        </div>

                        <div className="space-y-3">

                            {verifiedFees.map(item => (
                                <HistoryCard key={item.id} item={item} status="verified" />
                            ))}

                            {verifiedFees.length === 0 && <EmptyState msg="No verified records found" />}

                        </div>

                    </section>

                </div>

            )}

        </div>
    )
}

/** HELPER COMPONENTS **/
function TabButton({ active, onClick, label, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2 rounded-lg md:rounded-xl text-[10px] font-black uppercase transition-all
            ${active
                    ? "bg-brand-light text-white shadow-md"
                    : "text-brand-light dark:text-slate-300 hover:bg-brand-soft/30 dark:hover:bg-slate-800"
                }`}
        >
            {icon} {label}
        </button>
    );
}

function BankRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-slate-400 dark:text-slate-400 font-bold">
                {label}
            </span>
            <span className="text-slate-900 dark:text-white font-black">
                {value || "---"}
            </span>
        </div>
    );
}

function HistoryCard({ item, status }: { item: any, status: "pending" | "verified" }) {
    const isPending = status === "pending";

    return (
        <div className="bg-white dark:bg-slate-900 border border-brand-soft dark:border-slate-700 p-4 rounded-2xl shadow-sm flex flex-col gap-3">

            <div className="flex justify-between items-start">

                <div className="max-w-[70%]">
                    <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-tight mb-1">
                        {isPending ? item.fee_types : item.fee_type}
                    </p>

                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                        {isPending
                            ? item.payment_date
                            : new Date(item.created_at).toLocaleDateString()}
                    </p>
                </div>

                <p
                    className={`text-sm font-black ${isPending
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-900 dark:text-white"
                        }`}
                >
                    ₹
                    {Number(
                        isPending ? item.amount_paid : item.paid_amount
                    ).toLocaleString()}
                </p>

            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-700">

                <code className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                    UTR: {item.utr_number}
                </code>

                <span
                    className={`text-[8px] font-black uppercase px-2 py-1 rounded-full
                    ${isPending
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                            : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                        }`}
                >
                    {isPending ? "Pending Approval" : "Verified"}
                </span>

            </div>
        </div>
    );
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div className="py-8 text-center bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {msg}
            </p>
        </div>
    );
}