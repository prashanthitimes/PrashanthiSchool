'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  FiTrash2, FiAlertTriangle, FiDatabase, FiCheckSquare, 
  FiSquare, FiRefreshCw 
} from 'react-icons/fi'
import { toast, Toaster } from 'react-hot-toast'

// Keep the TABLE_GROUPS exactly as you have them
const TABLE_GROUPS = [
  {
    title: "Core Entities",
    description: "Primary records for the school. Warning: Deleting these will affect almost everything.",
    tables: [
      { id: 'students', label: 'Students Master Data' },
      { id: 'teachers', label: 'Teachers Master Data' },
      { id: 'subjects', label: 'Subjects List' },
    ]
  },
  {
    title: "Academic Records",
    description: "Daily operations, marks, and schedules.",
    tables: [
      { id: 'daily_attendance', label: 'Daily Attendance' },
      { id: 'exam_marks', label: 'Exam Marks Ledger' },
      { id: 'exam_syllabus', label: 'Exam Syllabus' },
      { id: 'exam_timetables', label: 'Exam Time Tables' },
      { id: 'exams', label: 'Exams List' },
      { id: 'homework', label: 'Homework Assignments' },
      { id: 'timetable', label: 'Weekly Class Timetable' },
    ]
  },
  {
    title: "Finance & Fees",
    description: "All transaction and fee configuration records.",
    tables: [
      { id: 'student_fees', label: 'Student Fee Records' },
      { id: 'student_payments', label: 'Payment Transactions' },
      { id: 'fee_submissions', label: 'Fee Submissions (UTR)' },
      { id: 'class_fees', label: 'Class-wise Fee Setup' },
      { id: 'fee_types', label: 'Fee Type Categories' },
    ]
  },
  {
    title: "Logistics & Comms",
    description: "Transport, notices, and media.",
    tables: [
      { id: 'transport_assignments', label: 'Student Bus Allotments' },
      { id: 'transport_routes', label: 'Transport Routes' },
      { id: 'notices_circulars', label: 'Notices & Circulars' },
      { id: 'gallery', label: 'Photo Gallery' },
    ]
  }
]

export default function DataManager() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) ? prev.filter(t => t !== tableId) : [...prev, tableId]
    )
  }

  const selectGroup = (tableIds: string[]) => {
    const allIn = tableIds.every(id => selectedTables.includes(id))
    if (allIn) {
      setSelectedTables(prev => prev.filter(id => !tableIds.includes(id)))
    } else {
      setSelectedTables(prev => Array.from(new Set([...prev, ...tableIds])))
    }
  }

  // --- UPDATED DELETE LOGIC ---
  const handleClearData = async () => {
    if (confirmText !== 'DELETE') {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)
    const loadingToast = toast.loading(`Initializing wipe of ${selectedTables.length} tables...`)

    try {
      /**
       * ORDER MATTERS: We must delete child records (Attendance, Marks, Payments) 
       * before we delete Parent records (Students, Teachers). 
       * This list ensures "students" and "teachers" are cleared LAST.
       */
      const parents = ['students', 'teachers', 'subjects', 'exams', 'transport_routes', 'fee_types'];
      
      const sortedTables = [...selectedTables].sort((a, b) => {
        if (parents.includes(a) && !parents.includes(b)) return 1;
        if (!parents.includes(a) && parents.includes(b)) return -1;
        return 0;
      });

      for (const table of sortedTables) {
        toast.loading(`Clearing ${table}...`, { id: loadingToast });
        
        // Using .neq on a common field is the standard way to clear all rows in Supabase
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('created_at', '1970-01-01T00:00:00Z'); 

        if (error) {
           console.error(`Error in ${table}:`, error);
           throw new Error(`Table "${table}" failed: ${error.message}`);
        }
      }

      toast.success("All selected tables cleared successfully!", { id: loadingToast })
      setSelectedTables([])
      setConfirmText('')
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-16 max-w-8xl mx-auto min-h-screen pb-20">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-brand-soft shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiDatabase className="text-brand" /> Database Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Select specific tables to wipe data. Action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setSelectedTables([])}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
           >
             Clear Selection
           </button>
        </div>
      </div>

      {/* Warning Box */}
      <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-4">
        <FiAlertTriangle className="text-red-500 mt-1 shrink-0" size={24} />
        <div>
          <h3 className="text-red-800 dark:text-red-300 font-bold">DANGER ZONE</h3>
          <p className="text-red-700 dark:text-red-400/80 text-sm">
            Clearing tables will permanently delete all records. This UI automatically sorts deletions to handle database dependencies.
          </p>
        </div>
      </div>

      {/* Table Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TABLE_GROUPS.map((group) => (
          <div key={group.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white">{group.title}</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{group.description}</p>
              </div>
              <button 
                onClick={() => selectGroup(group.tables.map(t => t.id))}
                className="text-brand text-xs font-bold hover:underline"
              >
                Toggle Group
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {group.tables.map((table) => {
                const isSelected = selectedTables.includes(table.id)
                return (
                  <label 
                    key={table.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
                      ${isSelected 
                        ? 'border-brand bg-brand-soft/30 dark:bg-brand/10' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-brand-soft'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => { e.preventDefault(); toggleTable(table.id); }}>
                        {isSelected ? <FiCheckSquare className="text-brand" size={20} /> : <FiSquare className="text-slate-400" size={20} />}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-brand-dark dark:text-brand-light' : 'text-slate-600 dark:text-slate-300'}`}>
                        {table.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{table.id}</span>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected} 
                      onChange={() => toggleTable(table.id)} 
                    />
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      {selectedTables.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white dark:bg-slate-900 border-2 border-brand shadow-2xl rounded-2xl p-4 z-50 animate-in slide-in-from-bottom-10">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Selected <span className="text-brand">{selectedTables.length} tables</span> for clearing.
              </p>
              <p className="text-xs text-slate-500">Type <span className="font-bold text-red-600 underline">DELETE</span> to enable button.</p>
            </div>
            
            <input 
              type="text" 
              placeholder="Confirm 'DELETE'"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="px-4 py-2 border rounded-lg text-sm w-32 focus:ring-2 focus:ring-brand outline-none dark:bg-slate-800 dark:border-slate-700 font-bold"
            />

            <button
              onClick={handleClearData}
              disabled={isDeleting || confirmText !== 'DELETE'}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all
                ${confirmText === 'DELETE' 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {isDeleting ? <FiRefreshCw className="animate-spin" /> : <FiTrash2 />}
              {isDeleting ? 'Processing...' : 'Clear Selected Tables'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}