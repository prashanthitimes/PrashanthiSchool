import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Prashanthi Vidyalaya & High School',
  description: 'Terms and Conditions of Service for the Prashanthi Vidyalaya School Web App.',
};

export default function TermsAndConditions() {
  const sections = [
    { 
      title: "1. User Accounts", 
      content: "Users must provide accurate information during registration. Login credentials are strictly personal and should not be shared with others. Users are responsible for maintaining the confidentiality of their accounts." 
    },
    { 
      title: "2. Acceptable Use", 
      content: "Users agree to use the platform only for educational and official school purposes. Respectful communication must be maintained, and users must avoid uploading harmful, false, or unauthorized content." 
    },
    { 
      title: "3. Privacy & Data Protection", 
      content: "The school takes reasonable measures to protect user information and maintain robust data security. Personal data collected through the platform will be used only for legitimate school-related activities." 
    },
    { 
      title: "4. Intellectual Property", 
      content: "All content, logos, school materials, designs, and academic information available on the platform are the property of Prashanthi Vidyalaya and may not be copied or misused without permission." 
    },
    { 
      title: "5. Service Availability", 
      content: "The school will make reasonable efforts to keep the platform accessible. However, uninterrupted service cannot be guaranteed due to routine maintenance, technical updates, or general internet-related problems." 
    },
    { 
      title: "6. Limitation of Liability", 
      content: "Prashanthi Vidyalaya is not responsible for external internet or device-related issues, temporary unavailability of the platform, or unauthorized account access caused by user negligence." 
    },
    { 
      title: "7. Suspension of Access", 
      content: "The school reserves the ultimate right to temporarily suspend or permanently terminate user access if misuse, systematic policy violations, or inappropriate activity is identified." 
    },
    { 
      title: "8. Changes to Terms", 
      content: "These Terms & Conditions may be updated from time to time without prior notice. Continued use of the platform following updates indicates your absolute acceptance of the revised terms." 
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/login" className="text-brand hover:text-brand-dark transition-colors font-medium flex items-center mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-5xl font-extrabold text-brand-dark mb-4 tracking-tight">Terms & Conditions</h1>
          <p className="text-gray-500 font-medium">Effective Date: May 15, 2026</p>
        </div>

        {/* Introduction Card */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-brand-soft mb-8">
          <h2 className="text-2xl font-bold text-brand-dark mb-4">Terms of Service</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Welcome to the Prashanthi Vidyalaya School Web App. By accessing or using this platform, 
            students, parents, teachers, and staff agree to fully comply with the following Terms & Conditions 
            designed to protect our educational environment.
          </p>
          
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-brand-dark mb-3 uppercase tracking-wider">Purpose of the Platform:</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Attendance updates", "Homework & assignments", 
                "Marks & academic reports", "Circulars & announcements", 
                "Parent-school communication", "Event & holiday info"
              ].map((item, index) => (
                <li key={index} className="flex items-center space-x-2.5 text-sm text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Terms Policy Grid */}
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
            <p className="opacity-90">We are here to assist with any technical or policy concerns.</p>
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