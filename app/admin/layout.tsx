'use client'

import React, { useState, useRef, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { FiUser, FiLogOut, FiSearch, FiChevronDown, FiSettings, FiMenu } from 'react-icons/fi'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [adminName, setAdminName] = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load admin data from localStorage
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
    <div className="flex min-h-screen bg-[#F8F9FD] font-sans text-slate-900 overflow-x-hidden">

      <AdminSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen relative lg:ml-64 w-full">

        <header
          className={`fixed top-0 right-0 z-40 px-4 md:px-8 flex items-center justify-between
          w-full lg:w-[calc(100%-16rem)]
          ${isScrolled ? 'bg-white shadow-sm border-b h-16' : 'bg-transparent h-20'}`}
        >

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white border rounded-xl text-brand"
            >
              <FiMenu size={20} />
            </button>

            <div>
              <h2 className="text-lg md:text-xl font-black capitalize">
                {activeMenu.replace('-', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">

            <div className="hidden sm:flex items-center bg-white border px-3 py-2 rounded-2xl">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent ml-2 text-sm outline-none"
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-2 bg-white border rounded-2xl"
              >
                <div className="h-9 w-9 bg-brand rounded-xl flex items-center justify-center text-white">
                  <FiUser size={16} />
                </div>

                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold">{adminName || 'Admin'}</p>
                  <p className="text-xs text-slate-500">{adminEmail}</p>
                </div>

                <FiChevronDown />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border py-2">
                  <button
                    onClick={() => window.location.href = '/admin/settings'}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm hover:bg-gray-50"
                  >
                    <FiSettings size={14} /> Settings
                  </button>

                  <div className="border-t my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 pb-4 mt-4 flex-1">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}