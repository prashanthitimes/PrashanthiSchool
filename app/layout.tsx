import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackButtonHandler from "../components/BackButtonHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata ONLY works in Server Components (no "use client" at the top)
export const metadata: Metadata = {
  title: "Prashanti Vidyalaya & High School.",
  description: "School Management System",
  icons: {
    icon: [
      { url: "/Schoollogo.jpg", sizes: "32x32", type: "image/jpeg" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}>
        {/* This component can be a client component internally */}
        <BackButtonHandler />
        {children}
      </body>
    </html>
  );
}