'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FiUsers, FiShield, FiBook, FiClipboard, FiCalendar, FiSettings,
  FiTruck, FiFileText, FiHome, FiUserCheck, FiUser,
  FiActivity, FiLayers, FiImage, FiCreditCard, FiCamera, FiX
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

  const [permissions, setPermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const savedPerms = localStorage.getItem('adminPerms')
    if (savedPerms) {
      setPermissions(JSON.parse(savedPerms))
    }
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/admin', group: 'Overview' },
    { id: 'admin-management', label: 'Admin Management', icon: <FiShield />, path: '/admin/management', group: 'System' },
    { id: 'teachers', label: 'Teachers', icon: <FiUsers />, path: '/admin/teachers', group: 'Academics' },
    { id: 'students', label: 'Students', icon: <FiUser />, path: '/admin/students', group: 'Academics' },
    { id: 'parents', label: 'Parents', icon: <FiUserCheck />, path: '/admin/parents', group: 'Academics' },
    { id: 'classes-sections', label: 'Classes & Sections', icon: <FiLayers />, path: '/admin/classes', group: 'Academics' },
    { id: 'subjects', label: 'Subjects', icon: <FiBook />, path: '/admin/subjects', group: 'Academics' },
    { id: 'timetable', label: 'Time Table', icon: <FiClock />, path: '/admin/timetable', group: 'Academics' },
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/admin/attendance', group: 'Operations' },
    { id: 'exam-registry', label: 'Exam Setup', icon: <FiSettings />, path: '/admin/exams', group: 'Operations' },
    { id: 'exam-schedule', label: 'Exam Time Table', icon: <FiCalendar />, path: '/admin/examtimetable', group: 'Operations' },
    { id: 'exams-marks', label: 'Marks Ledger', icon: <FiClipboard />, path: '/admin/examsmarks', group: 'Operations' },
    { id: 'fee-management', label: 'Fee Management', icon: <IndianRupee />, path: '/admin/fees', group: 'Operations' },
    { id: 'fee-ledger', label: 'Fee Ledger', icon: <FiCreditCard />, path: '/admin/viewfeesdeatils', group: 'Operations' },
    { id: 'payment-scanner', label: 'Scanner Setup', icon: <FiCamera />, path: '/admin/scanner', group: 'Operations' },
    { id: 'transport', label: 'Transport', icon: <FiTruck />, path: '/admin/transport', group: 'Logistics' },
    { id: 'notices-circulars', label: 'Notices', icon: <FiFileText />, path: '/admin/notices', group: 'Communication' },
    { id: 'calendar', label: 'Calendar', icon: <FiCalendar />, path: '/admin/calendar', group: 'Communication' },
    { id: 'photo-gallery', label: 'Photo Gallery', icon: <FiImage />, path: '/admin/gallery', group: 'Communication' },
    { id: 'settings', label: 'Settings', icon: <FiSettings />, path: '/admin/settings', group: 'System' },
  ]

  const visibleMenu = menuItems.filter(item => {
    if (item.id === 'dashboard') return true
    return permissions[item.id] === true
  })

  const groups = ['Overview', 'Academics', 'Operations', 'Logistics', 'Communication', 'System']

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 h-screen w-64 bg-brand text-white flex flex-col shadow-2xl z-[70] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-6 flex flex-col items-center border-b border-white/10 bg-black/20 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden absolute right-4 top-4"
          >
            <FiX size={20} />
          </button>

          <div className="w-16 h-16 bg-white rounded-2xl p-2 mb-3">
            <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-md font-black text-center">Prashanthi School</h2>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {groups.map(groupName => {
            const groupItems = visibleMenu.filter(item => item.group === groupName)
            if (groupItems.length === 0) return null

            return (
              <div key={groupName} className="mb-5">
                <h3 className="px-4 text-xs font-bold text-white/40 uppercase mb-2">{groupName}</h3>
                <div className="flex flex-col gap-1">
                  {groupItems.map(({ id, label, icon, path }) => (
                    <Link key={id} href={path}>
                      <button
                        onClick={() => { setActiveMenu(id); setIsOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full transition-all
                        ${activeMenu === id ? 'bg-white text-brand font-bold' : 'hover:bg-white/10'}`}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

      </aside>
    </>
  )
}