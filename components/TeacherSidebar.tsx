'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  FiHome, FiUser, FiClock, FiActivity, FiBookOpen,
  FiCalendar, FiEdit3, FiFileText, FiUsers,
  FiBell, FiCheckSquare, FiX, FiImage, FiPhoneCall,
  FiSun, FiMoon
} from 'react-icons/fi'

type Props = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function TeacherSidebar({ activeMenu, setActiveMenu, isOpen, setIsOpen }: Props) {
  const pathname = usePathname()
  const [isDarkMode, setIsDarkMode] = useState(false)

  /* SYNC THEME STATE WITH DOCUMENT */
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isDark)
  }, [])

  /* CLOSE SIDEBAR ON ROUTE CHANGE */
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, setIsOpen])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/teacher', group: 'Overview' },
    { id: 'profile', label: 'My Profile', icon: <FiUser />, path: '/teacher/profile', group: 'Personal' },
    { id: 'gallery', label: 'School Gallery', icon: <FiImage />, path: '/teacher/gallery' },
    { id: 'timetable', label: 'Timetable', icon: <FiClock />, path: '/teacher/timetable', group: 'Workspace' },
    { id: 'calendar', label: 'Academic Calendar', icon: <FiCalendar />, path: '/teacher/calendar', group: 'Workspace' },
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/teacher/attendance', group: 'Workspace' },
    { id: 'notices', label: 'Notices', icon: <FiBell />, path: '/teacher/notices', group: 'Workspace' },
    { id: 'homework', label: 'Homework', icon: <FiEdit3 />, path: '/teacher/homework', group: 'Classroom' },
   // { id: 'assignments', label: 'Assignments', icon: <FiBookOpen />, path: '/teacher/assignments', group: 'Classroom' },
    { id: 'student-profiles', label: 'Student Profiles', icon: <FiUsers />, path: '/teacher/students', group: 'Classroom' },
    { id: 'exam-syllabus', label: 'Exam Syllabus', icon: <FiFileText />, path: '/teacher/syllabus', group: 'Evaluation' },
    { id: 'exam-timetable', label: 'Exam Timetable', icon: <FiClock />, path: '/teacher/exam-timetable', group: 'Evaluation' },
    { id: 'marks-entry', label: 'Marks Entry', icon: <FiCheckSquare />, path: '/teacher/marks', group: 'Evaluation' },
    { id: 'contact', label: 'Contact School', icon: <FiPhoneCall />, path: '/teacher/contact', group: 'Personal' },
  ]

  const groups = ['Overview', 'Personal', 'Workspace', 'Classroom', 'Evaluation']

  const handleLinkClick = (id: string) => {
    setActiveMenu(id)
    setIsOpen(false)
  }

  return (
    <>
      {/* OVERLAY: Using the 60% black with blur as requested */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR: bg-brand for light, deep slate for dark */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 lg:w-64
        flex flex-col shadow-2xl z-[58] transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDarkMode
            ? 'bg-slate-900 border-r border-slate-800 text-slate-100'
            : 'bg-brand text-white'
          }`}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 bg-black/10 dark:bg-white/10 rounded-full"
        >
          <FiX size={20} />
        </button>

        {/* LOGO SECTION */}
        <div className={`p-6 flex flex-col items-center border-b transition-colors
          ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-white/10 bg-black/20'}`}>

          <div className="w-16 h-16 bg-white rounded-2xl p-2 mb-3 shadow-lg">
            <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h2 className={`text-md font-black text-center leading-tight
            ${isDarkMode ? 'text-slate-100' : 'text-white'}`}>
            Prashanti Vidyalaya & High School.
          </h2>

          <span className={`text-[9px] tracking-[0.2em] uppercase mt-1 font-bold
            ${isDarkMode ? 'text-slate-500' : 'text-white/60'}`}>
            Teacher Portal
          </span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          {groups.map(group => {
            const groupItems = menuItems.filter(item => item.group === group)
            if (groupItems.length === 0) return null

            return (
              <div key={group} className="mb-5">
                <h3 className={`px-4 text-[10px] font-black uppercase tracking-[0.2em] mb-2
                  ${isDarkMode ? 'text-slate-600' : 'text-white/30'}`}>
                  {group}
                </h3>

                <div className="flex flex-col gap-1">
                  {groupItems.map(({ id, label, icon, path }) => (
                    <Link key={id} href={path}>
                      <button
                        onClick={() => handleLinkClick(id)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-all w-full
                        ${activeMenu === id
                            ? (isDarkMode
                              ? 'bg-brand text-white font-black shadow-lg shadow-brand/20'
                              : 'bg-white text-brand font-black shadow-xl')
                            : (isDarkMode
                              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                              : 'text-white/80 hover:bg-white/10 hover:text-white')
                          }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <span className="truncate">{label}</span>
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* BOTTOM SECTION & THEME TOGGLE */}
        <div className={`p-4 border-t transition-colors
          ${isDarkMode ? 'border-slate-800 bg-slate-950/30' : 'border-white/10 bg-black/10'}`}>

          <button
            onClick={toggleTheme}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-sm border
              ${isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-750'
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <FiSun className="text-yellow-400" /> : <FiMoon className="text-white" />}
              <span className="font-bold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>

            <div className={`w-8 h-4 rounded-full relative transition-colors 
              ${isDarkMode ? 'bg-brand' : 'bg-white/40'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all 
                ${isDarkMode ? 'right-1' : 'left-1'}`} />
            </div>
          </button>

          <div className={`text-[8px] text-center font-bold tracking-widest uppercase mt-4
            ${isDarkMode ? 'text-slate-600' : 'text-white/30'}`}>
            Powered by RAKVH Solutions
          </div>
        </div>
      </aside>
    </>
  )
}