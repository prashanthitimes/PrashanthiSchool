'use client'

import { FiDownload, FiEdit, FiCheckCircle, FiCalendar, FiPlus, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useEffect, useState, useRef } from 'react' // Add useRef here
const classOptions = [
  'Pre-KG', 'LKG', 'UKG',
  ...Array.from({ length: 10 }, (_, i) => `${i + 1}`)
].flatMap(cls => [
  { label: `Class ${cls}-A`, class: cls, section: 'A' },
  { label: `Class ${cls}-B`, class: cls, section: 'B' },
  { label: `Class ${cls}-C`, class: cls, section: 'C' },
  { label: `Class ${cls}-D`, class: cls, section: 'D' },
]);
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Subject color mapping
const subjectColors: Record<string, string> = {
  // 🧮 Maths
  Maths: "bg-blue-50 text-blue-700 border-blue-100",
  Mathematics: "bg-blue-50 text-blue-700 border-blue-100",

  // 🔬 Science (individual)
  Physics: "bg-amber-50 text-amber-700 border-amber-100",
  Chemistry: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Biology: "bg-green-50 text-green-700 border-green-100",

  // 🧪 Science (combined)
  Science: "bg-lime-50 text-lime-700 border-lime-100",

  // 🌍 Social Science
  History: 'bg-rose-50 text-rose-700 border-rose-100',
  Civics: 'bg-orange-50 text-orange-700 border-orange-100',
  Geography: 'bg-teal-50 text-teal-700 border-teal-100',
  Social: 'bg-pink-50 text-pink-700 border-pink-100',
  'Social Science': 'bg-pink-50 text-pink-700 border-pink-100',

  // 🧠 Computer
  Computer: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Computer Science': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  CS: 'bg-cyan-50 text-cyan-700 border-cyan-100',

  // 🗣 Languages
  English: "bg-purple-50 text-purple-700 border-purple-100",
  Kannada: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Hindi: "bg-yellow-50 text-yellow-700 border-yellow-100",

  // 🏃 Physical / Activity
  PT: "bg-gray-50 text-gray-700 border-gray-200",
  GKVK: "bg-stone-50 text-stone-700 border-stone-200",

  // 🎨 Extras
  Drawing: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  Music: "bg-violet-50 text-violet-700 border-violet-100",

  // Fallback
  Default: "bg-brand-soft/30 text-brand-dark border-brand-soft/40",
}


const getSubjectColor = (subject: string) => {
  const key = subject.toLowerCase()

  if (key.includes('computer') || key === 'cs')
    return subjectColors['Computer Science']

  if (key.includes('social') || key.includes('history') || key.includes('civic') || key.includes('geo'))
    return subjectColors['Social Science']

  return subjectColors[subject] || subjectColors.Default
}


export default function TimeTablePage() {
  const [active, setActive] = useState(classOptions[0])
  const [timetable, setTimetable] = useState<Record<string, Record<number, string>>>({})
  const [subjectsList, setSubjectsList] = useState<{ id: string; name: string }[]>([])

  // Periods now include a 'time' property
  const [periods, setPeriods] = useState<
    { id: number; start_time: string; end_time: string; type: string }[]
  >([])

  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState(false)

  useEffect(() => {
    async function getSubjects() {
      const { data } = await supabase.from('subjects').select('id, name').order('name')
      if (data) setSubjectsList(data)
    }
    getSubjects()
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - 300
        : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };


  async function fetchTimetable() {
    setLoading(true)
    const { data, error } = await supabase
      .from('timetable')
      .select(`day, period, subject_id, subjects ( name )`)
      .eq('class', active.class)
      .eq('section', active.section)

    if (!error) {
      const grid: Record<string, Record<number, string>> = {}
      days.forEach(day => { grid[day] = {} })
      data.forEach((row: any) => {
        grid[row.day][row.period] = row.subject_id || ''
      })
      setTimetable(grid)
    }
    setLoading(false)
  }

  async function fetchPeriods() {
    const { data } = await supabase
      .from('periods')
      .select('id, start_time, end_time')
      .eq('class', active.class)
      .eq('section', active.section)
      .order('id')

    if (data && data.length === 0) {
      const defaults = [1, 2, 3, 4, 5, 6].map(id => ({
        id,
        class: active.class,
        section: active.section,
        start_time: '09:00',
        end_time: '09:40'
      }))

      await supabase.from('periods').insert(defaults)
      fetchPeriods()
      return
    }

    if (data) {
      const formatted = data.map((p: any) => ({
        id: p.id,
        start_time: p.start_time,
        end_time: p.end_time,
        type: p.type ?? "period", // default value
      }))

      setPeriods(formatted)
    }
  }

  useEffect(() => {
    fetchTimetable()
    fetchPeriods()
  }, [active])


  async function addPeriod() {
    const nextId = periods.length + 1

    await supabase.from('periods').insert({
      id: nextId,
      class: active.class,
      section: active.section,
      start_time: '09:00',
      end_time: '09:40'
    })

    fetchPeriods()
  }

  async function updatePeriodTime(id: number, field: 'start_time' | 'end_time', value: string) {

    setPeriods(prev =>
      prev.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    )

    await supabase.from('periods').upsert(
      {
        id,
        class: active.class,
        section: active.section,
        [field]: value
      },
      { onConflict: 'class,section,id' }
    )
  }
  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    doc.setFontSize(18)
    doc.setTextColor(143, 30, 122)
    doc.text(`${active.label} Schedule Registry`, 14, 20)

    // Headers include the time
    const headers = [
      'Day',
      ...periods.map(p => `P${p.id} (${p.start_time}-${p.end_time})`)
    ]
    const tableRows = days.map(day => [
      day,
      ...periods.map(p => {
        const id = timetable[day]?.[p.id] || "";
        const subject = subjectsList.find(s => s.id === id)?.name || "—";
        return subject;
      })
    ])

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: tableRows,
      headStyles: { fillColor: [143, 30, 122] },
      theme: 'grid'
    })

    doc.save(`${active.label}_Timetable.pdf`)
  }

  async function handleInlineUpdate(day: string, period: number, subjectId: string) {

    if (!subjectId) return;

    if (subjectId === "delete") {

      await supabase
        .from('timetable')
        .delete()
        .match({
          class: active.class,
          section: active.section,
          day,
          period
        })

    } else {

      const { error } = await supabase
        .from('timetable')
        .upsert({
          class: active.class,
          section: active.section,
          day,
          period,
          subject_id: subjectId
        }, {
          onConflict: 'class,section,day,period'
        })

      if (error) {
        console.error("Timetable Save Error:", error.message, error.details)
      }

    }

    await fetchTimetable()
  }
  return (
    <div className="max-w-7xl mx-auto mt-4 md:mt-10 px-3 py-2 space-y-4 md:space-y-6 bg-[#fffcfd] dark:bg-slate-950 transition-colors duration-300">

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-5 md:px-8 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-brand-accent dark:border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-accent dark:bg-brand/20 text-brand dark:text-brand-light rounded-2xl flex items-center justify-center shadow-inner shrink-0">
            <FiCalendar size={24} className="md:w-[28px] md:h-[28px]" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none">Schedule Registry</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-brand dark:text-brand-light tracking-[0.25em] uppercase mt-1.5 opacity-80">Academic Time Ledger</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {isEditMode && (

            <button onClick={addPeriod} className="flex-1 lg:flex-none bg-brand-accent dark:bg-brand/20 text-brand-dark dark:text-brand-light px-4 py-3.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all border border-brand-soft dark:border-brand/30 hover:bg-brand-soft dark:hover:bg-brand/40">
              <FiPlus size={14} className="inline mr-1 md:mr-2" /> Add Period
            </button>
          )}

          <button onClick={exportPDF} className="flex-1 lg:flex-none bg-white dark:bg-slate-800 border-2 border-brand-soft dark:border-slate-700 text-brand-dark dark:text-slate-300 px-4 py-3.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all hover:bg-brand-accent dark:hover:bg-slate-700">
            <FiDownload size={14} className="inline mr-1 md:mr-2" /> Export
          </button>
          <button onClick={() => setIsEditMode(!isEditMode)} className={`w-full lg:w-auto px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg ${isEditMode ? 'bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white' : 'bg-brand text-white'}`}>
            {isEditMode ? 'Finish Edit' : 'Modify Grid'}
          </button>
        </div>
      </header>

      {/* CLASS SELECTOR WITH NAVIGATION */}
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 shadow-md border border-slate-200 dark:border-slate-700 p-2 rounded-full text-brand dark:text-brand-light hover:bg-brand hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <FiChevronLeft size={20} />
        </button>

        <nav
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth px-1"
        >
          {classOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => setActive(opt)}
              className={`px-4 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border ${active.label === opt.label ? 'bg-brand-soft dark:bg-brand/30 border-brand dark:border-brand text-brand-dark dark:text-brand-light' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}
            >
              {opt.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 shadow-md border border-slate-200 dark:border-slate-700 p-2 rounded-full text-brand dark:text-brand-light hover:bg-brand hover:text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {/* TABLE GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl shadow-brand/5 dark:shadow-none border border-brand-soft/30 dark:border-slate-800 overflow-hidden relative transition-colors">

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-accent/40 dark:bg-slate-800/50">
                <th className="p-6 text-left text-[10px] font-black text-brand-dark/50 dark:text-slate-500 uppercase tracking-[0.2em]">Timeline</th>
                {periods.map(p => (
                  <th key={p.id} className="p-6 text-center border-l border-brand-soft/10 dark:border-slate-800">
                    <span className="block text-[10px] font-black text-brand-dark/50 dark:text-slate-500 uppercase tracking-[0.2em]">Period {p.id}</span>
                    {isEditMode ? (
                      <div className="flex gap-2 justify-center mt-2">

                        <input
                          type="time"
                          value={p.start_time}
                          onChange={(e) => updatePeriodTime(p.id, 'start_time', e.target.value)}
                          className="bg-white border rounded px-2 py-1 text-xs"
                        />

                        <input
                          type="time"
                          value={p.end_time}
                          onChange={(e) => updatePeriodTime(p.id, 'end_time', e.target.value)}
                          className="bg-white border rounded px-2 py-1 text-xs"
                        />

                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-1 mt-1 text-[11px] font-bold text-brand/70 dark:text-brand-light/60">
                        <FiClock size={10} /> {p.start_time} - {p.end_time}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/20 dark:divide-slate-800">
              {days.map(day => (
                <tr key={day} className="group hover:bg-brand-accent/10 dark:hover:bg-brand/5 transition-colors">
                  <td className="p-6 font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest bg-brand-accent/5 dark:bg-slate-800/30 border-r border-brand-soft/10 dark:border-slate-800">{day}</td>
                  {periods.map(period => {
                    const currentId = timetable[day]?.[period.id] || "";
                    const subjectName =
                      subjectsList.find(s => s.id === currentId)?.name ?? '—';
                    const isSlotEmpty = subjectName === '—';
                    const colorStyle = isSlotEmpty ? "bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 border-slate-50 dark:border-slate-800" : getSubjectColor(subjectName);

                    return (
                      <td key={period.id} className="p-3 min-w-[160px]">
                        {isEditMode ? (
                          <select
                            value={currentId || ""}
                            onChange={(e) => handleInlineUpdate(day, period.id, e.target.value)}
                            className={`w-full p-4 border-2 rounded-2xl text-[10px] font-black outline-none transition-all appearance-none text-center cursor-pointer uppercase ${isSlotEmpty ? "border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400" : "border-solid border-brand bg-brand-soft/20 dark:bg-brand/10 text-brand-dark dark:text-brand-light"}`}
                          >
                            <option value="" className="dark:bg-slate-900">+ Assign</option>
                            {subjectsList.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>)}
                            {!isSlotEmpty && <option value="delete" className="dark:bg-slate-900">Clear</option>}
                          </select>
                        ) : (
                          <div className={`h-14 flex items-center justify-center text-center px-4 rounded-2xl border text-[10px] font-black uppercase tracking-wider shadow-sm transition-all ${colorStyle}`}>
                            {subjectName}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE LIST VIEW */}
        <div className="md:hidden divide-y divide-brand-soft/10 dark:divide-slate-800">
          {days.map(day => (
            <details key={day} className="group" open={day === days[new Date().getDay() - 1]}>
              <summary className="flex items-center justify-between p-5 list-none cursor-pointer bg-brand-accent/5 dark:bg-slate-800/30">
                <span className="font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-[0.2em]">{day}</span>
                <FiChevronRight className="text-brand dark:text-brand-light transition-transform group-open:rotate-90" />
              </summary>
              <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
                {periods.map(period => {
                  const currentId = timetable[day]?.[period.id] || "";
                  const subjectName =
                    subjectsList.find(s => s.id === currentId)?.name || '—';
                  const isSlotEmpty = subjectName === '—';
                  const colorStyle = isSlotEmpty ? "bg-white dark:bg-slate-950 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800" : getSubjectColor(subjectName);

                  return (
                    <div key={period.id} className="flex items-center gap-3">
                      <div className="w-20 shrink-0">
                        <span className="block text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Period {period.id}</span>
                        <span className="text-[10px] font-bold text-brand dark:text-brand-light flex items-center gap-1"><FiClock size={10} /> {period.start_time} - {period.end_time}</span>
                      </div>

                      <div className="flex-1">
                        {isEditMode ? (
                          <select
                            value={currentId || ""}
                            onChange={(e) => handleInlineUpdate(day, period.id, e.target.value)}
                            className={`w-full p-3 border-2 rounded-xl text-[10px] font-black outline-none appearance-none uppercase text-center ${isSlotEmpty ? "border-dashed border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-500" : "border-solid border-brand bg-brand-soft/20 dark:bg-brand/10 dark:text-brand-light"}`}
                          >
                            <option value="" className="dark:bg-slate-900">+ Assign</option>
                            {subjectsList.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>)}
                            {!isSlotEmpty && <option value="delete" className="dark:bg-slate-900">Clear</option>}
                          </select>
                        ) : (
                          <div className={`py-3 px-4 rounded-xl border text-[9px] font-black uppercase tracking-wider text-center ${colorStyle}`}>
                            {subjectName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>

      </div>
    </div>
  )
}