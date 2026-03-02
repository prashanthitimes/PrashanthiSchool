'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiUsers, FiBook, FiArrowLeft, FiChevronRight } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'admin' | 'parent' | 'teacher'

export default function UnifiedLoginPage() {
  const [step, setStep] = useState<1 | 2>(1) 
  const [role, setRole] = useState<Role>('admin')

  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole)
    setErrorMsg('')
    setStep(2)
  }

  const handleLogin = async () => {
    setErrorMsg('')
    if (role === 'parent') {
      if (!userId || !password) return alert('Please enter Parent ID and password')
    } else {
      if (!email || !password) return alert('Please enter email and password')
    }

    setLoading(true)
    try {
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .ilike('email', email.trim())
          .eq('status', 'active')
          .single()

        if (error || !data) {
          setLoading(false)
          setErrorMsg('No active admin account found.')
          return
        }

        if (data.password !== password) {
          setLoading(false)
          setErrorMsg('Incorrect password.')
          return
        }

        localStorage.setItem('adminRole', data.role)
        localStorage.setItem('adminPerms', JSON.stringify(data.permissions || {}))
        localStorage.setItem('adminName', data.name)
        localStorage.setItem('userRole', 'admin')
        router.push('/admin')
      } 
      else if (role === 'parent') {
        const { data, error } = await supabase
          .from('parents')
          .select(`*, students:child_id (full_name, class_name, section)`)
          .eq('user_id', userId.trim())
          .single()

        if (error || !data) {
          setLoading(false)
          setErrorMsg('Parent ID not found.')
          return
        }

        if (data.temp_password !== password) {
          setLoading(false)
          setErrorMsg('Incorrect password.')
          return
        }

        localStorage.setItem('userRole', 'parent')
        localStorage.setItem('parentId', data.id)
        localStorage.setItem('parentName', data.full_name)
        localStorage.setItem('parentUserId', data.user_id)
        if (data.students) {
          localStorage.setItem('childId', data.child_id)
          localStorage.setItem('childName', data.students.full_name)
        }
        router.push('/parent')
      } 
      else if (role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .ilike('email', email.trim())
          .single()

        if (error || !data) {
          setLoading(false)
          setErrorMsg('Teacher account not found.')
          return
        }

        if (data.password !== password) {
          setLoading(false)
          setErrorMsg('Incorrect password.')
          return
        }

        localStorage.setItem('userRole', 'teacher')
        localStorage.setItem('teacherId', data.teacher_id)
        localStorage.setItem('teacherName', data.full_name)
        localStorage.setItem('teacherEmail', data.email)
        router.push('/teacher')
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background Blurs using brand colors */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-soft/30 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/50 blur-[100px] rounded-full" />

      <div className="w-full max-w-md bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-brand-soft/20 p-6 md:p-10 space-y-8 relative z-10 border border-brand-accent">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 relative p-1 rounded-2xl md:rounded-3xl bg-white shadow-xl shadow-brand-soft/30 border border-brand-accent mb-4">
            <Image src="/Schoollogo.jpg" alt="Logo" fill className="object-contain p-2" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Prashanti Vidyalaya <br/>& High School</h1>
          <p className="text-brand font-bold text-xs uppercase tracking-widest mt-1">
            {step === 1 ? 'Welcome Back' : `${role} Portal`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Select your role to continue</p>
            
            <RoleButton 
              icon={<FiUsers size={22} />} 
              title="Administrator" 
              desc="Manage school operations" 
              onClick={() => handleRoleSelect('admin')} 
            />
            <RoleButton 
              icon={<FiBook size={22} />} 
              title="Teacher / Faculty" 
              desc="Access classroom & grades" 
              onClick={() => handleRoleSelect('teacher')} 
            />
            <RoleButton 
              icon={<FiUser size={22} />} 
              title="Parent / Guardian" 
              desc="Track student progress" 
              onClick={() => handleRoleSelect('parent')} 
            />
          </div>
        )}

        {/* STEP 2: LOGIN FORM */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-400 hover:text-brand transition-colors text-xs font-bold uppercase tracking-widest mb-2"
            >
              <FiArrowLeft /> Back to Selection
            </button>

            {role !== 'parent' ? (
              <InputGroup 
                label={role === 'admin' ? 'Email Address' : 'Official Email'} 
                icon={<FiMail />} 
                type="email"
                placeholder="name@school.com"
                value={email}
                onChange={setEmail}
              />
            ) : (
              <InputGroup 
                label="Parent User ID" 
                icon={<FiUser />} 
                type="text"
                placeholder="e.g. JV13VV"
                value={userId}
                onChange={setUserId}
              />
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border-2 border-brand-accent/30 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand-light transition-all font-medium text-slate-800 bg-brand-soft/5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-brand-soft shadow-brand/20 active:scale-[0.98] mt-4 uppercase tracking-widest text-sm"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        )}

        <div className="text-center pt-4 border-t border-brand-accent/30">
          <p className="text-[10px] text-brand-light/60 font-bold uppercase tracking-[0.2em]">
            &copy; 2026 Prashanti Vidyalaya & High School
          </p>
        </div>
      </div>
    </div>
  )
}

function RoleButton({ icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-brand-accent/30 hover:border-brand-light hover:bg-brand-soft/20 transition-all text-left active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-xl bg-brand-soft/30 group-hover:bg-brand group-hover:text-white flex items-center justify-center text-brand transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 text-sm md:text-base">{title}</h3>
        <p className="text-slate-400 text-xs">{desc}</p>
      </div>
      <FiChevronRight className="text-brand-soft group-hover:text-brand transition-colors" />
    </button>
  )
}

function InputGroup({ label, icon, type, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full border-2 border-brand-accent/30 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand-light transition-all font-medium text-slate-800 bg-brand-soft/5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}