'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Save, FileSpreadsheet, Search, CheckCircle2, XCircle, Loader2, AlertTriangle, Lock, UserMinus, Info, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast, Toaster } from 'sonner'

export default function ExamMarksManager() {
  const [exams, setExams] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [marksData, setMarksData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // FILTER STATES
  const [selectedExamId, setSelectedExamId] = useState<string>('')
  const [availableClasses, setAvailableClasses] = useState<string[]>([]) // Classes for the selected exam
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')

  useEffect(() => {
    const loadFilters = async () => {
      setIsLoading(true)
      // 1. Fetch Exams
      const { data: ex } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      // 2. Fetch Subjects
      const { data: sub } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (ex) setExams(ex)
      if (sub) setSubjects(sub)
      setIsLoading(false)
    }
    loadFilters()
  }, [])

  // Handle Exam Change: Update available classes based on exam selection
  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId)
    setSelectedClass('') // Reset class when exam changes
    setMarksData([]) // Clear table

    const exam = exams.find(x => x.id === examId)
    if (exam && exam.classes) {
      // Ensure classes is handled as an array
      setAvailableClasses(Array.isArray(exam.classes) ? exam.classes : [exam.classes])
    } else {
      setAvailableClasses([])
    }
  }

  const fetchMarksheet = async () => {
    if (!selectedExamId || !selectedSubject || !selectedClass) {
      toast.error("Please select Exam, Class, and Subject")
      return
    }

    setIsLoading(true)
    setMarksData([])

    try {
      // 1. Get students for the specific selected class
      const { data: studentList } = await supabase
        .from('students')
        .select('id, full_name, roll_number, class_name')
        .eq('class_name', selectedClass)

      // 2. Get existing marks
      const { data: existingMarks } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('exam_id', selectedExamId)
        .eq('subject_id', selectedSubject)

      if (studentList) {
        const formattedData = studentList.map(student => {
          const record = existingMarks?.find(m => m.student_id === student.id)
          return {
            student_id: student.id,
            name: student.full_name,
            roll_no: student.roll_number,
            db_id: record?.id || null,
            marks_obtained: record?.marks_obtained ?? '',
            remarks: record?.remarks || '',
            status: record?.status || 'Pending',
            is_locked: !!record
          }
        })

        // Sort: Pending at top, then by Roll Number
        const sortedData = formattedData.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1
          if (a.status !== 'Pending' && b.status === 'Pending') return 1
          return (a.roll_no || 0) - (b.roll_no || 0)
        })

        setMarksData(sortedData)
        toast.success(`Loaded ${studentList.length} students`)
      }
    } catch (error) {
      toast.error("Failed to fetch records")
    } finally {
      setIsLoading(false)
    }
  }

  // ... (Keep updateRow, toggleAbsent, and handleBulkSave from your previous code)
  const updateRow = (index: number, field: string, value: any) => {
    if (marksData[index].is_locked) return;
    const update = [...marksData]
    update[index][field] = value
    if (field === 'marks_obtained' && update[index].status !== 'Absent') {
      update[index].status = parseFloat(value) >= 35 ? 'Pass' : 'Fail'
    }
    setMarksData(update)
  }

  const toggleAbsent = (index: number) => {
    if (marksData[index].is_locked) return;
    const update = [...marksData];
    if (update[index].status === 'Absent') {
      update[index].status = 'Pending';
      update[index].marks_obtained = '';
    } else {
      update[index].status = 'Absent';
      update[index].marks_obtained = 0;
      update[index].remarks = 'Absent';
    }
    setMarksData(update);
  }

  const handleBulkSave = async () => {
    const payload = marksData
      .filter(row => !row.is_locked && (row.marks_obtained !== '' || row.status === 'Absent'))
      .map(row => ({
        exam_id: selectedExamId, // Use exam_id consistent with fetch
        subject_id: selectedSubject,
        student_id: row.student_id,
        marks_obtained: parseFloat(row.marks_obtained) || 0,
        total_marks: 100,
        remarks: row.remarks,
        status: row.status
      }))

    if (payload.length === 0) return toast.error("No new marks to save.")

    const { error } = await supabase.from('exam_marks').insert(payload)
    if (error) toast.error("Some entries might already exist.")
    else {
      toast.success("All marks saved successfully.")
      fetchMarksheet()
    }
  }

  const pendingCount = marksData.filter(m => m.status === 'Pending').length;

  return (
    <div className="bg-[#fcfcfd] dark:bg-slate-950 p-6 md:p-10 transition-colors duration-300 min-h-screen">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fdf2f9] dark:bg-slate-800 text-[#a63d93] dark:text-pink-400 rounded-2xl flex items-center justify-center shadow-inner">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Registry Allotment</h1>
            <p className="text-[10px] font-bold text-[#a63d93] dark:text-pink-400/80 tracking-[0.2em] uppercase">
              {selectedClass ? `Class: ${selectedClass}` : 'Select Class to Start'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleBulkSave} 
          disabled={marksData.length === 0}
          className="flex items-center gap-2 bg-[#a63d93] dark:bg-pink-700 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all hover:opacity-90"
        >
          <Save size={16} /> Finalize Records
        </button>
      </header>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center mb-8">
        
        {/* 1. EXAM SELECT */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">Step 1: Exam</span>
          <select 
            className="premium-select" 
            value={selectedExamId} 
            onChange={(e) => handleExamChange(e.target.value)}
          >
            <option value="">Choose Exam</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name}</option>)}
          </select>
        </div>

        {/* 2. CLASS SELECT (Filtered by Exam) */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">Step 2: Class</span>
          <select 
            className="premium-select" 
            value={selectedClass} 
            disabled={!selectedExamId}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Choose Class</option>
            {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
        </div>

        {/* 3. SUBJECT SELECT */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase ml-2">Step 3: Subject</span>
          <select 
            className="premium-select" 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Choose Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <button 
          onClick={fetchMarksheet} 
          className="mt-5 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} Fetch Students
        </button>
      </div>

      {/* TABLE SECTION (Remains largely the same as your previous design) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        {marksData.length > 0 ? (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                {/* ... existing table code ... */}
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                    <th className="p-6">Roll</th>
                    <th className="p-6">Student</th>
                    <th className="p-6 text-center">Marks (100)</th>
                    <th className="p-6">Remarks</th>
                    <th className="p-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {marksData.map((row, idx) => (
                    <tr key={row.student_id} className={`transition-all ${row.status === 'Pending' ? 'bg-pink-50/30 dark:bg-pink-900/10' : ''}`}>
                      <td className="p-6 font-black text-slate-400 text-xs">#{row.roll_no}</td>
                      <td className="p-6 font-black text-slate-700 dark:text-slate-200 text-xs uppercase">{row.name}</td>
                      <td className="p-6 text-center">
                        <input
                          type="number"
                          value={row.marks_obtained}
                          disabled={row.is_locked || row.status === 'Absent'}
                          onChange={(e) => updateRow(idx, 'marks_obtained', e.target.value)}
                          className="w-20 p-2 text-center border-2 rounded-xl font-black outline-none border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                        />
                      </td>
                      <td className="p-6">
                        <input
                          type="text"
                          value={row.remarks}
                          disabled={row.is_locked}
                          onChange={(e) => updateRow(idx, 'remarks', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-100 py-1 text-xs outline-none focus:border-[#a63d93]"
                          placeholder="..."
                        />
                      </td>
                      <td className="p-6 text-center">
                        <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase border">
                           {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        ) : (
          <div className="p-24 text-center">
            <GraduationCap className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="font-black text-slate-300 uppercase text-xs tracking-[0.3em]">Select Filters to Load Registry</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .premium-select { 
          background: white; 
          border: 2px solid #f1f5f9; 
          padding: 0.8rem 1.2rem; 
          border-radius: 1rem; 
          font-size: 11px; 
          font-weight: 800; 
          text-transform: uppercase; 
          outline: none; 
          transition: all 0.2s; 
          cursor: pointer; 
          min-width: 180px;
        }
        .dark .premium-select {
          background: #1e293b;
          border-color: #334155;
          color: #f1f5f9;
        }
      `}</style>
    </div>
  )
}