'use client'

import React, { useState, useRef, useEffect } from 'react'
import TeacherSidebar from '@/components/TeacherSidebar'
import { FiUser, FiLogOut, FiSearch, FiChevronDown, FiSettings, FiBell } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [teacherData, setTeacherData] = useState({ name: 'Teacher', dept: 'Faculty' })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const savedName = localStorage.getItem('teacherName')
    const savedDept = localStorage.getItem('teacherDept')
    
    if (savedName) {
      setTeacherData({
        name: savedName,
        dept: savedDept || 'Faculty Member'
      })
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
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
    router.push('/teacherlogin')
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD] font-sans text-slate-900">
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Content Area: margin-left only on large screens */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative w-full overflow-x-hidden">
        
        <header 
          className={`sticky top-0 z-40 transition-all duration-300 px-4 md:px-8 h-20 flex items-center justify-between
          ${isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 h-16' 
            : 'bg-transparent'}
          /* Mobile spacing adjustment: push header content down on small screens if your Sidebar has a mobile header */
          mt-16 lg:mt-0`}
        >
          {/* LEFT: Breadcrumbs (Hidden or simplified on mobile) */}
          <div className="flex flex-col">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>Teacher</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand">Portal</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 capitalize leading-tight">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          {/* RIGHT: Search & Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - Icon only on mobile/tablet, full on desktop */}
            <div className="hidden md:flex lg:flex items-center bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all">
              <FiSearch className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-32 xl:w-56 placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand transition-all shadow-sm">
              <FiBell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 md:pr-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <div className="h-8 w-8 md:h-9 md:w-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20 font-bold text-sm">
                  {teacherData.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {teacherData.name.split(' ')[0]} {/* Show only first name on smaller desktops */}
                  </p>
                </div>
                <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 md:w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-5 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Details</p>
                    <p className="text-[11px] font-bold text-slate-600 truncate">{teacherData.name}</p>
                  </div>
                  
                  <button 
                    onClick={() => { router.push('/teacher/profile'); setIsProfileOpen(false); }}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors"
                  >
                    <FiUser size={14} /> My Profile
                  </button>
                  <button className="flex items-center gap-3 w-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors">
                    <FiSettings size={14} /> Settings
                  </button>
                  
                  <div className="border-t border-slate-50 my-1 mx-2"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="px-4 md:px-8 pb-12 pt-4 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </div>
          </div>
        </main>

        {/* Background Decorative Element - smaller on mobile */}
        <div className="fixed top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand/5 blur-[80px] md:blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </div>
  )
}