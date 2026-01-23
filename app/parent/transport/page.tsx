"use client";

import React, { useState, useEffect } from "react";
import { FiTruck, FiUser, FiPhone, FiMapPin, FiNavigation, FiInfo, FiAlertCircle } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function ParentTransport() {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransportDetails();
  }, []);

  async function fetchTransportDetails() {
    setLoading(true);
    try {
      const studentId = localStorage.getItem('childId');
      if (!studentId) return;

      // Fetch student and join with transport_routes
      const { data, error: fetchError } = await supabase
        .from('students')
        .select(`
          transport_route_id,
          transport_routes (*)
        `)
        .eq('id', studentId)
        .single();

      if (fetchError) throw fetchError;

      if (!data?.transport_routes) {
        setRoute(null);
      } else {
        setRoute(data.transport_routes);
      }
    } catch (err: any) {
      console.error("Transport Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper to turn the comma-separated stops string into an array
  const stopList = route?.stops ? route.stops.split(',').map((s: string) => s.trim()) : [];

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen animate-in fade-in duration-700">
      
      {/* --- COMPACT SMALL HEADER --- */}
      <header className="bg-brand-soft/40 rounded-[2rem] p-6 border border-brand-soft flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-light rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-soft">
            <FiTruck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-light tracking-tighter uppercase">Transport</h1>
            <p className="text-[10px] font-bold text-brand-light/60 uppercase tracking-[0.2em]">Route & Vehicle Details</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-brand-soft text-[10px] font-black text-brand-light uppercase tracking-widest">
                Bus {route?.bus_number || 'N/A'}
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest ${route?.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                {route?.is_active ? 'On Track' : 'Inactive'}
            </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-brand-soft/10 animate-pulse rounded-[2.5rem]"></div>)}
        </div>
      ) : route ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- ROUTE CARD --- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-brand-soft p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-brand-light/40 uppercase tracking-widest mb-1">Assigned Route</p>
                    <h2 className="text-3xl font-black text-brand-light uppercase tracking-tighter mb-6">
                        Route {route.route_number}: {route.route_name}
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center shrink-0">
                                <FiNavigation className="text-brand-light" size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-light/40 uppercase tracking-widest">Route Stops</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {stopList.map((stop, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-brand-soft/30 px-3 py-1.5 rounded-lg border border-brand-soft">
                                            <FiMapPin size={10} className="text-brand-light" />
                                            <span className="text-[11px] font-bold text-brand-light uppercase">{stop}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <FiMapPin className="absolute -right-10 -bottom-10 text-brand-soft/20 rotate-12" size={200} />
            </div>
          </div>

          {/* --- DRIVER & BUS INFO --- */}
          <div className="space-y-6">
             {/* DRIVER CARD */}
             <div className="bg-brand-light p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand-soft">
                <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-4">Driver Details</p>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <FiUser size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{route.driver_name}</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Primary Pilot</p>
                    </div>
                </div>
                
                <a 
                    href={`tel:${route.driver_contact}`}
                    className="w-full bg-white text-brand-light py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest hover:bg-brand-accent transition-colors"
                >
                    <FiPhone size={16} /> Contact Driver
                </a>
             </div>

             {/* BUS DETAILS */}
             <div className="bg-white border border-brand-soft p-6 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4">
                    <FiInfo className="text-brand-light/40" />
                    <span className="text-[10px] font-black text-brand-light/40 uppercase tracking-widest">Vehicle Info</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-soft/20 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-brand-light/40 uppercase mb-1">Bus Number</p>
                        <p className="text-sm font-black text-brand-light">{route.bus_number}</p>
                    </div>
                    <div className="bg-brand-soft/20 p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-brand-light/40 uppercase mb-1">Capacity</p>
                        <p className="text-sm font-black text-brand-light">{route.bus_capacity} Seats</p>
                    </div>
                </div>
             </div>
          </div>

        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-brand-soft rounded-[3rem] py-20 text-center">
          <FiTruck size={40} className="mx-auto text-brand-light/20 mb-4" />
          <h3 className="text-xl font-black text-brand-light uppercase tracking-tight">No Transport Assigned</h3>
          <p className="text-brand-light/50 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">
            It looks like your child is not currently registered for school transport.
          </p>
        </div>
      )}
    </div>
  );
}