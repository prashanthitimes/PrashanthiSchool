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
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [children, setChildren] = useState<any[]>([])
  const [showChildSelect, setShowChildSelect] = useState(false)
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
      if (!phone) return alert('Please enter phone number')
    } else {
      if (!email || !password) return alert('Please enter email and password')
    }

    setLoading(true)

    try {
      /* ---------------- ADMIN LOGIN ---------------- */
      if (role === 'admin') {
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
      }

      /* ---------------- PARENT LOGIN ---------------- */
      else if (role === 'parent') {
        const { data: students, error } = await supabase
          .from('students')
          .select('id, full_name, class_name, section, mobile_no, father_name')
          .eq('mobile_no', phone.trim())
          .eq('status', 'active')

        if (error || !students || students.length === 0) {
          setErrorMsg('No student found with this phone number.')
          setLoading(false)
          return
        }

        const childrenList = students.map((student: any) => ({
          childId: student.id, // This is the UUID
          childName: student.full_name,
          class: student.class_name,
          section: student.section,
          parentPhone: student.mobile_no,
          parentName: student.father_name || 'Parent'
        }))

        if (childrenList.length === 1) {
          const child = childrenList[0]

          localStorage.setItem('userRole', 'parent')
          localStorage.setItem('userId', child.childId) // 👈 CRITICAL: Saved as userId for Push Notifications
          localStorage.setItem('parentPhone', child.parentPhone)
          localStorage.setItem('parentName', child.parentName)
          localStorage.setItem('childId', child.childId)
          localStorage.setItem('childName', child.childName)

          router.push('/parent')
        } else {
          setChildren(childrenList)
          setShowChildSelect(true)
        }
      }

      /* ---------------- TEACHER LOGIN ---------------- */
      else if (role === 'teacher') {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .ilike('email', email.trim())
          .single()

        if (error || !data) {
          setErrorMsg('Teacher account not found.')
          return
        }

        if (data.password !== password) {
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
            {step === 1 ? 'Welcome Back' : `${role} Portal`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* STEP 1 ROLE */}
        {step === 1 && (
          <div className="space-y-5">
            <RoleButton
              icon="/principaliconn.png"
              title="Administrator"
              desc="Manage school operations"
              onClick={() => handleRoleSelect('admin')}
            />
            <RoleButton
              icon="/teachericonn.png"
              title="Teacher / Faculty"
              desc="Access classroom & grades"
              onClick={() => handleRoleSelect('teacher')}
            />
            <RoleButton
              icon="/parneticonn.png"
              title="Parent / Guardian"
              desc="Track student progress"
              onClick={() => handleRoleSelect('parent')}
            />
          </div>
        )}

        {/* STEP 2 LOGIN */}
        {step === 2 && (
          <div className="space-y-5">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase"
            >
              <FiArrowLeft /> Back
            </button>

            {role !== 'parent' ? (
              <InputGroup
                label="Email Address"
                icon={<FiMail />}
                type="email"
                placeholder="name@school.com"
                value={email}
                onChange={setEmail}
              />
            ) : (
              <InputGroup
                label="Parent Phone Number"
                icon={<FiUser />}
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={setPhone}
              />
            )}

            {role !== 'parent' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border-2 border-brand-accent/30 rounded-2xl px-12 py-3.5"
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
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-brand-dark text-white font-black py-4 rounded-2xl transition-all hover:bg-opacity-90 active:scale-[0.98]"
            >
              {loading ? 'Checking...' : role === 'parent' ? 'Find Students' : 'Sign In'}
            </button>
          </div>
        )}

        {/* CHILD SELECT MODAL */}
        {showChildSelect && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowChildSelect(false)}
            />
            <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-slate-800">Who is signing in?</h2>
                <p className="text-slate-500 text-xs font-medium">Multiple students linked to this number.</p>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {children.map((child, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      localStorage.setItem('userRole', 'parent')
                      localStorage.setItem('userId', child.childId) // 👈 CRITICAL: Saved as userId
                      localStorage.setItem('parentPhone', child.parentPhone)
                      localStorage.setItem('parentName', child.parentName)
                      localStorage.setItem('childId', child.childId)
                      localStorage.setItem('childName', child.childName)
                      router.push('/parent')
                    }}
                    className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent hover:border-brand bg-slate-50 hover:bg-brand-soft/20 transition-all duration-200 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-brand font-bold border border-brand-accent/20 group-hover:bg-brand group-hover:text-white transition-colors">
                      {child.childName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-sm">{child.childName}</h3>
                      <p className="text-[10px] font-black text-brand-light uppercase tracking-wider">
                        Class {child.class} • Section {child.section}
                      </p>
                    </div>
                    <FiChevronRight className="text-slate-300 group-hover:text-brand" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowChildSelect(false)}
                className="w-full py-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
<footer className="mt-8 pt-6 border-t border-white/10">
  <div className="flex flex-col items-center justify-center space-y-3 text-center">
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

function RoleButton({ icon, title, desc, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full group flex items-center gap-4 p-5 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white overflow-hidden relative shadow-md">
        <Image src={icon} alt={title} fill className="object-cover p-1 group-hover:scale-110 transition-transform" />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        <p className="text-slate-400 text-xs">{desc}</p>
      </div>
      <FiChevronRight className="text-brand-soft group-hover:text-brand" />
    </button>
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
          className="w-full border-2 border-brand-accent/30 rounded-2xl px-12 py-3.5 focus:outline-none focus:border-brand-dark transition-colors"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}