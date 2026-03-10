'use client'

import React, { useState, useRef, useEffect } from 'react'
import TeacherSidebar from '@/components/TeacherSidebar'
import { FiUser, FiLogOut, FiMenu, FiArrowLeft } from 'react-icons/fi'
import { useRouter, usePathname } from 'next/navigation'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [teacherData, setTeacherData] = useState({ name: 'Teacher', dept: 'Faculty' })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const path = pathname.split('/').pop() || 'dashboard'
    setActiveMenu(path === 'teacher' ? 'dashboard' : path)
  }, [pathname])

  useEffect(() => {
    const savedName = localStorage.getItem('teacherName')
    const savedDept = localStorage.getItem('teacherDept')
    if (savedName) {
      setTeacherData({ name: savedName, dept: savedDept || 'Faculty Member' })
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden">
      
      <TeacherSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64 w-full">
        
        {/* HEADER - ADDED SAFE AREA PADDING TOP */}
        <header
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
            height: isScrolled ? 'calc(env(safe-area-inset-top) + 4rem)' : 'calc(env(safe-area-inset-top) + 5rem)' 
          }}
          className={`fixed top-0 right-0 z-40 px-3 md:px-8 flex items-center justify-between
          w-full lg:w-[calc(100%-16rem)] transition-all duration-300
          ${isScrolled 
              ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b dark:border-slate-800' 
              : 'bg-white lg:bg-transparent'}`}
        >
          {/* LEFT SIDE */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-brand shrink-0 shadow-sm"
            >
              <FiMenu size={20} />
            </button>

            <button
              onClick={() => router.back()}
              className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 shrink-0 shadow-sm"
            >
              <FiArrowLeft size={20} />
            </button>

            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-black capitalize truncate">
                {activeMenu.replace(/-/g, ' ')}
              </h2>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border bg-white border-[#e9d1e4] text-red-500 dark:bg-slate-800 dark:border-slate-700 shadow-sm"
            >
              <FiLogOut size={18} />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 border rounded-xl bg-white border-[#e9d1e4] dark:bg-slate-800 dark:border-slate-700 shadow-sm"
              >
                <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center text-white shrink-0">
                  <FiUser size={16} />
                </div>
                <div className="text-left hidden sm:block pr-1">
                  <p className="text-xs font-bold leading-tight truncate max-w-[80px]">
                    {teacherData.name}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT - INCREASED TOP MARGIN TO ACCOUNT FOR TALLER HEADER */}
        <main 
          style={{ marginTop: 'calc(env(safe-area-inset-top) + 5.5rem)' }}
          className="px-4 pb-10 flex-1"
        >
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}