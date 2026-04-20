"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CreditCard, History, CheckCircle, Clock, Upload, Bus, Wallet, AlertCircle, ArrowRight } from "lucide-react";
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

            const normalizedClass = student.class_name.toLowerCase().replace(/(st|nd|rd|th)/g, "").trim();

            const { data: config } = await supabase.from("payment_configs").select("*")
                .overlaps("class_name", [`${normalizedClass} A`, `${normalizedClass} B`, `${normalizedClass} C`, `${normalizedClass} D`]).maybeSingle();
            setPaymentConfig(config);

            // Fetch Assigned Class Fees
            const { data: cFees } = await supabase.from("class_fees").select("*").eq("class", student.class_name);
            let combinedFees = cFees || [];

            // Transport Logic
            const { data: transport } = await supabase.from("transport_assignments")
                .select("monthly_fare, status").eq("student_id", childId).eq("status", "active").maybeSingle();

            if (transport) {
                combinedFees.push({ id: 'trans-id', fee_type: "Transport Fee", amount: transport.monthly_fare, is_transport: true });
            }
            setClassFees(combinedFees);

            // Fetch Records from student_fees (Verified/Partial)
            const { data: verified } = await supabase.from("student_fees").select("*").eq("student_id", childId);
            setVerifiedFees(verified || []);
            
            // Fetch Pending Submissions
            const { data: pending } = await supabase.from("fee_submissions").select("*").eq("student_id", childId).eq("status", "pending");
            setPendingSubmissions(pending || []);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load fee data");
        } finally {
            setLoading(false);
        }
    }

    // --- LOGIC FOR REMAINING BALANCES ---
    const feeCalculation = useMemo(() => {
        return classFees.map(cf => {
            // Find if there's an entry in student_fees for this type
            const record = verifiedFees.find(vf => vf.fee_type.toLowerCase() === cf.fee_type.toLowerCase());
            const paid = record ? Number(record.paid_amount) : 0;
            const total = Number(cf.amount);
            const remaining = total - paid;
            
            // Check if there is a pending submission for this fee type
            const isPending = pendingSubmissions.some(ps => ps.fee_types?.toLowerCase().includes(cf.fee_type.toLowerCase()));

            return {
                ...cf,
                total_assigned: total,
                already_paid: paid,
                remaining_balance: remaining,
                status: remaining <= 0 ? "verified" : (isPending ? "pending" : "available")
            };
        });
    }, [classFees, verifiedFees, pendingSubmissions]);

    const stats = useMemo(() => {
        const total = feeCalculation.reduce((sum, f) => sum + f.total_assigned, 0);
        const paid = feeCalculation.reduce((sum, f) => sum + f.already_paid, 0);
        return { total, paid, balance: total - paid };
    }, [feeCalculation]);

    const calculatedTotalSelection = feeCalculation
        .filter(f => selectedFeeTypes.includes(f.fee_type))
        .reduce((sum, f) => sum + f.remaining_balance, 0);

    async function handlePaymentSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !utr || selectedFeeTypes.length === 0) return toast.error("Complete all fields");

        setUploading(true);
        try {
            const childId = localStorage.getItem("childId");
            const fileName = `${childId}-${Date.now()}`;
            const { error: upErr } = await supabase.storage.from('payments').upload(`proofs/${fileName}`, file);
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`);

            const { error: dbErr } = await supabase.from("fee_submissions").insert([{
                student_id: childId,
                amount_paid: calculatedTotalSelection,
                utr_number: utr,
                payment_date: payDate,
                proof_url: publicUrl,
                fee_types: selectedFeeTypes.join(", "),
                status: 'pending'
            }]);

            if (dbErr) throw dbErr;
            toast.success("Submission Successful!");
            setUtr(""); setFile(null); setSelectedFeeTypes([]);
            fetchData();
        } catch (err: any) {
            toast.error("Submission failed");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-2 pb-10 space-y-6 dark:text-slate-200">
            <Toaster position="top-center" richColors />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 md:px-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-soft dark:bg-slate-800 text-brand-light rounded-2xl flex items-center justify-center">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase leading-none">Payments</h1>
                        <p className="text-[10px] font-bold text-brand-light tracking-widest uppercase mt-1">{studentInfo?.full_name}</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabButton active={activeTab === "pay"} onClick={() => setActiveTab("pay")} label="Pay Fees" />
                    <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} label="History" />
                </div>
            </header>

            {/* STATS SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Course Fee" value={stats.total} icon={<Wallet />} color="text-slate-500" />
                <StatCard label="Amount Paid" value={stats.paid} icon={<CheckCircle />} color="text-green-500" />
                <StatCard label="Pending Balance" value={stats.balance} icon={<AlertCircle />} color="text-brand-light" />
            </div>

            {activeTab === "pay" ? (
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
                    {/* FORM SECTION */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black italic">Pay Remaining Balance</h2>
                            <div className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                                <Clock size={12} className="text-amber-400" />
                                <span className="text-[9px] font-bold tracking-tighter text-amber-400">Receipt will be generated after 24 hours of working day.</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <label className="text-[10px] font-black uppercase opacity-40 block">Select Pending Fees</label>
                            {feeCalculation.map((f) => {
                                const isDisabled = f.status !== "available";
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => setSelectedFeeTypes(prev => prev.includes(f.fee_type) ? prev.filter(t => t !== f.fee_type) : [...prev, f.fee_type])}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left
                                        ${isDisabled ? "opacity-40 grayscale bg-white/5 border-transparent" : 
                                          selectedFeeTypes.includes(f.fee_type) ? "bg-brand-light/20 border-brand-light" : "bg-white/5 border-white/10 hover:border-white/30"}`}
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                {f.is_transport && <Bus size={14} className="text-brand-light" />}
                                                <span className="text-xs font-black uppercase">{f.fee_type}</span>
                                            </div>
                                            <span className="text-[10px] opacity-60 font-bold">Total: ₹{f.total_assigned.toLocaleString()} | Paid: ₹{f.already_paid.toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-brand-light">₹{f.remaining_balance.toLocaleString()}</p>
                                            <span className="text-[8px] font-black uppercase">{f.status}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <InputField label="UTR / Transaction ID" placeholder="Enter 12 digit UTR" value={utr} onChange={setUtr} />
                            <InputField label="Payment Date" type="date" value={payDate} onChange={setPayDate} />
                        </div>

                        <div className="mb-8 border-2 border-dashed border-white/10 rounded-3xl p-8 text-center hover:bg-white/5 cursor-pointer transition-all">
                            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="fileUp" accept="image/*" />
                            <label htmlFor="fileUp" className="cursor-pointer flex flex-col items-center gap-3">
                                <Upload size={32} className="text-brand-light" />
                                <span className="text-xs font-bold opacity-60">{file ? file.name : "Upload Payment Screenshot"}</span>
                            </label>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 gap-6">
                            <div>
                                <p className="text-[10px] font-black opacity-40 uppercase">Total to Pay Now</p>
                                <p className="text-4xl font-black text-brand-light italic">₹{calculatedTotalSelection.toLocaleString()}</p>
                            </div>
                            <button
                                disabled={uploading || calculatedTotalSelection === 0}
                                onClick={handlePaymentSubmit}
                                className="w-full md:w-auto bg-brand-light text-white px-12 py-5 rounded-2xl font-black uppercase text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-30"
                            >
                                {uploading ? "Processing..." : "Submit Payment Proof"}
                            </button>
                        </div>
                    </div>

                    {/* BANK INFO */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 h-fit shadow-sm">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Bank Details</h3>
                        {paymentConfig?.qr_url && (
                            <img src={paymentConfig.qr_url} className="w-full rounded-3xl border-8 border-slate-50 dark:border-slate-800 mb-8 p-4 shadow-inner" alt="QR" />
                        )}
                        <div className="space-y-3">
                            <BankRow label="Bank" value={paymentConfig?.bank_name} />
                            <BankRow label="Account" value={paymentConfig?.account_number} />
                            <BankRow label="IFSC Code" value={paymentConfig?.ifsc_code} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <HistorySection title="Pending Approval" items={pendingSubmissions} status="pending" />
                    <HistorySection title="Verified Payments" items={verifiedFees} status="verified" />
                </div>
            )}
        </div>
    );
}

// Sub-components
function StatCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{label}</p>
                <p className={`text-2xl font-black ${color}`}>₹{value.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-300">{icon}</div>
        </div>
    );
}

function InputField({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black opacity-40 uppercase">{label}</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-brand-light text-white" {...props} />
        </div>
    );
}

function BankRow({ label, value }: any) {
    return (
        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{value || "---"}</span>
        </div>
    );
}

function TabButton({ active, onClick, label }: any) {
    return (
        <button onClick={onClick} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${active ? "bg-white dark:bg-slate-700 text-brand-light shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
            {label}
        </button>
    );
}

function HistorySection({ title, items, status }: any) {
    return (
        <section>
            <h3 className="text-xs font-black uppercase text-slate-400 mb-4 px-2 tracking-widest">{title}</h3>
            <div className="space-y-3">
                {items.map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white">{status === 'pending' ? item.fee_types : item.fee_type}</p>
                            <p className="text-[9px] font-bold text-slate-400">{status === 'pending' ? item.payment_date : new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-black ${status === 'pending' ? 'text-amber-500' : 'text-green-500'}`}>₹{Number(status === 'pending' ? item.amount_paid : item.paid_amount).toLocaleString()}</p>
                            <code className="text-[8px] opacity-40">UTR: {item.utr_number}</code>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <div className="p-10 text-center text-[10px] font-black opacity-20 uppercase">No Records</div>}
            </div>
        </section>
    );
}