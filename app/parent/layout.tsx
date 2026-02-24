'use client'

import React, { useState, useRef, useEffect } from 'react'
import ParentSidebar from '@/components/ParentSidebar'
import { FiUser, FiLogOut, FiBell, FiChevronDown, FiSettings, FiHeart } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
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

  useEffect(() => {
    // Load data from LocalStorage
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
    // Updated redirect path to /login/parent
    router.push('/login/parent')
  }

  return (
    <div className="flex min-h-screen bg-[#FDFDFF] font-sans text-slate-900">
      {/* SIDEBAR - Ensure your ParentSidebar has the mobile logic we built earlier */}
      <ParentSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* MAIN WRAPPER - Changed ml-64 to lg:ml-64 to remove margin on mobile */}
      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64 transition-all duration-300">

        {/* TOP BAR - Adjusted padding for mobile (px-4 vs px-8) */}
        <header
          className={`sticky top-0 z-40 transition-all duration-300 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between
          ${isScrolled
              ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 !h-16'
              : 'bg-transparent'}`}
        >
          {/* Breadcrumbs - Hidden on very small screens to save space */}
          <div className="flex flex-col overflow-hidden">
            <div className="hidden xs:flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand">Parent</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 capitalize leading-tight truncate">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Child Info Tag - Hidden on mobile, only shown from md upwards */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-brand/5 border border-brand/10 rounded-2xl">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-brand rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/20">
                <FiHeart size={12} className="md:size-[14px]" />
              </div>
              <div className="hidden md:block">
                <p className="text-[9px] font-black text-brand uppercase tracking-widest opacity-60 leading-none mb-1">Studying</p>
                <p className="text-xs font-black text-slate-800">{childName}</p>
              </div>
            </div>


            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 md:p-1.5 md:pr-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-8 w-8 md:h-9 md:w-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                  <FiUser size={16} />
                </div>
                {/* Desktop Name Labels */}
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-black text-slate-800 leading-none">{parentName}</p>
                  <p className="text-[10px] text-brand font-bold mt-1 uppercase tracking-wider italic">Family Member</p>
                </div>
                <FiChevronDown className={`hidden md:block text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 md:w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="px-5 py-3 border-b border-slate-50 mb-1 sm:hidden">
                    <p className="text-xs font-black text-slate-800 truncate">{parentName}</p>
                    <p className="text-[9px] text-brand font-bold uppercase">{childName}'s Parent</p>
                  </div>
                  <Link href="/parent/profile" className="w-full">
                    <button className="flex items-center gap-3 w-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors">
                      <FiUser size={14} /> Profile Settings
                    </button>
                  </Link>
                 

                  <div className="border-t border-slate-50 my-1 mx-2"></div>
                  <Link href="/login" className="w-full">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm text-rose-500 hover:bg-rose-50 transition-colors font-bold"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN PAGE CONTENT - Responsive Padding */}
        <main className="px-4 md:px-8 pb-12 pt-4 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </div>
        </main>

        {/* Brand Background Blur - Hidden on mobile to improve performance */}
        <div className="hidden md:block fixed top-0 right-0 w-[500px] h-[500px] bg-brand/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </div>
  )
}