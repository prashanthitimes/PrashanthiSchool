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
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 bg-[#fffcfd] min-h-screen">
      <Toaster richColors position="top-center" />

      {/* HEADER */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-soft/30 rounded-3xl flex items-center justify-center text-brand border border-brand-soft shadow-sm">
            <Users size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
              FACULTY<span className="text-brand">REGISTRY</span>
            </h1>
            <p className="text-brand font-bold text-[10px] tracking-[0.2em] uppercase opacity-70">Staff Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {/* IMPORT HIDDEN INPUT */}
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls, .csv" className="hidden" />
            
           <div className="flex items-center gap-3">
    {/* NEW: Standalone Sample Button */}
    <button 
        onClick={downloadSample}
        className="bg-emerald-50 text-emerald-600 border-2 border-emerald-100 px-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-100 transition-all"
    >
        <FileText size={18}/> Sample File
    </button>

    {/* IMPORT HIDDEN INPUT */}
    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls, .csv" className="hidden" />
    
    <button 
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
    >
        <Upload size={18}/> Import
    </button>

    {/* EXPORT BUTTON */}
    <button 
        onClick={() => exportToExcel(teachers, 'all_teachers')}
        className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-700 transition-all"
    >
        <Download size={18}/> Export
    </button>
</div>
          <button
            onClick={() => openModal()}
            className="bg-brand text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-soft hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Onboard Teacher
          </button>
        </div>
      </header>
      
      {/* ... Rest of your search, table, and modal code remains the same ... */}
      {/* Ensure the table mapping and search logic are kept as per your original file */}
      
      {/* SEARCH & DEPT FILTER */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[2.5rem] border border-brand-soft flex flex-col lg:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by name, email or ID..."
                    className="w-full pl-14 pr-6 py-4 bg-brand-soft/20 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-brand"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex items-center bg-brand-soft/30 px-4 rounded-2xl w-full lg:w-auto">
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
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[3rem] border border-brand-soft overflow-hidden shadow-sm">
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
                    <div className="w-12 h-12 bg-brand-soft text-brand rounded-2xl flex items-center justify-center font-black text-xl">
                      {t.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 uppercase text-sm">{t.full_name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{t.teacher_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    <span className="text-xs font-black text-slate-700 uppercase">{t.department || "Unassigned"}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 lowercase"><Mail size={12} className="text-brand"/> {t.email}</p>
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
        {!loading && filtered.length === 0 && (
            <div className="p-20 text-center">
                <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No faculty members found</p>
            </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-brand-soft bg-brand-soft/10 flex justify-between items-center">
                <h2 className="text-xl font-black text-brand uppercase tracking-tighter">
                    {editTeacher ? 'Update' : 'Onboard'} Faculty
                </h2>
                <button onClick={() => setShowModal(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={saveTeacher} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Full Name</label>
                        <input 
                            required 
                            value={formData.full_name} 
                            onChange={e => setFormData({...formData, full_name: e.target.value})} 
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-soft outline-none"
                            placeholder="e.g. Dr. Sarah Jenkins"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email Address</label>
                        <input 
                            required 
                            type="email"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-soft outline-none"
                            placeholder="sarah.j@school.com"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Department</label>
                        <select 
                            required 
                            value={formData.department} 
                            onChange={e => setFormData({...formData, department: e.target.value})} 
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none cursor-pointer border-2 border-transparent focus:border-brand-soft"
                        >
                            <option value="">Select Dept</option>
                            {subjects.map((s, idx) => (
                                <option key={idx} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Contact Phone</label>
                        <input 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-soft outline-none"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="col-span-2">
                        <div className="p-6 bg-brand-soft/10 rounded-[2rem] border border-brand-soft/30">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                                    <Lock size={12}/> Portal Password
                                </label>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({ ...formData, password: generatePassword() })}
                                    className="text-[10px] font-black text-slate-400 hover:text-brand transition-colors uppercase"
                                >
                                    Regenerate
                                </button>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-xl font-mono text-lg font-black text-brand text-center tracking-widest border border-brand-soft">
                                {formData.password}
                            </div>
                        </div>
                    </div>
                </div>

                <button className="w-full bg-brand text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-brand-soft hover:brightness-110 active:scale-[0.98] transition-all">
                    {editTeacher ? "Update Profile" : "Onboard Faculty"}
                </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-10 rounded-[3.5rem] w-full max-w-sm text-center shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40}/>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">TERMINATE RECORD?</h3>
            <p className="text-slate-500 text-xs font-bold mb-8 uppercase leading-relaxed tracking-wide">
                This will permanently remove the teacher from all academic systems.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-400 text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancel</button>
              <button 
                onClick={async () => { 
                    await supabase.from("teachers").delete().eq("id", deleteId); 
                    setDeleteId(null); 
                    fetchData(); 
                    toast.success("Record Terminated");
                }} 
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}