"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");

    const timer = setTimeout(() => {
      if (userRole === "admin") {
        router.replace("/admin");
      } else if (userRole === "teacher") {
        router.replace("/teacher");
      } else if (userRole === "parent") {
        router.replace("/parent");
      } else {
        router.replace("/login");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      
      {/* Only Logo */}
      <div className="w-28 h-28 relative animate-pulse">
        <Image 
          src="/Schoollogo.jpg" 
          alt="School Logo" 
          fill
          className="object-contain"
          priority
        />
      </div>

    </div>
  );
}