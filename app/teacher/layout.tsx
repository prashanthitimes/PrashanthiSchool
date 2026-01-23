'use client'

import React, { useState, useRef, useEffect } from 'react'
import TeacherSidebar from '@/components/TeacherSidebar'
import { FiUser, FiLogOut, FiSearch, FiChevronDown, FiSettings, FiBell, FiBook } from 'react-icons/fi'
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

  // 1. Fetch Teacher Name and Dept from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('teacherName')
    const savedDept = localStorage.getItem('teacherDept') // Make sure this is saved during login
    
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
    localStorage.clear() // Clears teacherName, teacherEmail, etc.
    router.push('/teacherlogin')
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD] font-sans text-slate-900">
      <TeacherSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        
        <header 
          className={`sticky top-0 z-40 transition-all duration-300 px-8 h-20 flex items-center justify-between
          ${isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 h-16' 
            : 'bg-transparent'}`}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>Teacher</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand">Portal</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 capitalize leading-tight">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all">
              <FiSearch className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-56 placeholder:text-slate-400 font-medium"
              />
            </div>

            <button className="relative p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand transition-all shadow-sm">
              <FiBell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* DYNAMIC PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <div className="h-9 w-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20 font-bold">
                  {teacherData.name.charAt(0)}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {teacherData.name}
                  </p>
                  <p className="text-[10px] text-brand font-bold mt-1 uppercase tracking-wider">
                    {teacherData.dept}
                  </p>
                </div>
                <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-5 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Details</p>
                    <p className="text-xs font-bold text-slate-600 truncate">{localStorage.getItem('teacherEmail')}</p>
                  </div>
                  
                  <button 
                    onClick={() => router.push('/teacher/profile')}
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

        <main className="px-8 pb-12 pt-4 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </div>
          </div>
        </main>

        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </div>
  )
}