'use client'

import Link from 'next/link'
import Image from 'next/image' // Recommended for Next.js

const items = [
  { title: "Profile", img: "/profile.jpg", link: "/parent/profile" },
  { title: "Homework", img: "/homewor.png", link: "/parent/homework" },
  { title: "Attendance", img: "/attendance.jpg", link: "/parent/attendance" },
  { title: "Time Table", img: "/timetable.png", link: "/parent/timetable" },
  { title: "Exams", img: "/exam.png", link: "/parent/exams" },
  { title: "Syllabus", img: "/syllabus.jpg", link: "/parent/syllabus" },
  { title: "Marks", img: "/marks.jpg", link: "/parent/marks" },
  { title: "Calendar", img: "/calendar.jpg", link: "/parent/calendar" },
  { title: "Fees", img: "/fees.jpg", link: "/parent/fees" },
  { title: "Transport", img: "/bus.jpg", link: "/parent/transport" },
  { title: "Notice", img: "/notice.jpg", link: "/parent/notices" },
  { title: "Contact", img: "/contact.png", link: "/parent/contact" },
]

export default function ParentMobileDashboard() {
  return (
    /* Main Canvas Background: bg-[#fffcfd] | dark:bg-slate-950 */
    <div className="lg:hidden min-h-screen bg-[#fffcfd] dark:bg-slate-950 transition-colors duration-300 pt-8">

      {/* 1. Icon Grid Section */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-y-6 gap-x-4 max-w-sm mx-auto">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.link}
              className="group flex flex-col items-center active:scale-95 transition-all duration-200"
            >
              <div
                /* Card Background: bg-white | dark:bg-slate-900 */
                /* Card Border: border-[#e9d1e4] | dark:border-slate-800 */
                className="relative w-full aspect-square max-w-[85px] bg-white dark:bg-slate-900 
                rounded-[22%] flex items-center justify-center p-4
                shadow-[0_8px_20px_rgba(233,209,228,0.3)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                border border-[#e9d1e4] dark:border-slate-800
                group-hover:shadow-md transition-all overflow-hidden"
              >
                {/* Branding Highlight Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 dark:from-brand-soft/10 to-transparent pointer-events-none" />

                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-contain relative z-10 brightness-[1.02] dark:grayscale-[0.2] dark:brightness-90"
                />
              </div>

              {/* Primary Headings/Text: text-slate-800 | dark:text-slate-100 */}
              <span className="text-[12px] font-bold text-slate-800 dark:text-slate-100 mt-2 text-center leading-tight tracking-tight">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Footer Section */}
      <div className="mt-12 pb-10 text-center px-8">
        <div className="flex items-center gap-3 w-full opacity-20 dark:opacity-20 mb-4">
          <div className="h-[1px] bg-slate-400 dark:bg-slate-700 flex-1"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-brand dark:bg-brand-soft"></div>
          <div className="h-[1px] bg-slate-400 dark:bg-slate-700 flex-1"></div>
        </div>
        
        {/* Branding Highlights: text-brand | dark:text-brand-soft */}
        <h2 className="text-brand dark:text-brand-soft font-black text-[10px] uppercase tracking-[0.25em]">
          Student Portal
        </h2>
      </div>
    </div>
  )
}