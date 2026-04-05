import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchComplaintByNo }           from '@/utils/api';
import StatusBadge                      from '@/components/StatusBadge';
import StatusTimeline                   from '@/components/StatusTimeline';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

function buildStaticMap(lat, lng) {
  if (!MAPS_KEY || MAPS_KEY === 'your_google_maps_api_key_here') return null;
  const p = new URLSearchParams({ center: `${lat},${lng}`, zoom: '16', size: '800x300', maptype: 'roadmap', markers: `color:red|${lat},${lng}`, key: MAPS_KEY });
  return `https://maps.googleapis.com/maps/api/staticmap?${p}`;
}

function fmtDate(d) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(d));
}

export default function TrackComplaint() {
  const { complaintNo: urlNo } = useParams();
  const navigate               = useNavigate();
  const [inputNo, setInputNo]   = useState(urlNo || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { if (urlNo) search(urlNo); }, [urlNo]);

  const search = async (no) => {
    const val = (no || inputNo).trim().toUpperCase();
    if (!val) { setError('Please enter a complaint number'); return; }
    setLoading(true); setError(''); setComplaint(null);
    try {
      const data = await fetchComplaintByNo(val);
      setComplaint(data);
      navigate(`/track/${val}`, { replace: true });
    } catch (err) {
      setError(err.response?.status === 404 ? `No complaint found with number "${val}".` : 'Failed to fetch complaint. Please try again.');
    } finally { setLoading(false); }
  };

  const mapUrl = complaint ? buildStaticMap(complaint.latitude, complaint.longitude) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/admin/login" className="btn-ghost p-2 text-gray-600 hover:text-primary-600 rounded-full" title="Admin Login">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </Link>
              <Link to="/report" className="btn-primary text-sm">Report a problem</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="page-container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track your complaint</h1>
            <p className="text-gray-500">Enter your complaint number to see the latest status</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); search(inputNo); }} className="card p-4 mb-8">
            <div className="flex gap-3">
              <input type="text" value={inputNo} onChange={(e) => { setInputNo(e.target.value.toUpperCase()); setError(''); }}
                placeholder="Enter complaint number (e.g. MUN-2026-00001)" className="input flex-1" />
              <button type="submit" disabled={loading} className="btn-primary flex-shrink-0 px-6">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="card p-8 text-center animate-entry">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Complaint not found</h3>
              <p className="text-sm text-gray-500 mb-4">{error}</p>
              <Link to="/report" className="btn-primary">Report a new problem</Link>
            </div>
          )}

          {complaint && (
            <div className="space-y-5 animate-entry">
              {/* Header */}
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Complaint number</p>
                    <p className="text-2xl font-bold text-gray-900 font-mono tracking-wide">{complaint.complaintNo}</p>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
                <hr className="border-gray-100 my-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Category</p>
                    <p className="text-gray-900 font-medium">{complaint.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Submitted on</p>
                    <p className="text-gray-900">{fmtDate(complaint.createdAt)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Location</p>
                    <p className="text-gray-900">{complaint.address}</p>
                  </div>
                </div>
              </div>

              {/* Public note */}
              {complaint.publicNote && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-700 mb-1">Note from Municipal Office</p>
                      <p className="text-sm text-blue-700 leading-relaxed">{complaint.publicNote}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Problem description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{complaint.description}</p>
              </div>

              {/* Photos */}
              {complaint.images?.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Photos ({complaint.images.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.images.map((img, idx) => (
                      <button key={idx} onClick={() => setLightbox(img.imageUrl)} className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                        <img src={img.imageUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Reported location</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                  {mapUrl
                    ? <img src={mapUrl} alt="Location" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm">{complaint.latitude?.toFixed(5)}, {complaint.longitude?.toFixed(5)}</p>
                        <p className="text-xs text-center px-4">{complaint.address}</p>
                      </div>
                  }
                </div>
              </div>

              {/* Timeline */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-5">Status history</h3>
                <StatusTimeline logs={complaint.statusLogs || []} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
