"use client";

import React, { useState, useEffect } from "react";
import { FiTruck,FiUser, FiUsers, FiPhone, FiMapPin, FiNavigation, FiInfo, FiAlertCircle } from "react-icons/fi";
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
const stopList: string[] = route?.stops
  ? route.stops.split(",").map((s: string) => s.trim())
  : [];

 return (
  <div className="space-y-4 p-3 md:p-6 bg-[#fffcfd] dark:bg-slate-950 ">

    {/* HEADER */}
    <header className="bg-white dark:bg-slate-900 rounded-2xl p-3 md:p-6 border border-brand-soft dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 shadow-sm">

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-light rounded-xl flex items-center justify-center text-white shadow-lg">
          <FiTruck size={18} />
        </div>

        <div>
          <h1 className="text-lg md:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase">
            Transport
          </h1>

          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Route & Vehicle Details
          </p>
        </div>
      </div>

      <div className="flex gap-2">

        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase border border-brand-soft dark:border-slate-700">
          Bus {route?.bus_number || "N/A"}
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black text-white uppercase ${
            route?.is_active ? "bg-emerald-500" : "bg-rose-500"
          }`}
        >
          {route?.is_active ? "On Track" : "Inactive"}
        </div>

      </div>
    </header>

    {loading ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"
          ></div>
        ))}
      </div>
    ) : route ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">

        {/* ROUTE INFO */}
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white dark:bg-slate-900 border border-brand-soft dark:border-slate-800 p-4 md:p-8 rounded-2xl shadow-sm">

            <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Assigned Route
            </p>

            <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase mb-3 md:mb-6">
              Route {route.route_number}: {route.route_name}
            </h2>

            <div className="grid grid-cols-3 gap-2 md:gap-4">

              <div className="bg-slate-50 dark:bg-slate-800 p-3 md:p-5 rounded-xl text-center">
                <FiMapPin className="mx-auto text-brand mb-1 md:mb-2" size={16}/>
                <p className="text-[8px] font-black text-slate-400 uppercase">
                  Route
                </p>
                <p className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100">
                  {route.route_number}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 md:p-5 rounded-xl text-center">
                <FiTruck className="mx-auto text-brand mb-1 md:mb-2" size={16}/>
                <p className="text-[8px] font-black text-slate-400 uppercase">
                  Bus
                </p>
                <p className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100">
                  {route.bus_number}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 md:p-5 rounded-xl text-center">
                <FiUsers className="mx-auto text-brand mb-1 md:mb-2" size={16}/>
                <p className="text-[8px] font-black text-slate-400 uppercase">
                  Seats
                </p>
                <p className="font-black text-sm md:text-base text-slate-800 dark:text-slate-100">
                  {route.bus_capacity}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* DRIVER CARD */}
        <div className="space-y-4">

          <div className="bg-brand-light p-4 md:p-8 rounded-2xl text-white shadow-xl">

            <p className="text-[8px] md:text-[9px] font-black opacity-60 uppercase mb-3 md:mb-6">
              Driver Details
            </p>

            <div className="flex items-center gap-3 mb-3 md:mb-6">

              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <FiUser size={20} />
              </div>

              <div>
                <h3 className="text-base md:text-xl font-black uppercase">
                  {route.driver_name}
                </h3>

                <p className="text-[9px] opacity-70 uppercase">
                  Primary Driver
                </p>
              </div>

            </div>

            <a
              href={`tel:${route.driver_contact}`}
              className="w-full bg-white text-brand-light py-2.5 md:py-4 rounded-lg flex items-center justify-center gap-2 font-black text-[10px] md:text-[11px] uppercase"
            >
              <FiPhone size={14} />
              Contact Driver
            </a>
          </div>

          {/* BUS DETAILS */}
          <div className="bg-white dark:bg-slate-900 border border-brand-soft dark:border-slate-800 p-4 md:p-6 rounded-2xl">

            <div className="flex items-center gap-2 mb-3 md:mb-6">
              <FiInfo className="text-slate-400" size={16}/>
              <span className="text-[9px] font-black text-slate-400 uppercase">
                Vehicle Info
              </span>
            </div>

            <div className="space-y-2 md:space-y-4">

              <div className="flex justify-between bg-slate-50 dark:bg-slate-800 p-2.5 md:p-4 rounded-lg">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  Bus Number
                </span>
                <span className="font-black text-sm text-slate-800 dark:text-slate-100">
                  {route.bus_number}
                </span>
              </div>

              <div className="flex justify-between bg-slate-50 dark:bg-slate-800 p-2.5 md:p-4 rounded-lg">
                <span className="text-slate-400 text-[10px] font-bold uppercase">
                  Capacity
                </span>
                <span className="font-black text-sm text-slate-800 dark:text-slate-100">
                  {route.bus_capacity} Seats
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    ) : (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-12 text-center">

        <FiTruck size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />

        <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 uppercase">
          No Transport Assigned
        </h3>

        <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 px-6">
          Your child is not registered for school transport.
        </p>

      </div>
    )}
  </div>
);
}