'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  Save, 
  FileSpreadsheet, 
  Search, 
  Loader2, 
  GraduationCap, 
  CheckCircle, 
  UserPlus, 
  ShieldCheck,
  UserX
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast, Toaster } from 'sonner'

// Updated Type to include 'Absent'
interface MarkRecord {
  student_id: string
  name: string
  roll_no: string
  db_id: string | null
  marks_obtained: string | number
  remarks: string
  status: 'Pass' | 'Fail' | 'Pending' | 'Absent'
  is_locked: boolean
}

interface Exam { id: string; exam_name: string; classes: any }
interface Subject { id: string; name: string }

export default function ExamMarksManager() {
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [marksData, setMarksData] = useState<MarkRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  // FILTER STATES
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')

  useEffect(() => {
    const loadFilters = async () => {
      setIsLoading(true)
      try {
        const { data: ex } = await supabase.from('exams').select('id, exam_name, classes').order('created_at', { ascending: false })
        const { data: sub } = await supabase.from('subjects').select('id, name').order('name')
        if (ex) setExams(ex)
        if (sub) setSubjects(sub)
      } catch (err) {
        toast.error("Failed to load setup data")
      } finally {
        setIsLoading(false)
      }
    }
    loadFilters()
  }, [])

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId)
    setSelectedClass('')
    setMarksData([])
    const exam = exams.find(x => x.id === examId)
    if (exam?.classes) {
      const classList = typeof exam.classes === 'string' ? JSON.parse(exam.classes) : exam.classes
      setAvailableClasses(Array.isArray(classList) ? classList : [])
    }
  }

  const fetchMarksheet = async () => {
    if (!selectedExamId || !selectedSubject || !selectedClass) {
      toast.error("Please select Exam, Class, and Subject")
      return
    }

    setIsFetching(true)
    try {
      const lastDashIndex = selectedClass.lastIndexOf('-')
      const classNamePart = selectedClass.substring(0, lastDashIndex)
      const sectionPart = selectedClass.substring(lastDashIndex + 1)
      const dbClassName = classNamePart.match(/^\d+$/) ? `${classNamePart}th` : classNamePart

      const [studentsRes, marksRes] = await Promise.all([
        supabase.from('students').select('id, full_name, roll_number').eq('class_name', dbClassName).eq('section', sectionPart),
        supabase.from('exam_marks').select('*').eq('exam_id', selectedExamId).eq('subject_id', selectedSubject)
      ])

      const formattedData: MarkRecord[] = (studentsRes.data || []).map(student => {
        const record = marksRes.data?.find(m => m.student_id === student.id)
        return {
          student_id: student.id,
          name: student.full_name,
          roll_no: student.roll_number,
          db_id: record?.id || null,
          marks_obtained: record?.status === 'Absent' ? '' : (record?.marks_obtained ?? ''),
          remarks: record?.remarks || '',
          status: (record?.status as any) || 'Pending',
          is_locked: !!record 
        }
      })

      setMarksData(formattedData)
      toast.success(`Registry loaded: ${formattedData.length} records`)
    } catch (error) {
      toast.error("Error retrieving registry")
    } finally {
      setIsFetching(false)
    }
  }

  // --- LOGIC FOR UPDATING ROWS & TOGGLING ABSENT ---
 const updateRow = (studentId: string, field: keyof MarkRecord, value: any) => {
  setMarksData(prev => prev.map(item => {
    if (item.student_id === studentId) {
      let finalValue = value;

      // Logic to block numbers greater than 100
      if (field === 'marks_obtained' && value !== '') {
        const numValue = parseFloat(value);
        if (numValue > 100) {
          finalValue = 100; // Force it to 100
          toast.warning("Maximum marks allowed is 100");
        } else if (numValue < 0) {
          finalValue = 0; // Force it to 0
        }
      }

      const updated = { ...item, [field]: finalValue };
      
      if (field === 'marks_obtained' && updated.status !== 'Absent') {
        const numValue = parseFloat(String(finalValue));
        updated.status = isNaN(numValue) ? 'Pending' : (numValue >= 35 ? 'Pass' : 'Fail');
      }
      return updated;
    }
    return item;
  }))
}

  const toggleAbsent = (studentId: string) => {
    setMarksData(prev => prev.map(item => {
      if (item.student_id === studentId && !item.is_locked) {
        const isCurrentlyAbsent = item.status === 'Absent'
        return {
          ...item,
          status: isCurrentlyAbsent ? 'Pending' : 'Absent',
          marks_obtained: isCurrentlyAbsent ? '' : 0, // Clear marks if absent
          remarks: isCurrentlyAbsent ? item.remarks : 'Student was absent for the examination'
        }
      }
      return item
    }))
  }

  const handleBulkSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const rowsToSave = marksData.filter(row => !row.is_locked && (row.marks_obtained !== '' || row.status === 'Absent'))

    if (rowsToSave.length === 0) return toast.error("No new changes to save.")

    const payload = rowsToSave.map(row => ({
      exam_id: selectedExamId,
      subject_id: selectedSubject,
      student_id: row.student_id,
      teacher_id: user?.id || 'a735f722-cdd6-4b7e-bbf8-4e5e240fddc2', 
      marks_obtained: row.status === 'Absent' ? 0 : (parseFloat(String(row.marks_obtained)) || 0),
      total_marks: 100,
      remarks: row.remarks,
      status: row.status
    }))

    setIsFetching(true)
    const { error } = await supabase.from('exam_marks').insert(payload)
    if (error) {
      toast.error("Save failed.")
      setIsFetching(false)
    } else {
      toast.success("Marks archived successfully")
      fetchMarksheet()
    }
  }

  const pendingStudents = useMemo(() => marksData.filter(m => !m.is_locked), [marksData])
  const savedStudents = useMemo(() => marksData.filter(m => m.is_locked), [marksData])

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-4 md:p-8 min-h-screen">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl shadow-brand/5 mb-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-soft dark:bg-brand/20 text-brand rounded-2xl flex items-center justify-center">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Registry Allotment</h1>
            <p className="text-[10px] font-bold text-brand tracking-[0.2em] uppercase">
              {selectedClass ? `Class: ${selectedClass}` : 'Filters required'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleBulkSave} 
          disabled={rowsToSaveCount(marksData) === 0 || isFetching}
          className="flex items-center gap-3 bg-brand hover:bg-brand-dark text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all disabled:opacity-30"
        >
          {isFetching ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          Finalize Registry
        </button>
      </header>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-6 items-end mb-10">
        <FilterSelect label="1. Select Exam" value={selectedExamId} onChange={handleExamChange} options={exams.map(e => ({ id: e.id, name: e.exam_name }))} />
        <FilterSelect label="2. Target Class" value={selectedClass} onChange={setSelectedClass} options={availableClasses.map(c => ({ id: c, name: c }))} disabled={!selectedExamId} />
        <FilterSelect label="3. Subject" value={selectedSubject} onChange={setSelectedSubject} options={subjects.map(s => ({ id: s.id, name: s.name }))} />
        
        <button onClick={fetchMarksheet} disabled={isFetching} className="h-[58px] px-10 bg-slate-900 dark:bg-brand-light text-white rounded-2xl flex items-center gap-3 hover:bg-brand transition-all font-black text-xs uppercase tracking-widest">
          {isFetching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />} Fetch
        </button>
      </div>

      {/* DATA AREA */}
      {marksData.length > 0 ? (
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-4 mb-6 ml-6">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center"><UserPlus size={20} /></div>
              <h2 className="text-base font-black uppercase tracking-[0.3em]">New Entries ({pendingStudents.length})</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-brand/20 overflow-hidden">
              <MarksTable data={pendingStudents} onUpdate={updateRow} onToggleAbsent={toggleAbsent} />
            </div>
          </section>

          <section className="opacity-80">
            <div className="flex items-center gap-4 mb-6 ml-6 text-slate-500">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><CheckCircle size={20} /></div>
              <h2 className="text-base font-black uppercase tracking-[0.3em]">Locked Records ({savedStudents.length})</h2>
            </div>
            <div className="bg-white/50 dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 overflow-hidden">
              <MarksTable data={savedStudents} onUpdate={()=>{}} onToggleAbsent={()=>{}} isLocked={true} />
            </div>
          </section>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-40 text-center border border-slate-100">
          <GraduationCap className="mx-auto text-brand-soft/50 mb-8" size={100} />
          <p className="font-black text-slate-300 uppercase text-[12px] tracking-[0.8em]">Select parameters to load students</p>
        </div>
      )}

      <style jsx global>{`
        .premium-select { 
          appearance: none; background: #f8fafc; border: 2px solid #f1f5f9; padding: 0 1.5rem; height: 58px; 
          border-radius: 1.25rem; font-size: 12px; font-weight: 800; text-transform: uppercase; outline: none; 
          transition: all 0.3s; width: 100%; color: #1e293b;
        }
        .premium-select:focus { border-color: #8f1e7a; background: #fff; }
        .dark .premium-select { background: #1e293b; border-color: #334155; color: #f1f5f9; }
      `}</style>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options, disabled = false }: any) {
  return (
    <div className="flex-1 min-w-[200px] flex flex-col gap-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <select className="premium-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="">Choose...</option>
        {options.map((opt: any) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
      </select>
    </div>
  )
}

function MarksTable({ data, onUpdate, onToggleAbsent, isLocked = false }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black uppercase text-brand tracking-[0.25em] border-b border-slate-100">
            <th className="p-8">ID / Roll</th>
            <th className="p-8">Student Name</th>
            <th className="p-8 text-center">Marks (100)</th>
            <th className="p-8 text-center">Status</th>
            <th className="p-8">Remarks</th>
            <th className="p-8 text-center">Absent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {data.map((row: MarkRecord) => {
            const isAbsent = row.status === 'Absent';
            return (
              <tr key={row.student_id} className={`group transition-all ${isLocked ? 'grayscale-[0.4]' : ''}`}>
                <td className="p-8 font-black text-brand-light/60 text-xs tabular-nums">#{row.roll_no || '00'}</td>
                <td className="p-8">
                  <p className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-tight">{row.name}</p>
                </td>
                <td className="p-8 text-center">
                  <input
  type="number"
  value={row.marks_obtained}
  disabled={isLocked || isAbsent}
  // Prevent typing 'e', '+', '-', etc. and clamp value
  onChange={(e) => {
    const val = e.target.value;
    if (Number(val) <= 100) {
      onUpdate(row.student_id, 'marks_obtained', val);
    } else {
      onUpdate(row.student_id, 'marks_obtained', 100);
    }
  }}
  onKeyDown={(e) => {
    // Optional: Block symbols like 'e' or '-' from being typed
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  }}
  className={`w-24 h-14 text-center rounded-2xl font-black text-lg outline-none transition-all border-2 ${
    isAbsent || isLocked
      ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed' 
      : 'bg-brand-accent/30 dark:bg-slate-800 text-brand border-transparent focus:border-brand shadow-sm'
  }`}
/>
                </td>
                <td className="p-8 text-center">
                  <StatusBadge status={row.status} />
                </td>
                <td className="p-8">
                  <input
                    type="text"
                    value={row.remarks}
                    disabled={isLocked || isAbsent}
                    onChange={(e) => onUpdate(row.student_id, 'remarks', e.target.value)}
                    className="w-full bg-transparent py-3 text-xs font-medium outline-none border-b-2 border-transparent focus:border-brand/20"
                    placeholder="Enter observation..."
                  />
                </td>
                <td className="p-8 text-center">
                  <button 
                    onClick={() => onToggleAbsent(row.student_id)}
                    disabled={isLocked}
                    className={`p-4 rounded-2xl transition-all border-2 ${
                      isAbsent 
                        ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200' 
                        : 'bg-white dark:bg-slate-800 text-slate-300 border-slate-100 dark:border-slate-700 hover:border-rose-200 hover:text-rose-400'
                    }`}
                  >
                    <UserX size={20} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Pass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Fail: 'bg-rose-50 text-rose-600 border-rose-100',
    Absent: 'bg-slate-900 text-white border-slate-900',
    Pending: 'bg-slate-50 text-slate-400 border-slate-100'
  }
  return (
    <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  )
}

function rowsToSaveCount(data: MarkRecord[]) {
  return data.filter(row => !row.is_locked && (row.marks_obtained !== '' || row.status === 'Absent')).length;
}