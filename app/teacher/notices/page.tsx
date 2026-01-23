'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FiBell, FiFileText, FiCalendar, 
  FiDownload, FiInfo 
} from 'react-icons/fi'

export default function TeacherNotices() {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [])

  async function fetchNotices() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notices_circulars')
        .select('*')
        .eq('is_active', true)
        .or('recipients.cs.{"Teachers"},recipients.cs.{"All"}') 
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (err) {
      console.error('Error fetching notices:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-100'
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100'
      default: return 'bg-brand-soft text-brand-dark border-brand-light/20'
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-soft border-t-brand rounded-full animate-spin"></div>
        <p className="text-brand-dark font-black text-sm animate-pulse tracking-widest">LOADING...</p>
    </div>
  )

  return (
    // Removed max-w-5xl and px-4 to remove side space
    <div className="w-full space-y-8 pb-20">
      
     {/* Header Banner - Rounded Corner Style */}
<div className="px-6 pt-6"> {/* Adds the spacing to reveal the rounded corners */}
  <div className="relative overflow-hidden bg-brand-soft p-10 rounded-[3rem] border border-brand-light/10 shadow-sm shadow-brand-soft/20">
    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-6">
        <div className="p-5 bg-white rounded-[2rem] shadow-sm text-brand border border-brand-soft">
          <FiBell size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tight">Staff Room Board</h1>
          <p className="text-brand-light font-bold text-sm mt-1 opacity-90">Updates and circulars for teaching staff.</p>
        </div>
      </div>
      
      <div className="bg-white/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white shadow-sm min-w-[160px]">
        <p className="text-[10px] font-black text-brand-light uppercase tracking-widest text-center mb-1">Total Notices</p>
        <p className="text-4xl font-black text-brand-dark text-center">{notices.length}</p>
      </div>
    </div>

    {/* Decorative Background Elements */}
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-light/10 rounded-full blur-2xl"></div>
  </div>
</div>

      {/* Notices List - 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {notices.length > 0 ? (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-soft/40 transition-all duration-500 overflow-hidden group flex flex-col">
              
              {/* Top Priority Bar (Horizontal for Grid look) */}
              <div className={`h-2 w-full ${
                  notice.priority === 'High' ? 'bg-rose-400' : 
                  notice.priority === 'Medium' ? 'bg-amber-400' : 'bg-brand'
              }`} />

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${getPriorityStyle(notice.priority)}`}>
                        {notice.priority}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-100">
                        {notice.category}
                      </span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-300 font-bold text-[10px]">
                      <FiCalendar />
                      {new Date(notice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                </div>

                <h3 className="text-lg font-black text-brand-dark mb-3 group-hover:text-brand transition-colors leading-tight">
                  {notice.title}
                </h3>
                
                <p className="text-slate-500 text-sm mb-8 line-clamp-3 group-hover:line-clamp-none transition-all">
                  {notice.content}
                </p>

                <div className="mt-auto pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {notice.attachment_url ? (
                    <a 
                      href={notice.attachment_url} 
                      target="_blank" 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-brand-soft text-brand-dark rounded-xl text-[10px] font-black transition-all hover:bg-brand hover:text-white"
                    >
                      <FiDownload size={14} /> DOWNLOAD PDF
                    </a>
                  ) : (
                    <div className="text-[10px] font-black text-slate-300 italic flex items-center gap-1">
                      <FiInfo /> No attachment
                    </div>
                  )}

                  <div className="flex -space-x-2">
                    {notice.recipients.map((role: string, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-brand-accent border-2 border-white flex items-center justify-center text-[8px] text-brand font-black shadow-sm uppercase">
                        {role[0]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-20 rounded-[3rem] border-2 border-dashed border-brand-soft text-center">
            <FiFileText size={48} className="mx-auto text-brand-soft mb-4" />
            <h3 className="text-xl font-black text-brand-dark">No notices posted.</h3>
          </div>
        )}
      </div>
    </div>
  )
}