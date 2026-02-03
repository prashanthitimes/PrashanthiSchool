'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  FiUsers, FiShield, FiBook, FiClipboard, FiCalendar, FiSettings, 
  FiDollarSign, FiTruck, FiFileText, FiHome, FiUserCheck, FiUser,
  FiUserPlus, FiBookOpen, FiActivity, FiLayers, FiImage // Added FiImage
} from 'react-icons/fi'
import { FiClock } from 'react-icons/fi'

type Props = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
}

export default function AdminSidebar({ activeMenu, setActiveMenu }: Props) {
  const [role, setRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const savedRole = localStorage.getItem('adminRole')
    const savedPerms = localStorage.getItem('adminPerms')
    if (savedRole) setRole(savedRole)
    if (savedPerms) setPermissions(JSON.parse(savedPerms))
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/admin', group: 'Overview' },
    { id: 'admin-management', label: 'Admin Management', icon: <FiShield />, path: '/admin/management', group: 'System' },
    { id: 'teachers', label: 'Teachers', icon: <FiUsers />, path: '/admin/teachers', group: 'Academics' },
    { id: 'students', label: 'Students', icon: <FiUser />, path: '/admin/students', group: 'Academics' },
    { id: 'parents', label: 'Parents', icon: <FiUserCheck />, path: '/admin/parents', group: 'Academics' },
    { id: 'classes-sections', label: 'Classes & Sections', icon: <FiLayers />, path: '/admin/classes', group: 'Academics' },
    { id: 'subjects', label: 'Subjects', icon: <FiBook />, path: '/admin/subjects', group: 'Academics' },
 { id: 'time-table', label: 'Time Table', icon: <FiClock />, path: '/admin/timetable', group: 'Academics' },
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/admin/attendance', group: 'Operations' },
// Add these to your menuItems array
{ id: 'exam-setup', label: 'Exam Setup', icon: <FiSettings />, path: '/admin/exams', group: 'Operations' },
{ id: 'exam-timetable', label: 'Exam Time Table', icon: <FiCalendar />, path: '/admin/examtimetable', group: 'Operations' },
{ id: 'marks-ledger', label: 'Marks Ledger', icon: <FiClipboard />, path: '/admin/examsmarks', group: 'Operations' },    { id: 'fee-management', label: 'Fee Management', icon: <FiDollarSign />, path: '/admin/fees', group: 'Operations' },
    { id: 'transport', label: 'Transport', icon: <FiTruck />, path: '/admin/transport', group: 'Logistics' },
    { id: 'notices-circulars', label: 'Notices & Circulars', icon: <FiFileText />, path: '/admin/notices', group: 'Communication' },
    { id: 'calendar', label: 'Calendar', icon: <FiCalendar />, path: '/admin/calendar', group: 'Communication' },
    { id: 'photo-gallery', label: 'Photo Gallery', icon: <FiImage />, path: '/admin/gallery', group: 'Communication' },
//    { id: 'admissions-exit', label: 'Admissions & Exit', icon: <FiUserPlus />, path: '/admin/admissions', group: 'Entry/Exit' },
    { id: 'settings', label: 'Settings', icon: <FiSettings />, path: '/admin/settings', group: 'System' },
  ]

  const visibleMenu = menuItems.filter(item => {
    if (role === 'super_admin') return true
    if (item.id === 'dashboard') return true
    return permissions[item.id] === true
  })

  // Logical groups for the sidebar
  const groups = ['Overview', 'Academics', 'Operations', 'Logistics', 'Communication', 'Entry/Exit', 'System']

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-brand text-white flex flex-col shadow-2xl z-50 overflow-hidden">
      {/* BRANDING */}
      <div className="p-6 flex flex-col items-center border-b border-white/10 bg-black/20">
        <div className="w-16 h-16 relative mb-3 bg-white rounded-2xl p-2 overflow-hidden shadow-lg shadow-black/20">
          <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-md font-black text-center leading-tight">Prashanthi School</h2>
        <span className="text-[9px] text-white/60 tracking-[0.2em] uppercase mt-1 font-bold">
          {role?.replace('_', ' ')} Portal
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide px-3">
        {groups.map((groupName) => {
          const groupItems = visibleMenu.filter(item => item.group === groupName);
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
      
      <div className="p-4 border-t border-white/10 text-[10px] text-center text-white/30 font-bold bg-black/10 tracking-widest">
        © 2026 PRASHANTHI SCHOOL
      </div>
    </aside>
  )
}