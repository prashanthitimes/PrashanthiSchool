'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FiHome, FiUser, FiEdit3, FiActivity, FiCheckSquare,
  FiCalendar, FiCreditCard, FiBell, FiTruck, FiPhoneCall,
  FiBookOpen, FiClock, FiMap
} from 'react-icons/fi'

type Props = {
  activeMenu: string
  setActiveMenu: (menu: string) => void
}

export default function ParentSidebar({ activeMenu, setActiveMenu }: Props) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome />, path: '/parent' },
    { id: 'student-profile', label: 'Student Profile', icon: <FiUser />, path: '/parent/profile' },
    { id: 'homework', label: 'Homework', icon: <FiEdit3 />, path: '/parent/homework' },
    { id: 'attendance', label: 'Attendance', icon: <FiActivity />, path: '/parent/attendance' },
    { id: 'class-timetable', label: 'Class Time Table', icon: <FiClock />, path: '/parent/timetable' },
    { id: 'exam-timetable', label: 'Exam Time Table', icon: <FiCalendar />, path: '/parent/exams' },
    { id: 'syllabus', label: 'Exam Syllabus', icon: <FiBookOpen />, path: '/parent/syllabus' },
    { id: 'marks', label: 'Exam Markscard', icon: <FiCheckSquare />, path: '/parent/marks' },
    { id: 'annual-calendar', label: 'Annual Calendar', icon: <FiMap />, path: '/parent/calendar' },
    { id: 'fees', label: 'Fee Details', icon: <FiCreditCard />, path: '/parent/fees' },
    { id: 'transport', label: 'Transport', icon: <FiTruck />, path: '/parent/transport' },
    { id: 'notices', label: 'Notice', icon: <FiBell />, path: '/parent/notices' },
    { id: 'contact', label: 'Contact School', icon: <FiPhoneCall />, path: '/parent/contact' },
  ]

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-brand text-white flex-col shadow-2xl z-50">

      <div className="p-6 flex flex-col items-center border-b border-white/10">
        <img src="/Schoollogo.jpg" className="w-14 mb-2"/>
        <h2 className="font-bold">Prashanthi School</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.id} href={item.path}>
            <div
              onClick={() => setActiveMenu(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
              ${activeMenu === item.id ? 'bg-white text-brand font-bold' : 'hover:bg-white/10'}`}
            >
              {item.icon}
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

    </aside>
  )
}