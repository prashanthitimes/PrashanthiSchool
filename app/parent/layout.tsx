'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useRef, useEffect } from 'react'
import ParentSidebar from '@/components/ParentSidebar'
import ParentMobileDashboard from '@/components/ParentMobileDashboard'
import { FiUser, FiLogOut, FiArrowLeft, FiHeart, FiSun, FiMoon } from 'react-icons/fi'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [parentName, setParentName] = useState('Parent')
  const [childName, setChildName] = useState('Student')
  const [isDarkMode, setIsDarkMode] = useState(false) // Added state

  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // THEME LOGIC: Sync with HTML class
  useEffect(() => {
    const root = window.document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

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
    router.push('/login')
  }

  return (
    /* MAIN CANVAS BACKGROUND: bg-[#fffcfd] | dark:bg-slate-950 */
    <div className="flex  bg-[#fffcfd] dark:bg-slate-950 font-sans transition-colors duration-500">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block">
        <ParentSidebar />      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col  relative lg:ml-64">

        {/* ENHANCED HEADER */}
        <header
          className={`sticky top-[20px] z-40 px-4 md:px-8 h-12 md:h-14 flex items-center justify-between transition-all duration-300
  ${isScrolled ? 'bg-white/90 shadow-sm' : 'bg-transparent'}`}
        >
          {/* LEFT: BACK BUTTON OR MOBILE BRANDING */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
            >
              <FiArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>

            <div className="flex lg:hidden items-center gap-2">
              <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700 shadow-sm">
                <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-none uppercase">Prashanti Vidyalaya</h1>
                <span className="text-[9px] font-bold text-brand dark:text-brand-soft tracking-tighter uppercase opacity-70">Parental Panel</span>
              </div>
            </div>

            <h2 className="hidden lg:block text-xl font-black text-slate-800 dark:text-slate-100 capitalize">
              {pathname.split('/').pop()?.replace('-', ' ')}            </h2>
          </div>

          {/* RIGHT: THEME TOGGLE, LOGOUT, PROFILE */}
          <div className="flex items-center gap-2 md:gap-4">

            {/* THEME TOGGLE BUTTON - MOBILE ONLY */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="md:hidden p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-[#e9d1e4] dark:border-slate-700 text-slate-600 dark:text-yellow-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
              title="Toggle Theme"
            >
              {isDarkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-[#e9d1e4] dark:border-slate-700 text-red-500 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiLogOut size={14} />
            </button>

            {/* CHILD INFO */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-brand/5 dark:bg-slate-800/50 border border-brand/10 dark:border-slate-700 rounded-xl">
              <div className="w-7 h-7 bg-brand dark:bg-brand-soft rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/20">
                <FiHeart size={12} />
              </div>
              <p className="text-xs font-black text-slate-700 dark:text-slate-100 truncate max-w-[100px]">
                {childName}
              </p>
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 md:p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-brand/30 dark:hover:border-brand-soft/50 transition-all"
              >
                <div className="h-8 w-8 bg-brand dark:bg-brand-soft rounded-lg flex items-center justify-center text-white shadow-md shadow-brand/10">
                  <FiUser size={16} />
                </div>

                <div className="hidden md:block text-left pr-1">
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-none">
                    {parentName}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        {/* CONTENT AREA */}
        <main className={`px-4 md:px-8 flex-1 w-full ${pathname === "/parent" ? "pb-4 pt-8 md:pt-8" : "pb-4 pt-6 md:pt-8"}`}>
          {pathname === "/parent" && (
            <div className="lg:hidden">
              {/* Reduced margin-bottom from mb-6 to mb-2 */}
              <div className="mb-2 px-1 text-center">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  Hello, <span className="text-brand dark:text-brand-soft uppercase">{parentName}!</span>
                </h3>
                {/* Hidden on mobile to save space */}
                <p className="hidden xs:block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                  Academic overview for {childName}
                </p>
              </div>
              <ParentMobileDashboard />
            </div>
          )}

          {/* Ensure the container doesn't add extra height */}
          <div className={`${pathname === "/parent" ? "hidden lg:block" : "block"} max-w-8xl mx-auto h-full`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}