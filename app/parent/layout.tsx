'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useRef, useEffect } from 'react'
import ParentSidebar from '@/components/ParentSidebar'
import ParentMobileDashboard from '@/components/ParentMobileDashboard'
import { FiUser, FiLogOut, FiArrowLeft, FiHeart } from 'react-icons/fi'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core' // 👈 Added Capacitor core
import { supabase } from '@/lib/supabase'

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [parentName, setParentName] = useState('Parent')
  const [childName, setChildName] = useState('Student')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // --- PUSH NOTIFICATIONS LOGIC ---
  useEffect(() => {
    const setupPush = async () => {
      // 1. SILENTLY EXIT IF ON WEB
      // This prevents the "Plugin not implemented" error in the browser
      if (Capacitor.getPlatform() === 'web') {
        console.log('Push notifications are disabled on web browser.');
        return;
      }

      try {
        // 2. Check permissions
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          // 3. Register with Apple/Google to get the token
          await PushNotifications.register();

          // 4. Listen for the registration token
          await PushNotifications.addListener('registration', async (token) => {
            const deviceToken = token.value;
            console.log('Push Token Generated:', deviceToken);

            const studentId = localStorage.getItem('userId'); 

            if (studentId) {
              const { error } = await supabase
                .from('students') 
                .update({ fcm_token: deviceToken })
                .eq('id', studentId);

              if (error) {
                console.error('Error saving token to Supabase:', error);
              } else {
                console.log('Token successfully linked to student record!');
              }
            }
          });

          // 5. Handle errors if registration fails
          await PushNotifications.addListener('registrationError', (err) => {
            console.error('Push registration error: ', err.error);
          });

          // 6. Handle notification received while app is active
          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Notification received in foreground:', notification);
          });
        }
      } catch (err) {
        console.error('Failed to initialize push notifications:', err);
      }
    };

    setupPush();

    return () => {
      // Only attempt to remove listeners if not on web
      if (Capacitor.getPlatform() !== 'web') {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  // --- UI LOGIC ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setParentName(localStorage.getItem('parentName') || 'Parent')
      setChildName(localStorage.getItem('childName') || 'Student')
    }
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
    <div className="flex bg-[#fffcfd] font-sans transition-colors duration-500 min-h-screen">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block">
        <ParentSidebar />
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col relative lg:ml-64">

        {/* HEADER */}
        <header
          className={`sticky top-0 z-40 px-4 md:px-8 h-[68px] md:h-[74px] flex items-center justify-between transition-all duration-300
            ${isScrolled 
              ? 'bg-white/90 backdrop-blur-md shadow-sm border-b' 
              : 'bg-white border-transparent'
            }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <FiArrowLeft size={20} className="text-slate-600" />
            </button>

            <div className="flex lg:hidden items-center gap-2">
              <div className="w-9 h-9 bg-white rounded-lg p-1 border border-slate-100 shadow-sm">
                <img src="/Schoollogo.jpg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left">
                <h1 className="text-[13px] font-black text-slate-800 leading-none uppercase">Prashanti Vidyalaya</h1>
                <span className="text-[9px] font-bold text-brand tracking-tighter uppercase opacity-70">Parent Panel</span>
              </div>
            </div>

            <h2 className="hidden lg:block text-xl font-black text-slate-800 capitalize">
              {pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border bg-white border-[#e9d1e4] text-red-500 shadow-sm hover:bg-red-50 transition-colors"
            >
              <FiLogOut size={14} />
            </button>

            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-brand/5 border border-brand/10 rounded-xl">
              <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white shadow-sm shadow-brand/20">
                <FiHeart size={12} />
              </div>
              <p className="text-xs font-black text-slate-700 truncate max-w-[100px]">
                {childName}
              </p>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 md:p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand/30 transition-all"
              >
                <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center text-white shadow-md shadow-brand/10">
                  <FiUser size={16} />
                </div>
                <div className="hidden md:block text-left pr-1">
                  <p className="text-[11px] font-black text-slate-800 leading-none">
                    {parentName}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className={`px-4 md:px-8 flex-1 w-full ${pathname === "/parent" ? "pb-4 pt-8" : "pb-4 pt-6"}`}>
          {pathname === "/parent" && (
            <div className="lg:hidden">
              <div className="mb-4 px-1 text-center">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Hello, <span className="text-brand uppercase">{parentName}!</span>
                </h3>
                <p className="xs:block text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Academic overview for {childName}
                </p>
              </div>
              <ParentMobileDashboard />
            </div>
          )}

          <div className={`${pathname === "/parent" ? "hidden lg:block" : "block"} max-w-8xl mx-auto h-full`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}