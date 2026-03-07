"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  FiCalendar,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiClipboard,
  FiChevronRight,
  FiCheckCircle,
  FiAward,
  FiTarget // Icon for Passing Marks
} from "react-icons/fi";
// 1. Updated classesList to include C and D for all grades
const baseLevels = ["Pre-KG", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `${i + 1}`)];
const sections = ["A", "B", "C", "D"];

// flatMap ensures every level gets exactly one of each section
const classesList = baseLevels.flatMap(lvl =>
  sections.map(sec => `${lvl}-${sec}`)
);

export default function ExamsPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  const emptyForm = {
    exam_name: "",
    exam_type: "",
    total_marks: 100,
    pass_marks: 33, // Added passing marks field
    start_date: "",
    end_date: "",
    classes: [] as string[],
    instructions: "",
  };

  const [form, setForm] = useState(emptyForm);

  const fetchExams = async () => {
    const { data } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });
    setExams(data || []);
  };

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  const saveExam = async () => {
    if (!form.exam_name || !form.exam_type) return alert("Please fill required fields");
    // Simple validation: Pass marks shouldn't exceed total marks
    if (form.pass_marks > form.total_marks) return alert("Passing marks cannot exceed maximum marks");

    setLoading(true);
    if (editId) {
      await supabase.from("exams").update(form).eq("id", editId);
    } else {
      await supabase.from("exams").insert([form]);
    }

    setLoading(false);
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
    triggerSaveIndicator();
    fetchExams();
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam schedule?")) return;
    await supabase.from("exams").delete().eq("id", id);
    fetchExams();
  };

  const triggerSaveIndicator = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 3000);
  };

  const toggleClass = (cls: string) => {
    setForm((prev) => ({
      ...prev,
      classes: prev.classes.includes(cls)
        ? prev.classes.filter((c) => c !== cls)
        : [...prev.classes, cls],
    }));
  };

  const getStatus = (start: string, end: string) => {
    if (!today) return { label: "", color: "" };

    if (today < start)
      return { label: "Upcoming", color: "bg-blue-50 text-blue-600 border-blue-100" };

    if (today > end)
      return { label: "Completed", color: "bg-slate-100 text-slate-500 border-slate-200" };

    return { label: "Ongoing", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
  };

  return (
    <div className="p-6 mt-10 space-y-8 max-w-[1200px] mx-auto min-h-screen bg-[#FCFAFC] dark:bg-slate-950 transition-colors duration-300">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-brand-soft/30 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-accent dark:bg-brand/20 text-brand dark:text-brand-light rounded-2xl flex items-center justify-center shadow-inner">
            <FiClipboard size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none">Exam Registry</h1>
            <p className="text-[10px] font-bold text-brand dark:text-brand-light tracking-[0.25em] uppercase mt-1.5 opacity-80">Assessment Ledger</p>
          </div>
        </div>

        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true); }}
          className="px-8 py-4 bg-brand dark:bg-brand text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <FiPlus size={16} /> Schedule Assessment
        </button>
      </header>

      {/* EXAMS TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-brand/5 dark:shadow-none border border-brand-soft/30 dark:border-slate-800 overflow-hidden">

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-accent/40 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <th className="p-6 text-left">Exam</th>
                <th className="p-6 text-left">Classes</th>
                <th className="p-6 text-center">Marks</th>
                <th className="p-6 text-left">Dates</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y dark:divide-slate-800 text-xs font-bold uppercase">
              {today && exams.map((e) => {
                const status = getStatus(e.start_date, e.end_date)
                return (
                  <tr key={e.id} className="hover:bg-brand-accent/10 dark:hover:bg-brand/5 transition-colors">
                    <td className="p-6">
                      <div className="text-slate-800 dark:text-slate-200 text-sm font-black">{e.exam_name}</div>
                      <div className="text-brand dark:text-brand-light text-[9px]">{e.exam_type}</div>
                    </td>
                    <td className="p-6 text-slate-600 dark:text-slate-400">
                      {e.classes.join(", ")}
                    </td>
                    <td className="p-6 text-center text-slate-600 dark:text-slate-400">
                      {e.total_marks} / {e.pass_marks}
                    </td>
                    <td className="p-6 text-slate-600 dark:text-slate-400">
                      {e.start_date} → {e.end_date}
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] border ${status.color} dark:bg-opacity-10`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditId(e.id); setForm(e); setOpen(true); }}
                          className="p-2 bg-brand-soft/30 dark:bg-slate-800 text-brand dark:text-brand-light rounded-xl hover:bg-brand dark:hover:bg-brand hover:text-white transition-all"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => deleteExam(e.id)}
                          className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE CARD VIEW ================= */}
        <div className="md:hidden p-4 space-y-4">
          {today && exams.map((e) => {
            const status = getStatus(e.start_date, e.end_date)
            return (
              <div key={e.id} className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">{e.exam_name}</h3>
                    <p className="text-[10px] text-brand dark:text-brand-light font-bold uppercase">{e.exam_type}</p>
                  </div>
                  <span className={`px-3 py-1 text-[9px] rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <FiCalendar size={14} className="text-brand dark:text-brand-light" />
                  {e.start_date} → {e.end_date}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-xs font-bold">
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] uppercase">Max Marks</p>
                    <p className="dark:text-slate-300">{e.total_marks}</p>
                  </div>
                  <div className="text-xs font-bold">
                    <p className="text-slate-400 dark:text-slate-500 text-[9px] uppercase">Pass Marks</p>
                    <p className="dark:text-slate-300">{e.pass_marks}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => { setEditId(e.id); setForm(e); setOpen(true); }} className="flex-1 py-2 bg-brand text-white rounded-xl text-xs font-bold">Edit</button>
                  <button onClick={() => deleteExam(e.id)} className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-xs font-bold">Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-brand dark:bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl dark:shadow-none border dark:border-slate-800">
        <div className="flex items-center gap-6">
          <div>
            <h4 className="text-lg font-black tracking-tight">Exam Administration</h4>
            <p className="text-brand-soft/60 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Total Records: {exams.length}
            </p>
          </div>
          {saveStatus && (
            <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Records Updated</span>
            </div>
          )}
        </div>
      </footer>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-brand-dark/40 dark:bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white dark:border-slate-800 animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-brand-accent/20 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                  {editId ? "Update Schedule" : "New Assessment"}
                </h2>
                <p className="text-[10px] font-bold text-brand dark:text-brand-light uppercase tracking-widest">Database Entry Configuration</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center rounded-2xl text-slate-400 dark:text-slate-500 hover:text-red-500 transition-all">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Assessment Name</label>
                  <input
                    placeholder="E.G. FIRST SEMESTER FINAL"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-brand dark:text-slate-200 transition-all"
                    value={form.exam_name}
                    onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Category</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-brand dark:text-slate-200 transition-all"
                    value={form.exam_type}
                    onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                  >
                    <option value="" className="dark:bg-slate-900">SELECT CATEGORY</option>
                    <option className="dark:bg-slate-900">UNIT TEST</option>
                    <option className="dark:bg-slate-900">MID TERM</option>
                    <option className="dark:bg-slate-900">FINAL EXAM</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Max Marks</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 pl-10 rounded-2xl text-[11px] font-black outline-none focus:border-brand dark:text-slate-200"
                        value={form.total_marks}
                        onChange={(e) => setForm({ ...form, total_marks: +e.target.value })}
                      />
                      <FiAward className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Pass Marks</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 pl-10 rounded-2xl text-[11px] font-black outline-none focus:border-brand dark:text-slate-200"
                        value={form.pass_marks}
                        onChange={(e) => setForm({ ...form, pass_marks: +e.target.value })}
                      />
                      <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40" size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[11px] font-black outline-none focus:border-brand dark:text-slate-200 transition-all"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[11px] font-black outline-none focus:border-brand dark:text-slate-200 transition-all"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Assign Classes
                  </label>

                  ```
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = form.classes.length === classesList.length;
                      setForm({ ...form, classes: allSelected ? [] : [...classesList] });
                    }}
                    className="text-[8px] font-bold uppercase px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-soft hover:text-brand transition border border-slate-200 dark:border-slate-700"
                  >
                    {form.classes.length === classesList.length ? "Clear" : "All"}
                  </button>
                  ```

                </div>

                {/* Compact grid */}

                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                  {classesList.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={`px-1.5 py-2 rounded-lg border text-[9px] font-bold transition ${form.classes.includes(cls)
                          ? "bg-brand border-brand text-white shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-soft"
                        }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>


              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-2 block">Guidelines & Instructions</label>
                <textarea
                  placeholder="REPORTING TIME, REQUIRED STATIONARY..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-brand dark:text-slate-200 transition-all"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                />
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-600 transition"
              >
                Discard
              </button>
              <button
                onClick={saveExam}
                disabled={loading}
                className="px-10 py-4 rounded-2xl bg-brand text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Syncing..." : editId ? "Update Registry" : "Commit to Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}