'use client'

import Link from 'next/link'
import Image from 'next/image' 

const items = [
  { title: "Profile", img: "/Student Profile.png", link: "/parent/profile" },
  { title: "Homework", img: "/HomeWork.png", link: "/parent/homework" },
  { title: "Attendance", img: "/Attendance.png", link: "/parent/attendance" },
  // --- ADDED GALLERY HERE ---
  { title: "Gallery", img: "/gallery.jpg", link: "/parent/gallery" }, 
  { title: "Time Table", img: "/TimeTable.png", link: "/parent/timetable" },
  { title: "Exams", img: "/examicon.png", link: "/parent/exams" },
  { title: "Syllabus", img: "/Syllabus.png", link: "/parent/syllabus" },
  { title: "Report Card", img: "/ReportCard.png", link: "/parent/marks" },
  { title: "Calendar", img: "/Calendaricon.png", link: "/parent/calendar" },
  { title: "Fees", img: "/Fees.png", link: "/parent/fees" },
  { title: "Transport", img: "/Transporticon.png", link: "/parent/transport" },
  { title: "Notice", img: "/Notice.png", link: "/parent/notices" },
  { title: "Contact", img: "/contact.png", link: "/parent/contact" },
]

export default function ParentMobileDashboard() {
  return (
    <div className="lg:hidden bg-[#fffcfd] dark:bg-slate-950 transition-colors duration-300 pt-8">

      <div className="px-4">
        {/* Changed grid-cols-3 to keep a balanced look since we now have 13 items */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-4 max-w-sm mx-auto">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.link}
              className="group flex flex-col items-center active:scale-95 transition-all duration-200"
            >
              <div
                className="relative w-full aspect-square max-w-[85px] bg-white dark:bg-slate-900 
                rounded-[22%] flex items-center justify-center p-4
                shadow-[0_8px_20px_rgba(233,209,228,0.3)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)]
                border border-[#e9d1e4] dark:border-slate-800
                group-hover:shadow-md transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 dark:from-brand-soft/10 to-transparent pointer-events-none" />

            <Image
  src={item.img}
  alt={item.title}
  fill
  className="object-contain p-2 relative z-10"
/>
              </div>

              <span className="text-[12px] font-black text-slate-800 dark:text-slate-100 mt-2 text-center leading-tight tracking-tight uppercase">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 pb-10 text-center px-8">
        <div className="flex items-center gap-3 w-full opacity-20 mb-4">
          <div className="h-[1px] bg-slate-300 dark:bg-slate-700 flex-1"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-brand dark:bg-brand-soft"></div>
          <div className="h-[1px] bg-slate-300 dark:bg-slate-700 flex-1"></div>
        </div>

        <h2 className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.25em]">
          Student Portal
        </h2>
      </div>
    </div>
  )
}