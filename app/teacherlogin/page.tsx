'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return alert('Please enter email and password')
    setLoading(true)

    try {
      // 1. Query the 'teachers' table specifically
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .ilike('email', email)
        .single()
  
      if (error || !data) {
        setLoading(false)
        return alert('Teacher account not found.')
      }

      // 2. Simple password check (Note: In production, use Supabase Auth or hashed passwords)
      if (data.password !== password) {
        setLoading(false)
        return alert('Incorrect password.')
      }

      // 3. Save Teacher details to LocalStorage
      localStorage.setItem('userRole', 'teacher');
      localStorage.setItem('teacherId', data.teacher_id);
      localStorage.setItem('teacherName', data.full_name);
      localStorage.setItem('teacherEmail', data.email);

      // 4. Redirect to the Teacher Dashboard
      router.push('/teacher')

    } catch (err) {
      alert('An error occurred during login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-brand/5 p-10 space-y-8 relative z-10 border border-slate-100">
        
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 relative p-1 rounded-3xl bg-white shadow-xl shadow-brand/10 border border-slate-50 mb-4">
             <Image
                src="/Schoollogo.jpg"
                alt="Logo"
                fill
                className="object-contain p-2"
              />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Prashanthi Vidyalaya</h1>
          <p className="text-brand font-bold text-sm uppercase tracking-widest mt-1 italic">Teacher Portal</p>
        </div>

        <div className="space-y-5">
          {/* Identity Tag */}
          <div className="flex items-center gap-3 p-4 bg-brand/5 rounded-2xl border border-brand/10">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <FiUser size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">Login Type</p>
              <p className="text-sm font-bold text-slate-700">Educator / Faculty</p>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
              Official Email
            </label>
            <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="email"
                    placeholder="teacher@prashanthi.com"
                    className="w-full border-2 border-slate-100 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand transition-all font-medium text-slate-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
              Portal Password
            </label>
            <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full border-2 border-slate-100 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand transition-all font-medium text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-brand/20 active:scale-[0.98] mt-4 uppercase tracking-widest text-sm"
          >
            {loading ? 'Verifying Credentials...' : 'Access My Dashboard'}
          </button>

          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Protected Faculty Access
            </p>
            <button 
              onClick={() => router.push('/login')} 
              className="text-[10px] text-brand hover:underline font-black uppercase tracking-widest"
            >
              Are you an Admin? Click here
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}