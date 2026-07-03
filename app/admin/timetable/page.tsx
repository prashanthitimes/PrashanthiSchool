'use client'

import { FiDownload, FiEdit, FiCheckCircle, FiCalendar, FiPlus, FiClock, FiChevronLeft, FiChevronRight, FiPrinter } from 'react-icons/fi'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import { saveImageFromDataUrl } from '@/lib/nativeDownload'

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
  Maths: "bg-blue-50 text-blue-700 border-blue-100",
  Mathematics: "bg-blue-50 text-blue-700 border-blue-100",
  Physics: "bg-amber-50 text-amber-700 border-amber-100",
  Chemistry: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Biology: "bg-green-50 text-green-700 border-green-100",
  Science: "bg-lime-50 text-lime-700 border-lime-100",
  History: 'bg-rose-50 text-rose-700 border-rose-100',
  Civics: 'bg-orange-50 text-orange-700 border-orange-100',
  Geography: 'bg-teal-50 text-teal-700 border-teal-100',
  Social: 'bg-pink-50 text-pink-700 border-pink-100',
  'Social Science': 'bg-pink-50 text-pink-700 border-pink-100',
  Computer: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Computer Science': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  CS: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  English: "bg-purple-50 text-purple-700 border-purple-100",
  Kannada: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Hindi: "bg-yellow-50 text-yellow-700 border-yellow-100",
  PT: "bg-gray-50 text-gray-700 border-gray-200",
  GKVK: "bg-stone-50 text-stone-700 border-stone-200",
  Drawing: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  Music: "bg-violet-50 text-violet-700 border-violet-100",
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

const [periods, setPeriods] = useState< // <-- Added '<' here
  {
    id: number
    start_time: string
    end_time: string
    type: string
  }[]
>([])
  const defaultPeriods = [
    { id: 1, start_time: '09:40', end_time: '09:55', type: 'period' },
    { id: 2, start_time: '09:55', end_time: '10:10', type: 'period' },
    { id: 3, start_time: '10:10', end_time: '10:55', type: 'period' },
    { id: 4, start_time: '10:55', end_time: '11:40', type: 'period' },
    { id: 5, start_time: '11:40', end_time: '11:50', type: 'break' },
    { id: 6, start_time: '11:50', end_time: '12:35', type: 'period' },
    { id: 7, start_time: '12:35', end_time: '13:20', type: 'period' },
    { id: 8, start_time: '13:20', end_time: '13:55', type: 'lunch' },
    { id: 9, start_time: '13:55', end_time: '14:35', type: 'period' },
    { id: 10, start_time: '14:35', end_time: '15:15', type: 'period' },
    { id: 11, start_time: '15:15', end_time: '15:55', type: 'period' },
    { id: 12, start_time: '15:55', end_time: '16:05', type: 'break' },
  ]
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)

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
    const { data, error } = await supabase
      .from('periods')
      .select('*')
      .eq('class', active.class)
      .eq('section', active.section)
      .order('id')

    if (error) {
      console.error(error)
      return
    }

    if (!data || data.length < 12) {
      await supabase
        .from('periods')
        .delete()
        .eq('class', active.class)
        .eq('section', active.section)

      const insertData = defaultPeriods.map((p) => ({
        ...p,
        class: active.class,
        section: active.section,
      }))

      const { error: insertError } = await supabase
        .from('periods')
        .insert(insertData)

      if (insertError) {
        console.error(insertError)
        return
      }

      fetchPeriods()
      return
    }

    setPeriods(
      data.map((p: any) => ({
        id: p.id,
        start_time: p.start_time,
        end_time: p.end_time,
        type: p.type || 'period',
      }))
    )
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
      start_time: '08:00',
      end_time: '08:40',
      type: 'period'
    })

    fetchPeriods()
  }

  async function updatePeriodField(
    id: number,
    field: 'start_time' | 'end_time' | 'type',
    value: string
  ) {
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
      {
        onConflict: 'class,section,id'
      }
    )
  }

  // --- NEW: PNG export using the same branded template + native-safe save pattern ---
  const exportOfficialImage = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const element = printRef.current;
      element.style.display = "block";

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      element.style.display = "none";

      const dataUrl = canvas.toDataURL("image/png");
      const fileName = `Official_Timetable_${active.label.replace(/\s+/g, '_')}.png`;
      await saveImageFromDataUrl(dataUrl, fileName);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  async function handleInlineUpdate(day: string, period: number, subjectId: string) {
    if (!subjectId) return;

    const currentClass = String(active.class);

    if (subjectId === "delete") {
      await supabase
        .from('timetable')
        .delete()
        .match({
          class: currentClass,
          section: active.section,
          day,
          period
        });
    } else {
      const { error } = await supabase
        .from('timetable')
        .upsert({
          class: currentClass,
          section: active.section,
          day,
          period,
          subject_id: subjectId
        }, {
          onConflict: 'class,section,day,period'
        });

      if (error) {
        console.error("Timetable Save Error:", error.message, error.details);
        alert("Error saving: " + error.message);
      }
    }
    await fetchTimetable();
  }

  return (
    <div className="max-w-7xl mx-auto mt-4 md:mt-10 px-3 py-2 space-y-4 md:space-y-6 bg-[#fffcfd] dark:bg-slate-950 transition-colors duration-300">

      {/* --- HIDDEN OFFICIAL PRINT TEMPLATE (this is what gets exported as PNG) --- */}
      <div
        ref={printRef}
        style={{ display: 'none', width: '1120px', padding: '50px', backgroundColor: 'white', fontFamily: 'sans-serif' }}
      >
        <div style={{ border: '8px double #a63d93', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #a63d93', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#a63d93', margin: 0, textTransform: 'uppercase' }}>Prashanthi Vidyalaya</h1>
            <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '5px', color: '#64748b', margin: '5px 0' }}>OFFICIAL CLASS SCHEDULE REGISTRY</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fdf2f8', padding: '20px', borderRadius: '15px', marginBottom: '40px', border: '1px solid #fbcfe8' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Class & Section</p>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#000' }}>{active.label}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', fontWeight: '900', color: '#a63d93', textTransform: 'uppercase', margin: 0 }}>Generated On</p>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#000' }}>{new Date().toLocaleDateString()}</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' }}>
            {days.map((day) => (
              <div key={day}>
                <div style={{ backgroundColor: '#a63d93', color: 'white', padding: '10px', textAlign: 'center', borderRadius: '8px', fontSize: '12px', fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {periods.map((slot) => {
                    const currentId = timetable[day]?.[slot.id] || "";
                    const subjectName = subjectsList.find(s => s.id === currentId)?.name;

                    let printLabel = subjectName || "—";
                    let isBreakSlot = false;
                    if (slot.type === "break") { printLabel = "Short Break"; isBreakSlot = true; }
                    if (slot.type === "lunch") { printLabel = "Lunch Break"; isBreakSlot = true; }

                    return (
                      <div key={slot.id} style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        minHeight: '90px',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8' }}>
                          {slot.type === "break" || slot.type === "lunch" ? "BREAK" : `PERIOD ${slot.id}`}
                        </span>
                        <p style={{ fontSize: '13px', fontWeight: '800', margin: '6px 0', lineHeight: '1.2', color: isBreakSlot ? '#ea580c' : '#1e293b' }}>{printLabel}</p>
                        <span style={{ fontSize: '9px', color: '#64748b', marginTop: 'auto', fontWeight: '600' }}>
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}><div style={{ borderTop: '2px solid #000', width: '200px', paddingTop: '10px', fontSize: '11px', fontWeight: '900' }}>ACADEMIC COORDINATOR</div></div>
            <div style={{ textAlign: 'center', opacity: 0.2 }}><p style={{ fontSize: '10px', fontWeight: 'bold' }}>SYSTEM GENERATED RECORD</p></div>
            <div style={{ textAlign: 'center' }}><div style={{ borderTop: '2px solid #000', width: '200px', paddingTop: '10px', fontSize: '11px', fontWeight: '900' }}>PRINCIPAL SEAL</div></div>
          </div>
        </div>
      </div>

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

          <button
            onClick={exportOfficialImage}
            disabled={isExporting}
            className="flex-1 lg:flex-none bg-white dark:bg-slate-800 border-2 border-brand-soft dark:border-slate-700 text-brand-dark dark:text-slate-300 px-4 py-3.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all hover:bg-brand-accent dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? "Generating..." : <><FiPrinter size={14} /> Export Official</>}
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
                    <span className="block text-[10px] font-black uppercase">
                      {p.type === 'break'
                        ? 'Break'
                        : p.type === 'lunch'
                          ? 'Lunch'
                          : `Period ${p.id}`}
                    </span>
                    {isEditMode ? (
                      <div className="flex flex-col gap-2 justify-center mt-2">
                        <select
                          value={p.type}
                          onChange={(e) =>
                            updatePeriodField(p.id, 'type', e.target.value)
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs font-bold"
                        >
                          <option value="period">Period</option>
                          <option value="break">Break</option>
                          <option value="lunch">Lunch</option>
                        </select>

                        <input
                          type="time"
                          value={p.start_time}
                          onChange={(e) =>
                            updatePeriodField(p.id, 'start_time', e.target.value)
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs"
                        />

                        <input
                          type="time"
                          value={p.end_time}
                          onChange={(e) =>
                            updatePeriodField(p.id, 'end_time', e.target.value)
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs"
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