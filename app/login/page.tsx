'use client'

import Image from 'next/image'
import { useState } from 'react'
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiUsers, FiBook, FiWifi } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function UnifiedLoginPage() {
  const [role, setRole] = useState<'admin' | 'parent' | 'teacher'>('admin')

  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  // Test Supabase connection
  const testConnection = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('email')
        .limit(1)

      console.log('Connection test:', { data, error })

      if (error) {
        setErrorMsg('Database might be paused. Wait 2-5 minutes and try again.')
        alert('Connection failed: ' + error.message)
      } else {
        alert('Connection successful! Database is awake.')
      }
    } catch (err) {
      setErrorMsg('Cannot connect to database. Is it resumed?')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // LOGIN HANDLER
  // ---------------------------------------------------------
  const handleLogin = async () => {
    setErrorMsg('')

    if (role === 'parent') {
      if (!userId || !password) return alert('Please enter Parent ID and password')
    } else {
      if (!email || !password) return alert('Please enter email and password')
    }

    setLoading(true)

    try {
      // ---------------------------------------------------------
      // 1. ADMIN LOGIN - Using .ilike (case-insensitive)
      // ---------------------------------------------------------
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .ilike('email', email.trim())  // Case-insensitive like original code
          .eq('status', 'active')
          .single()

        if (error || !data) {
          setLoading(false)
          setErrorMsg('No active admin account found.')
          return alert('No active admin account found.')
        }

        if (data.password !== password) {
          setLoading(false)
          return alert('Incorrect password.')
        }

        localStorage.setItem('adminRole', data.role);
        localStorage.setItem('adminPerms', JSON.stringify(data.permissions || {}));
        localStorage.setItem('adminName', data.name);
        localStorage.setItem('userRole', 'admin');

        router.push('/admin')
      }

      // ---------------------------------------------------------
      // 2. PARENT LOGIN - Using .eq with user_id
      // ---------------------------------------------------------
      else if (role === 'parent') {
        const { data, error } = await supabase
          .from('parents')
          .select(`
            *,
            students:child_id (full_name, class_name, section)
          `)
          .eq('user_id', userId.trim())
          .single()

        if (error || !data) {
          setLoading(false)
          setErrorMsg('Parent ID not found.')
          return alert('Parent ID not found. Please check your credentials.')
        }

        if (data.temp_password !== password) {
          setLoading(false)
          return alert('Incorrect password.')
        }

        localStorage.setItem('userRole', 'parent');
        localStorage.setItem('parentId', data.id);
        localStorage.setItem('parentName', data.full_name);
        localStorage.setItem('parentUserId', data.user_id);

        if (data.students) {
          localStorage.setItem('childId', data.child_id);
          localStorage.setItem('childName', data.students.full_name);
        }

        router.push('/parent')
      }

      // ---------------------------------------------------------
      // 3. TEACHER LOGIN - Using .ilike (case-insensitive)
      // ---------------------------------------------------------
      else if (role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .ilike('email', email.trim())  // Case-insensitive like original code
          .single()

        if (error || !data) {
          setLoading(false)
          setErrorMsg('Teacher account not found.')
          return alert('Teacher account not found.')
        }

        if (data.password !== password) {
          setLoading(false)
          return alert('Incorrect password.')
        }

        localStorage.setItem('userRole', 'teacher');
        localStorage.setItem('teacherId', data.teacher_id);
        localStorage.setItem('teacherName', data.full_name);
        localStorage.setItem('teacherEmail', data.email);

        router.push('/teacher')
      }

    } catch (err) {
      console.error('Login error:', err)
      setErrorMsg('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = () => {
    switch (role) {
      case 'admin': return <FiUsers size={20} />;
      case 'parent': return <FiUser size={20} />;
      case 'teacher': return <FiBook size={20} />;
      default: return <FiUser size={20} />;
    }
  }

  const getButtonText = () => {
    switch (role) {
      case 'admin': return 'Sign In To Portal';
      case 'parent': return "View My Child's Progress";
      case 'teacher': return 'Access My Dashboard';
      default: return 'Login';
    }
  }

  const getLoadingText = () => {
    switch (role) {
      case 'admin': return 'Authenticating...';
      case 'parent': return 'Securing Connection...';
      case 'teacher': return 'Verifying Credentials...';
      default: return 'Loading...';
    }
  }

  const getPortalTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Portal';
      case 'parent': return 'Parent Portal';
      case 'teacher': return 'Teacher Portal';
      default: return 'Portal';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-brand/5 p-10 space-y-8 relative z-10 border border-slate-100">

        {/* Header */}
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
          <p className="text-brand font-bold text-sm uppercase tracking-widest mt-1 italic">{getPortalTitle()}</p>
        </div>

        <div className="space-y-5">

          {/* Error Message Display */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Connection Test Button (for debugging) */}
          {/* <button type="button" onClick={testConnection}  disabled={loading} className="text-xs text-blue-500 underline flex items-center justify-center gap-1 w-full" >  <FiWifi size={12} /> Test Database Connection  </button> */}

          {/* Role Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
              Login As
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as any)
                setEmail('')
                setUserId('')
                setPassword('')
                setErrorMsg('')
              }}
              className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3.5 bg-slate-50/50 focus:outline-none focus:border-brand focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="admin">Administrator</option>
              <option value="parent">Parent / Guardian</option>
              <option value="teacher">Teacher / Faculty</option>
            </select>
          </div>

          {/* Role Tag */}
          <div className="flex items-center gap-3 p-4 bg-brand/5 rounded-2xl border border-brand/10">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              {getRoleIcon()}
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">Login Type</p>
              <p className="text-sm font-bold text-slate-700">
                {role === 'admin' && 'Administrator Access'}
                {role === 'parent' && 'Family / Guardian'}
                {role === 'teacher' && 'Educator / Faculty'}
              </p>
            </div>
          </div>

          {/* Email Input (For Admin & Teacher) */}
          {role !== 'parent' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                {role === 'admin' ? 'Email Address' : 'Official Email'}
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder={role === 'admin' ? 'admin@school.com' : 'teacher@prashanthi.com'}
                  className="w-full border-2 border-slate-100 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand transition-all font-medium text-slate-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* User ID Input (For Parent Only) */}
          {role === 'parent' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                Parent ID (User ID)
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. jv13vv"
                  className="w-full border-2 border-slate-100 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand transition-all font-medium text-slate-800"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
              {role === 'parent' ? 'Access Password' : 'Password'}
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

          {/* Submit Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-brand/20 active:scale-[0.98] mt-4 uppercase tracking-widest text-sm"
          >
            {loading ? getLoadingText() : getButtonText()}
          </button>

          {/* Footer */}
          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {role === 'admin' && 'Secured Admin Access Only'}
              {role === 'parent' && 'Official School Parent Access'}
              {role === 'teacher' && 'Protected Faculty Access'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}