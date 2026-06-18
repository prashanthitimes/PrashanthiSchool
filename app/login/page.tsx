'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setErrorMsg('')

    if (!email || !password) {
      return alert('Please enter email and password')
    }

    setLoading(true)

    try {
      /* ---------------- ADMIN LOGIN ---------------- */
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .ilike('email', email.trim())
        .eq('status', 'active');

      if (error || !data || data.length === 0) {
        setErrorMsg('No active admin account found.');
        setLoading(false);
        return;
      }

      const admin = data[0];
      if (admin.password !== password) {
        setErrorMsg('Incorrect password.');
        setLoading(false);
        return;
      }

      localStorage.setItem('adminRole', admin.role);
      localStorage.setItem('adminPerms', JSON.stringify(admin.permissions || {}));
      localStorage.setItem('adminName', admin.name);
      localStorage.setItem('userRole', 'admin');
      router.push('/admin');

    } catch (err) {
      setErrorMsg('Unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center px-4 py-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-soft/30 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/50 blur-[100px] rounded-full" />

      <div className="w-full max-w-md bg-brand rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-brand-soft/20 p-6 md:p-10 space-y-8 relative z-10 border border-brand-accent">

        {/* HEADER */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 relative p-1 rounded-3xl bg-white shadow-xl border border-brand-accent mb-4">
            <Image src="/Schoollogo.jpg" alt="Logo" fill className="object-contain p-2" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Prashanti Vidyalaya <br /> & High School
          </h1>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1">
            Admin Portal
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* ADMIN PORTAL LOGIN FIELDS */}
        <div className="space-y-5">
          <InputGroup
            label="Email Address"
            icon={<FiMail />}
            type="email"
            placeholder="name@school.com"
            value={email}
            onChange={setEmail}
          />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full border-2 border-brand-accent/30 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand-dark transition-colors text-slate-800"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl transition-all hover:bg-opacity-90 active:scale-[0.98]"
          >
            {loading ? 'Checking...' : 'Sign In'}
          </button>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            
            {/* Links: Terms and Privacy */}
            <div className="flex space-x-4 text-[10px] text-white/70 font-bold uppercase tracking-[0.15em]">
              <a href="/terms" className="hover:text-white transition-colors underline underline-offset-4 decoration-white/30">
                Terms of Service
              </a>
              <span className="text-white/30">•</span>
              <a href="/policy" className="hover:text-white transition-colors underline underline-offset-4 decoration-white/30">
                Privacy Policy
              </a>
            </div>

            {/* Copyright Line */}
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.15em]">
              © 2026 Prashanti Vidyalaya & High School
            </p>

            {/* Developer Line */}
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.15em]">
              Developed by{" "}
              <a
                href="https://rakvih.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand-soft transition-colors underline underline-offset-4 decoration-white/30 hover:decoration-brand-soft"
              >
                Rakvih
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

function InputGroup({ label, icon, type, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full border-2 border-brand-accent/30 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand-dark transition-colors text-slate-800"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}