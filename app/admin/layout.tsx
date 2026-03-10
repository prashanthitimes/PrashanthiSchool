'use client'

import React, { useState, useRef, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { FiUser, FiLogOut, FiChevronDown, FiSettings, FiMenu, FiArrowLeft } from 'react-icons/fi'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const path = pathname.split('/').pop() || 'dashboard'
    setActiveMenu(path === 'admin' ? 'dashboard' : path)
  }, [pathname])

  useEffect(() => {
    const name = localStorage.getItem('adminName')
    const email = localStorage.getItem('adminEmail')

    if (!localStorage.getItem('userRole')) {
      window.location.href = '/login'
    }

    if (name) setAdminName(name)
    if (email) setAdminEmail(email)
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
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FD] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
      <AdminSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64 w-full">
        {/* --- FIXED HEADER WITH SAFE AREA --- */}
        <header
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
            height: isScrolled ? 'calc(env(safe-area-inset-top) + 4rem)' : 'calc(env(safe-area-inset-top) + 5rem)' 
          }}
          className={`fixed top-0 right-0 z-40 px-4 md:px-8 flex items-center justify-between
          w-full lg:w-[calc(100%-16rem)] transition-all duration-300
          ${isScrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b dark:border-slate-800' : 'bg-transparent'}`}
        >
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-brand"
            >
              <FiMenu size={20} />
            </button>

            <button
              onClick={() => router.back()}
              className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand transition-colors"
              title="Go Back"
            >
              <FiArrowLeft size={20} />
            </button>

            <div>
              <h2 className="text-lg md:text-xl font-black capitalize">
                {activeMenu.replace(/-/g, ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 md:p-3 rounded-2xl transition-all border group bg-white border-[#e9d1e4] text-red-500 hover:bg-red-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-red-950/20 shadow-sm"
            >
              <FiLogOut size={18} className="group-active:scale-90 transition-transform" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 md:p-2 border rounded-2xl transition-all bg-white border-[#e9d1e4] text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 shadow-sm"
              >
                <div className="h-8 w-8 md:h-9 md:w-9 bg-brand rounded-xl flex items-center justify-center text-white shrink-0">
                  <FiUser size={16} />
                </div>
                <div className="text-left hidden md:block pr-2">
                  <p className="text-sm font-bold leading-tight">{adminName || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {adminEmail}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <main 
          style={{ marginTop: 'calc(env(safe-area-inset-top) + 5.5rem)' }}
          className="px-4 pb-10 flex-1"
        >
          <div className="max-w-9xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}