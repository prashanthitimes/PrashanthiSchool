'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiX, 
  FiMapPin, FiShield, FiGrid, FiClock, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const EVENT_TYPES = ['Event', 'Meeting', 'Exam', 'Holiday', 'Function', 'College Event']

export default function CalendarManagement() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', event_type: 'Event', location: '', start_date: '', 
    end_date: '', description: '', status: 'Upcoming', is_active: true
  })

  const fetchEvents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true })

    if (!error) setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.start_date) {
        toast.error("Title and Start Date are required");
        return;
    }

    const toastId = toast.loading('Saving to Registry...')
    const payload = { ...form, end_date: form.end_date || null }

    const action = editingEvent 
      ? supabase.from('calendar_events').update(payload).eq('id', editingEvent.id)
      : supabase.from('calendar_events').insert([payload])

    const { error } = await action
    if (error) {
        toast.error(error.message, { id: toastId })
    } else {
      toast.success(editingEvent ? 'Registry Updated' : 'New Entry Added', { id: toastId })
      setShowForm(false)
      setEditingEvent(null)
      fetchEvents()
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('calendar_events').delete().eq('id', deleteId)
    if (!error) {
        toast.success("Purged");
        setDeleteId(null);
        fetchEvents();
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-8xl mx-auto pt-16 md:pt-10 px-3 sm:px-6 lg:px-8 py-4 space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <Toaster position="top-right" />

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-5 md:px-8 md:py-6 rounded-[2rem] border border-brand-accent dark:border-slate-800 shadow-sm gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-accent dark:bg-slate-800 text-brand-light rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <FiShield size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">Schedule Registry</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mt-1">Academic Security</p>
            </div>
          </div>
          
          <button 
            onClick={() => { setEditingEvent(null); setForm({title:'', event_type:'Event', location:'', start_date:'', end_date:'', description:'', status:'Upcoming', is_active: true}); setShowForm(true); }}
            className="w-full sm:w-auto bg-brand-light hover:bg-brand text-white px-6 py-4 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/50 active:scale-95">
            <FiPlus size={16} className="inline mr-2" /> New Entry
          </button>
        </header>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* SIDEBAR METRICS */}
          <aside className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-brand-accent dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-4 md:mb-6">Metrics</p>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 md:gap-5">
                <Metric icon={<FiGrid/>} label="Total" value={events.length} />
                <Metric icon={<FiCheckCircle className="text-emerald-500"/>} label="Active" value={events.filter(e => e.is_active).length} />
                <Metric icon={<FiAlertCircle className="text-rose-500"/>} label="Inactive" value={events.filter(e => !e.is_active).length} />
                <div className="hidden lg:block pt-4 mt-4 border-t border-brand-soft dark:border-slate-800">
                  <Metric 
                    icon={<FiShield/>} 
                    label="Integrity" 
                    value={events.length > 0 ? `${Math.round((events.filter(e => e.is_active).length / events.length) * 100)}%` : '100%'} 
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-9">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {loading ? (
                  <div className="col-span-full text-center py-10 text-brand-light font-bold animate-pulse uppercase text-xs">Accessing Database...</div>
              ) : events.map(event => (
                <EventEntry 
                  key={event.id} 
                  event={event} 
                  onEdit={() => { setEditingEvent(event); setForm(event); setShowForm(true); }} 
                  onDelete={() => setDeleteId(event.id)} 
                />
              ))}
            </div>
          </main>
        </div>

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 bg-brand-dark/20 dark:bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] p-6 md:p-10 shadow-2xl relative border-t sm:border border-brand-accent dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in duration-300 overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-brand-light p-2 bg-brand-soft dark:bg-slate-800 rounded-full"><FiX size={18} /></button>
              <div className="mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-black text-brand dark:text-white tracking-tighter uppercase">{editingEvent ? 'Edit Log' : 'New Registry'}</h2>
                  <p className="text-[9px] md:text-[10px] font-bold text-brand-light uppercase tracking-widest mt-1">Official Event Entry</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 pb-6">
                <Field label="Registry Title" value={form.title} onChange={(v:any) => setForm({...form, title: v})} placeholder="e.g. Independence Day" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField label="Classification" value={form.event_type} onChange={(v:any) => setForm({...form, event_type: v})} options={EVENT_TYPES} />
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Display Status</label>
                      <div className="flex gap-2 p-1 bg-brand-soft/50 dark:bg-slate-800 rounded-2xl border border-brand-accent dark:border-slate-700">
                          <button 
                              type="button"
                              onClick={() => setForm({...form, is_active: true})}
                              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${form.is_active ? 'bg-brand-light text-white shadow-md' : 'text-brand-light dark:text-slate-500'}`}
                          >Active</button>
                          <button 
                              type="button"
                              onClick={() => setForm({...form, is_active: false})}
                              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${!form.is_active ? 'bg-rose-500 text-white shadow-md' : 'text-brand-light dark:text-slate-500'}`}
                          >Inactive</button>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Start Date" type="date" value={form.start_date} onChange={(v:any) => setForm({...form, start_date: v})} />
                  <Field label="End Date" type="date" value={form.end_date || ''} onChange={(v:any) => setForm({...form, end_date: v})} />
                </div>

                <Field label="Location" value={form.location} onChange={(v:any) => setForm({...form, location: v})} placeholder="Campus / Hall / Online" />

                <button className="w-full bg-brand-light hover:bg-brand text-white py-4 md:py-5 rounded-[1.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] shadow-xl shadow-brand-accent transition-all active:scale-95">
                  {editingEvent ? 'Commit Changes' : 'Execute Registration'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DELETE DIALOG */}
        {deleteId && (
          <div className="fixed inset-0 bg-brand-dark/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] max-w-sm w-full text-center border border-brand-accent dark:border-slate-800 shadow-2xl">
                  <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><FiTrash2 size={28}/></div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase">Purge Record?</h3>
                  <div className="flex gap-4 mt-8">
                      <button onClick={() => setDeleteId(null)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Abort</button>
                      <button onClick={handleDelete} className="flex-1 py-4 font-black text-[10px] uppercase bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">Confirm</button>
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ... Sub-components (Metric, EventEntry, Field, SelectField) stay the same as they already have the dark: classes.
function Metric({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-brand-light bg-brand-soft dark:bg-slate-800 p-1.5 md:p-2 rounded-lg shrink-0">{icon}</span>
        <span className="text-[9px] md:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm md:text-lg font-black text-brand-dark dark:text-white">{value}</span>
    </div>
  )
}

function EventEntry({ event, onEdit, onDelete }: any) {
  const isHoliday = event.event_type === 'Holiday';
  const isActive = event.is_active;

  return (
    <div className={`p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white dark:bg-slate-900 border transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col justify-between h-full ${isHoliday ? 'border-brand-accent dark:border-slate-700 shadow-lg shadow-brand-accent/30 dark:shadow-none' : 'border-transparent dark:border-slate-800 shadow-md'}`}>
      
      {!isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 z-20" />
      )}

      <div>
        <div className="flex justify-between items-start relative z-10">
          <div className={`p-2.5 md:p-4 rounded-xl ${isHoliday ? 'bg-brand text-white' : 'bg-brand-soft dark:bg-slate-800 text-brand-light'}`}>
            <FiCalendar size={16} className="md:w-5 md:h-5" />
          </div>
          <div className="flex gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={onEdit} className="p-2 text-brand-light hover:bg-brand-soft dark:hover:bg-slate-800 rounded-lg"><FiEdit2 size={14} /></button>
            <button onClick={onDelete} className="p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><FiTrash2 size={14} /></button>
          </div>
        </div>

        <div className="mt-4 md:mt-6 relative z-10">
          <div className="flex flex-col gap-1">
            <h3 className="font-black text-slate-800 dark:text-white text-xs md:text-xl leading-tight uppercase tracking-tight line-clamp-2">{event.title}</h3>
            {!isActive && <span className="w-fit text-[7px] font-black text-rose-500 border border-rose-500 px-1 py-0.5 rounded uppercase">Inactive</span>}
          </div>
          <p className="text-[8px] md:text-[10px] font-black text-brand-light dark:text-slate-400 mt-2 md:mt-3 flex items-center gap-1 md:gap-2 uppercase tracking-widest">
             <FiClock className="text-brand-accent dark:text-slate-600" /> {new Date(event.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 md:pt-6 mt-4 md:mt-6 border-t border-brand-soft dark:border-slate-800 relative z-10 gap-2">
        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-widest truncate max-w-full">
            <FiMapPin className="text-brand-accent dark:text-slate-700 shrink-0"/> {event.location || 'Registry'}
        </span>
        <span className={`text-[7px] md:text-[9px] font-black px-2 py-1 md:px-3 md:py-1.5 rounded-full uppercase tracking-[0.1em] md:tracking-[0.2em] shrink-0 ${isHoliday ? 'bg-brand/10 dark:bg-brand/20 text-brand' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {event.event_type.split(' ')[0]}
        </span>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-brand-light dark:text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-brand-soft/50 dark:bg-slate-800 border border-brand-accent dark:border-slate-700 focus:border-brand-light dark:focus:border-brand p-3 md:p-4 rounded-2xl outline-none font-bold text-sm md:text-base text-brand-dark dark:text-white transition-all" 
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-brand-light dark:text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <select 
        value={value} onChange={e => onChange(e.target.value)} 
        className="w-full bg-brand-soft/50 dark:bg-slate-800 border border-brand-accent dark:border-slate-700 p-3 md:p-4 rounded-2xl font-bold text-sm md:text-base text-brand-dark dark:text-white outline-none cursor-pointer"
      >
        {options.map((o: string) => <option key={o} value={o} className="dark:bg-slate-900">{o}</option>)}
      </select>
    </div>
  )
}