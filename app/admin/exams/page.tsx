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

const classesList = Array.from({ length: 10 }, (_, i) => [
  `${i + 1}-A`, `${i + 1}-B`
]).flat();

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
    <div className="p-6 mt-10 space-y-8 max-w-[1200px] mx-auto min-h-screen bg-[#FCFAFC]">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-brand-soft/30 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-accent text-brand rounded-2xl flex items-center justify-center shadow-inner">
            <FiClipboard size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Exam Registry</h1>
            <p className="text-[10px] font-bold text-brand tracking-[0.25em] uppercase mt-1.5 opacity-80">Assessment Ledger</p>
          </div>
        </div>

        <button
          onClick={() => { setForm(emptyForm); setEditId(null); setOpen(true); }}
          className="px-8 py-4 bg-brand text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <FiPlus size={16} /> Schedule Assessment
        </button>
      </header>

      {/* EXAMS TABLE */}
      {/* EXAMS LIST */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-brand/5 border border-brand-soft/30 overflow-hidden">

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brand-accent/40 text-[10px] font-black uppercase tracking-widest">
                <th className="p-6 text-left">Exam</th>
                <th className="p-6 text-left">Classes</th>
                <th className="p-6 text-center">Marks</th>
                <th className="p-6 text-left">Dates</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y text-xs font-bold uppercase">
              {today && exams.map((e) => {
                const status = getStatus(e.start_date, e.end_date)

                return (
                  <tr key={e.id} className="hover:bg-brand-accent/10">
                    <td className="p-6">
                      <div className="text-slate-800 text-sm font-black">{e.exam_name}</div>
                      <div className="text-brand text-[9px]">{e.exam_type}</div>
                    </td>

                    <td className="p-6">
                      {e.classes.join(", ")}
                    </td>

                    <td className="p-6 text-center">
                      {e.total_marks} / {e.pass_marks}
                    </td>

                    <td className="p-6">
                      {e.start_date} → {e.end_date}
                    </td>

                    <td className="p-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>

                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditId(e.id); setForm(e); setOpen(true); }}
                          className="p-2 bg-brand-soft/30 text-brand rounded-xl"
                        >
                          <FiEdit size={14} />
                        </button>

                        <button
                          onClick={() => deleteExam(e.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl"
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
              <div
                key={e.id}
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      {e.exam_name}
                    </h3>
                    <p className="text-[10px] text-brand font-bold uppercase">
                      {e.exam_type}
                    </p>
                  </div>

                  <span className={`px-3 py-1 text-[9px] rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Dates */}
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <FiCalendar size={14} className="text-brand" />
                  {e.start_date} → {e.end_date}
                </div>

                {/* Marks */}
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Max Marks</span>
                  <span>{e.total_marks}</span>
                </div>

                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Pass Marks</span>
                  <span>{e.pass_marks}</span>
                </div>

                {/* Classes */}
                <div>
                  <p className="text-[9px] text-slate-400 uppercase mb-1">Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {e.classes.map((c: string) => (
                      <span
                        key={c}
                        className="px-2 py-1 text-[9px] bg-brand-soft/20 text-brand rounded-lg"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => { setEditId(e.id); setForm(e); setOpen(true); }}
                    className="flex-1 py-2 bg-brand text-white rounded-xl text-xs font-bold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteExam(e.id)}
                    className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="bg-brand-light rounded-[2rem] p-8 text-white flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-6">
          <div>
            <h4 className="text-lg font-black tracking-tight">Exam Administration</h4>
            <p className="text-brand-soft/60 text-[10px] font-bold uppercase tracking-widest">
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
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-brand-accent/20">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {editId ? "Update Schedule" : "New Assessment"}
                </h2>
                <p className="text-[10px] font-bold text-brand uppercase tracking-widest">Database Entry Configuration</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-10 h-10 bg-white shadow-sm border border-slate-100 flex items-center justify-center rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Assessment Name</label>
                  <input
                    placeholder="E.G. FIRST SEMESTER FINAL"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-brand transition-all"
                    value={form.exam_name}
                    onChange={(e) => setForm({ ...form, exam_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Category</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-brand transition-all"
                    value={form.exam_type}
                    onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                  >
                    <option value="">SELECT CATEGORY</option>
                    <option>UNIT TEST</option>
                    <option>MID TERM</option>
                    <option>FINAL EXAM</option>
                  </select>
                </div>

                {/* DUAL MARKS INPUTS */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
                      Max Marks
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-10 rounded-2xl text-[11px] font-black outline-none focus:border-brand transition-all"
                        value={form.total_marks}
                        onChange={(e) => setForm({ ...form, total_marks: +e.target.value })}
                      />
                      <FiAward className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
                      Pass Marks
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-10 rounded-2xl text-[11px] font-black outline-none focus:border-brand transition-all"
                        value={form.pass_marks}
                        onChange={(e) => setForm({ ...form, pass_marks: +e.target.value })}
                      />
                      <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-brand/40" size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black outline-none focus:border-brand transition-all"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black outline-none focus:border-brand transition-all"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block">Assign Target Classes</label>
                <div className="flex flex-wrap gap-2">
                  {classesList.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black transition-all ${form.classes.includes(cls)
                          ? "bg-brand border-brand text-white shadow-lg shadow-brand/30"
                          : "bg-white border-slate-100 text-slate-400 hover:border-brand-soft"
                        }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Guidelines & Instructions</label>
                <textarea
                  placeholder="REPORTING TIME, REQUIRED STATIONARY..."
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:border-brand transition-all"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                />
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
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