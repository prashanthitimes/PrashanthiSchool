'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useRef, useEffect } from 'react'
import ParentSidebar from '@/components/ParentSidebar'
import ParentMobileDashboard from '@/components/ParentMobileDashboard'
import { FiUser, FiLogOut, FiChevronDown, FiHeart, FiArrowLeft } from 'react-icons/fi'
import Link from "next/link";

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
  const pathname = usePathname()

  useEffect(() => {
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
      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block">
        <ParentSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64">
        
        {/* ENHANCED HEADER - MOBILE FRIENDLY */}
        <header
          className={`sticky top-0 z-40 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between transition-all duration-300
          ${isScrolled
              ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200'
              : 'bg-white lg:bg-transparent border-b lg:border-none border-slate-100'}`}
        >
          {/* LEFT: BACK BUTTON OR MOBILE BRANDING */}
          <div className="flex items-center gap-3">
            {pathname !== "/parent" ? (
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
              >
                <FiArrowLeft size={20} className="text-slate-600" />
              </button>
            ) : (
              /* MOBILE BRANDING (Only visible on Dashboard /parent) */
              <div className="flex lg:hidden items-center gap-2">
                <div className="w-9 h-9 bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
                   <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                   <h1 className="text-[13px] font-black text-slate-800 leading-none uppercase">Prashanthi</h1>
                   <span className="text-[9px] font-bold text-brand tracking-tighter uppercase opacity-70">Parental Panel</span>
                </div>
              </div>
            )}

            {/* DESKTOP PAGE TITLE */}
            <h2 className="hidden lg:block text-xl font-black text-slate-800 capitalize">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          {/* RIGHT: PROFILE ACTIONS */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* CHILD INFO - HIDDEN ON SMALL MOBILE */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-brand/5 border border-brand/10 rounded-xl">
              <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/20">
                <FiHeart size={12} />
              </div>
              <p className="text-xs font-black text-slate-700 truncate max-w-[100px]">{childName}</p>
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 md:p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand/30 transition-all"
              >
                <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand/20">
                  <FiUser size={16} />
                </div>
                <div className="hidden md:block text-left pr-1">
                   <p className="text-[11px] font-black text-slate-800 leading-none">{parentName}</p>
                </div>
                <FiChevronDown className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-4 py-2 border-b border-slate-50 mb-1 lg:hidden">
                     <p className="text-[10px] font-bold text-slate-400 uppercase">Signed in as</p>
                     <p className="text-xs font-black text-slate-800">{parentName}</p>
                  </div>
                  
                  <Link href="/parent/profile">
                    <button className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors">
                      <FiUser size={14} /> Profile Settings
                    </button>
                  </Link>

                  <div className="border-t border-slate-50 my-1 mx-2"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-50 transition-colors font-bold"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="px-4 md:px-8 pb-12 pt-4 flex-1">
          {/* MOBILE DASHBOARD - Shown only on /parent path for small screens */}
          {pathname === "/parent" && (
            <div className="lg:hidden">
              {/* HELLO BANNER FOR MOBILE */}
              <div className="mb-6 px-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  Hello, <span className="text-brand uppercase">{parentName}!</span>
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Academic overview for {childName}
                </p>
              </div>
              <ParentMobileDashboard />
            </div>
          )}

          {/* MAIN PAGE CONTENT (CHILDREN) */}
          <div className={`${pathname === "/parent" ? "hidden lg:block" : "block"} max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-500`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}