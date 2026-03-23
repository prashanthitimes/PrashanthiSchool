'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FiHome, FiUser, FiEdit3, FiActivity, FiCheckSquare,
  FiCalendar, FiCreditCard, FiBell, FiTruck, FiPhoneCall,
  FiBookOpen, FiClock, FiMap, FiSun, FiMoon, 
  FiImage // 1. Added FiImage for the gallery icon
} from 'react-icons/fi'
import { usePathname } from 'next/navigation'

export default function ParentSidebar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname()

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/parent' },
    { id: 'student-profile', label: 'Student Profile', icon: <FiUser />, path: '/parent/profile' },
    { id: 'homework', label: 'Homework', icon: <FiEdit3 />, path: '/parent/homework' },
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/parent/attendance' },
    // 2. Added Gallery Item here
    { id: 'gallery', label: 'School Gallery', icon: <FiImage />, path: '/parent/gallery' }, 
    { id: 'class-timetable', label: 'Class Time Table', icon: <FiClock />, path: '/parent/timetable' },
    { id: 'exam-timetable', label: 'Exam Time Table', icon: <FiCalendar />, path: '/parent/exams' },
    { id: 'syllabus', label: 'Exam Syllabus', icon: <FiBookOpen />, path: '/parent/syllabus' },
    { id: 'marks', label: 'Report Card', icon: <FiCheckSquare />, path: '/parent/marks' },
    { id: 'annual-calendar', label: 'Annual Calendar', icon: <FiMap />, path: '/parent/calendar' },
    { id: 'fees', label: 'Fee Details', icon: <FiCreditCard />, path: '/parent/fees' },
    { id: 'transport', label: 'Transport', icon: <FiTruck />, path: '/parent/transport' },
    { id: 'notices', label: 'Notice', icon: <FiBell />, path: '/parent/notices' },
    { id: 'contact', label: 'Contact School', icon: <FiPhoneCall />, path: '/parent/contact' },
  ]

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-brand dark:bg-slate-950 text-white flex-col shadow-2xl z-50 transition-colors duration-300">

      {/* --- SIDEBAR HEADER --- */}
      <div className="p-6 flex flex-col items-center border-b border-white/10 dark:bg-slate-900 ">
        <img src="/Schoollogo.jpg" className="w-14 mb-2 rounded-full border-2 border-white/20 dark:border-slate-700 p-1 bg-white" alt="School Logo" />
        <h2 className="font-bold text-center text-sm dark:text-slate-100 uppercase tracking-tight">Prashanti Vidyalaya</h2>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <Link key={item.id} href={item.path} className="block">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
            ${pathname === item.path
                  ? 'bg-white text-brand dark:bg-brand dark:text-white font-bold shadow-lg'
                  : 'hover:bg-white/10 text-white/80 hover:text-white'}
                `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* --- THEME TOGGLE FOOTER --- */}
      <div className="p-4 border-t border-white/10 dark:border-slate-800 bg-brand-dark/20 dark:bg-slate-900/50">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-sm
            bg-white/10 dark:bg-slate-950 hover:bg-white/20 dark:hover:bg-slate-900 text-white border border-white/10 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <FiSun className="text-yellow-400" size={18} />
            ) : (
              <FiMoon className="text-white/80" size={18} />
            )}
            <span className="font-bold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>

          <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-emerald-500' : 'bg-white/20'}`}>
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
        </button>
      </div>

    </aside>
  )
}