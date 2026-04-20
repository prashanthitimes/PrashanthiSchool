'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation' // Added to track current URL
import {
  FiUsers, FiShield, FiBook, FiClipboard, FiCalendar, FiSettings,
  FiTruck,  FiHome, FiUserCheck, FiUser,FiDatabase,
  FiActivity, FiLayers, FiImage, FiCreditCard, FiCamera, FiX,
  FiSun, FiMoon,FiFileText// Added for Theme Toggle
} from 'react-icons/fi'
import { FiClock } from 'react-icons/fi'
import { IndianRupee } from 'lucide-react'

type Props = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export default function AdminSidebar({ activeMenu, setActiveMenu, isOpen, setIsOpen }: Props) {
  const pathname = usePathname() // Get current path
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 1. Fix: Sync activeMenu with the URL on refresh
  useEffect(() => {
    const currentItem = menuItems.find(item => item.path === pathname)
    if (currentItem) {
      setActiveMenu(currentItem.id)
    }
  }, [pathname])

  // 2. Initialize Theme and Permissions
  useEffect(() => {
    const savedPerms = localStorage.getItem('adminPerms')
    if (savedPerms) {
      setPermissions(JSON.parse(savedPerms))
    }

    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    }
  }, [])

  // 3. Functional Theme Toggle
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
  { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/admin', group: 'Overview' },

  // SYSTEM
  { id: 'admin-management', label: 'Admin Management', icon: <FiShield />, path: '/admin/management', group: 'System' },

  // ACADEMICS
  { id: 'teachers', label: 'Teachers', icon: <FiUsers />, path: '/admin/teachers', group: 'Academics' },
  { id: 'students', label: 'Students', icon: <FiUser />, path: '/admin/students', group: 'Academics' },
  { id: 'classes-sections', label: 'Classes & Sections', icon: <FiLayers />, path: '/admin/classes', group: 'Academics' },
  { id: 'subjects', label: 'Subjects', icon: <FiBook />, path: '/admin/subjects', group: 'Academics' },
  { id: 'timetable', label: 'Time Table', icon: <FiClock />, path: '/admin/timetable', group: 'Academics' },

  // OPERATIONS
  { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/admin/attendance', group: 'Operations' },
  { id: 'exam-registry', label: 'Exam Setup', icon: <FiSettings />, path: '/admin/exams', group: 'Operations' },
  { id: 'exam-schedule', label: 'Exam Time Table', icon: <FiCalendar />, path: '/admin/examtimetable', group: 'Operations' },
  {
    id: 'fee-setup',
    label: 'Fee Setup',
    icon: <FiFileText size={16} />,
    path: '/admin/FeeTypeManager',
    group: 'Operations'
  },
  { id: 'payment-scanner', label: 'Scanner Setup', icon: <FiCamera />, path: '/admin/scanner', group: 'Operations' },

  // ✅ DATA CENTER (NEW CLEAN TAB)
  {
    id: 'exams-marks',
    label: 'Marks Ledger',
    icon: <FiClipboard />,
    path: '/admin/examsmarks',
    group: 'Data Center'
  },
  {
    id: 'fee-management',
    label: 'Fee Management',
    icon: <IndianRupee size={16} />,
    path: '/admin/fees',
    group: 'Data Center'
  },
  {
    id: 'fee-ledger',
    label: 'Fee Ledger',
    icon: <FiCreditCard />,
    path: '/admin/viewfeesdeatils',
    group: 'Data Center'
  },

  // LOGISTICS
  { id: 'transport', label: 'Transport', icon: <FiTruck />, path: '/admin/transport', group: 'Logistics' },

  // COMMUNICATION
  { id: 'notices-circulars', label: 'Notices', icon: <FiFileText />, path: '/admin/notices', group: 'Communication' },
  { id: 'calendar', label: 'Calendar', icon: <FiCalendar />, path: '/admin/calendar', group: 'Communication' },
  { id: 'photo-gallery', label: 'Photo Gallery', icon: <FiImage />, path: '/admin/gallery', group: 'Communication' },

  // SYSTEM
  { id: 'settings', label: 'Settings', icon: <FiSettings />, path: '/admin/settings', group: 'System' },
  { id: 'data-manager', label: 'Data Manager', icon: <FiDatabase />, path: '/admin/data-manager', group: 'Data Clear' }
]

 const visibleMenu = menuItems.filter(item => {
  if (item.id === 'dashboard' || item.id === 'data-manager') return true
  return permissions[item.id] === true
})

  const groups = ['Overview', 'Academics', 'Operations', 'Data Center', 'Logistics', 'Communication', 'System', 'Data Clear']

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col shadow-2xl z-[70] transition-all duration-300 lg:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        /* Palette Mapping */
        bg-[#fffcfd] dark:bg-slate-950 border-r border-[#e9d1e4] dark:border-slate-800`}>

        {/* --- HEADER SECTION --- */}
        <div className="p-6 flex flex-col items-center border-b relative transition-colors
          border-[#e9d1e4] dark:border-slate-800 bg-white dark:bg-slate-900">

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute right-4 top-4 text-slate-400 dark:text-slate-500"
          >
            <FiX size={20} />
          </button>

          <div className="w-16 h-16 bg-white rounded-2xl p-2 mb-3 shadow-sm border border-[#e9d1e4] dark:border-slate-700">
            <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-md font-black text-center text-slate-800 dark:text-slate-100">
            Prashanti Vidyalaya & High School.
          </h2>
        </div>

        {/* --- NAVIGATION SECTION --- */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          {groups.map(groupName => {
            const groupItems = visibleMenu.filter(item => item.group === groupName)
            if (groupItems.length === 0) return null

            return (
              <div key={groupName} className="mb-5">
                <h3 className="px-4 text-xs font-bold uppercase mb-2 text-slate-400 dark:text-slate-500">
                  {groupName}
                </h3>
                <div className="flex flex-col gap-1">
                  {groupItems.map(({ id, label, icon, path }) => (
                    <Link key={id} href={path}>
                      <button
                        onClick={() => { setActiveMenu(id); setIsOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full transition-all
                        ${activeMenu === id
                            ? 'bg-brand text-white font-bold shadow-lg shadow-brand/20'
                            : 'text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                      >
                        <span className={activeMenu === id ? 'text-white' : 'text-brand dark:text-brand-soft'}>
                          {icon}
                        </span>
                        <span>{label}</span>
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* --- THEME TOGGLE FOOTER --- */}
        <div className="p-4 border-t border-[#e9d1e4] dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-sm
              bg-slate-50 dark:bg-slate-950 hover:opacity-80 text-slate-800 dark:text-slate-100 border border-[#e9d1e4] dark:border-slate-800"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <FiSun className="text-yellow-500" /> : <FiMoon className="text-brand" />}
              <span className="font-bold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>

            {/* Toggle Track */}
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-brand' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
            </div>
          </button>
        </div>
      </aside>
    </>
  )
}