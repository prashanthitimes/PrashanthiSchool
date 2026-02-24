"use client";
import * as XLSX from "xlsx";
import { 
  Plus, Search, Edit2, Trash2, X, GraduationCap, 
  Users, Building2, Phone, Mail, Download, Layers, Lock, AlertCircle, Upload, FileText
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialForm = {
    full_name: "",
    email: "",
    phone: "",
    department: "",
    description: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // Helper: Generate Password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tRes, sRes] = await Promise.all([
      supabase.from("teachers").select("*").order("created_at", { ascending: false }),
      supabase.from("subjects").select("name").order("name", { ascending: true })
    ]);

    if (tRes.error) toast.error(tRes.error.message);
    else setTeachers(tRes.data || []);

    if (sRes.error) toast.error("Could not load departments");
    else setSubjects(sRes.data || []);
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle Excel Import
 const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);

      if (rawData.length === 0) throw new Error("The file is empty.");

      // 1. CHECK FOR COMPULSORY FIELDS
      const validData: any[] = [];
      const emailsToImport: string[] = [];

      for (const [index, item] of rawData.entries()) {
        const name = item["Full Name"] || item.FullName;
        const email = item.Email;
        const phone = item.Phone;
        const rowNum = index + 2; // Offset for header and 0-index

        if (!name || !email || !phone) {
          throw new Error(`Row ${rowNum} is missing required data (Name, Email, or Phone).`);
        }

        validData.push({
          full_name: name,
          email: email.toLowerCase().trim(),
          phone: phone.toString(),
          department: item.Department || "Unassigned",
          teacher_id: `TEA-${Math.floor(1000 + Math.random() * 9000)}`,
          password: generatePassword(), 
        });
        emailsToImport.push(email.toLowerCase().trim());
      }

      // 2. CHECK FOR DUPLICATES IN DATABASE
      const { data: existingStaff } = await supabase
        .from("teachers")
        .select("email")
        .in("email", emailsToImport);

      if (existingStaff && existingStaff.length > 0) {
        const dups = existingStaff.map(s => s.email).join(", ");
        throw new Error(`Import blocked. The following emails already exist: ${dups}`);
      }

      // 3. INSERT DATA
      const { error } = await supabase.from("teachers").insert(validData);
      if (error) throw error;

      toast.success(`${validData.length} Staff members imported successfully.`);
      fetchData();
    } catch (err: any) {
      // SHOW ERROR MODAL/TOAST
      toast.error(err.message, { duration: 5000 });
    }
  };
  reader.readAsBinaryString(file);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

  // Download Sample File
  const downloadSample = () => {
    const sampleData = [
      { "Full Name": "John Doe", "Email": "john@school.com", "Department": "Mathematics", "Phone": "1234567890" },
      { "Full Name": "Jane Smith", "Email": "jane@school.com", "Department": "Science", "Phone": "0987654321" }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "teacher_import_sample.xlsx");
  };

  const filtered = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = [t.full_name, t.email, t.department, t.teacher_id].some(field => 
        (field || "").toLowerCase().includes(search.toLowerCase())
      );
      const matchesDept = selectedDept === "All" || t.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [teachers, search, selectedDept]);

  const exportToExcel = (data: any[], fileName: string) => {
    if (data.length === 0) return toast.error("No data to export");

    const excelData = data.map((t) => ({
      "Teacher ID": t.teacher_id,
      "Full Name": t.full_name,
      "Department": t.department || "Unassigned",
      "Email": t.email,
      "Phone": t.phone || "N/A",
      "Portal Password": t.password || "N/A", // PASSWORD INCLUDED IN EXPORT
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel file downloaded");
  };

  const openModal = (t: any = null) => {
    if (t) {
      setEditTeacher(t);
      setFormData({
        full_name: t.full_name,
        email: t.email,
        phone: t.phone || "",
        department: t.department || "",
        description: t.description || "",
        password: t.password || "",
      });
    } else {
      setEditTeacher(null);
      setFormData({ ...initialForm, password: generatePassword() });
    }
    setShowModal(true);
  };

  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) return toast.error("Required fields missing");

    try {
      const payload = { ...formData, teacher_id: editTeacher ? editTeacher.teacher_id : `TEA-${Math.floor(1000 + Math.random() * 9000)}` };
      
      const { error } = editTeacher 
        ? await supabase.from("teachers").update(payload).eq("id", editTeacher.id)
        : await supabase.from("teachers").insert([payload]);

      if (error) throw error;
      toast.success(editTeacher ? "Profile updated" : "Staff onboarded");
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message.includes("unique") ? "Email already exists" : e.message);
    }
  };

return (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-6 md:space-y-8 bg-[#fffcfd] min-h-screen">
    <Toaster richColors position="top-center" />

    {/* HEADER */}
    <header className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-soft/30 rounded-2xl md:rounded-3xl flex items-center justify-center text-brand border border-brand-soft shadow-sm shrink-0">
            <Users size={24} className="md:w-[30px] md:h-[30px]" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">
              FACULTY<span className="text-brand">REGISTRY</span>
            </h1>
            <p className="text-brand font-bold text-[8px] md:text-[10px] tracking-[0.2em] uppercase opacity-70 mt-1">Staff Management System</p>
          </div>
        </div>
        {/* Onboard Button for Mobile - Floating or Top Right */}
        <button
          onClick={() => openModal()}
          className="lg:hidden bg-brand text-white p-4 rounded-2xl shadow-lg shadow-brand-soft active:scale-95 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* ACTION BUTTONS BAR */}
      <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-3">
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls, .csv" className="hidden" />
        
        <button 
            onClick={downloadSample}
            className="flex-1 bg-emerald-50 text-emerald-600 border-2 border-emerald-100 px-3 py-4 rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
        >
            <FileText size={16}/> Sample
        </button>

        <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-white border-2 border-slate-100 text-slate-600 px-3 py-4 rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
        >
            <Upload size={16}/> Import
        </button>

        <button 
            onClick={() => exportToExcel(teachers, 'all_teachers')}
            className="flex-1 bg-slate-800 text-white px-3 py-4 rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
        >
            <Download size={16}/> Export
        </button>

        <button
          onClick={() => openModal()}
          className="hidden lg:flex flex-1 bg-brand text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-soft hover:brightness-110 transition-all items-center justify-center gap-2"
        >
          <Plus size={18} /> Onboard Teacher
        </button>
      </div>
    </header>

    {/* SEARCH & DEPT FILTER */}
    <div className="bg-white p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] border border-brand-soft flex flex-col md:flex-row gap-3 items-center shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" size={18} />
        <input 
          type="text" 
          placeholder="Search faculty..."
          className="w-full pl-12 pr-6 py-4 bg-brand-soft/20 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-brand"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center bg-brand-soft/30 px-4 rounded-2xl w-full md:w-auto">
        <Building2 className="text-brand mr-2" size={14}/>
        <select 
          value={selectedDept}
          className="w-full bg-transparent border-none py-4 font-black text-slate-700 text-[11px] uppercase cursor-pointer outline-none" 
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="All">All Departments</option>
          {subjects.map((s, idx) => (
            <option key={idx} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>

    {/* DATA CONTAINER */}
    <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-brand-soft overflow-hidden shadow-sm">
      {/* DESKTOP VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-soft/10 text-[10px] font-black text-brand uppercase tracking-widest border-b border-brand-soft">
              <th className="px-10 py-7">Faculty Member</th>
              <th className="px-8 py-7">Department</th>
              <th className="px-8 py-7">Contact Information</th>
              <th className="px-10 py-7 text-center">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-soft/10">
            {loading ? (
              <tr><td colSpan={4} className="p-32 text-center animate-pulse text-brand font-black tracking-widest">LOADING...</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-brand-soft/5 transition-all group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-soft text-brand rounded-xl flex items-center justify-center font-black text-lg shrink-0">{t.full_name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-slate-800 uppercase text-sm">{t.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{t.teacher_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black text-slate-700 uppercase bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{t.department || "Unassigned"}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 lowercase truncate max-w-[150px]"><Mail size={12} className="text-brand"/> {t.email}</p>
                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2"><Phone size={12} className="text-brand"/> {t.phone || "N/A"}</p>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => openModal(t)} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-800 hover:text-white transition-all"><Edit2 size={16}/></button>
                    <button onClick={() => setDeleteId(t.id)} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden divide-y divide-brand-soft/10">
        {loading ? (
           <div className="p-20 text-center animate-pulse text-brand font-black text-xs uppercase tracking-widest">Loading...</div>
        ) : filtered.map((t) => (
          <div key={t.id} className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-soft text-brand rounded-xl flex items-center justify-center font-black">{t.full_name.charAt(0)}</div>
                <div>
                  <p className="font-black text-slate-800 uppercase text-xs">{t.full_name}</p>
                  <p className="text-[9px] font-bold text-slate-400">{t.teacher_id}</p>
                </div>
              </div>
              <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">{t.department || "N/A"}</span>
            </div>
            
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2 lowercase"><Mail size={10} className="text-brand"/> {t.email}</p>
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2"><Phone size={10} className="text-brand"/> {t.phone || "N/A"}</p>
            </div>

            <div className="flex gap-2">
               <button onClick={() => openModal(t)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                <Edit2 size={14}/> Edit
               </button>
               <button onClick={() => setDeleteId(t.id)} className="flex-1 py-3 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase">
                <Trash2 size={14}/> Remove
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* MODAL ADJUSTMENTS (Mobile Full Screen) */}
    {showModal && (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 max-h-[95vh] flex flex-col">
          <div className="p-6 md:p-8 border-b border-brand-soft bg-brand-soft/10 flex justify-between items-center shrink-0">
            <h2 className="text-lg md:text-xl font-black text-brand uppercase tracking-tighter">
              {editTeacher ? 'Update' : 'Onboard'} Faculty
            </h2>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={24}/></button>
          </div>
          
          <form onSubmit={saveTeacher} className="p-6 md:p-10 space-y-4 md:space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Full Name</label>
                <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full px-5 py-3.5 md:px-6 md:py-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-soft outline-none text-sm" placeholder="e.g. Dr. Sarah Jenkins" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3.5 md:px-6 md:py-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-soft outline-none text-sm" placeholder="sarah.j@school.com" />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Department</label>
                <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold outline-none cursor-pointer border-2 border-transparent focus:border-brand-soft text-sm">
                  <option value="">Select Dept</option>
                  {subjects.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Contact Phone</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-soft outline-none text-sm" placeholder="+1 (555) 000-0000" />
              </div>

              <div className="md:col-span-2">
                <div className="p-4 md:p-6 bg-brand-soft/10 rounded-[1.5rem] md:rounded-[2rem] border border-brand-soft/30">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-black text-brand uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Portal Password</label>
                    <button type="button" onClick={() => setFormData({ ...formData, password: generatePassword() })} className="text-[9px] font-black text-slate-400 uppercase">Regenerate</button>
                  </div>
                  <div className="bg-white px-4 py-2.5 rounded-xl font-mono text-base md:text-lg font-black text-brand text-center tracking-widest border border-brand-soft">
                    {formData.password}
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-brand text-white py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-brand-soft hover:brightness-110 active:scale-[0.98] transition-all text-[11px] md:text-sm">
              {editTeacher ? "Update Profile" : "Onboard Faculty"}
            </button>
          </form>
        </div>
      </div>
    )}
  </div>
);
}