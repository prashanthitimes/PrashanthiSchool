'use client'

import Link from 'next/link'

const items = [
  { title: "Student Profile", img: "/profile.jpg", link: "/parent/profile" },
  { title: "Homework", img: "/homewor.png", link: "/parent/homework" },
  { title: "Attendance", img: "/attendance.jpg", link: "/parent/attendance" },
  { title: "Class Time Table", img: "/timetable.png", link: "/parent/timetable" },
  { title: "Exam Time Table", img: "/exam.png", link: "/parent/exams" },
  { title: "Exam Syllabus", img: "/syllabus.jpg", link: "/parent/syllabus" },
  { title: "Exam Markscard", img: "/marks.jpg", link: "/parent/marks" },
  { title: "Annual Calendar", img: "/calendar.jpg", link: "/parent/calendar" },
  { title: "Fee Details", img: "/fees.jpg", link: "/parent/fees" },
  { title: "Transport", img: "/bus.jpg", link: "/parent/transport" },
  { title: "Notice", img: "/notice.jpg", link: "/parent/notices" },
  { title: "Contact School", img: "/contact.png", link: "/parent/contact" },
]

export default function ParentMobileDashboard() {
  return (
<div className="lg:hidden px-4 py-8 bg-[#F8FAFC]">      
      {/* 1. Icon Grid Section */}
      <div className="grid grid-cols-3 gap-y-10 gap-x-4 max-w-sm mx-auto">
        {items.map((item) => (
          <Link key={item.title} href={item.link} className="group active:scale-90 transition-transform duration-200">
            <div className="flex flex-col items-center">
              
              {/* App Icon Container */}
              <div className="relative w-[72px] h-[72px] md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center p-3
                shadow-[0_8px_30px_rgb(0,0,0,0.06)] 
                border-b-[3px] border-slate-100 
                group-hover:shadow-lg transition-all">
                
                {/* Subtle Glow Effect behind image */}
                <div className="absolute inset-0 bg-brand/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-contain relative z-10"
                />
              </div>

              {/* Icon Label */}
              <p className="text-[11px] font-bold text-slate-700 mt-3 text-center leading-tight tracking-tight px-1">
                {item.title}
              </p>
              
            </div>
          </Link>
        ))}
      </div>

      {/* 2. Footer Section (Matches Reference Image) */}
      <div className="mt-16 text-center">
        <div className="w-full h-[1px] bg-slate-200 mb-8 max-w-[200px] mx-auto"></div>
        <h2 className="text-[#5B21B6] font-black text-xl uppercase tracking-tight opacity-90">
          Select an Option
        </h2>
      </div>

    </div>
  )
}