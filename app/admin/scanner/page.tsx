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
const PRE_PRIMARY = ['Pre-KG', 'LKG', 'UKG'];
const GRADES = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
const SECTIONS = ['A', 'B', 'C', 'D'];

// Create the combined list: ["Pre-KG A", "Pre-KG B", ..., "10D"]
const ALL_CLASSES = [...PRE_PRIMARY, ...GRADES].flatMap(cls =>
    SECTIONS.map(sec => `${cls} ${sec}`)
);
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
        <div className="max-w-8xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
            <Toaster position="top-right" />

            {/* HEADER SECTION */}
            <header className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 px-4 py-4 sm:px-8 sm:py-5 rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
                    <div className="text-center sm:text-left">
                        <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase leading-tight">Payment Hub</h1>
                        <p className="text-[8px] sm:text-[9px] font-bold text-brand uppercase tracking-widest opacity-80">Finance Administration</p>
                    </div>

                    {/* TOGGLE TABS */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('setup')}
                            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'setup' ? 'bg-brand text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Setup
                        </button>
                        <button
                            onClick={() => setActiveTab('verify')}
                            className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'verify' ? 'bg-brand text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'}`}
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
                        className="w-full md:w-auto bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                    >
                        <FiPlus /> Add Scanner
                    </button>
                )}
            </header>

            {/* CONTENT AREA */}
            <main>
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl dark:shadow-none">
                    {activeTab === 'setup' ? (
                        /* SETUP TABLE */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                                        <th className="p-6">Assigned Classes</th>
                                        <th className="p-6">Bank Info</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {configs.map((conf) => (
                                        <tr key={conf.id} className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-6">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {conf.class_name?.map((c: string) => (
                                                        <span key={c} className="bg-brand/10 text-brand text-[9px] px-2 py-1 rounded font-black border border-brand/20">{c}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-slate-900 dark:text-white font-black">{conf.bank_name}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">{conf.account_number}</p>
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button onClick={() => setViewDetail(conf)} className="p-2 bg-slate-100 dark:bg-slate-800 text-brand rounded-lg hover:bg-brand hover:text-white transition-all border border-slate-200 dark:border-slate-700"><FiEye /></button>
                                                <button className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"><FiTrash2 /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* VERIFICATION TABLE */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                                        <th className="p-6">Student</th>
                                        <th className="p-6">Fees & UTR</th>
                                        <th className="p-6">Amount</th>
                                        <th className="p-6">Proof</th>
                                        <th className="p-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {pendingSubmissions.map((sub) => (
                                        <tr key={sub.id} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-6">
                                                <p className="uppercase text-slate-900 dark:text-white font-black tracking-wide">{sub.students?.full_name}</p>
                                                <p className="text-[9px] text-brand uppercase mt-0.5 font-bold">Class {sub.students?.class_name}</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    {sub.fee_types?.split(',').map((t: string) => (
                                                        <span key={t} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[8px] uppercase border border-slate-200 dark:border-slate-700">{t}</span>
                                                    ))}
                                                </div>
                                                <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500">UTR: {sub.utr_number}</p>
                                            </td>
                                            <td className="p-6 font-black text-brand text-sm">₹{sub.amount_paid}</td>
                                            <td className="p-6">
                                                <a href={sub.proof_url} target="_blank" className="text-brand hover:text-brand-dark underline text-[9px] uppercase flex items-center gap-1 transition-colors"><FiExternalLink /> View</a>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-all"><FiCheck /></button>
                                                    <button className="border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white p-2 rounded-lg transition-all"><FiX /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL SECTION - Refactored for Dual Mode */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
                    <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3.5rem] w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors">
                        <div className="p-6 sm:p-8 lg:p-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Scanner</h2>
                                <p className="text-slate-500 text-[9px] sm:text-xs font-bold uppercase mt-1 italic">Setup class & bank details</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-white dark:bg-slate-800 text-brand rounded-2xl hover:bg-brand hover:text-white shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-6 sm:p-10 overflow-y-auto bg-white dark:bg-slate-900">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                                    <div className="space-y-8">
                                       <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 dark:text-brand-light uppercase tracking-widest ml-1">Scanner QR Code</label>
    <div className="relative group h-[200px] flex">
        <input
            type="file"
            accept="image/*"
            onChange={(e) => {
                if (e.target.files?.[0]) {
                    setQrFile(e.target.files[0])
                }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50 transition-all overflow-hidden">
            {qrFile ? (
                <img 
                    src={URL.createObjectURL(qrFile)} 
                    alt="Preview" 
                    className="h-full w-full object-contain rounded-xl"
                />
            ) : (
                <>
                    <FiUpload size={24} className="text-brand mb-2" />
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase text-center">Tap to Upload QR Image</p>
                </>
            )}
        </div>
    </div>
</div>

                                        {/* CLASSES GRID */}
                                        <div className="space-y-3">

                                            {/* Label + Select All Button */}
                                            {/* Label + Select All Button */}
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-brand-light uppercase tracking-widest">
                                                    Assign Classes
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const allSelected = selectedClasses.length === ALL_CLASSES.length
                                                        setSelectedClasses(allSelected ? [] : [...ALL_CLASSES])
                                                    }}
                                                    className="text-[9px] font-bold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-soft hover:text-brand transition"
                                                >
                                                    {selectedClasses.length === ALL_CLASSES.length ? "Deselect All" : "Select All"}
                                                </button>
                                            </div>

                                            {/* Classes Grid */}
                                            <div className="grid grid-cols-5 gap-2 max-h-[90px] overflow-y-auto pr-2 custom-scrollbar">
                                                {ALL_CLASSES.map((cls) => (
                                                    <button
                                                        key={cls}
                                                        type="button"
                                                        onClick={() => toggleClass(cls)}
                                                        className={`px-2 py-2 rounded-lg text-[9px] font-bold uppercase border transition-all
      ${selectedClasses.includes(cls)
                                                                ? "bg-brand border-brand text-white"
                                                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand"
                                                            }`}
                                                    >
                                                        {cls}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-5 shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-[10px] font-black text-brand uppercase tracking-widest">Bank Details</h3>
                                            <FiShield className="text-brand opacity-40" size={24} />
                                        </div>
                                        <div className="space-y-4">
                                            {/* Bank Name */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Bank Name</label>
                                                <input
                                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 text-xs shadow-sm focus:border-brand outline-none transition-all"
                                                    placeholder="e.g. HDFC Bank"
                                                    value={formData.bank_name}
                                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            {/* Account Holder Name */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Account Holder Name</label>
                                                <input
                                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 text-xs shadow-sm focus:border-brand outline-none transition-all"
                                                    placeholder="e.g. SRI PAVAN EDUCATIONAL TRUST"
                                                    value={formData.account_holder}
                                                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            {/* Account Number */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Account Number</label>
                                                <input
                                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 text-xs shadow-sm focus:border-brand outline-none transition-all"
                                                    placeholder="000000000000"
                                                    value={formData.account_number}
                                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* IFSC */}
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">IFSC</label>
                                                    <input
                                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 text-xs shadow-sm focus:border-brand outline-none"
                                                        placeholder="HDFC000123"
                                                        value={formData.ifsc_code}
                                                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                {/* Branch */}
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Branch</label>
                                                    <input
                                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 text-xs shadow-sm focus:border-brand outline-none"
                                                        placeholder="City Name"
                                                        value={formData.bank_branch}
                                                        onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-brand text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black uppercase text-xs sm:text-sm shadow-xl shadow-brand/40 hover:brightness-110 active:scale-[0.98] transition-all"
                                    >
                                        Register Scanner
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


            {/* VIEW DETAIL MODAL */}
{viewDetail && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-black uppercase text-slate-900 dark:text-white">Scanner Configuration</h3>
                <button onClick={() => setViewDetail(null)} className="text-slate-400 hover:text-rose-500"><FiX size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
                <div className="flex justify-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                    <img src={viewDetail.qr_url} alt="QR Code" className="max-h-48 rounded-lg shadow-md" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div>
                        <p className="text-slate-400 uppercase font-black">Bank Name</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{viewDetail.bank_name}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 uppercase font-black">Account Holder</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{viewDetail.account_holder}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-slate-400 uppercase font-black">Account Number / IFSC</p>
                        <p className="font-mono font-bold text-brand text-sm">{viewDetail.account_number} / {viewDetail.ifsc_code}</p>
                    </div>
                </div>
                <div className="pt-2">
                    <p className="text-slate-400 uppercase font-black text-[10px] mb-2">Linked Classes</p>
                    <div className="flex flex-wrap gap-1">
                        {viewDetail.class_name?.map((c: string) => (
                            <span key={c} className="bg-brand/10 text-brand px-2 py-1 rounded text-[9px] font-black">{c}</span>
                        ))}
                    </div>
                </div>
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