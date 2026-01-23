'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FiHome, FiUser, FiEdit3, FiActivity, FiCheckSquare, 
  FiCalendar, FiCreditCard, FiBell, FiTruck, FiPhoneCall, FiLogOut 
} from 'react-icons/fi'

type Props = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
}

export default function ParentSidebar({ activeMenu, setActiveMenu }: Props) {
  const [childName, setChildName] = useState<string | null>(null)

  useEffect(() => {
    const savedChildName = localStorage.getItem('childName')
    if (savedChildName) setChildName(savedChildName)
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/parent', group: 'Overview' },
    
    { id: 'student-profile', label: 'Student Profile', icon: <FiUser />, path: '/parent/profile', group: 'Personal' },
    
    { id: 'homework', label: 'Homework', icon: <FiEdit3 />, path: '/parent/homework', group: 'Academic' },
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/parent/attendance', group: 'Academic' },
    { id: 'marks', label: 'Exam Marks', icon: <FiCheckSquare />, path: '/parent/marks', group: 'Academic' },
    { id: 'exam-calendar', label: 'Exam Calendar', icon: <FiCalendar />, path: '/parent/exams', group: 'Academic' },
    
    { id: 'fees', label: 'Fee Details', icon: <FiCreditCard />, path: '/parent/fees', group: 'Finance' },
    { id: 'transport', label: 'Transport', icon: <FiTruck />, path: '/parent/transport', group: 'Services' },
    
    { id: 'notices', label: 'Notices', icon: <FiBell />, path: '/parent/notices', group: 'Communication' },
    { id: 'contact', label: 'Contact School', icon: <FiPhoneCall />, path: '/parent/contact', group: 'Communication' },
  ]

  const groups = ['Overview', 'Personal', 'Academic', 'Finance', 'Services', 'Communication']

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand text-white flex flex-col shadow-2xl z-50 overflow-hidden">
      {/* BRANDING */}
      <div className="p-6 flex flex-col items-center border-b border-white/10 bg-black/20">
        <div className="w-16 h-16 relative mb-3 bg-white rounded-2xl p-2 overflow-hidden shadow-lg shadow-black/20">
          <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-md font-black text-center leading-tight">Prashanthi School</h2>
        <span className="text-[9px] text-white/60 tracking-[0.2em] uppercase mt-1 font-bold">
          Parent Portal
        </span>
        {childName && (
            <div className="mt-3 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                <p className="text-[10px] font-black text-brand-soft truncate max-w-[140px]">
                   {childName}
                </p>
            </div>
        )}
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
        <div className="text-[9px] text-center text-white/40 font-bold tracking-widest uppercase">
          © 2026 Parent Connect
        </div>
      </div>
    </aside>
  )
}