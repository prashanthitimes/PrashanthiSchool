"use client";

import {
  Shield, Plus, Edit2, CheckCircle, X, Trash2, Mail,
  User, Users, ShieldCheck, LayoutDashboard, GraduationCap, Briefcase,
  ClipboardList, Wallet, Truck, Bell, Calendar, Key, Settings,
  Image as ImageIcon, Clock, AlertTriangle, Phone, FileText, Camera
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";

const PERMISSION_STRUCTURE = [
  {
    category: "Overview",
    items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> }]
  },
  {
    category: "Academics",
    items: [
      { id: 'teachers', label: 'Teachers', icon: <Briefcase size={14} /> },
      { id: 'students', label: 'Students', icon: <GraduationCap size={14} /> },
      { id: 'parents', label: 'Parents', icon: <Users size={14} /> },
      { id: 'classes-sections', label: 'Classes & Sections', icon: <Shield size={14} /> },
      { id: 'subjects', label: 'Subjects', icon: <ClipboardList size={14} /> },
      { id: 'timetable', label: 'Time Table', icon: <Clock size={14} /> },
    ]
  },
  {
    category: "Operations",
    items: [
      { id: 'attendance', label: 'Attendance', icon: <CheckCircle size={14} /> },
      { id: 'exam-registry', label: 'Exam Registry', icon: <ClipboardList size={14} /> },
      { id: 'exam-schedule', label: 'Exam Timetable', icon: <Clock size={14} /> },
      { id: 'marks-entry', label: 'Marks Ledger', icon: <Edit2 size={14} /> }, 
      { id: 'fee-management', label: 'Fee Management', icon: <Wallet size={14} /> },
      { id: 'fee-ledger', label: 'Fee Ledger', icon: <Wallet size={14} /> },
      { id: 'payment-scanner', label: 'Payment Scanner', icon: <Camera size={14} /> },
    ]
  },
  {
    category: "Logistics & Communication",
    items: [
      { id: 'transport', label: 'Transport', icon: <Truck size={14} /> },
      { id: 'notices-circulars', label: 'Notices & Circulars', icon: <Bell size={14} /> },
      { id: 'calendar', label: 'Calendar', icon: <Calendar size={14} /> },
      { id: 'photo-gallery', label: 'Photo Gallery', icon: <ImageIcon size={14} /> },
    ]
  },
  {
    category: "System",
    items: [
      { id: 'admissions-exit', label: 'Admissions & Exit', icon: <Key size={14} /> },
      { id: 'admin-management', label: 'Admin Management', icon: <ShieldCheck size={14} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
    ]
  }
];

export default function AdminManagement() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState<any>(null);
  const [editAdmin, setEditAdmin] = useState<any>(null);
  const [counts, setCounts] = useState({ total: 0, super: 0, sub: 0 });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", role: "sub_admin", description: ""
  });
  const [selectedPerms, setSelectedPerms] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("admin_users").select(`*`).order('created_at', { ascending: false });
    if (!error) {
      setAdmins(data || []);
      setCounts({
        total: data?.length || 0,
        super: data?.filter((a: any) => a.role === 'super_admin').length || 0,
        sub: data?.filter((a: any) => a.role === 'sub_admin').length || 0
      });
    }
    setLoading(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    const activePermsCount = Object.values(selectedPerms).filter(Boolean).length;
    if (activePermsCount === 0) newErrors.perms = "Select at least one permission";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = (admin: any = null) => {
    setErrors({});
    if (admin) {
      setEditAdmin(admin);
      setFormData({
        name: admin.full_name || admin.name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        role: admin.role || "sub_admin",
        description: admin.description || ""
      });
      setSelectedPerms(admin.permissions || {});
    } else {
      setEditAdmin(null);
      setFormData({ name: "", email: "", phone: "", role: "sub_admin", description: "" });
      setSelectedPerms({});
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Validation Failed", { description: "Please check the required fields." });
      return;
    }

    const payload = {
      full_name: formData.name, // FIX: Resolves the not-null constraint error
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      description: formData.description,
      permissions: selectedPerms,
      status: "active"
    };

    const { error } = editAdmin
      ? await supabase.from("admin_users").update(payload).eq("id", editAdmin.id)
      : await supabase.from("admin_users").insert([payload]);

    if (error) {
      toast.error("Database Error", { description: error.message });
    } else {
      toast.success(editAdmin ? "Updated successfully" : "Admin created successfully");
      setShowModal(false);
      fetchAdmins();
    }
  };

  // ADDED: Missing handleDelete function
  const handleDelete = async () => {
    if (!targetAdmin) return;
    const { error } = await supabase.from("admin_users").delete().eq("id", targetAdmin.id);

    if (error) {
      toast.error("Could not delete", { description: error.message });
    } else {
      toast.success("Access Revoked");
      setShowDeleteModal(false);
      fetchAdmins();
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-soft/20">
      <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );



  return (
    <div className="max-w-7xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-center justify-between bg-white/80 backdrop-blur-md px-6 py-6 sm:px-8 sm:py-6 rounded-[2rem] border border-brand-soft shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 bg-brand-soft text-brand-light rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase">Admin Registry</h1>
            <p className="text-[10px] font-bold text-brand-light tracking-[0.2em] uppercase leading-none">Security Management</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-brand-light hover:bg-brand text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-soft">
          <Plus size={18} className="inline mr-2" /> Create New Admin
        </button>
      </header>

      {/* STATS - Now scrollable or grid depending on size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard title="Total Registry" value={counts.total} icon={<Users size={22} />} />
        <StatCard title="Super Access" value={counts.super} icon={<ShieldCheck size={22} />} />
        <StatCard title="Standard Access" value={counts.sub} icon={<Shield size={22} />} />
      </div>

      {/* REGISTRY LIST/TABLE */}
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-brand-soft overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-soft/30">
              <tr>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Administrator</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Assigned Access</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/40">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-brand-soft/10 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-light flex items-center justify-center font-black">{admin.full_name?.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-800 leading-none">{admin.full_name}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-brand-light text-white rounded-lg text-[9px] font-black uppercase tracking-wider">{admin.role?.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(admin)} className="p-2 text-brand-light hover:bg-brand-soft rounded-xl transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => { setTargetAdmin(admin); setShowDeleteModal(true); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-brand-soft/40">
          {admins.map((admin) => (
            <div key={admin.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-light flex items-center justify-center font-black text-sm">{admin.full_name?.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{admin.full_name}</p>
                    <p className="text-[10px] text-slate-400">{admin.email}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-brand-soft text-brand-light rounded-lg text-[8px] font-black uppercase">{admin.role?.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1">
                   {Object.keys(admin.permissions || {}).filter(k => admin.permissions[k]).slice(0, 2).map(k => (
                      <span key={k} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[8px] font-bold uppercase border border-slate-100">{k.split('-')[0]}</span>
                   ))}
                   {Object.keys(admin.permissions || {}).filter(k => admin.permissions[k]).length > 2 && <span className="text-[8px] text-slate-300 self-center font-bold">...</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(admin)} className="p-2.5 bg-brand-soft/50 text-brand-light rounded-xl"><Edit2 size={14} /></button>
                  <button onClick={() => { setTargetAdmin(admin); setShowDeleteModal(true); }} className="p-2.5 bg-red-50 text-red-400 rounded-xl"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden border border-brand-soft flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">

            <div className="p-6 sm:p-8 border-b border-brand-soft flex justify-between items-center bg-brand-soft/20">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{editAdmin ? "Modify Access" : "Create Profile"}</h2>
                <p className="hidden sm:block text-[10px] text-brand-light font-black uppercase tracking-[0.3em] mt-1">Fields marked with (*) are compulsory</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-brand-soft rounded-full text-brand-light border border-brand-soft"><X size={20} /></button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <InputGroup label="Full Name *" icon={<User size={16} />} error={errors.name}>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="soft-input" placeholder="Required" />
                </InputGroup>
                <InputGroup label="Email Address *" icon={<Mail size={16} />} error={errors.email}>
                  <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="soft-input" placeholder="Required" />
                </InputGroup>
                <InputGroup label="Phone Number" icon={<Phone size={16} />}>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="soft-input" placeholder="Optional" />
                </InputGroup>
                <InputGroup label="Access Level" icon={<Shield size={16} />}>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="soft-input appearance-none cursor-pointer">
                    <option value="sub_admin">Sub Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </InputGroup>
              </div>

              {/* Module Permissions Grid optimized for mobile */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[11px] font-black text-brand-light uppercase tracking-[0.3em]">Module Permissions</h3>
                  <div className="h-px bg-brand-soft flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PERMISSION_STRUCTURE.map((group) => (
                    <div key={group.category} className="bg-brand-soft/5 border border-brand-soft/30 rounded-2xl p-4 space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-brand-soft/50 pb-2">{group.category}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map(p => {
                          const active = selectedPerms[p.id];
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedPerms(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border transition-all duration-200 
                                ${active ? 'bg-brand-soft/30 border-brand-light' : 'bg-white border-brand-soft'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={active ? 'text-brand-light' : 'text-slate-400'}>{p.icon}</span>
                                <span className="text-[9px] font-black uppercase tracking-wider">{p.label}</span>
                              </div>
                              {active && <CheckCircle size={12} className="text-brand-light" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-brand-soft/20 border-t border-brand-soft flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button onClick={() => setShowModal(false)} className="order-2 sm:order-1 text-[11px] font-black text-slate-400 uppercase tracking-widest py-2">Discard</button>
              <button onClick={handleSubmit} className="order-1 sm:order-2 bg-brand-light text-white w-full sm:w-auto px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]">
                {editAdmin ? "Update Access" : "Confirm Grant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL - Simplified for mobile */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl text-center border border-brand-soft">
             {/* ... Same delete modal content ... */}
          </div>
        </div>
      )}

      <style jsx global>{`
        .soft-input { 
          padding-left: 3rem !important; 
        }
        @media (max-width: 640px) {
          .soft-input {
            font-size: 12px;
            padding: 0.7rem 1rem 0.7rem 2.8rem;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] border border-brand-soft flex items-center gap-4 sm:gap-6">
      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center bg-brand-soft text-brand-light flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

function InputGroup({ label, children, icon, error }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-brand-light/60 uppercase tracking-widest ml-4">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-light/40">{icon}</div>
        {children}
        {error && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 ml-4">{error}</p>}
      </div>
    </div>
  );
}