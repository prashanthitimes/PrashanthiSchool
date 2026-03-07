"use client";

import React, { useState, useEffect } from "react";
import { 
  FiBell, FiPaperclip, FiAlertCircle, 
  FiInfo, FiCalendar, FiExternalLink, FiChevronRight 
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notices_circulars")
        .select("*")
        .eq("is_active", true)
        .eq("status", "Published")
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filtered = data?.filter(notice => 
        notice.recipients.some((r: string) => 
          ["All", "Parents", "Students"].includes(r)
        )
      );

      setNotices(filtered || []);
    } catch (err) {
      console.error("Notice Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-brand-light text-white shadow-md shadow-brand-soft';
      case 'medium': return 'bg-brand-soft text-brand-light border-brand-soft';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

return (
  <div className="w-full space-y-6 p-4 bg-[#fffcfd] dark:bg-slate-950 min-h-screen animate-in fade-in duration-700">
    
    {/* --- WIDE HEADER --- */}
    <div className="bg-brand-soft/30 dark:bg-slate-900 p-6 rounded-[2rem] border border-brand-soft dark:border-slate-800 flex items-center justify-between relative overflow-hidden">
      
      <div className="relative z-10">
        <h1 className="text-2xl md:text-3xl font-black text-brand-light dark:text-brand-soft tracking-tighter uppercase leading-none">
          Notices Board
        </h1>

        <p className="text-brand-light/60 dark:text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
          Latest School Circulars
        </p>
      </div>

      <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg">
        <FiBell size={22} className="animate-bounce" />
      </div>

    </div>

    {/* --- 3 COLUMN GRID --- */}
    {loading ? (
      <div className="py-24 text-center">

        <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin mx-auto mb-4"></div>

        <p className="font-black text-brand-light/30 dark:text-slate-400 text-[10px] uppercase tracking-widest">
          Refreshing Feed...
        </p>

      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {notices.length > 0 ? (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-brand-soft/60 dark:border-slate-800 hover:border-brand-light flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:shadow-brand-soft/20"
            >

              <div className="p-6 flex flex-col h-full">

                {/* Category */}
                <div className="flex items-center justify-between mb-4">

                  <span className="px-3 py-1 bg-brand-soft/50 dark:bg-slate-800 text-brand-light dark:text-brand-soft rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {notice.category}
                  </span>

                </div>

                {/* Title & Date */}
                <div className="mb-4">

                  <h3 className="text-xl font-black text-brand-light dark:text-brand-soft leading-tight">
                    {notice.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold mt-2 uppercase">
                    <FiCalendar />
                    {new Date(notice.created_at).toLocaleDateString('en-GB')}
                  </div>

                </div>

                {/* Content */}
                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-4 mb-6 flex-grow transition-colors duration-300">
                  {notice.content}
                </div>

                {/* Attachment */}
                {notice.attachment_url && (
                  <div className="mt-auto pt-4 border-t border-brand-soft/30 dark:border-slate-800">

                    <a
                      href={notice.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 bg-brand-soft/20 dark:bg-slate-800 text-brand-light dark:text-brand-soft rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-light hover:text-white transition-all group/btn"
                    >

                      <span className="flex items-center gap-2">
                        <FiPaperclip />
                        {notice.attachment_name || "View Circular"}
                      </span>

                      <FiExternalLink />

                    </a>

                  </div>
                )}

              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full bg-slate-50 dark:bg-slate-900 rounded-[2rem] py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">

            <FiInfo size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />

            <p className="text-slate-500 dark:text-slate-400 font-black uppercase text-xs tracking-widest">
              No circulars posted yet.
            </p>

          </div>
        )}

      </div>
    )}
  </div>
);
}