'use client'

import Link from 'next/link'

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
    // REMOVED: min-h-screen and pb-20
    <div className="lg:hidden bg-[#F8FAFC]"> 

      {/* 1. Icon Grid Section */}
      <div className="px-4">
        <div className="grid grid-cols-3 gap-y-6 gap-x-4 max-w-sm mx-auto">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.link}
              className="group flex flex-col items-center active:scale-95 transition-all duration-200"
            >
              <div className="relative w-full aspect-square max-w-[85px] bg-white rounded-[1.8rem] flex items-center justify-center p-4
                  shadow-[0_4px_20px_rgba(0,0,0,0.04)] 
                  border border-slate-100/80
                  group-hover:shadow-md transition-all">
                
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent rounded-[1.8rem] pointer-events-none" />

                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-contain relative z-10 brightness-[1.02]"
                />
              </div>

              <span className="text-[11px] font-bold text-slate-600 mt-2.5 text-center leading-[1.1] tracking-tight">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Focused Footer Section - Tightened Up */}
      <div className="mt-8 pb-8 text-center px-8"> 
        <div className="flex items-center gap-3 w-full opacity-10 mb-4">
          <div className="h-[1px] bg-slate-900 flex-1"></div>
          <div className="w-1 h-1 rounded-full bg-slate-900"></div>
          <div className="h-[1px] bg-slate-900 flex-1"></div>
        </div>
        <h2 className="text-brand-dark/40 font-black text-[10px] uppercase tracking-[0.2em]">
          Select an Option
        </h2>
      </div>
    </div>
  )
}