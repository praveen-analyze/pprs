import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [trackNo, setTrackNo] = useState('');
  const [trackError, setTrackError] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    const val = trackNo.trim().toUpperCase();
    if (!val) { setTrackError('Please enter a complaint number'); return; }
    if (!val.startsWith('MUN-')) { setTrackError('Format: MUN-YYYY-XXXXX (e.g. MUN-2026-00001)'); return; }
    navigate(`/track/${val}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">Municipal Board</p>
                <p className="text-xs text-gray-500 leading-tight">Problem Reporting System</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/admin/login" className="btn-ghost p-2 text-gray-600 hover:text-primary-600 rounded-full" title="Admin Login">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </Link>
              <Link to="/track" className="btn-ghost text-sm hidden sm:flex">Track complaint</Link>
              <Link to="/report" className="btn-primary text-sm">Report a problem</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-primary-600 text-white py-20 sm:py-28">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-15 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Live reporting system</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Report civic problems<br />
            <span className="text-blue-200">in your neighbourhood</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Submit complaints about potholes, garbage, broken streetlights, drainage issues and more.
            Track your complaint status in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link to="/report" className="inline-flex items-center justify-center gap-2.5 bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 active:scale-95 transition-all text-lg shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Report a problem
            </Link>
            <Link to="/track" className="inline-flex items-center justify-center gap-2.5 bg-primary-500 text-white font-semibold px-8 py-4 rounded-xl hover:bg-primary-400 active:scale-95 transition-all text-lg border border-primary-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Track complaint
            </Link>
          </div>
          {/* Inline track search */}
          <div className="max-w-lg mx-auto">
            <p className="text-blue-200 text-sm mb-3 font-medium">Already have a complaint number?</p>
            <form onSubmit={handleTrack} className="flex gap-2">
              <input
                type="text" value={trackNo}
                onChange={(e) => { setTrackNo(e.target.value); setTrackError(''); }}
                placeholder="Enter complaint number (MUN-2026-XXXXX)"
                className="flex-1 px-4 py-3 rounded-xl bg-white bg-opacity-15 text-white placeholder-blue-200 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white text-sm"
              />
              <button type="submit" className="px-5 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-blue-50 active:scale-95 transition-all text-sm flex-shrink-0">Track</button>
            </form>
            {trackError && <p className="mt-2 text-red-300 text-xs text-left">{trackError}</p>}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="page-container py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[{ number: '24hrs', label: 'Average response time' }, { number: '6', label: 'Problem categories' }, { number: '100%', label: 'Free to use' }, { number: '24/7', label: 'Complaint tracking' }].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary-600">{s.number}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Report a civic problem in under 2 minutes — no account needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', color: 'bg-blue-50 text-primary-600', title: 'Report with photo', desc: 'Take a photo, drop your GPS pin, describe the problem, and submit — all from your phone browser.' },
              { step: '02', color: 'bg-amber-50 text-amber-600', title: 'Get your ID', desc: 'Receive a unique complaint number like MUN-2026-00001 instantly after submission.' },
              { step: '03', color: 'bg-green-50 text-green-600', title: 'Track in real time', desc: 'Use your complaint number anytime to see status updates, admin notes, and resolution timeline.' },
            ].map((item) => (
              <div key={item.step} className="card p-8 hover:shadow-panel transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${item.color}`}>
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-gray-300 mb-2 tracking-widest">STEP {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What can you report?</h2>
            <p className="text-gray-500">We handle 6 categories of civic problems</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Road', emoji: '🛣️', desc: 'Potholes, cracks' },
              { label: 'Garbage', emoji: '🗑️', desc: 'Uncollected waste' },
              { label: 'Streetlight', emoji: '💡', desc: 'Broken lights' },
              { label: 'Drainage', emoji: '🌊', desc: 'Blocked drains' },
              { label: 'Water', emoji: '💧', desc: 'Supply issues' },
              { label: 'Other', emoji: '📋', desc: 'Any civic issue' },
            ].map((cat) => (
              <Link key={cat.label} to="/report" className="card p-5 text-center hover:shadow-panel hover:border-primary-200 transition-all group cursor-pointer">
                <div className="text-3xl mb-3">{cat.emoji}</div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{cat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold mb-4">Spotted a problem? Report it now.</h2>
          <p className="text-blue-100 mb-8 max-w-lg mx-auto">Your report goes directly to the municipal authority. No registration required.</p>
          <Link to="/report" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 active:scale-95 transition-all text-lg">
            Get started — it's free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

    {/* Footer */ }
    < footer className = "bg-gray-900 text-gray-400 py-10" >
      <div className="page-container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Municipal Board</p>
              <p className="text-xs text-gray-500">Public Problem Reporting System</p>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/report" className="hover:text-white transition-colors">Report</Link>
            <Link to="/track" className="hover:text-white transition-colors">Track</Link>
            <Link to="/admin/login" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Municipal Board. All rights reserved.</p>
        </div>
      </div>
      </footer >
    </div >
  );
}
