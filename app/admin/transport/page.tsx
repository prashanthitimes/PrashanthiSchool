"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Bus, Pencil, Trash2, Plus, Users, MapPin,
  Phone, X, ChevronRight, Search, Printer, CheckCircle2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function TransportPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [routeModal, setRouteModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filter States for Assignment
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");

  const [form, setForm] = useState({
    route_number: "", route_name: "", bus_number: "",
    driver_name: "", driver_contact: "", bus_capacity: 50, stops: "",
  });

  const [assignData, setAssignData] = useState({ studentId: "", routeId: "" });

  const fetchData = async () => {
    setLoading(true);
    // Fetch routes and join with a count of students if possible, 
    // or we calculate manually from the student data
    const { data: routeData } = await supabase.from("transport_routes").select("*").order("route_number");
    const { data: studentData } = await supabase.from("students").select("*").eq('status', 'active');

    setRoutes(routeData || []);
    setStudents(studentData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- Logic Helpers ---
  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name)));
  const availableSections = Array.from(new Set(students.filter(s => s.class_name === filterClass).map(s => s.section)));
  const filteredStudentsForAssign = students.filter(s => s.class_name === filterClass && s.section === filterSection);

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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure? This will remove the route but keep student records.")) return;
    const { error } = await supabase.from("transport_routes").delete().eq('id', id);
    if (!error) {
      toast.success("Route deleted");
      fetchData();
    }
  };

  const handleEdit = (route: any) => {
    setEditingId(route.id);
    setForm({
      route_number: route.route_number,
      route_name: route.route_name,
      bus_number: route.bus_number,
      driver_name: route.driver_name,
      driver_contact: route.driver_contact,
      bus_capacity: route.bus_capacity,
      stops: route.stops,
    });
    setRouteModal(true);
  };

  const handleAssignStudent = async () => {
    if (!assignData.studentId || !assignData.routeId) return toast.error("Please select both student and route");
    const { error } = await supabase.from("students")
      .update({ transport_route_id: assignData.routeId })
      .eq('id', assignData.studentId);

    if (!error) {
      toast.success("Student linked successfully");
      setAssignModal(false);
      setAssignData({ studentId: "", routeId: "" });
      fetchData();
    }
  };

  const resetForm = () => setForm({ route_number: "", route_name: "", bus_number: "", driver_name: "", driver_contact: "", bus_capacity: 50, stops: "" });

  const handlePrint = (route: any) => {
    const routeStudents = students.filter(s => s.transport_route_id === route.id);

    // Set document title for the filename (Route + Driver Name)
    const originalTitle = document.title;
    document.title = `Route_${route.route_number}_${route.driver_name.replace(/\s+/g, '_')}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
    <html>
      <head>
        <title>${document.title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
          th { background-color: #8f1e7a; color: white; text-transform: uppercase; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8f1e7a; padding-bottom: 10px; }
          .route-info { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PASSENGER MANIFEST</h1>
        </div>
        <div class="route-info">
          <span>Route: ${route.route_number} - ${route.route_name}</span>
          <span>Driver: ${route.driver_name} (${route.driver_contact})</span>
        </div>
        <div class="route-info">
          <span>Vehicle: ${route.bus_number}</span>
          <span>Total Passengers: ${routeStudents.length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Class & Section</th>
              <th>Parent Contact</th>
            </tr>
          </thead>
          <tbody>
            ${routeStudents.map((s, i) => `
              <tr>
                <td>${i + 1}</td>
                <td style="font-weight: bold;">${s.full_name.toUpperCase()}</td>
                <td>${s.class_name} - ${s.section}</td>
                <td>${s.parent_phone || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = () => { 
            window.print(); 
            setTimeout(() => { window.close(); }, 100);
          };
        </script>
      </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();

    // Restore original title after print dialog opens
    document.title = originalTitle;
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
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



      {/* STATS CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <StatCard label="Total Routes" value={routes.length} icon={<MapPin />} />

        <StatCard label="Live Fleet" value={new Set(routes.map(r => r.bus_number)).size} icon={<Bus />} />

        <StatCard label="Passengers" value={routes.reduce((s, r) => s + (r.total_students || 0), 0)} icon={<Users />} />

        <StatCard label="Status" value="Optimized" icon={<CheckCircle2 />} />

      </div>


      {/* ROUTES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {routes.map(route => {
          const routeStudents = students.filter(s => s.transport_route_id === route.id);
          const occupancy = routeStudents.length;

          return (
            <div key={route.id} className="bg-white border border-[#f3e8f1] rounded-[2.5rem] p-8 hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-[#e9d1e4] text-[#8f1e7a] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Route {route.route_number}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(route)} className="p-2.5 bg-[#f3e8f1] text-[#8f1e7a] rounded-xl hover:bg-[#8f1e7a] hover:text-white transition-all"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(route.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                </div>
              </div>

              <h3 className="text-xl font-black text-[#6b165c] uppercase leading-tight mb-2">{route.route_name}</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase mb-6">{route.driver_name} • {route.bus_number}</p>

              <button
                onClick={() => setDetailsModal(route)}
                className="w-full flex items-center justify-between p-4 bg-[#f3e8f1]/50 rounded-2xl border border-dashed border-[#8f1e7a]/30 hover:bg-[#8f1e7a] hover:text-white transition-all group/btn"
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-[#8f1e7a] group-hover/btn:text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest">View Passengers</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#f3e8f1]">
                <div>
                  <p className="text-[9px] font-black text-[#a63d93] uppercase tracking-widest">Occupancy</p>
                  <p className="text-lg font-black text-[#6b165c]">{occupancy} / {route.bus_capacity}</p>
                </div>
                <div className="h-10 w-10 rounded-full border-4 border-[#e9d1e4] border-t-[#8f1e7a] flex items-center justify-center text-[10px] font-bold text-[#8f1e7a]">
                  {Math.round((occupancy / route.bus_capacity) * 100)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODALS --- */}

      {/* DETAILED VIEW MODAL */}
      {detailsModal && (
        <div className="fixed inset-0 bg-[#6b165c]/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 shadow-2xl border border-[#f3e8f1] max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-brand-accent text-brand-light rounded-2xl flex items-center justify-center shadow-inner">
                  <Bus size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-[#e9d1e4] text-[#8f1e7a] text-[9px] font-black px-3 py-1 rounded-full uppercase">Route {detailsModal.route_number}</span>
                    <h2 className="text-2xl font-black text-[#6b165c] uppercase tracking-tighter">{detailsModal.route_name}</h2>
                  </div>
                  <p className="text-[10px] font-bold text-[#a63d93] uppercase tracking-[0.1em] flex items-center gap-2">
                    <MapPin size={12} /> {detailsModal.stops || "General Route"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(detailsModal)}
                  className="p-3 bg-[#f3e8f1] text-[#8f1e7a] rounded-full hover:bg-[#8f1e7a] hover:text-white transition-all shadow-sm"
                >
                  <Printer size={18} />
                </button>                <button onClick={() => { setDetailsModal(null); setSearchQuery(""); }} className="p-3 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X size={18} /></button>
              </div>
            </div>

            {/* Sub-Header: Driver info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Lead Driver</p>
                <p className="text-sm font-black text-[#6b165c]">{detailsModal.driver_name}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Contact</p>
                <p className="text-sm font-black text-[#6b165c]">{detailsModal.driver_contact}</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search passenger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-11 pr-4 bg-[#f3e8f1]/50 border border-[#f3e8f1] rounded-2xl text-xs font-bold outline-none focus:border-[#8f1e7a]"
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {(() => {
                const filtered = students
                  .filter(s => s.transport_route_id === detailsModal.id)
                  .filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

                if (filtered.length === 0) return (
                  <div className="text-center py-20 opacity-30">
                    <Users size={48} className="mx-auto mb-4" />
                    <p className="font-black uppercase text-sm tracking-widest">No Passengers Found</p>
                  </div>
                );

                // Group by Section
                const grouped = filtered.reduce((acc: any, s) => {
                  const key = `${s.class_name} - ${s.section}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(s);
                  return acc;
                }, {});

                return Object.entries(grouped).map(([group, members]: any) => (
                  <div key={group} className="mb-8">
                    {/* Section Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <h4 className="text-[10px] font-black text-[#8f1e7a] uppercase tracking-[0.2em] whitespace-nowrap">{group}</h4>
                      <div className="h-[1px] w-full bg-[#f3e8f1]"></div>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{members.length}</span>
                    </div>

                    {/* Updated Grid: 3 Columns on Medium screens and up */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {members.map((std: any) => (
                        <div key={std.id} className="flex items-center justify-between p-3 bg-white border border-[#f3e8f1] rounded-2xl hover:border-[#8f1e7a] transition-all group/card shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-[#f3e8f1] flex items-center justify-center text-[10px] font-black text-[#8f1e7a] group-hover/card:bg-[#8f1e7a] group-hover/card:text-white transition-colors">
                              {std.full_name.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="flex flex-col">
                              {/* Student Name */}
                              <p className="text-[11px] font-black text-[#6b165c] uppercase leading-tight">
                                {std.full_name}
                              </p>

                              {/* Parent Phone Number - Added Here */}
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                                <span className="opacity-50">P:</span> {std.parent_phone || "No Contact"}
                              </p>
                            </div>
                          </div>

                          {/* Phone Icon Link */}
                          <a href={`tel:${std.parent_phone}`} className="p-1.5 rounded-lg hover:bg-[#8f1e7a]/10 transition-colors">
                            <Phone size={12} className="text-slate-300 group-hover/card:text-[#8f1e7a]" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN STUDENT MODAL */}
      {assignModal && (
        <div className="fixed inset-0 bg-[#6b165c]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-2xl border border-[#f3e8f1] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#6b165c] uppercase tracking-tighter">Assign Transport</h2>
                <p className="text-[10px] font-bold text-[#a63d93] uppercase">Filter by academic credentials</p>
              </div>
              <button onClick={() => setAssignModal(false)} className="p-2 bg-[#f3e8f1] rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2 tracking-widest">1. Select Class</label>
                  <select className="w-full bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold outline-none text-[#6b165c] text-sm"
                    value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); }}>
                    <option value="">Choose Class</option>
                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2 tracking-widest">2. Select Section</label>
                  <select className="w-full bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold outline-none disabled:opacity-50 text-[#6b165c] text-sm"
                    disabled={!filterClass} value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                    <option value="">Choose Section</option>
                    {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2 tracking-widest">3. Select Student Name</label>
                <select className="w-full bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold outline-none disabled:opacity-50 text-[#6b165c] text-sm"
                  disabled={!filterSection} value={assignData.studentId} onChange={(e) => setAssignData({ ...assignData, studentId: e.target.value })}>
                  <option value="">Choose Student...</option>
                  {filteredStudentsForAssign.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2 tracking-widest">4. Assign to Route</label>
                <select className="w-full bg-[#8f1e7a]/5 border border-[#8f1e7a]/20 p-4 rounded-2xl font-bold outline-none text-[#6b165c] text-sm"
                  value={assignData.routeId} onChange={(e) => setAssignData({ ...assignData, routeId: e.target.value })}>
                  <option value="">Target Route...</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.route_number} - {r.route_name}</option>)}
                </select>
              </div>

              <button onClick={handleAssignStudent} className="w-full py-5 bg-[#8f1e7a] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[#8f1e7a]/20">
                Link Passenger to Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUTE MODAL (ADD & EDIT) */}
      {routeModal && (
        <div className="fixed inset-0 bg-[#6b165c]/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl border border-[#f3e8f1] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#6b165c] uppercase tracking-tighter">{editingId ? 'Modify' : 'New'} Route Configuration</h2>
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

            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black text-[#a63d93] uppercase ml-2 tracking-widest">Stops Overview</label>
              <textarea value={form.stops} className="w-full bg-[#f3e8f1]/50 border border-[#f3e8f1] p-4 rounded-2xl font-bold outline-none min-h-[100px] text-sm text-[#6b165c]"
                placeholder="Point A, Point B, Point C" onChange={(e) => setForm({ ...form, stops: e.target.value })} />
            </div>

            <button onClick={handleSaveRoute} className="w-full mt-8 py-5 bg-[#8f1e7a] text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-[#8f1e7a]/20">
              {editingId ? 'Update Log' : 'Initialize Fleet Route'}
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

      <div className="w-12 h-12 bg-[#f3e8f1] text-[#8f1e7a] rounded-2xl flex items-center justify-center">

        {icon}

      </div>

      <div>

        <p className="text-[10px] font-black text-[#a63d93] uppercase tracking-widest">{label}</p>

        <p className="text-xl font-black text-[#6b165c]">{value}</p>

      </div>

    </div>

  );

}
// --- Internal Helper Components ---

type StyledInputProps = {
  label: string
  placeholder?: string
  value: string | number
  type?: "text" | "number"
  onChange: (value: string) => void
}

function StyledInput({
  label,
  placeholder,
  value,
  type = "text",
  onChange,
}: StyledInputProps) {
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
  )
}
