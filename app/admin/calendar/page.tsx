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
    <div className="max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      <header className="flex items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2rem] border border-brand-accent shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-accent text-brand-light rounded-2xl flex items-center justify-center shadow-inner">
            <FiShield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Schedule Registry</h1>
            <p className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase mt-1">Academic Security</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingEvent(null); setForm({title:'', event_type:'Event', location:'', start_date:'', end_date:'', description:'', status:'Upcoming', is_active: true}); setShowForm(true); }}
          className="bg-brand-light hover:bg-brand text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand-accent/50">
          <FiPlus size={18} className="inline mr-2" /> New Entry
        </button>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
       <aside className="lg:col-span-3 space-y-6">
  <div className="bg-white p-8 rounded-[2.5rem] border border-brand-accent shadow-sm">
    <p className="text-[10px] font-black text-brand-light uppercase tracking-[0.2em] mb-6">Metrics</p>
    <div className="space-y-5">
      <Metric icon={<FiGrid/>} label="Total Logs" value={events.length} />
      <Metric icon={<FiCheckCircle/>} label="Active" value={events.filter(e => e.is_active).length} />
      {/* New Inactive Metric */}
      <Metric icon={<FiAlertCircle className="text-rose-500"/>} label="Inactive" value={events.filter(e => !e.is_active).length} />
      
      <div className="pt-4 mt-4 border-t border-brand-soft">
        <Metric 
          icon={<FiShield/>} 
          label="Integrity" 
          value={events.length > 0 ? `${Math.round((events.filter(e => e.is_active).length / events.length) * 100)}%` : '100%'} 
        />
      </div>
    </div>
  </div>
</aside>

        <main className="lg:col-span-9">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
                <div className="col-span-full text-center py-10 text-brand-light font-bold animate-pulse uppercase text-xs">Loading...</div>
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
        <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative border border-brand-accent animate-in zoom-in duration-300">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-brand-light p-2 bg-brand-soft rounded-full"><FiX size={20} /></button>
            <div className="mb-8">
                <h2 className="text-2xl font-black text-brand tracking-tighter uppercase">{editingEvent ? 'Edit Log' : 'New Registry'}</h2>
                <p className="text-[10px] font-bold text-brand-light uppercase tracking-widest mt-1">Official Event Entry</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Registry Title" value={form.title} onChange={(v:any) => setForm({...form, title: v})} placeholder="e.g. Independence Day" />
              
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Classification" value={form.event_type} onChange={(v:any) => setForm({...form, event_type: v})} options={EVENT_TYPES} />
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">Display Status</label>
                    <div className="flex gap-2 p-1 bg-brand-soft/50 rounded-2xl border border-brand-accent">
                        <button 
                            type="button"
                            onClick={() => setForm({...form, is_active: true})}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${form.is_active ? 'bg-brand-light text-white shadow-md' : 'text-brand-light'}`}
                        >Active</button>
                        <button 
                            type="button"
                            onClick={() => setForm({...form, is_active: false})}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!form.is_active ? 'bg-rose-500 text-white shadow-md' : 'text-brand-light'}`}
                        >Inactive</button>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date" type="date" value={form.start_date} onChange={(v:any) => setForm({...form, start_date: v})} />
                <Field label="End Date" type="date" value={form.end_date || ''} onChange={(v:any) => setForm({...form, end_date: v})} />
              </div>

              <Field label="Location" value={form.location} onChange={(v:any) => setForm({...form, location: v})} placeholder="Campus / Hall / Online" />

              <button className="w-full bg-brand-light hover:bg-brand text-white py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand-accent transition-all active:scale-95">
                {editingEvent ? 'Commit Changes' : 'Execute Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white p-10 rounded-[2.5rem] max-w-sm w-full text-center border border-brand-accent shadow-2xl">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><FiTrash2 size={32}/></div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase">Purge Record?</h3>
                <div className="flex gap-4 mt-8">
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Abort</button>
                    <button onClick={handleDelete} className="flex-1 py-4 font-black text-[10px] uppercase bg-rose-500 text-white rounded-2xl">Confirm</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

function Metric({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-brand-light bg-brand-soft p-2 rounded-lg">{icon}</span>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-lg font-black text-brand-dark">{value}</span>
    </div>
  )
}

function EventEntry({ event, onEdit, onDelete }: any) {
  const isHoliday = event.event_type === 'Holiday';
  const isActive = event.is_active;

  return (
    <div className={`p-8 rounded-[2.5rem] bg-white border transition-all hover:shadow-2xl group relative overflow-hidden ${isHoliday ? 'border-brand-accent shadow-lg shadow-brand-accent/30' : 'border-transparent shadow-md'}`}>
      
      {/* RED STATUS BAR FOR INACTIVE ITEMS */}
      {!isActive && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 z-20" />
      )}

      <div className="flex justify-between items-start relative z-10">
        <div className={`p-4 rounded-2xl ${isHoliday ? 'bg-brand text-white' : 'bg-brand-soft text-brand-light'}`}>
          <FiCalendar size={20} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={onEdit} className="p-3 text-brand-light hover:bg-brand-soft rounded-xl"><FiEdit2 size={16} /></button>
          <button onClick={onDelete} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl"><FiTrash2 size={16} /></button>
        </div>
      </div>

      <div className="mt-6 relative z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-slate-800 text-xl leading-none uppercase tracking-tight">{event.title}</h3>
          {!isActive && <span className="text-[8px] font-black text-rose-500 border border-rose-500 px-1.5 py-0.5 rounded-md uppercase">Inactive</span>}
        </div>
        <p className="text-[10px] font-black text-brand-light mt-3 flex items-center gap-2 uppercase tracking-widest">
           <FiClock className="text-brand-accent" /> {new Date(event.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="flex justify-between items-center pt-6 mt-6 border-t border-brand-soft relative z-10">
        <span className="text-[9px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest"><FiMapPin className="text-brand-accent"/> {event.location || 'Registry'}</span>
        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] ${isHoliday ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-500'}`}>{event.event_type}</span>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">{label}</label>
      <input 
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-brand-soft/50 border border-brand-accent focus:border-brand-light p-4 rounded-2xl outline-none font-bold text-brand-dark transition-all" 
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-brand-light uppercase ml-2 tracking-widest">{label}</label>
      <select 
        value={value} onChange={e => onChange(e.target.value)} 
        className="w-full bg-brand-soft/50 border border-brand-accent p-4 rounded-2xl font-bold text-brand-dark outline-none cursor-pointer"
      >
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}