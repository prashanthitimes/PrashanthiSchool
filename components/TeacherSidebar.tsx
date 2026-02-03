'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FiHome, FiUser, FiClock, FiActivity, FiBookOpen, FiCalendar ,
  FiEdit3, FiFileText, FiUsers, FiBell, FiCheckSquare
} from 'react-icons/fi'

type Props = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
}

export default function TeacherSidebar({ activeMenu, setActiveMenu }: Props) {
  const [role, setRole] = useState<string | null>('Teacher')

  // The specific Teacher Portal items mapped to the design
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/teacher', group: 'Overview' },
    
    { id: 'profile', label: 'My Profile', icon: <FiUser />, path: '/teacher/profile', group: 'Personal' },
    
{ id: 'timetable', label: 'Timetable', icon: <FiClock />, path: '/teacher/timetable', group: 'Workspace' },
    { id: 'calendar', label: 'Academic Calendar', icon: <FiCalendar />, path: '/teacher/calendar', group: 'Workspace' }, // Added Calendar
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/teacher/attendance', group: 'Workspace' },
    { id: 'notices', label: 'Notices', icon: <FiBell />, path: '/teacher/notices', group: 'Workspace' },
    { id: 'homework', label: 'Homework', icon: <FiEdit3 />, path: '/teacher/homework', group: 'Classroom' },
    { id: 'assignments', label: 'Assignments', icon: <FiBookOpen />, path: '/teacher/assignments', group: 'Classroom' },
    { id: 'student-profiles', label: 'Student Profiles', icon: <FiUsers />, path: '/teacher/students', group: 'Classroom' },
    
// ... inside your menuItems array ...
{ id: 'exam-syllabus', label: 'Exam Syllabus', icon: <FiFileText />, path: '/teacher/syllabus', group: 'Evaluation' },
{ id: 'exam-timetable', label: 'Exam Timetable', icon: <FiClock />, path: '/teacher/exam-timetable', group: 'Evaluation' }, // Added this
{ id: 'marks-entry', label: 'Marks Entry', icon: <FiCheckSquare />, path: '/teacher/marks', group: 'Evaluation' },
 ]

  // Logical groups for the teacher layout
  const groups = ['Overview', 'Personal', 'Workspace', 'Classroom', 'Evaluation']

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand text-white flex flex-col shadow-2xl z-50 overflow-hidden">
      {/* BRANDING */}
      <div className="p-6 flex flex-col items-center border-b border-white/10 bg-black/20">
        <div className="w-16 h-16 relative mb-3 bg-white rounded-2xl p-2 overflow-hidden shadow-lg shadow-black/20">
          <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-md font-black text-center leading-tight">Prashanthi School</h2>
        <span className="text-[9px] text-white/60 tracking-[0.2em] uppercase mt-1 font-bold">
          Teacher Portal
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide px-3">
        {groups.map((groupName) => {
          const groupItems = menuItems.filter(item => item.group === groupName);
          if (groupItems.length === 0) return null;

          return (
            <div key={groupName} className="mb-5">
              <h3 className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">
                {groupName}
              </h3>
              <div className="flex flex-col gap-1">
                {groupItems.map(({ id, label, icon, path }) => (
                  <Link key={id} href={path} className="w-full">
                    <button
                      onClick={() => setActiveMenu(id)}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group w-full ${
                        activeMenu === id 
                          ? 'bg-white text-brand shadow-xl font-black scale-[1.02]' 
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span className={`text-xl ${activeMenu === id ? 'text-brand' : 'text-white/40 group-hover:text-white'}`}>
                        {icon}
                      </span>
                      <span className="truncate">{label}</span>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      
      {/* FOOTER */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="text-[8px] text-center text-white/20 font-bold tracking-widest uppercase mb-1">
          Powered by RAKVH Solutions
        </div>
        <div className="text-[9px] text-center text-white/40 font-bold tracking-widest">
          © 2026 PRASHANTHI SCHOOL
        </div>
      </div>
    </aside>
  )
}