import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Prashanthi Vidyalaya & High School',
  description: 'Privacy Policy and Terms of Service for the Prashanthi Vidyalaya School Web App.',
};

export default function PrivacyPolicy() {
  const sections = [
    { title: "1. Information Collection", content: "We collect essential user-provided data such as names, student IDs, grade levels, and attendance records. We also collect automated technical data (device type, IP address, and app usage logs) solely to improve platform performance." },
    { title: "2. Purpose of Use", content: "Your data is used strictly for authorized educational purposes, including school administration, academic progress tracking, and facilitating seamless communication between the school and parents." },
    { title: "3. Data Sharing & Third Parties", content: "We maintain a strict 'No-Sell' policy. Your data is never sold to third-party advertisers. We only share information with essential service providers (e.g., secure cloud hosting) under strict confidentiality agreements." },
    { title: "4. Data Security", content: "We employ industry-standard security protocols, including TLS/HTTPS encryption for data in transit and robust access control measures to ensure that sensitive student information remains private." },
    { title: "5. Children’s Privacy", content: "We are deeply committed to protecting the privacy of minors. We do not knowingly collect personal information from children without appropriate authorization from their parents or the school administration." },
    { title: "6. User Rights", content: "You maintain full control over your data. You may request access to, correction of, or permanent deletion of your personal information at any time by contacting the school administration." },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-brand hover:text-brand-dark transition-colors font-medium flex items-center mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-5xl font-extrabold text-brand-dark mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 font-medium">Effective Date: June 9, 2026</p>
        </div>

        {/* Terms Card */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-brand-soft mb-8">
          <h2 className="text-2xl font-bold text-brand-dark mb-4">Terms & Conditions</h2>
          <p className="text-gray-600 leading-relaxed">
            Welcome to the Prashanthi Vidyalaya School Web App. By accessing this platform, you agree to 
            adhere to our standards of digital conduct. This platform is provided to support our 
            educational mission, and your usage constitutes agreement to these policies designed 
            to protect our student community.
          </p>
        </section>

        {/* Policy Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-brand-accent hover:border-brand-soft transition-all">
              <h3 className="text-lg font-bold text-brand-light mb-3">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>

        {/* Contact Footer */}
        <section className="mt-12 bg-brand text-white p-8 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Have Questions?</h3>
            <p className="opacity-90">We are here to assist with any privacy concerns.</p>
          </div>
          <div className="text-center md:text-right bg-brand-light p-4 rounded-xl">
            <p className="font-semibold">Prashanthi Vidyalaya & High School</p>
            <p className="text-sm opacity-90">Chelur, Karnataka</p>
            <p className="font-bold text-lg mt-1 underline">Phone: +91 9353202052</p>
          </div>
        </section>
      </div>
    </main>
  );
}