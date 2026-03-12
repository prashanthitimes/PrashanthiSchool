"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in to avoid unnecessary redirects
    const userRole = localStorage.getItem("userRole");

    const timer = setTimeout(() => {
      if (userRole === "admin") {
        router.replace("/admin");
      } else if (userRole === "teacher") {
        router.replace("/teacher");
      } else if (userRole === "parent") {
        router.replace("/parent");
      } else {
        // If no session, go to login
        router.replace("/login");
      }
    }, 1000); // 1 second delay gives the UI time to breath and prevents instant loops

    return () => clearTimeout(timer);
  }, [router]);

  return (
  <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-50">
    
    {/* Decorative Background Blur */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-soft/20 blur-[100px] rounded-full" />

    <div className="relative z-10 flex flex-col items-center text-center">
      
      {/* 1. School Logo */}
      <div className="mb-8 animate-bounce transition-all">
        <div className="w-24 h-24 relative p-1 rounded-3xl bg-white shadow-xl border border-brand-soft/30">
          <Image 
            src="/Schoollogo.jpg" 
            alt="Prashanti Vidyalaya & High School. Logo" 
            fill
            className="object-contain p-2"
            priority
          />
        </div>
      </div>

      {/* 2. Modern Loading Spinner */}
      <div className="relative">
        <div className="w-12 h-12 border-4 border-brand-soft rounded-full"></div>
        <div className="absolute top-0 w-12 h-12 border-4 border-brand rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* 3. School Name */}
      <h2 className="mt-6 text-slate-800 font-black tracking-tight text-lg">
        Prashanti Vidyalaya & High School
      </h2>

      <p className="mt-1 text-brand-light font-bold text-[10px] uppercase tracking-[0.3em]">
        Loading Experience...
      </p>

    </div>
  </div>
);
}