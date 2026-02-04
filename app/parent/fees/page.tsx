"use client";

import React, { useState, useEffect } from "react";
import { FiCreditCard, FiFileText, FiInfo, FiCheckCircle, FiShield, FiArrowRight } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ParentFees() {
  const [fees, setFees] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);

  const academicYear = "2026-27";

  useEffect(() => {
    fetchFeeDetails();
  }, []);

  async function fetchFeeDetails() {
    setLoading(true);
    try {
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      // Fetch student info
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("class_name, full_name")
        .eq("id", childId)
        .single();

      if (studentError) throw studentError;
      setStudentInfo(student);

      const cleanedClass = student.class_name.replace(/(st|nd|rd|th)$/i, "").trim();

      // Fetch class fees
      const { data: feeData, error: feeError } = await supabase
        .from("class_fees")
        .select("*")
        .or(`class.eq."${student.class_name}",class.eq."${cleanedClass}"`);

      if (feeError) throw feeError;
      setFees(feeData || []);

      // Total fees
      const totalAmount = (feeData || []).reduce((sum, item) => sum + Number(item.amount), 0);

      // Fetch student payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("student_payments")
        .select("*")
        .eq("student_id", childId)
        .eq("academic_year", academicYear)
        .single();

      if (paymentError && paymentError.code !== "PGRST116") {
        throw paymentError;
      }

      if (paymentData) {
        setPaidAmount(Number(paymentData.paid_amount));
        setBalanceAmount(Number(paymentData.balance_amount));
      } else {
        // If no record exists, create initial record
        await supabase.from("student_payments").insert([
          {
            student_id: childId,
            academic_year: academicYear,
            total_amount: totalAmount,
            paid_amount: 0,
            balance_amount: totalAmount,
            payment_status: "pending",
            payment_method: "razorpay",
          },
        ]);

        setPaidAmount(0);
        setBalanceAmount(totalAmount);
      }
    } catch (err) {
      console.error("Fee Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = fees.reduce((sum, item) => sum + Number(item.amount), 0);

  async function loadRazorpayScript() {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    try {
      const childId = localStorage.getItem("childId");
      if (!childId) return;

      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Check Internet.");
        return;
      }

      // Create order in backend
   const orderRes = await fetch("/api/create-order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: balanceAmount }),
});

const orderData = await orderRes.json();

console.log("ORDER RESPONSE:", orderData);

if (!orderRes.ok) {
  alert("Order API failed. Check console.");
  return;
}

if (!orderData?.id) {
  alert("Order ID not received from server.");
  return;
}

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "School Fee Payment",
        description: `Fee Payment ${academicYear}`,
        order_id: orderData.id,

        handler: async function (response: any) {
          const razorpay_payment_id = response.razorpay_payment_id;
          const razorpay_order_id = response.razorpay_order_id;

          // Insert transaction record
          await supabase.from("payment_transactions").insert([
            {
              student_id: childId,
              academic_year: academicYear,
              amount: balanceAmount,
              status: "success",
              razorpay_payment_id,
              razorpay_order_id,
            },
          ]);

          const newPaid = paidAmount + balanceAmount;
          const newBalance = totalAmount - newPaid;

          // Update student_payments table
          await supabase
            .from("student_payments")
            .update({
              paid_amount: newPaid,
              balance_amount: newBalance,
              payment_status: newBalance <= 0 ? "paid" : "partial",
              razorpay_payment_id,
              razorpay_order_id,
            })
            .eq("student_id", childId)
            .eq("academic_year", academicYear);

          alert("Payment Successful ✅");
          fetchFeeDetails();
        },

        prefill: {
          name: studentInfo?.full_name,
        },

        theme: {
          color: "#2563eb",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment Failed ❌");
    }
  }

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiShield size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase font-sans">
              Fee Ledger
            </h1>
            <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">
              {studentInfo?.full_name} • Class {studentInfo?.class_name}
            </p>
          </div>
        </div>

        <div className="flex gap-2 font-sans">
          <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest">
            {academicYear}
          </div>
          <div className="bg-brand-light px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest">
            Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- BILLING LIST --- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 px-2 mb-2">
            <FiFileText className="text-brand-light" size={18} />
            <h3 className="text-[11px] font-black text-brand-light uppercase tracking-[0.2em]">
              Bill Breakdown
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-brand-soft/10 animate-pulse rounded-[2rem] border border-brand-soft/20"></div>
              ))}
            </div>
          ) : fees.length > 0 ? (
            fees.map((fee) => (
              <div
                key={fee.id}
                className="group bg-white p-6 rounded-[2.5rem] border border-brand-soft flex items-center justify-between hover:bg-brand-accent/20 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-brand-soft/40 rounded-[1.5rem] flex items-center justify-center text-brand-light transition-colors group-hover:bg-brand-light group-hover:text-white">
                    <span className="text-xl font-black">₹</span>
                  </div>
                  <div>
                    <h4 className="font-black text-brand-light uppercase tracking-tight text-lg leading-tight">
                      {fee.fee_type}
                    </h4>
                    <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest">
                      Tuition & Operations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-brand-light tracking-tighter">
                    ₹{Number(fee.amount).toLocaleString("en-IN")}
                  </p>
                  <span className="text-[9px] font-black text-brand-light/40 uppercase tracking-tighter">
                    Due This Term
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-brand-soft text-center">
              <FiInfo size={40} className="mx-auto text-brand-light/20 mb-4" />
              <p className="text-brand-light/40 font-black text-[10px] uppercase tracking-widest">
                No fee data found
              </p>
            </div>
          )}
        </div>

        {/* --- SUMMARY --- */}
        <div className="space-y-6">
          
          {/* TOTAL CARD */}
          <div className="bg-brand-light rounded-[2.5rem] p-8 text-white shadow-xl shadow-brand-soft/50 relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
              Total Fee Amount
            </p>
            <h2 className="text-4xl font-black tracking-tighter italic font-sans">
              ₹{totalAmount.toLocaleString("en-IN")}
            </h2>

            <div className="mt-6 space-y-3 pt-6 border-t border-white/10">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase opacity-80">Paid</span>
                <span className="text-[10px] font-black">
                  ₹{paidAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase opacity-80">Balance</span>
                <span className="text-[10px] font-black text-yellow-200">
                  ₹{balanceAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase opacity-80">Status</span>
                <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full">
                  {balanceAmount <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* PAY BUTTON */}
          <button
            disabled={balanceAmount <= 0}
            onClick={handlePayment}
            className={`w-full p-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg 
              ${
                balanceAmount <= 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-brand-soft border border-brand-light/20 text-brand-light hover:bg-brand-light hover:text-white"
              }`}
          >
            <FiCreditCard size={18} />
            {balanceAmount <= 0 ? "Already Paid" : `Pay ₹${balanceAmount.toLocaleString("en-IN")} via Razorpay`}
          </button>

          {/* INFO BOX */}
          <div className="p-8 bg-white border border-brand-soft rounded-[2.5rem] space-y-4">
            <div className="flex items-center gap-3 text-brand-light">
              <FiCheckCircle size={18} />
              <h4 className="text-[10px] font-black uppercase tracking-widest">
                Transaction Info
              </h4>
            </div>
            <p className="text-[11px] font-medium text-brand-light/60 leading-relaxed font-sans">
              Payment is secured using Razorpay. Receipt will be generated automatically after successful payment.
            </p>
            <div className="flex items-center gap-2 text-[9px] font-black text-brand-light uppercase group cursor-pointer pt-2">
              <span>View Payment History</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
