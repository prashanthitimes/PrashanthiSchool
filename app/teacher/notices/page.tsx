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
  <div className="w-full space-y-4 md:space-y-8 pb-20">

    {/* Header Banner - Responsive Spacing */}
    <div className="px-4 md:px-6 pt-4 md:pt-6"> 
      <div className="relative overflow-hidden bg-brand-soft p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-brand-light/10 shadow-sm shadow-brand-soft/20">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-6">
            <div className="p-4 md:p-5 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm text-brand border border-brand-soft">
              <FiBell size={28} className="md:size-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight">Staff Room Board</h1>
              <p className="text-brand-light font-bold text-xs md:text-sm mt-1 opacity-90">Updates and circulars for teaching staff.</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md px-8 md:px-10 py-3 md:py-4 rounded-[1.5rem] md:rounded-[2rem] border border-white shadow-sm min-w-[120px] md:min-w-[160px]">
            <p className="text-[9px] md:text-[10px] font-black text-brand-light uppercase tracking-widest text-center mb-1">Total Notices</p>
            <p className="text-3xl md:text-4xl font-black text-brand-dark text-center">{notices.length}</p>
          </div>
        </div>

        {/* Decorative Background Elements - Hidden on small mobile to reduce noise */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl hidden md:block"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-light/10 rounded-full blur-2xl hidden md:block"></div>
      </div>
    </div>

    {/* Notices List - Single Column on Mobile, 3 on Desktop */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
      {notices.length > 0 ? (
        notices.map((notice) => (
          <div key={notice.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-soft/40 transition-all duration-500 overflow-hidden group flex flex-col">

            {/* Top Priority Bar */}
            <div className={`h-1.5 md:h-2 w-full ${notice.priority === 'High' ? 'bg-rose-400' :
                notice.priority === 'Medium' ? 'bg-amber-400' : 'bg-brand'
              }`} />

            <div className="p-6 md:p-8 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase border tracking-wider ${getPriorityStyle(notice.priority)}`}>
                    {notice.priority}
                  </span>
                  <span className="px-2 md:px-3 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-100">
                    {notice.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[9px] md:text-[10px] shrink-0">
                  <FiCalendar />
                  {new Date(notice.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
              </div>

              <h3 className="text-base md:text-lg font-black text-brand-dark mb-2 md:mb-3 group-hover:text-brand transition-colors leading-tight">
                {notice.title}
              </h3>

              <p className="text-slate-500 text-xs md:text-sm mb-6 line-clamp-3 md:line-clamp-4 group-active:line-clamp-none transition-all">
                {notice.content}
              </p>

              <div className="mt-auto pt-5 md:pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                {notice.attachment_url ? (
                  <a
                    href={notice.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-brand-soft text-brand-dark rounded-xl text-[9px] md:text-[10px] font-black transition-all hover:bg-brand hover:text-white active:scale-95"
                  >
                    <FiDownload size={14} /> DOWNLOAD PDF
                  </a>
                ) : (
                  <div className="text-[9px] md:text-[10px] font-black text-slate-300 italic flex items-center gap-1">
                    <FiInfo /> No attachment
                  </div>
                )}

                {/* Recipient Avatars */}
                <div className="flex -space-x-2">
                  {notice.recipients.map((role: string, i: number) => (
                    <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-brand-accent border-2 border-white flex items-center justify-center text-[7px] md:text-[8px] text-brand font-black shadow-sm uppercase">
                      {role[0]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full bg-white p-12 md:p-20 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-brand-soft text-center">
          <FiFileText size={40} className="mx-auto text-brand-soft mb-4 md:size-12" />
          <h3 className="text-lg md:text-xl font-black text-brand-dark">No notices posted.</h3>
        </div>
      )}
    </div>
  </div>
)
}