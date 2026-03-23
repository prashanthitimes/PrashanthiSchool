'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Layers, CreditCard, Loader2, IndianRupee } from 'lucide-react'
import { toast, Toaster } from 'sonner'

export default function FeeManagementSystem() {
  const [activeTab, setActiveTab] = useState<'categories' | 'allotment'>('categories')
  const [feeTypes, setFeeTypes] = useState<any[]>([])
  const [classFees, setClassFees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [allotmentForm, setAllotmentForm] = useState({ class: '', fee_type: '', amount: '' })

  // Data Arrays
  const gradeLevels = ["Pre-KG", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    const { data: types } = await supabase.from('fee_types').select('*').order('name')
    const { data: allot } = await supabase.from('class_fees').select('*').order('class')
    if (types) setFeeTypes(types)
    if (allot) setClassFees(allot)
    setLoading(false)
  }

  async function handleAddCategory() {
    if (!categoryForm.name) return toast.error("Category name is required")
    const { error } = await supabase.from('fee_types').insert([categoryForm])
    if (error) toast.error(error.message)
    else {
      toast.success("Category Created")
      setCategoryForm({ name: '', description: '' })
      fetchInitialData()
    }
  }

  async function handleAddAllotment() {
    const { class: cls, fee_type, amount } = allotmentForm
    if (!cls || !fee_type || !amount) {
      return toast.error("Please fill all fields")
    }

    const { error } = await supabase.from('class_fees').insert([{
      class: cls,
      fee_type: fee_type,
      amount: parseFloat(amount)
    }])

    if (error) {
      if (error.code === '23505') toast.error(`Already exists for ${cls}`)
      else toast.error(error.message)
    } else {
      toast.success(`Fee set for ${cls}`)
      setAllotmentForm({ class: '', fee_type: '', amount: '' })
      fetchInitialData()
    }
  }

  async function deleteItem(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) toast.error("Delete failed")
    else {
      toast.success("Removed")
      fetchInitialData()
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen p-4 md:p-10 space-y-8 transition-all">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row items-center justify-between bg-white dark:bg-slate-900 px-8 py-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fdf2f9] dark:bg-pink-900/20 text-[#a63d93] rounded-2xl flex items-center justify-center shadow-inner">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Fee Structure</h1>
            <p className="text-[10px] font-bold text-[#a63d93] uppercase tracking-[0.2em]">Configure School Finances</p>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button onClick={() => setActiveTab('categories')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? "bg-white dark:bg-slate-700 text-[#a63d93] shadow-md" : "text-slate-400 hover:text-slate-600"}`}>
            Categories
          </button>
          <button onClick={() => setActiveTab('allotment')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'allotment' ? "bg-white dark:bg-slate-700 text-[#a63d93] shadow-md" : "text-slate-400 hover:text-slate-600"}`}>
            Class Allotment
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM PANEL */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl border-b-8 border-b-[#a63d93]">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">{activeTab === 'categories' ? 'Create New Category' : 'Assign Fee to Class'}</h2>
            
            {activeTab === 'categories' ? (
              <div className="space-y-5">
                <div className="group">
                  <label className="label-style">Category Title</label>
                  <input className="soft-input" placeholder="e.g. Lab Fee" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
                </div>
                <div className="group">
                  <label className="label-style">Details</label>
                  <textarea className="soft-input min-h-[100px]" placeholder="Explain this fee..." value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
                </div>
                <button onClick={handleAddCategory} className="premium-btn w-full mt-4">Save Category</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="label-style">Select Class</label>
                  <select className="soft-input" value={allotmentForm.class} onChange={e => setAllotmentForm({...allotmentForm, class: e.target.value})}>
                    <option value="">Choose Grade</option>
                    {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-style">Category</label>
                  <select className="soft-input" value={allotmentForm.fee_type} onChange={e => setAllotmentForm({...allotmentForm, fee_type: e.target.value})}>
                    <option value="">Select Category</option>
                    {feeTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-style">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input type="number" className="soft-input pl-10" placeholder="0.00" value={allotmentForm.amount} onChange={e => setAllotmentForm({...allotmentForm, amount: e.target.value})} />
                  </div>
                </div>
                <button onClick={handleAddAllotment} className="premium-btn w-full mt-4 !bg-slate-900">Finalize Allotment</button>
              </div>
            )}
          </div>
        </aside>

        {/* DATA PANEL */}
        <main className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="p-20 flex flex-col items-center gap-4 text-slate-300">
                <Loader2 className="animate-spin" size={40} />
                <span className="text-[10px] font-black uppercase tracking-widest">Syncing Records...</span>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="p-6">{activeTab === 'categories' ? 'Category' : 'Class'}</th>
                    <th className="p-6">{activeTab === 'categories' ? 'Description' : 'Fee Type'}</th>
                    <th className="p-6">{activeTab === 'categories' ? '' : 'Amount'}</th>
                    <th className="p-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {activeTab === 'categories' ? feeTypes.map(t => (
                    <tr key={t.id} className="hover:bg-[#fdf2f9]/20 transition-colors">
                      <td className="p-6 font-black text-slate-700 dark:text-slate-200 uppercase text-xs">{t.name}</td>
                      <td className="p-6 text-xs text-slate-400">{t.description || '---'}</td>
                      <td></td>
                      <td className="p-6 text-center">
                        <button onClick={() => deleteItem('fee_types', t.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )) : classFees.map(cf => (
                    <tr key={cf.id} className="hover:bg-[#fdf2f9]/20 transition-colors">
                      <td className="p-6">
                        <span className="bg-[#a63d93] text-white px-3 py-1.5 rounded-lg text-[9px] font-black tracking-tighter uppercase">{cf.class}</span>
                      </td>
                      <td className="p-6 text-[11px] font-bold text-slate-500 uppercase">{cf.fee_type}</td>
                      <td className="p-6 text-sm font-black text-slate-800 dark:text-slate-200">₹{cf.amount.toLocaleString()}</td>
                      <td className="p-6 text-center">
                        <button onClick={() => deleteItem('class_fees', cf.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .label-style { display: block; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; margin-left: 4px; letter-spacing: 0.1em; }
        .soft-input { border: 2px solid #f1f5f9; padding: 0.8rem 1.2rem; border-radius: 1.2rem; font-size: 13px; font-weight: 700; outline: none; width: 100%; transition: all 0.2s; color: #1e293b; background: #fff; }
        .dark .soft-input { background: #0f172a; border-color: #334155; color: #f1f5f9; }
        .soft-input:focus { border-color: #a63d93; background: #fdf2f9; }
        .premium-btn { background: #a63d93; color: white; padding: 1.2rem; border-radius: 1.5rem; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; transition: all 0.3s; box-shadow: 0 10px 20px -5px rgba(166, 61, 147, 0.3); }
        .premium-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(166, 61, 147, 0.4); }
      `}</style>
    </div>
  )
}