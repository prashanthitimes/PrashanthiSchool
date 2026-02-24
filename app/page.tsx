"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // This triggers the redirect instantly on the phone
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* 1. Your School Logo */}
      <div className="mb-8 animate-pulse">
        <Image 
          src="/icon-only.png" 
          alt="Prashanthi School Logo" 
          width={120} 
          height={120}
          priority
        />
      </div>

      {/* 2. Modern Loading Spinner */}
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute top-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* 3. School Name */}
      <p className="mt-4 text-gray-500 font-medium tracking-wide">
        PRASHANTHI SCHOOL
      </p>
    </div>
  );
}