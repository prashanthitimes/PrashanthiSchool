'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
    FiPlus, FiX, FiUploadCloud, FiTrash2, FiSave,
    FiCamera, FiEye, FiCheckSquare, FiSquare, FiShield, FiList, FiCheck, FiExternalLink
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
    const assignedClasses = configs.flatMap(conf => conf.class_name || []);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])

    const [formData, setFormData] = useState({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        bank_branch: '',
        account_holder: '',
        qr_url: ''
    })

    const fetchData = async () => {
        setLoading(true)
        // Fetch Setup Configs
        const { data: configsData } = await supabase.from('payment_configs').select('*').order('created_at', { ascending: false })
        setConfigs(configsData || [])

        // Fetch Pending Submissions with Student Details
        const { data: submissionsData } = await supabase
            .from('fee_submissions')
            .select(`*, students(full_name, class_name, roll_number)`)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
        
        setPendingSubmissions(submissionsData || [])
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    // --- APPROVAL LOGIC ---
  const handleApprove = async (submission: any) => {
    const loader = toast.loading("Splitting fees and updating ledger...");
    try {
        // 1. Split the comma-separated string into an array
        // Example: "Tuition Fee, Exam Fee" -> ["Tuition Fee", "Exam Fee"]
        const feeTypesArray = submission.fee_types.split(',').map((item: string) => item.trim());

        // 2. Prepare multiple rows for insertion
        // We divide the total amount by the number of fee types 
        // OR you can handle custom logic if amounts are specific
        const amountPerType = submission.amount_paid / feeTypesArray.length;

        const insertData = feeTypesArray.map((type: string) => ({
            student_id: submission.student_id,
            student_name: submission.students?.full_name,
            class: submission.students?.class_name,
            roll_no: submission.students?.roll_number,
            fee_type: type, // Now saving "Tuition Fee" then "Exam Fee" separately
            paid_amount: amountPerType, 
            total_amount: amountPerType,
            utr_number: submission.utr_number,
            payment_method: "UPI/Scanner",
            remarks: "Approved via Admin Scanner Panel",
            created_at: new Date().toISOString()
        }));

        // 3. Insert all rows at once into student_fees
        const { error: insertError } = await supabase
            .from('student_fees')
            .insert(insertData);

        if (insertError) throw insertError;

        // 4. Delete the original submission from pending
        const { error: deleteError } = await supabase
            .from('fee_submissions')
            .delete()
            .eq('id', submission.id);

        if (deleteError) throw deleteError;

        toast.success(`Verified! Created ${feeTypesArray.length} separate records.`, { id: loader });
        fetchData(); // Refresh the list
    } catch (err: any) {
        toast.error(err.message, { id: loader });
        console.error("Approval Error:", err);
    }
};
    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this payment?")) return
        await supabase.from('fee_submissions').delete().eq('id', id)
        toast.success("Submission Rejected")
        fetchData()
    }

    // Existing Setup Logic...
    const toggleClass = (cls: string) => {
        setSelectedClasses(prev => prev.includes(cls) ? prev.filter(i => i !== cls) : [...prev, cls])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedClasses.length === 0) return toast.error("Select at least one class")
        setIsUploading(true)
        const loader = toast.loading("Saving...")
        try {
            let finalUrl = formData.qr_url
            if (qrFile) {
                const fileName = `qrs/multi-class-${Date.now()}`
                await supabase.storage.from('payment-assets').upload(fileName, qrFile)
                const { data: { publicUrl } } = supabase.storage.from('payment-assets').getPublicUrl(fileName)
                finalUrl = publicUrl
            }
            await supabase.from('payment_configs').upsert({ ...formData, class_name: selectedClasses, qr_url: finalUrl })
            toast.success("Setup Saved", { id: loader })
            setShowModal(false); setSelectedClasses([]); setQrFile(null); fetchData();
        } catch (error: any) { toast.error(error.message, { id: loader }) }
        finally { setIsUploading(false) }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <Toaster position="top-right" />

            {/* --- TOP TABS --- */}
            <header className="flex flex-wrap items-center justify-between bg-white px-8 py-5 rounded-[2rem] border border-brand-soft shadow-sm gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-lg font-black text-brand-dark uppercase leading-tight">Payment Hub</h1>
                        <p className="text-[9px] font-bold text-brand-light uppercase tracking-widest">Finance Administration</p>
                    </div>
                    
                    <div className="flex bg-brand-soft/30 p-1 rounded-xl border border-brand-soft">
                        <button 
                            onClick={() => setActiveTab('setup')}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'setup' ? 'bg-brand text-white shadow-md' : 'text-brand-light hover:bg-white'}`}
                        >
                            <FiPlus /> Setup Scanners
                        </button>
                        <button 
                            onClick={() => setActiveTab('verify')}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'verify' ? 'bg-brand text-white shadow-md' : 'text-brand-light hover:bg-white'}`}
                        >
                            <FiShield /> Verify Payments 
                            {pendingSubmissions.length > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{pendingSubmissions.length}</span>}
                        </button>
                    </div>
                </div>

                {activeTab === 'setup' && (
                    <button onClick={() => setShowModal(true)} className="bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20">
                        Add New Scanner
                    </button>
                )}
            </header>

            {/* --- TAB CONTENT: SETUP --- */}
            {activeTab === 'setup' ? (
                <div className="bg-white rounded-[2.5rem] border border-brand-soft overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-brand-soft/20 border-b border-brand-soft">
                            <tr className="text-[10px] font-black uppercase text-brand-dark">
                                <th className="p-6">Classes</th>
                                <th className="p-6">Bank Info</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-soft/20">
                            {configs.map((conf) => (
                                <tr key={conf.id} className="text-xs font-bold text-slate-600">
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                            {conf.class_name?.map((c: string) => (
                                                <span key={c} className="bg-brand-soft text-brand text-[9px] px-2 py-1 rounded font-black">{c}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p>{conf.bank_name}</p>
                                        <p className="text-[10px] opacity-50 font-mono">{conf.account_number}</p>
                                    </td>
                                    <td className="p-6 text-right space-x-2">
                                        <button onClick={() => setViewDetail(conf)} className="p-2 bg-brand-soft text-brand rounded-lg"><FiEye /></button>
                                        <button onClick={async () => { if(confirm("Delete?")) { await supabase.from('payment_configs').delete().eq('id', conf.id); fetchData(); }}} className="p-2 bg-rose-50 text-rose-500 rounded-lg"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* --- TAB CONTENT: VERIFY --- */
                <div className="bg-white rounded-[2.5rem] border border-brand-soft overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-brand-soft/20 border-b border-brand-soft">
                            <tr className="text-[10px] font-black uppercase text-brand-dark">
                                <th className="p-6">Student & Class</th>
                                <th className="p-6">Fees Selected</th>
                                <th className="p-6">Amount</th>
                                <th className="p-6">Proof</th>
                                <th className="p-6 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-soft/20">
                            {pendingSubmissions.map((sub) => (
                                <tr key={sub.id} className="text-[11px] font-bold text-slate-700 hover:bg-slate-50">
                                    <td className="p-6">
                                        <p className="uppercase">{sub.students?.full_name}</p>
                                        <p className="text-[9px] text-brand uppercase">Class {sub.students?.class_name} • Roll {sub.students?.roll_number}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-1">
                                            {sub.fee_types?.split(',').map((t: string) => (
                                                <span key={t} className="bg-slate-100 px-2 py-0.5 rounded text-[8px] uppercase">{t}</span>
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-mono mt-1 text-slate-400 italic">UTR: {sub.utr_number}</p>
                                    </td>
                                    <td className="p-6 font-black text-brand text-sm">₹{sub.amount_paid}</td>
                                    <td className="p-6">
                                        <a href={sub.proof_url} target="_blank" className="flex items-center gap-1 text-brand underline text-[9px] uppercase">
                                            <FiExternalLink /> View Receipt
                                        </a>
                                    </td>
                                    <td className="p-6 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleApprove(sub)}
                                            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-green-600 transition-all shadow-md"
                                        >
                                            <FiCheck /> Approve
                                        </button>
                                        <button 
                                            onClick={() => handleReject(sub.id)}
                                            className="bg-white border border-rose-200 text-rose-500 px-4 py-2 rounded-lg hover:bg-rose-50 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingSubmissions.length === 0 && (
                                <tr><td colSpan={5} className="p-20 text-center text-[10px] font-black uppercase opacity-30">No payments waiting for verification</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VIEW MODAL */}
            {viewDetail && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden border border-brand-soft shadow-2xl">
                        <div className="p-10 text-center space-y-6">
                            <div className="flex flex-wrap justify-center gap-1">
                                {viewDetail.class_name.map((c: string) => (
                                    <span key={c} className="bg-brand text-white text-[9px] px-2 py-1 rounded font-bold uppercase">{c}</span>
                                ))}
                            </div>

                            {viewDetail.qr_url && <img src={viewDetail.qr_url} className="w-48 h-48 mx-auto rounded-3xl border-4 border-brand-accent" alt="Scanner" />}

                            <div className="text-left bg-brand-accent/30 p-6 rounded-3xl space-y-2">
                                <p className="text-xs font-bold text-brand-dark underline">Bank Info</p>
                                <p className="text-sm font-bold text-slate-800">{viewDetail.account_holder}</p>
                                <p className="text-xs text-slate-600 font-medium">{viewDetail.bank_name} - {viewDetail.bank_branch}</p>
                                <p className="text-sm font-black text-brand tracking-tighter mt-2">{viewDetail.account_number} / {viewDetail.ifsc_code}</p>
                            </div>

                            <button onClick={() => setViewDetail(null)} className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black uppercase text-xs">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function Field({ label, value, onChange }: any) {
    return (
        <div className="space-y-1">
            <label className="text-[9px] font-black text-brand-light uppercase ml-2 tracking-widest">{label}</label>
            <input required value={value} onChange={e => onChange(e.target.value)} className="w-full bg-brand-soft/20 border border-brand-soft p-4 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-brand-light transition-all" />
        </div>
    )
}