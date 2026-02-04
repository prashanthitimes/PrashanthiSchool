"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  Bus, Pencil, Trash2, Plus, Users, MapPin,
  Phone, X, ChevronRight, Search, Printer, CheckCircle2, IndianRupee,
  UserMinus, Edit3
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function TransportPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]); // New State for Pricing
  const [loading, setLoading] = useState(false);

  // Modal States
  const [routeModal, setRouteModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Search & Assignment States
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [monthlyFee, setMonthlyFee] = useState("");
  const [assignData, setAssignData] = useState({ routeId: "" });

  const [form, setForm] = useState({
    route_number: "", route_name: "", bus_number: "",
    driver_name: "", driver_contact: "", bus_capacity: 50, stops: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetching for speed
      const [routeRes, studentRes, assignRes] = await Promise.all([
        supabase.from("transport_routes").select("*").order("route_number"),
        supabase.from("students").select("*").eq('status', 'active'),
        supabase.from("transport_assignments").select("*")
      ]);

      setRoutes(routeRes.data || []);
      setStudents(studentRes.data || []);
      setAssignments(assignRes.data || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSearchStudents = useMemo(() => {
    if (studentSearchTerm.length < 2 || selectedStudent) return [];
    return students.filter(s => 
      s.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (s.father_name && s.father_name.toLowerCase().includes(studentSearchTerm.toLowerCase()))
    ).slice(0, 6); 
  }, [studentSearchTerm, students, selectedStudent]);

  // --- Handlers ---

  const handleSaveRoute = async () => {
    setLoading(true);
    const action = editingId
      ? supabase.from("transport_routes").update(form).eq('id', editingId)
      : supabase.from("transport_routes").insert([form]);

    const { error } = await action;
    if (!error) {
      toast.success(editingId ? "Route updated" : "Route created");
      setRouteModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
    }
    setLoading(false);
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent || !assignData.routeId || !monthlyFee) {
      return toast.error("Please fill all assignment fields");
    }

    setLoading(true);
    try {
      // 1. Create/Update Assignment (The Price Table)
      const { error: assignError } = await supabase
        .from("transport_assignments")
        .upsert({
          student_id: selectedStudent.id,
          route_id: assignData.routeId,
          monthly_fare: Number(monthlyFee)
        }, { onConflict: 'student_id' });

      if (assignError) throw assignError;

      // 2. Sync the route ID back to the main students table for easy filtering
      const { error: studentUpdateError } = await supabase
        .from("students")
        .update({ transport_route_id: assignData.routeId })
        .eq('id', selectedStudent.id);

      if (studentUpdateError) throw studentUpdateError;

      toast.success("Passenger Assigned with Individual Pricing");
      setAssignModal(false);
      resetAssignFields();
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this route?`)) return;

    // Delete from assignments and clear route ID in students
    await supabase.from("transport_assignments").delete().eq('student_id', studentId);
    const { error } = await supabase.from("students")
      .update({ transport_route_id: null })
      .eq('id', studentId);

    if (!error) {
      toast.success("Student removed");
      fetchData();
      if (detailsModal) setDetailsModal(null);
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm("Delete this route? All passengers will be unassigned.")) return;
    const { error } = await supabase.from("transport_routes").delete().eq('id', id);
    if (!error) {
      toast.success("Route deleted");
      fetchData();
    }
  };

  const handleEditRoute = (route: any) => {
    setEditingId(route.id);
    setForm({
      route_number: route.route_number, route_name: route.route_name,
      bus_number: route.bus_number, driver_name: route.driver_name,
      driver_contact: route.driver_contact, bus_capacity: route.bus_capacity,
      stops: route.stops,
    });
    setRouteModal(true);
  };

  const resetForm = () => setForm({ route_number: "", route_name: "", bus_number: "", driver_name: "", driver_contact: "", bus_capacity: 50, stops: "" });
  const resetAssignFields = () => { setStudentSearchTerm(""); setSelectedStudent(null); setMonthlyFee(""); setAssignData({ routeId: "" }); };

  const handlePrint = (route: any) => {
    const routeStudents = students.filter(s => s.transport_route_id === route.id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <body style="font-family:sans-serif; padding: 20px;">
          <h1 style="color: #6b165c;">${route.route_name} - Passenger List</h1>
          <p>Bus: ${route.bus_number} | Driver: ${route.driver_name}</p>
          <table border="1" width="100%" style="border-collapse:collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #f3e8f1;">
                <th style="padding: 10px;">Name</th>
                <th style="padding: 10px;">Class</th>
                <th style="padding: 10px;">Individual Fee</th>
              </tr>
            </thead>
            <tbody>
              ${routeStudents.map(s => {
                const price = assignments.find(a => a.student_id === s.id)?.monthly_fare || 0;
                return `<tr>
                  <td style="padding: 10px;">${s.full_name}</td>
                  <td style="padding: 10px;">${s.class_name}</td>
                  <td style="padding: 10px;">₹${price}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    printWindow.document.write(html);
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <Toaster />

      {/* HEADER */}
      <header className="flex items-center justify-between bg-white/80 backdrop-blur-md px-8 py-6 rounded-[2.5rem] border border-[#f3e8f1] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8f1e7a] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#8f1e7a]/20">
            <Bus size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#6b165c] uppercase tracking-tight">Transport Registry</h1>
            <p className="text-[10px] font-bold text-[#a63d93] tracking-[0.2em] uppercase mt-1">Fleet & Logistics Hub</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAssignModal(true)} className="bg-[#e9d1e4] text-[#8f1e7a] px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#8f1e7a] hover:text-white transition-all">
            Assign Passenger
          </button>
          <button onClick={() => { setEditingId(null); resetForm(); setRouteModal(true); }} className="bg-[#8f1e7a] text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#8f1e7a]/30">
            <Plus size={16} className="inline mr-2" /> New Route
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Routes" value={routes.length} icon={<MapPin />} />
        <StatCard label="Live Fleet" value={new Set(routes.map(r => r.bus_number)).size} icon={<Bus />} />
        <StatCard label="Passengers" value={students.filter(s => s.transport_route_id).length} icon={<Users />} />
        <StatCard label="Total Revenue" value={`₹${assignments.reduce((sum, a) => sum + Number(a.monthly_fare), 0)}`} icon={<IndianRupee />} />
      </div>

      {/* ROUTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {routes.map(route => {
          const occupancy = students.filter(s => s.transport_route_id === route.id).length;
          return (
            <div key={route.id} className="bg-white border border-[#f3e8f1] rounded-[2.5rem] p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-[#e9d1e4] text-[#8f1e7a] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Route {route.route_number}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleEditRoute(route)} className="p-2.5 bg-[#f3e8f1] text-[#8f1e7a] rounded-xl hover:bg-[#8f1e7a] hover:text-white transition-all"><Edit3 size={14} /></button>
                  <button onClick={() => handleDeleteRoute(route.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                </div>
              </div>

              <h3 className="text-xl font-black text-[#6b165c] uppercase leading-tight mb-2">{route.route_name}</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-6">{route.driver_name} • {route.bus_number}</p>

              <button onClick={() => setDetailsModal(route)} className="w-full flex items-center justify-between p-4 bg-[#f3e8f1]/50 rounded-2xl border border-dashed border-[#8f1e7a]/30 hover:bg-[#8f1e7a] hover:text-white transition-all group/btn">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-[#8f1e7a] group-hover/btn:text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Manage Passengers ({occupancy})</span>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ASSIGN MODAL */}
      {assignModal && (
        <div className="fixed inset-0 bg-[#6b165c]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl border border-[#f3e8f1]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#6b165c] uppercase">Assign Passenger</h2>
              <button onClick={() => { setAssignModal(false); resetAssignFields(); }} className="p-2 bg-[#f3e8f1] rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2">1. Find Student</label>
                <input
                  type="text"
                  placeholder="Search Name..."
                  value={studentSearchTerm}
                  onChange={(e) => { setStudentSearchTerm(e.target.value); setSelectedStudent(null); }}
                  className="w-full mt-2 p-4 bg-[#f3e8f1]/50 border border-[#f3e8f1] rounded-2xl font-bold outline-none text-[#6b165c]"
                />
                {filteredSearchStudents.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-[#f3e8f1] rounded-2xl shadow-2xl overflow-hidden">
                    {filteredSearchStudents.map(s => (
                      <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearchTerm(s.full_name); }} className="w-full text-left p-4 hover:bg-[#f3e8f1] border-b border-[#f3e8f1] last:border-0">
                        <p className="text-sm font-black text-[#6b165c] uppercase">{s.full_name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Class: {s.class_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2">2. Route</label>
                  <select className="w-full mt-2 bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold text-[#6b165c]" value={assignData.routeId} onChange={(e) => setAssignData({ ...assignData, routeId: e.target.value })}>
                    <option value="">Select Route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2">3. Monthly Fare</label>
                  <input type="number" placeholder="₹ Amount" className="w-full mt-2 bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold text-[#6b165c]" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />
                </div>
              </div>

              <button onClick={handleAssignStudent} disabled={loading} className="w-full py-5 bg-[#8f1e7a] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest">
                {loading ? "Processing..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsModal && (
        <div className="fixed inset-0 bg-[#6b165c]/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 shadow-2xl border border-[#f3e8f1] max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#6b165c] uppercase">{detailsModal.route_name}</h2>
                <p className="text-[10px] font-bold text-[#a63d93] uppercase tracking-widest">{detailsModal.bus_number} • {detailsModal.driver_name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePrint(detailsModal)} className="p-3 bg-[#f3e8f1] text-[#8f1e7a] rounded-full hover:bg-[#8f1e7a] hover:text-white transition-all"><Printer size={18} /></button>
                <button onClick={() => setDetailsModal(null)} className="p-3 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f3e8f1] text-[10px] font-black text-[#a63d93] uppercase tracking-widest">
                    <th className="pb-4">Passenger</th>
                    <th className="pb-4">Class</th>
                    <th className="pb-4">Custom Fare</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3e8f1]">
                  {students.filter(s => s.transport_route_id === detailsModal.id).map(std => {
                    const price = assignments.find(a => a.student_id === std.id)?.monthly_fare || "0";
                    return (
                      <tr key={std.id} className="group">
                        <td className="py-4">
                          <p className="font-black text-[#6b165c] text-sm uppercase">{std.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400">Guardian: {std.father_name}</p>
                        </td>
                        <td className="py-4 text-sm font-bold text-[#6b165c]">{std.class_name}</td>
                        <td className="py-4 text-sm font-black text-[#8f1e7a]">₹{price}</td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <a href={`tel:${std.parent_phone}`} className="p-2 bg-[#f3e8f1] text-[#8f1e7a] rounded-lg hover:bg-[#8f1e7a] hover:text-white transition-all"><Phone size={14} /></a>
                            <button onClick={() => handleUnassignStudent(std.id, std.full_name)} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><UserMinus size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ROUTE MODAL */}
      {routeModal && (
        <div className="fixed inset-0 bg-[#6b165c]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl border border-[#f3e8f1]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#6b165c] uppercase">{editingId ? 'Modify' : 'New'} Route</h2>
              <button onClick={() => setRouteModal(false)} className="p-2 bg-[#f3e8f1] rounded-full"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <StyledInput label="Route ID" value={form.route_number} placeholder="R-101" onChange={v => setForm({ ...form, route_number: v })} />
              <StyledInput label="Route Name" value={form.route_name} placeholder="North Sector" onChange={v => setForm({ ...form, route_name: v })} />
              <StyledInput label="Vehicle #" value={form.bus_number} placeholder="ABC-1234" onChange={v => setForm({ ...form, bus_number: v })} />
              <StyledInput label="Max Seats" type="number" value={form.bus_capacity} placeholder="50" onChange={v => setForm({ ...form, bus_capacity: Number(v) })} />
              <StyledInput label="Driver" value={form.driver_name} placeholder="Name" onChange={v => setForm({ ...form, driver_name: v })} />
              <StyledInput label="Contact" value={form.driver_contact} placeholder="+91" onChange={v => setForm({ ...form, driver_contact: v })} />
            </div>
            <button onClick={handleSaveRoute} className="w-full mt-8 py-5 bg-[#8f1e7a] text-white rounded-[1.5rem] font-black uppercase text-[11px] shadow-xl">
              {editingId ? 'Update Route' : 'Initialize Route'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-[#f3e8f1] flex items-center gap-5">
      <div className="w-12 h-12 bg-[#f3e8f1] text-[#8f1e7a] rounded-2xl flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-[#a63d93] uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-[#6b165c]">{value}</p>
      </div>
    </div>
  );
}

type StyledInputProps = {
  label: string;
  placeholder?: string;
  value: string | number;
  type?: string;
  onChange: (value: string) => void;
};

function StyledInput({ label, placeholder, value, type = "text", onChange }: StyledInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2 tracking-widest">
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold outline-none focus:border-[#8f1e7a] transition-all text-sm text-[#6b165c]"
      />
    </div>
  );
}
