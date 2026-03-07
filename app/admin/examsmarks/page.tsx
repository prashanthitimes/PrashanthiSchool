'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Save, FileSpreadsheet, Search, CheckCircle2, XCircle, Loader2, AlertTriangle, Lock, UserMinus, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast, Toaster } from 'sonner'

export default function ExamMarksManager() {
  const [exams, setExams] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [marksData, setMarksData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [selectedSyllabus, setSelectedSyllabus] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')

  useEffect(() => {
    const loadFilters = async () => {
      const { data: ex } = await supabase.from('exam_syllabus').select('*')
      const { data: sub } = await supabase.from('subjects').select('*')
      if (ex) setExams(ex)
      if (sub) setSubjects(sub)
    }
    loadFilters()
  }, [])

  const fetchMarksheet = async () => {
    if (!selectedSyllabus || !selectedSubject || !selectedClass) {
      toast.error("Please select Exam, Subject, and Class")
      return
    }

    setIsLoading(true)
    setMarksData([])

    const { data: studentList } = await supabase
      .from('students')
      .select('id, full_name, roll_number, class_name')
      .eq('class_name', selectedClass)

    const { data: existingMarks } = await supabase
      .from('exam_marks')
      .select('*')
      .eq('syllabus_id', selectedSyllabus)
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

      // SORTING LOGIC: Move Pending (Not Added) to the top
      const sortedData = formattedData.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return (a.roll_no || 0) - (b.roll_no || 0); // Then sort by roll number
      });

      setMarksData(sortedData)
      toast.success(`Fetched ${studentList.length} students`)
    }
    setIsLoading(false)
  }

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
        syllabus_id: selectedSyllabus,
        subject_id: selectedSubject,
        student_id: row.student_id,
        marks_obtained: parseFloat(row.marks_obtained) || 0,
        total_marks: 100,
        remarks: row.remarks,
        status: row.status
      }))

    if (payload.length === 0) return toast.error("No marks entered.")

    const { error } = await supabase.from('exam_marks').insert(payload)
    if (error) toast.error("Entry already exists.")
    else {
      toast.success("Marks synchronized.")
      fetchMarksheet()
    }
  }

  const pendingCount = marksData.filter(m => m.status === 'Pending').length;

return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-slate-950 p-6 md:p-10 transition-colors duration-300">
      <Toaster position="top-right" richColors />

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-[#fdf2f9] dark:border-slate-800 shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#fdf2f9] dark:bg-slate-800 text-[#a63d93] dark:text-pink-400 rounded-2xl flex items-center justify-center shadow-inner">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Registry Allotment</h1>
            <p className="text-[10px] font-bold text-[#a63d93] dark:text-pink-400/80 tracking-[0.2em] uppercase">
              Status: {pendingCount > 0 ? `${pendingCount} Pending` : 'Completed'}
            </p>
          </div>
        </div>

        <button onClick={handleBulkSave} className="flex items-center gap-2 bg-[#a63d93] dark:bg-pink-700 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-pink-100 dark:shadow-none transition-all hover:opacity-90">
          <Save size={16} /> Finalize Records
        </button>
      </header>

      {/* PENDING ALERT */}
      {pendingCount > 0 && (
        <div className="mb-6 animate-pulse bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-xl text-amber-600 dark:text-amber-400">
            <Info size={20} />
          </div>
          <p className="text-xs font-black text-amber-800 dark:text-amber-200 uppercase tracking-wider">
            Attention: {pendingCount} Students have no marks added yet.
          </p>
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center mb-8">
        <select className="premium-select dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" value={selectedSyllabus} onChange={(e) => {
          const s = exams.find(x => x.id === e.target.value);
          setSelectedSyllabus(e.target.value);
          setSelectedClass(s?.class_name || '');
        }}>
          <option value="">Choose Exam</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.exam_name} ({e.class_name})</option>)}
        </select>
        
        <select className="premium-select dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
          <option value="">Choose Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button onClick={fetchMarksheet} className="flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
          {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} Fetch Registry
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        {marksData.length > 0 ? (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
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
                    <tr
                      key={row.student_id}
                      className={`transition-all ${row.status === 'Pending'
                          ? 'bg-[#fdf2f9]/30 dark:bg-pink-900/10'
                          : row.is_locked
                            ? 'bg-slate-50/50 dark:bg-slate-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                        }`}
                    >
                      <td className="p-6 font-black text-slate-400 dark:text-slate-500 text-xs">#{row.roll_no}</td>
                      <td className="p-6">
                        <p className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase">{row.name}</p>
                        {!row.is_locked && (
                          <button onClick={() => toggleAbsent(idx)} className="text-[9px] font-black text-[#a63d93] dark:text-pink-400 uppercase hover:underline mt-1">
                            {row.status === 'Absent' ? 'Mark Present' : 'Mark Absent'}
                          </button>
                        )}
                      </td>

                      <td className="p-6 text-center">
                        <input
                          type="number"
                          value={row.marks_obtained}
                          disabled={row.is_locked || row.status === 'Absent'}
                          onChange={(e) => updateRow(idx, 'marks_obtained', e.target.value)}
                          className="w-20 p-2 text-center border-2 rounded-xl font-black outline-none border-[#a63d93]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-[#a63d93]"
                          placeholder="--"
                        />
                      </td>

                      <td className="p-6">
                        <input
                          type="text"
                          value={row.remarks}
                          disabled={row.is_locked}
                          onChange={(e) => updateRow(idx, 'remarks', e.target.value)}
                          className="w-full bg-transparent border-b border-slate-100 dark:border-slate-800 py-1 text-xs outline-none focus:border-[#a63d93] dark:text-slate-300"
                          placeholder="..."
                        />
                      </td>

                      <td className="p-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                          row.status === 'Pass' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30' :
                          row.status === 'Fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' :
                          row.status === 'Absent' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 animate-pulse'
                        }`}>
                          {row.status === 'Pending' ? 'Not Added' : row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden p-4 space-y-4">
              {marksData.map((row, idx) => (
                <div key={row.student_id} className={`rounded-3xl border p-5 shadow-sm space-y-4 ${
                  row.status === 'Pending' ? 'bg-[#fdf2f9]/40 dark:bg-pink-900/10 border-[#a63d93]/10' :
                  row.is_locked ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800' :
                  'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-400 dark:text-slate-500">Roll #{row.roll_no}</p>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">{row.name}</h3>
                    </div>
                    <span className={`px-3 py-1 text-[9px] rounded-full font-black uppercase border ${
                      row.status === 'Pass' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' :
                      row.status === 'Fail' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                      row.status === 'Absent' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {row.status === 'Pending' ? 'Not Added' : row.status}
                    </span>
                  </div>

                  <input
                    type="number"
                    value={row.marks_obtained}
                    disabled={row.is_locked || row.status === 'Absent'}
                    onChange={(e) => updateRow(idx, 'marks_obtained', e.target.value)}
                    className="w-full p-3 text-center border-2 rounded-2xl font-black dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 border-[#a63d93]/20"
                    placeholder="Enter marks"
                  />

                  {!row.is_locked && (
                    <button onClick={() => toggleAbsent(idx)} className="w-full py-2 text-xs font-black uppercase rounded-xl bg-[#fdf2f9] dark:bg-slate-800 text-[#a63d93] dark:text-pink-400">
                      {row.status === 'Absent' ? 'Mark Present' : 'Mark Absent'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-24 text-center">
            <p className="font-black text-slate-300 dark:text-slate-700 uppercase text-xs tracking-[0.3em]">No Selection</p>
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
        }
        .dark .premium-select {
          background: #1e293b; /* slate-800 */
          border-color: #334155; /* slate-700 */
          color: #f1f5f9;
        }
      `}</style>
    </div>
  )
}