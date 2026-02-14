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
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <Toaster position="top-right" />

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
                            Setup Scanners
                        </button>
                        <button 
                            onClick={() => setActiveTab('verify')}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'verify' ? 'bg-brand text-white shadow-md' : 'text-brand-light hover:bg-white'}`}
                        >
                            Verify Payments 
                            {pendingSubmissions.length > 0 && <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[8px]">{pendingSubmissions.length}</span>}
                        </button>
                    </div>
                </div>

                {activeTab === 'setup' && (
                    <button onClick={() => setShowModal(true)} className="bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20">
                        Add New Scanner
                    </button>
                )}
            </header>

            {activeTab === 'setup' ? (
                <div className="bg-white rounded-[2.5rem] border border-brand-soft overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-brand-soft/20 border-b border-brand-soft">
                            <tr className="text-[10px] font-black uppercase text-brand-dark">
                                <th className="p-6">Assigned Classes</th>
                                <th className="p-6">Bank Account Info</th>
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
                                        <p className="text-brand-dark">{conf.bank_name}</p>
                                        <p className="text-[10px] opacity-50 font-mono">{conf.account_number}</p>
                                    </td>
                                    <td className="p-6 text-right space-x-2">
                                        <button onClick={() => setViewDetail(conf)} className="p-2 bg-brand-soft text-brand rounded-lg hover:bg-brand hover:text-white transition-all"><FiEye /></button>
                                        <button onClick={async () => { if(confirm("Delete this configuration?")) { await supabase.from('payment_configs').delete().eq('id', conf.id); fetchData(); }}} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-brand-soft overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-brand-soft/20 border-b border-brand-soft">
                            <tr className="text-[10px] font-black uppercase text-brand-dark">
                                <th className="p-6">Student & Class</th>
                                <th className="p-6">Fees Selected</th>
                                <th className="p-6">Amount Paid</th>
                                <th className="p-6">Proof</th>
                                <th className="p-6 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-soft/20">
                            {pendingSubmissions.map((sub) => (
                                <tr key={sub.id} className="text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                        <p className="uppercase text-brand-dark font-black">{sub.students?.full_name}</p>
                                        <p className="text-[9px] text-brand uppercase mt-0.5">Class {sub.students?.class_name} • Roll {sub.students?.roll_number}</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-wrap gap-1">
                                            {sub.fee_types?.split(',').map((t: string) => (
                                                <span key={t} className="bg-slate-100 px-2 py-0.5 rounded text-[8px] uppercase border border-slate-200">{t}</span>
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-mono mt-1.5 text-slate-400 italic">UTR: {sub.utr_number}</p>
                                    </td>
                                    <td className="p-6 font-black text-brand text-sm">₹{sub.amount_paid}</td>
                                    <td className="p-6">
                                        <a href={sub.proof_url} target="_blank" className="flex items-center gap-1 text-brand hover:text-brand-dark underline text-[9px] uppercase transition-colors">
                                            <FiExternalLink /> View Receipt
                                        </a>
                                    </td>
                                    <td className="p-6 text-right flex justify-end gap-2">
                                        <button onClick={() => handleApprove(sub)} className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-green-600 transition-all shadow-md text-[10px] font-black uppercase">
                                            <FiCheck /> Approve
                                        </button>
                                        <button onClick={() => handleReject(sub.id)} className="bg-white border border-rose-200 text-rose-500 px-4 py-2 rounded-lg hover:bg-rose-50 transition-all text-[10px] font-black uppercase">
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-6xl overflow-hidden border border-brand-soft shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-8 lg:p-12 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Add New Scanner</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Note: Classes highlighted in red are already assigned to other scanners.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 bg-brand-soft text-brand rounded-2xl hover:bg-brand hover:text-white transition-all">
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    <div className="lg:col-span-5 space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-brand-light uppercase tracking-widest ml-1">Scanner QR Code</label>
                                            <div className="relative group h-[280px] flex">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="w-full border-2 border-dashed border-brand-soft rounded-[2.5rem] p-4 flex flex-col items-center justify-center bg-brand-soft/5 group-hover:bg-brand-soft/10 transition-all overflow-hidden">
                                                    {qrFile ? (
                                                        <div className="relative w-full h-full flex flex-col items-center justify-center space-y-3">
                                                            <img 
                                                                src={URL.createObjectURL(qrFile)} 
                                                                alt="Preview" 
                                                                className="max-h-[200px] object-contain rounded-xl shadow-lg"
                                                            />
                                                            <span className="text-[10px] font-bold text-brand uppercase bg-white px-4 py-1.5 rounded-full shadow-sm border border-brand-soft">Replace Image</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="p-5 bg-white rounded-2xl shadow-sm mb-3 text-brand"><FiUpload size={24} /></div>
                                                            <p className="text-[11px] font-bold text-brand-dark uppercase">Drop QR Image Here</p>
                                                            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-tighter">Click or drag to upload</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-black text-brand-light uppercase tracking-widest">Assign Classes</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const available = CLASS_OPTIONS.filter(c => !assignedClasses.includes(c));
                                                        if(selectedClasses.length === available.length) setSelectedClasses([]);
                                                        else setSelectedClasses([...available]);
                                                    }}
                                                    className="text-[10px] font-black text-brand uppercase hover:underline"
                                                >
                                                    Select All Available
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {CLASS_OPTIONS.map(cls => {
                                                    const isUsed = assignedClasses.includes(cls);
                                                    return (
                                                        <button
                                                            key={cls}
                                                            type="button"
                                                            disabled={isUsed}
                                                            onClick={() => toggleClass(cls)}
                                                            className={`p-3 rounded-xl text-[10px] font-bold uppercase border transition-all relative ${
                                                                isUsed 
                                                                ? 'bg-rose-50 border-rose-100 text-rose-300 cursor-not-allowed opacity-60' 
                                                                : selectedClasses.includes(cls)
                                                                    ? 'bg-brand text-white border-brand shadow-md' 
                                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-brand-soft'
                                                            }`}
                                                        >
                                                            {cls}
                                                            {isUsed && <span className="absolute -top-1 -right-1 text-[7px] bg-rose-500 text-white px-1 rounded">Taken</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-7 bg-slate-50/80 p-10 rounded-[3.5rem] border border-brand-soft/30 space-y-6">
                                        <div className="space-y-1 mb-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-[11px] font-black text-brand-dark uppercase tracking-[0.2em]">Settlement Account</h3>
                                                <p className="text-[10px] text-slate-400 font-medium">Verified information required for fee transfers.</p>
                                            </div>
                                            <FiShield className="text-brand opacity-20" size={32} />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-6">
                                            <Field 
                                                label="Bank Name" 
                                                placeholder="e.g. State Bank of India / HDFC"
                                                value={formData.bank_name} 
                                                onChange={(v: string) => setFormData({ ...formData, bank_name: v })} 
                                            />
                                            <Field 
                                                label="Account Holder Name" 
                                                placeholder="Enter full name as per Passbook"
                                                value={formData.account_holder} 
                                                onChange={(v: string) => setFormData({ ...formData, account_holder: v })} 
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Field 
                                                    label="Account Number" 
                                                    placeholder="00001111222233"
                                                    value={formData.account_number} 
                                                    onChange={(v: string) => setFormData({ ...formData, account_number: v })} 
                                                />
                                                <Field 
                                                    label="IFSC Code" 
                                                    placeholder="SBIN0001234"
                                                    value={formData.ifsc_code} 
                                                    onChange={(v: string) => setFormData({ ...formData, ifsc_code: v })} 
                                                />
                                            </div>
                                            <Field 
                                                label="Bank Branch" 
                                                placeholder="e.g. Main Market, New Delhi"
                                                value={formData.bank_branch} 
                                                onChange={(v: string) => setFormData({ ...formData, bank_branch: v })} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center pt-6 space-y-4">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className="w-full max-w-md bg-brand text-white py-5 rounded-[2rem] font-black uppercase text-sm shadow-2xl shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {isUploading ? 'Registering...' : 'Register Payment Scanner'}
                                    </button>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                        <FiAlertCircle /> Check details before saving
                                    </p>
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
    )
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