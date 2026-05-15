import React from 'react';

const TermsAndConditions = () => {
  const effectiveDate = "May 15, 2026"; // Current Date

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-brand-soft selection:text-brand-dark">
      {/* Header Section */}
      <div className="bg-brand text-white py-12 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Terms & Conditions</h1>
        <div className="mt-4 inline-block bg-brand-dark px-4 py-1 rounded-full text-sm font-medium">
          Effective Date: {effectiveDate}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-brand-accent p-8 md:p-12 text-gray-800 leading-relaxed">
          
          <p className="text-lg mb-10 text-gray-700">
            Welcome to the <span className="font-bold text-brand">Prashanthi Vidyalaya School Web App</span>. By accessing or using this platform, students, parents, teachers, and staff agree to comply with the following Terms & Conditions.
          </p>

          <div className="space-y-12">
            {/* 1. Purpose */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">1. Purpose of the Platform</h2>
              <p className="mb-4">The web app is developed to provide school-related services including:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Attendance updates", "Homework and assignments", 
                  "Marks and academic reports", "Circulars and announcements", 
                  "Communication between school and parents", "Event and holiday information"
                ].map((item, index) => (
                  <li key={index} className="flex items-center space-x-3 bg-brand-accent/30 p-3 rounded-lg">
                    <span className="h-2 w-2 rounded-full bg-brand"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 2. User Accounts */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">2. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users must provide accurate information during registration.</li>
                <li>Login credentials are personal and should not be shared with others.</li>
                <li>Users are responsible for maintaining the confidentiality of their accounts.</li>
              </ul>
            </section>

            {/* 3. Acceptable Use */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">3. Acceptable Use</h2>
              <p className="mb-3 italic text-gray-600 font-medium">Users agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the platform only for educational and official school purposes</li>
                <li>Maintain respectful communication</li>
                <li>Avoid uploading harmful, false, or inappropriate content</li>
                <li>Not attempt unauthorized access to the system</li>
              </ul>
            </section>

            {/* 4. Privacy */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">4. Privacy & Data Protection</h2>
              <p>The school takes reasonable measures to protect user information and maintain data security. Personal data collected through the platform will be used only for school-related activities.</p>
            </section>

            {/* 5. Intellectual Property */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">5. Intellectual Property</h2>
              <p>All content, logos, school materials, designs, and information available on the platform are the property of Prashanthi Vidyalaya and may not be copied or misused without permission.</p>
            </section>

            {/* 6. Service Availability */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">6. Service Availability</h2>
              <p>The school will make reasonable efforts to keep the platform accessible. However, uninterrupted service cannot be guaranteed due to maintenance, technical issues, or internet-related problems.</p>
            </section>

            {/* 7. Limitation of Liability */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">7. Limitation of Liability</h2>
              <p className="mb-3 font-medium">Prashanthi Vidyalaya is not responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Internet or device-related issues</li>
                <li>Temporary unavailability of the platform</li>
                <li>Unauthorized account access caused by user negligence</li>
              </ul>
            </section>

            {/* 8. Suspension of Access */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">8. Suspension of Access</h2>
              <p>The school reserves the right to suspend or terminate user access if misuse, policy violation, or inappropriate activity is identified.</p>
            </section>

            {/* 9. Changes to Terms */}
            <section>
              <h2 className="text-xl font-bold text-brand border-b-2 border-brand-soft pb-2 mb-4">9. Changes to Terms</h2>
              <p>These Terms & Conditions may be updated from time to time without prior notice. Continued use of the platform indicates acceptance of the updated terms.</p>
            </section>

            {/* 10. Contact Info */}
            <section className="bg-brand-soft rounded-xl p-6 border border-brand-light/20">
              <h2 className="text-xl font-bold text-brand-dark mb-4">10. Contact Information</h2>
              <p className="font-semibold text-brand-dark">For support or inquiries, contact:</p>
              <div className="mt-4 space-y-1 text-brand-dark">
                <p className="font-bold text-lg text-brand">Prashanthi Vidyalaya & High School</p>
                <p>Chelur, Karnataka</p>
                <p className="flex items-center font-medium">
                  Phone: <span className="ml-2 font-bold">+91 9353202052</span>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 border-t border-gray-200 pt-8">
          <p className="text-sm">© Prashanthi Vidyalaya. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;