"use client";

import {
  Shield, Plus, Edit2, CheckCircle, X, Trash2, Mail,
  User, Users, ShieldCheck, LayoutDashboard, GraduationCap, Briefcase,
  ClipboardList, Wallet, Truck, Bell, Calendar, Key, Settings,
  Image as ImageIcon, Clock, AlertTriangle, Phone, FileText, Camera, IndianRupee
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";
import { useEffect, useState, Children, isValidElement, cloneElement } from "react";

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
      {
        id: 'fee-setup',
        label: 'Fee Setup',
        icon: <IndianRupee size={16} />
      },
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
  // Inside AdminManagement component
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", role: "sub_admin", description: "", password: "" // Add password here
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation: Required for new admins, optional for edits unless you want to change it
    if (!editAdmin && !formData.password) {
      newErrors.password = "Password is required for new accounts";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    const activePermsCount = Object.values(selectedPerms).filter(Boolean).length;
    if (activePermsCount === 0) newErrors.perms = "Select at least one permission";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
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

  const handleToggleCategory = (categoryItems: any[]) => {
    const allSelected = categoryItems.every(item => selectedPerms[item.id]);
    const newState = { ...selectedPerms };
    categoryItems.forEach(item => {
      newState[item.id] = !allSelected;
    });
    setSelectedPerms(newState);
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
  description: admin.description || "",
  password: "" // ✅ ADD THIS
});
      setSelectedPerms(admin.permissions || {});
    } else {
      setEditAdmin(null);
      const [formData, setFormData] = useState({
  name: "",
  email: "",
  phone: "",
  role: "sub_admin",
  description: "",
  password: ""
});
      setSelectedPerms({});
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const userRole = localStorage.getItem('userRole');

    if (userRole !== 'admin') {
      toast.error("Security Blocked", {
        description: "You must be signed in as an Admin."
      });
      return;
    }

    if (!validate()) return;

    const payload: any = {
      full_name: formData.name,
      name: formData.name,
      email: formData.email.trim(),
      phone: formData.phone,
      role: formData.role,
      description: formData.description,
      permissions: selectedPerms,
      status: "active",
    };

    // Only include password if it's been typed (prevents overwriting with empty string on edits)
    if (formData.password) {
      payload.password = formData.password;
    }

    const toastId = toast.loading(editAdmin ? "Updating..." : "Creating...");

    try {
      const { data, error } = editAdmin
        ? await supabase.from("admin_users").update(payload).eq("id", editAdmin.id)
        : await supabase.from("admin_users").insert([payload]);

      if (error) {
        console.error("Database Error:", error);
        toast.error("Save Failed", { description: error.message, id: toastId });
      } else {
        toast.success(editAdmin ? "Admin updated!" : "Admin created!", { id: toastId });

        // CRITICAL: Refresh the list and close the modal
        setShowModal(false);
        fetchAdmins();
      }
    } catch (err) {
      toast.error("An unexpected error occurred", { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!targetAdmin) return;
    if (targetAdmin.email === 'Prashanthitimes@gmail.com') {
      toast.error("System Protected", { description: "The primary root administrator cannot be removed." });
      setShowDeleteModal(false);
      return;
    }

    const toastId = toast.loading("Revoking access...");
    try {
      const { error } = await supabase.from("admin_users").delete().eq("id", targetAdmin.id);
      if (error) {
        toast.error("Database Error", { description: error.message, id: toastId });
      } else {
        toast.success("Access Revoked", { id: toastId });
        setShowDeleteModal(false);
        fetchAdmins();
      }
    } catch (err) {
      toast.error("System Error", { id: toastId });
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-brand-soft/20 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-brand-soft border-t-brand-light rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-8xl mx-auto mt-4 sm:mt-10 px-4 sm:px-6 lg:px-8 py-4 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <Toaster position="top-center" richColors />

      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-6 sm:px-8 sm:py-6 rounded-[2rem] border border-brand-soft dark:border-slate-800 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 bg-brand-soft dark:bg-slate-800 text-brand-light rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Admin Registry</h1>
            <p className="text-[10px] font-bold text-brand-light dark:text-brand-soft uppercase leading-none">Security Management</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-brand-light hover:bg-brand text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-brand-soft">
          <Plus size={18} className="inline mr-2" /> Create New Admin
        </button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6">
        <StatCard title="Total" value={counts.total} icon={<Users size={18} />} />
        <StatCard title="Super Admin" value={counts.super} icon={<ShieldCheck size={18} />} />
        <StatCard title="Sub Admin" value={counts.sub} icon={<Shield size={18} />} />
      </div>

      {/* REGISTRY LIST/TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-brand-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-soft/30 dark:bg-slate-800/50">
              <tr>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Administrator</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest">Assigned Access</th>
                <th className="p-6 text-[10px] font-black text-brand-light uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-soft/40 dark:divide-slate-800">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-brand-soft/10 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-6 align-top">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-brand-soft dark:bg-slate-800 text-brand-light flex items-center justify-center font-black">{admin.full_name?.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 leading-none">{admin.full_name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-2">
                      <span className="w-fit px-2 py-0.5 bg-brand-light text-white rounded-md text-[8px] font-black uppercase tracking-wider">{admin.role?.replace('_', ' ')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PERMISSION_STRUCTURE.flatMap(g => g.items)
                          .filter(item => admin.permissions?.[item.id])
                          .map(item => (
                            <div key={item.id} className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                              <span className="text-brand-light">{item.icon}</span>
                              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(admin)} className="p-2 text-brand-light hover:bg-brand-soft dark:hover:bg-slate-800 rounded-xl transition-all"><Edit2 size={16} /></button>
                      {admin.email !== 'Prashanthitimes@gmail.com' ? (
                        <button onClick={() => { setTargetAdmin(admin); setShowDeleteModal(true); }} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                      ) : (
                        <div className="p-2 text-brand-light bg-brand-soft/50 dark:bg-slate-800 rounded-xl"><ShieldCheck size={16} /></div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-brand-soft/40 dark:divide-slate-800">
          {admins.map((admin) => (
            <div key={admin.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-soft dark:bg-slate-800 text-brand-light flex items-center justify-center font-black text-sm">{admin.full_name?.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{admin.full_name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{admin.email}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-brand-soft dark:bg-slate-800 text-brand-light rounded-lg text-[8px] font-black uppercase">{admin.role?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-wrap gap-1 max-w-[70%]">
                  {Object.keys(admin.permissions || {}).filter(k => admin.permissions[k]).slice(0, 4).map(k => (
                    <span key={k} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-md text-[8px] font-bold uppercase border border-slate-100 dark:border-slate-700">{k.split('-')[0]}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(admin)} className="p-2.5 bg-brand-soft/50 dark:bg-slate-800 text-brand-light rounded-xl"><Edit2 size={14} /></button>
                  {admin.email !== 'Prashanthitimes@gmail.com' && (
                    <button onClick={() => { setTargetAdmin(admin); setShowDeleteModal(true); }} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-400 rounded-xl"><Trash2 size={14} /></button>
                  )}
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
          <div className="relative bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden border border-brand-soft dark:border-slate-800 flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">
            <div className="p-6 sm:p-8 border-b border-brand-soft dark:border-slate-800 flex justify-between items-center bg-brand-soft/20 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{editAdmin ? "Modify Access" : "Create Profile"}</h2>
                <p className="hidden sm:block text-[10px] text-brand-light dark:text-brand-soft font-black uppercase tracking-[0.3em] mt-1">Fields marked with (*) are compulsory</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-brand-soft dark:hover:bg-slate-700 rounded-full text-brand-light border border-brand-soft dark:border-slate-700"><X size={20} /></button>
            </div>

            <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <InputGroup label="Full Name *" icon={<User size={16} />} error={errors.name}>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="Required"
                  />
                </InputGroup>

                <InputGroup label="Email Address *" icon={<Mail size={16} />} error={errors.email}>
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="Required"
                  />
                </InputGroup>
                {/* Add this block inside the <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"> */}

                <InputGroup label={editAdmin ? "New Password (Optional)" : "Password *"} icon={<Key size={16} />} error={errors.password}>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder={editAdmin ? "Leave blank to keep current" : "Minimum 6 chars"}
                  />
                </InputGroup>
                <InputGroup label="Phone Number" icon={<Phone size={16} />}>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    placeholder="Optional"
                  />
                </InputGroup>

                <InputGroup label="Access Level" icon={<Shield size={16} />}>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="soft-input dark:bg-slate-800 dark:border-slate-700 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="sub_admin">Sub Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </InputGroup>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[11px] font-black text-brand-light uppercase tracking-[0.3em]">Module Permissions</h3>
                  <div className="h-px bg-brand-soft dark:bg-slate-800 flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PERMISSION_STRUCTURE.map((group) => {
                    const allSelected = group.items.every(item => selectedPerms[item.id]);
                    return (
                      <div key={group.category} className="bg-brand-soft/5 dark:bg-slate-800/30 border border-brand-soft/30 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-brand-soft/50 dark:border-slate-700 pb-2">
                          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{group.category}</p>
                          <button
                            type="button"
                            onClick={() => handleToggleCategory(group.items)}
                            className={`text-[8px] font-black px-2 py-1 rounded-md uppercase transition-colors ${allSelected ? 'bg-brand-light text-white' : 'bg-brand-soft dark:bg-slate-700 text-brand-light hover:bg-brand-light/20'}`}
                          >
                            {allSelected ? 'Unselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {group.items.map(p => {
                            const active = selectedPerms[p.id];
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPerms(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl border transition-all duration-200 ${active ? 'bg-brand-soft/30 border-brand-light dark:bg-brand-light/10' : 'bg-white dark:bg-slate-800 border-brand-soft dark:border-slate-700'}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={active ? 'text-brand-light' : 'text-slate-400 dark:text-slate-500'}>{p.icon}</span>
                                  <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'dark:text-white' : 'dark:text-slate-400'}`}>{p.label}</span>
                                </div>
                                {active && <CheckCircle size={12} className="text-brand-light" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-brand-soft/20 dark:bg-slate-800 border-t border-brand-soft dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button onClick={() => setShowModal(false)} className="order-2 sm:order-1 text-[11px] font-black text-slate-400 uppercase tracking-widest py-2">Discard</button>
              <button onClick={handleSubmit} className="order-1 sm:order-2 bg-brand-light text-white w-full sm:w-auto px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px]">
                {editAdmin ? "Update Access" : "Confirm Grant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-brand-dark/60 dark:bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-brand-soft dark:border-slate-800 overflow-hidden relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center shadow-inner">
                <AlertTriangle size={40} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight uppercase dark:text-slate-100">Revoke Access?</h3>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 px-4 leading-relaxed">
                  Permanently remove <span className="text-red-500">{targetAdmin?.full_name}</span>. This action is immediate.
                </p>
              </div>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button onClick={handleDelete} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-red-200">Confirm Revocation</button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-brand-soft dark:border-slate-800 flex flex-col sm:flex-row items-center sm:gap-6 text-center sm:text-left transition-colors">
      <div className="h-8 w-8 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center bg-brand-soft dark:bg-slate-800 text-brand-light flex-shrink-0 mb-2 sm:mb-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-400 dark:text-slate-500 truncate">{title}</p>
        <h3 className="text-sm sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}


function InputGroup({ label, children, icon, error }: any) {
  return (
    <div className="space-y-1.5 w-full flex flex-col group">
      <label className="text-[9px] font-black text-brand-light/60 dark:text-slate-500 uppercase tracking-widest ml-4 group-focus-within:text-brand-light transition-colors">
        {label}
      </label>
      <div className="relative flex items-center">
        {/* Icon Container: Ensure it has a fixed width and height for centering */}
        <div className="absolute left-4 z-10 pointer-events-none text-brand-light/50 group-focus-within:text-brand-light transition-colors flex items-center justify-center w-5 h-5">
          {icon}
        </div>

        {Children.map(children, (child) => {
          if (isValidElement(child)) {
            return cloneElement(child as React.ReactElement<any>, {
              // Using style as a fallback to ensure padding is applied regardless of CSS conflicts
              style: { paddingLeft: '3rem' },
              className: `${child.props.className || ""} w-full`.trim(),
            });
          }
          return child;
        })}
      </div>
      {error && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 ml-4 animate-in fade-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}