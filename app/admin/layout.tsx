'use client'

import React, { useState, useRef, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { FiUser, FiLogOut, FiSearch, FiChevronDown, FiSettings, FiBell } from 'react-icons/fi'
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    console.log("Logging out...")
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD] font-sans text-slate-900">
      {/* SIDEBAR */}
      <AdminSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">

        {/* TOP BAR */}
        <header
          className={`fixed top-0 right-0 z-40 transition-all duration-300 px-8 flex items-center justify-between
  w-[calc(100%-16rem)] 
  ${isScrolled
              ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 h-16'
              : 'bg-transparent h-20'}`}
        >
          {/* Breadcrumbs using brand color */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>Admin</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand">Portal</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 capitalize leading-tight">
              {activeMenu.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Search - Highlighted with brand on focus */}
            <div className="hidden lg:flex items-center bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-56 placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Notification - Brand hover effect */}
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand hover:border-brand/20 hover:bg-brand/5 transition-all shadow-sm">
              <FiBell size={20} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                {/* Avatar uses brand background */}
                <div className="h-9 w-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                  <FiUser size={18} />
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-sm font-black text-slate-800 leading-none">Prashanth Admin</p>
                  <p className="text-[10px] text-brand font-bold mt-1 uppercase tracking-wider">Super User</p>
                </div>
                <FiChevronDown className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-5 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Manager</p>
                  </div>

                  
                <Link href="/admin/settings" className="w-full">
  <button className="flex items-center gap-3 w-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-brand/5 hover:text-brand transition-colors">
    <FiSettings size={14} />
    Settings
  </button>
</Link>


                  <div className="border-t border-slate-50 my-1 mx-2"></div>
                <Link href="/adminlogin" className="w-full">

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                  >
                    <FiLogOut size={14} />
                    Logout
                  </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN PAGE CONTENT */}
        {/* Change pt-4 to pt-0 in main */}
        <main className="px-4 pb-4 mt-6 pt-0 flex-1">
          <div className="max-w-7xl mx-auto">
            {/* Remove top margin/padding from children if they have any */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </div>
        </main>

        {/* Brand Accent Blur (matches your color) */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      </div>
    </div>
  )
}