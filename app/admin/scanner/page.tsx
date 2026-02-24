'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
    FiPlus, FiX, FiTrash2, FiUpload,
    FiEye, FiShield, FiCheck, FiExternalLink, FiAlertCircle
} from 'react-icons/fi'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CLASS_OPTIONS = ['Pre-KG', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString())]

export default function PaymentConfiguration() {
    const [activeTab, setActiveTab] = useState<'setup' | 'verify'>('setup')
    const [configs, setConfigs] = useState<any[]>([])
    const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [viewDetail, setViewDetail] = useState<any | null>(null)
    const [qrFile, setQrFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Logic to track which classes are already assigned to scanners
    const assignedClasses = configs.flatMap(conf => conf.class_name || []);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])

    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        bank_branch: '',
        account_holder: ''
    })

    const fetchData = async () => {
        setLoading(true)
        const { data: configsData } = await supabase.from('payment_configs').select('*').order('created_at', { ascending: false })
        setConfigs(configsData || [])

        const { data: submissionsData } = await supabase
            .from('fee_submissions')
            .select(`*, students(full_name, class_name, roll_number)`)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })

        setPendingSubmissions(submissionsData || [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const handleApprove = async (submission: any) => {
        const loader = toast.loading("Processing approval...");
        try {
            const feeTypesArray = submission.fee_types.split(',').map((item: string) => item.trim());
            const amountPerType = submission.amount_paid / feeTypesArray.length;

            const insertData = feeTypesArray.map((type: string) => ({
                student_id: submission.student_id,
                student_name: submission.students?.full_name,
                class: submission.students?.class_name,
                roll_no: submission.students?.roll_number,
                fee_type: type,
                paid_amount: amountPerType,
                total_amount: amountPerType,
                utr_number: submission.utr_number,
                payment_method: "UPI/Scanner",
                remarks: "Approved via Admin Scanner Panel",
                created_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase.from('student_fees').insert(insertData);
            if (insertError) throw insertError;

            await supabase.from('fee_submissions').delete().eq('id', submission.id);
            toast.success("Payment Verified Successfully", { id: loader });
            fetchData();
        } catch (err: any) {
            toast.error(err.message, { id: loader });
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this payment?")) return
        await supabase.from('fee_submissions').delete().eq('id', id)
        toast.success("Submission Rejected")
        fetchData()
    }

    const toggleClass = (cls: string) => {
        // Prevent selecting classes already assigned to other scanners
        if (assignedClasses.includes(cls)) return;
        setSelectedClasses(prev => prev.includes(cls) ? prev.filter(i => i !== cls) : [...prev, cls])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // --- VALIDATIONS ---
        if (selectedClasses.length === 0) return toast.error("Please select at least one class")
        if (!qrFile) return toast.error("Please upload a QR Code image")
        if (!formData.bank_name || !formData.account_number || !formData.ifsc_code || !formData.account_holder) {
            return toast.error("Please fill all bank details")
        }

        setIsUploading(true)
        const loader = toast.loading("Uploading and Saving...")
        try {
            let finalUrl = ''
            const fileName = `qrs/scanner-${Date.now()}`
            const { error: uploadError } = await supabase.storage.from('payment-assets').upload(fileName, qrFile)
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('payment-assets').getPublicUrl(fileName)
            finalUrl = publicUrl

            const { error: dbError } = await supabase.from('payment_configs').insert({
                ...formData,
                class_name: selectedClasses,
                qr_url: finalUrl
            })
            if (dbError) throw dbError

            toast.success("New Scanner Registered", { id: loader })
            setShowModal(false);
            setSelectedClasses([]);
            setQrFile(null);
            setFormData({ bank_name: '', account_number: '', ifsc_code: '', bank_branch: '', account_holder: '' });
            fetchData();
        } catch (error: any) {
            toast.error(error.message, { id: loader })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-slate-50 min-h-screen">
            <Toaster position="top-right" />

            {/* HEADER SECTION */}
            <header className="flex flex-col md:flex-row items-center justify-between bg-white px-4 py-4 sm:px-8 sm:py-5 rounded-2xl sm:rounded-[2rem] border border-brand-soft shadow-sm gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                    <div className="text-center sm:text-left">
                        <h1 className="text-base sm:text-lg font-black text-brand-dark uppercase leading-tight">Payment Hub</h1>
                        <p className="text-[8px] sm:text-[9px] font-bold text-brand-light uppercase tracking-widest">Finance Administration</p>
                    </div>

                    {/* TOGGLE TABS */}
                    <div className="flex bg-brand-soft/30 p-1 rounded-xl border border-brand-soft w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('setup')}
                            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'setup' ? 'bg-brand text-white shadow-md' : 'text-brand-light hover:bg-white'}`}
                        >
                            Setup
                        </button>
                        <button
                            onClick={() => setActiveTab('verify')}
                            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'verify' ? 'bg-brand text-white shadow-md' : 'text-brand-light hover:bg-white'}`}
                        >
                            Verify
                            {pendingSubmissions.length > 0 && (
                                <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{pendingSubmissions.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {activeTab === 'setup' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
                    >
                        <FiPlus /> Add Scanner
                    </button>
                )}
            </header>

            {/* CONTENT AREA */}
            <main>
                {activeTab === 'setup' ? (
                    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-brand-soft overflow-hidden shadow-sm">
                        {/* Desktop View Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-brand-soft/20 border-b border-brand-soft">
                                    <tr className="text-[10px] font-black uppercase text-brand-dark">
                                        <th className="p-6">Assigned Classes</th>
                                        <th className="p-6">Bank Info</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-soft/20">
                                    {configs.map((conf) => (
                                        <tr key={conf.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50">
                                            <td className="p-6">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {conf.class_name?.map((c: string) => (
                                                        <span key={c} className="bg-brand-soft text-brand text-[9px] px-2 py-1 rounded font-black">{c}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-brand-dark">{conf.bank_name}</p>
                                                <p className="text-[10px] opacity-50 font-mono">{conf.account_number}</p>
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button onClick={() => setViewDetail(conf)} className="p-2 bg-brand-soft text-brand rounded-lg hover:bg-brand hover:text-white transition-all"><FiEye /></button>
                                                <button className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View Cards */}
                        <div className="md:hidden divide-y divide-brand-soft/20">
                            {configs.map((conf) => (
                                <div key={conf.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-wrap gap-1 flex-1">
                                            {conf.class_name?.map((c: string) => (
                                                <span key={c} className="bg-brand-soft text-brand text-[8px] px-2 py-0.5 rounded font-black">{c}</span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setViewDetail(conf)} className="p-2 bg-brand-soft text-brand rounded-lg"><FiEye /></button>
                                            <button className="p-2 bg-rose-50 text-rose-500 rounded-lg"><FiTrash2 /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-brand-dark">{conf.bank_name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{conf.account_number}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* VERIFICATION TAB - MOBILE RESPONSIVE CARDS */
                    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-brand-soft overflow-hidden shadow-sm">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-brand-soft/20 border-b border-brand-soft">
                                    <tr className="text-[10px] font-black uppercase text-brand-dark">
                                        <th className="p-6">Student</th>
                                        <th className="p-6">Fees & UTR</th>
                                        <th className="p-6">Amount</th>
                                        <th className="p-6">Proof</th>
                                        <th className="p-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-soft/20">
                                    {pendingSubmissions.map((sub) => (
                                        <tr key={sub.id} className="text-[11px] font-bold text-slate-700 hover:bg-slate-50">
                                            <td className="p-6">
                                                <p className="uppercase text-brand-dark font-black">{sub.students?.full_name}</p>
                                                <p className="text-[9px] text-brand uppercase mt-0.5">Class {sub.students?.class_name}</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    {sub.fee_types?.split(',').map((t) => (
                                                        <span key={t} className="bg-slate-100 px-2 py-0.5 rounded text-[8px] uppercase">{t}</span>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] font-mono text-slate-400">UTR: {sub.utr_number}</p>
                                            </td>
                                            <td className="p-6 font-black text-brand text-sm">₹{sub.amount_paid}</td>
                                            <td className="p-6">
                                                <a href={sub.proof_url} target="_blank" className="text-brand underline text-[9px] uppercase flex items-center gap-1"><FiExternalLink /> View</a>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="bg-green-500 text-white p-2 rounded-lg"><FiCheck /></button>
                                                    <button className="border border-rose-200 text-rose-500 p-2 rounded-lg"><FiX /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View for Verification */}
                        <div className="md:hidden divide-y divide-brand-soft/20">
                            {pendingSubmissions.map((sub) => (
                                <div key={sub.id} className="p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-black text-brand-dark uppercase">{sub.students?.full_name}</p>
                                            <p className="text-[9px] text-brand font-bold uppercase">Class {sub.students?.class_name}</p>
                                        </div>
                                        <p className="text-sm font-black text-brand">₹{sub.amount_paid}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {sub.fee_types?.split(',').map((t) => (
                                                <span key={t} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[8px] uppercase">{t}</span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-500">UTR: {sub.utr_number}</p>
                                        <a href={sub.proof_url} target="_blank" className="text-brand underline text-[10px] font-bold uppercase block pt-1">View Receipt Image</a>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="bg-green-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                                            <FiCheck /> Approve
                                        </button>
                                        <button className="border border-rose-200 text-rose-500 py-2.5 rounded-xl font-black text-[10px] uppercase">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* FULLY RESPONSIVE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3.5rem] w-full max-w-5xl overflow-hidden border border-brand-soft shadow-2xl max-h-[95vh] flex flex-col">
                        {/* Modal Header - Sticky */}
                        <div className="p-6 sm:p-8 lg:p-10 flex items-center justify-between border-b border-slate-100 bg-white">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-brand-dark uppercase tracking-tight">New Scanner</h2>
                                <p className="text-slate-400 text-[9px] sm:text-xs font-bold uppercase mt-1 italic">Setup class & bank details</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-brand-soft text-brand rounded-2xl hover:bg-brand transition-all">
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-6 sm:p-10 overflow-y-auto">
                            <form className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                                    {/* Left Column: QR & Classes */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Scanner QR Code</label>
                                            <div className="relative group h-[200px] sm:h-[250px] flex">
                                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className="w-full border-2 border-dashed border-brand-soft rounded-3xl p-4 flex flex-col items-center justify-center bg-brand-soft/5">
                                                    <FiUpload size={24} className="text-brand mb-2" />
                                                    <p className="text-[11px] font-bold text-brand-dark uppercase text-center">Tap to Upload QR Image</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Assign Classes</label>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {/* Map classes here... using smaller text on mobile */}
                                                {['1A', '1B', '2A', '2B', '3A', '3B'].map(cls => (
                                                    <button key={cls} type="button" className="p-2 sm:p-3 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase border bg-white border-slate-100">
                                                        {cls}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Bank Form */}
                                    <div className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-brand-soft/30 space-y-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Bank Details</h3>
                                            <FiShield className="text-brand opacity-20" size={24} />
                                        </div>
                                        <div className="space-y-4">
                                            {/* Use your Field component here, ensuring it styles inputs as w-full */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Bank Name</label>
                                                <input className="w-full p-3 rounded-xl border border-white bg-white text-xs shadow-sm focus:border-brand outline-none" placeholder="e.g. HDFC Bank" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Account Number</label>
                                                <input className="w-full p-3 rounded-xl border border-white bg-white text-xs shadow-sm focus:border-brand outline-none" placeholder="000000000000" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">IFSC</label>
                                                    <input className="w-full p-3 rounded-xl border border-white bg-white text-xs shadow-sm" placeholder="HDFC000123" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Branch</label>
                                                    <input className="w-full p-3 rounded-xl border border-white bg-white text-xs shadow-sm" placeholder="City Name" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-brand text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black uppercase text-xs sm:text-sm shadow-xl shadow-brand/40"
                                    >
                                        Register Scanner
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


            {viewDetail && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-lg overflow-hidden border border-brand-soft shadow-2xl">
                        <div className="p-10 text-center space-y-6">
                            <h3 className="text-[10px] font-black text-brand uppercase tracking-widest">Active Scanner Profile</h3>
                            <div className="flex flex-wrap justify-center gap-1">
                                {viewDetail.class_name.map((c: string) => (
                                    <span key={c} className="bg-brand text-white text-[9px] px-2 py-1 rounded font-bold uppercase">{c}</span>
                                ))}
                            </div>

                            {viewDetail.qr_url && (
                                <div className="relative inline-block group">
                                    <img src={viewDetail.qr_url} className="w-56 h-56 mx-auto rounded-3xl border-4 border-brand shadow-xl" alt="Scanner" />
                                </div>
                            )}

                            <div className="text-left bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-2">
                                <p className="text-[9px] font-black text-brand-light uppercase tracking-widest mb-2">Settlement Account</p>
                                <p className="text-sm font-black text-slate-800 uppercase">{viewDetail.account_holder}</p>
                                <p className="text-xs text-slate-500 font-bold">{viewDetail.bank_name} • {viewDetail.bank_branch}</p>
                                <div className="pt-2 flex justify-between items-center border-t border-slate-200 mt-2">
                                    <p className="text-[10px] font-mono text-brand font-black">{viewDetail.account_number}</p>
                                    <p className="text-[10px] font-mono text-brand font-black">{viewDetail.ifsc_code}</p>
                                </div>
                            </div>

                            <button onClick={() => setViewDetail(null)} className="w-full py-4 bg-brand text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-brand-dark transition-all">Dismiss Detail</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black text-brand-light uppercase ml-3 tracking-widest">{label}</label>
            <input
                required
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-white border border-slate-200 p-4 rounded-2xl outline-none font-bold text-slate-700 text-sm focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-slate-300"
            />
        </div>
    )
}