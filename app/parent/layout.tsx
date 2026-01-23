'use client'

import React, { useState, useRef, useEffect } from 'react'
import ParentSidebar from '@/components/ParentSidebar'
import { FiUser, FiLogOut, FiBell, FiChevronDown, FiSettings, FiHeart } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [parentName, setParentName] = useState('Parent')
  const [childName, setChildName] = useState('Student')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Load data from LocalStorage (saved during login)
    setParentName(localStorage.getItem('parentName') || 'Parent')
    setChildName(localStorage.getItem('childName') || 'Student')

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
    router.push('/login/parent')
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFF] font-sans text-slate-900">
      {/* SIDEBAR */}
      <ParentSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        
        {/* TOP BAR */}
        <header 
          className={`sticky top-0 z-40 transition-all duration-300 px-8 h-20 flex items-center justify-between
          ${isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 h-16' 
            : 'bg-transparent'}`}
        >
          {/* Breadcrumbs - Synced with Brand theme */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand">Parent</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 capitalize leading-tight">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Child Info Tag - Specific to Parents, using Brand color */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-brand/5 border border-brand/10 rounded-2xl">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/20">
                    <FiHeart size={14} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-brand uppercase tracking-widest opacity-60">Studying</p>
                    <p className="text-xs font-black text-slate-800">{childName}</p>
                </div>
            </div>

            {/* Notifications */}
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand hover:border-brand/30 transition-all shadow-sm">
              <FiBell size={20} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-9 w-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                  <FiUser size={18} />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-black text-slate-800 leading-none">{parentName}</p>
                  <p className="text-[10px] text-brand font-bold mt-1 uppercase tracking-wider italic">Family Member</p>
                </div>
                <FiChevronDown className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-5 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Account</p>
                  </div>
                  
                  <button className="flex items-center gap-3 w-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors">
                    <FiUser size={14} /> Profile Settings
                  </button>
                  <button className="flex items-center gap-3 w-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors">
                    <FiSettings size={14} /> App Preferences
                  </button>
                  
                  <div className="border-t border-slate-50 my-1 mx-2"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm text-rose-500 hover:bg-rose-50 transition-colors font-bold"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN PAGE CONTENT */}
        <main className="px-8 pb-12 pt-4 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
            </div>
          </div>
        </main>

        {/* Brand Background Blur */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </div>
  )
}