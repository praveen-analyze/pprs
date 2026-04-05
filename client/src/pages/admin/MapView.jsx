import React, { useState, useEffect, useRef } from 'react';
import { useNavigate }  from 'react-router-dom';
import AdminLayout      from '@/components/AdminLayout';
import StatusBadge      from '@/components/StatusBadge';
import { fetchMapData } from '@/utils/api';
import toast            from 'react-hot-toast';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const STATUS_COLORS = {
  submitted:'#6B7280', under_review:'#D97706', assigned:'#2563EB',
  in_progress:'#7C3AED', resolved:'#16A34A', rejected:'#DC2626',
};
const STATUS_LABELS = {
  submitted:'Submitted', under_review:'Under Review', assigned:'Assigned',
  in_progress:'In Progress', resolved:'Resolved', rejected:'Rejected',
};

function markerIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24S32 28 32 16C32 7.163 24.837 0 16 0z" fill="${color}"/><circle cx="16" cy="16" r="7" fill="white" opacity="0.9"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function MapView() {
  const navigate              = useNavigate();
  const mapRef                = useRef(null);
  const mapInstanceRef        = useRef(null);
  const markersRef            = useRef([]);
  const infoWindowRef         = useRef(null);
  const [complaints, setComplaints]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [mapLoaded, setMapLoaded]           = useState(false);
  const [mapError, setMapError]             = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const d = await fetchMapData(); setComplaints(d); }
    catch { toast.error('Failed to load map data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!MAPS_KEY || MAPS_KEY === 'your_google_maps_api_key_here') {
      setMapError('Google Maps API key not configured. Add VITE_GOOGLE_MAPS_KEY to client/.env');
      return;
    }
    if (window.google?.maps) { setMapLoaded(true); return; }
    const sid = 'google-maps-script';
    if (document.getElementById(sid)) {
      const t = setInterval(() => { if (window.google?.maps) { setMapLoaded(true); clearInterval(t); } }, 200);
      return;
    }
    const s = document.createElement('script');
    s.id = sid;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async = true; s.defer = true;
    s.onload  = () => setMapLoaded(true);
    s.onerror = () => setMapError('Failed to load Google Maps. Check your API key.');
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 13.0827, lng: 80.2707 }, zoom: 12,
      mapTypeControl: false, fullscreenControl: false, streetViewControl: false,
    });
    mapInstanceRef.current = map;
    infoWindowRef.current  = new window.google.maps.InfoWindow();
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || complaints.length === 0) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    const filtered = selectedStatus ? complaints.filter((c) => c.status === selectedStatus) : complaints;
    const bounds   = new window.google.maps.LatLngBounds();

    filtered.forEach((complaint) => {
      const marker = new window.google.maps.Marker({
        position : { lat: complaint.latitude, lng: complaint.longitude },
        map      : mapInstanceRef.current,
        icon     : { url: markerIcon(STATUS_COLORS[complaint.status] || '#6B7280'), scaledSize: new window.google.maps.Size(32,40), anchor: new window.google.maps.Point(16,40) },
        title    : complaint.complaintNo,
      });
      marker.addListener('click', () => {
        const html = `<div style="font-family:Inter,sans-serif;min-width:200px;padding:12px 14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;font-family:monospace;font-weight:600;color:#374151;background:#F3F4F6;padding:2px 6px;border-radius:4px;">${complaint.complaintNo}</span>
            <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:${STATUS_COLORS[complaint.status]}20;color:${STATUS_COLORS[complaint.status]};">${STATUS_LABELS[complaint.status] || complaint.status}</span>
          </div>
          <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 4px;">${complaint.category}</p>
          <p style="font-size:12px;color:#6B7280;margin:0 0 10px;line-height:1.4;">${complaint.address}</p>
          <a href="/admin/complaints/${complaint._id}" style="display:inline-block;font-size:12px;font-weight:600;color:#185FA5;text-decoration:none;padding:5px 10px;background:#EFF6FF;border-radius:6px;border:1px solid #BFDBFE;">View detail →</a>
        </div>`;
        infoWindowRef.current.setContent(html);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: complaint.latitude, lng: complaint.longitude });
    });
    if (filtered.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
      if (filtered.length === 1) mapInstanceRef.current.setZoom(15);
    }
  }, [complaints, selectedStatus, mapLoaded]);

  const counts = complaints.reduce((a, c) => { a[c.status] = (a[c.status] || 0) + 1; return a; }, {});

  return (
    <AdminLayout title="Map view">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{selectedStatus ? complaints.filter((c) => c.status === selectedStatus).length : complaints.length}</span> complaint{complaints.length !== 1 ? 's' : ''} shown
          </div>
          <div className="h-4 w-px bg-gray-200 hidden sm:block" />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedStatus('')} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!selectedStatus ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All ({complaints.length})</button>
            {Object.entries(STATUS_COLORS).map(([status, color]) => {
              const count = counts[status] || 0;
              if (!count) return null;
              return (
                <button key={status} onClick={() => setSelectedStatus(selectedStatus === status ? '' : status)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${selectedStatus === status ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  style={selectedStatus === status ? { backgroundColor: color } : {}}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selectedStatus === status ? 'rgba(255,255,255,0.7)' : color }} />
                  {STATUS_LABELS[status]} ({count})
                </button>
              );
            })}
          </div>
          <button onClick={loadData} className="btn-ghost text-xs py-1.5 px-3 ml-auto" disabled={loading}>
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />

          {(loading || (!mapLoaded && !mapError)) && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">{loading ? 'Loading complaint data...' : 'Loading map...'}</p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 p-6">
              <div className="card max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Map unavailable</h3>
                <p className="text-sm text-gray-500 mb-4">{mapError}</p>
                <div className="text-left mt-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All complaint locations ({complaints.length})</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {complaints.map((c) => (
                      <button key={c._id} onClick={() => navigate(`/admin/complaints/${c._id}`)}
                        className="w-full text-left flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <span className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[c.status] }} />
                        <div className="min-w-0">
                          <p className="text-xs font-mono font-semibold text-gray-900">{c.complaintNo}</p>
                          <p className="text-xs text-gray-500 truncate">{c.address}</p>
                        </div>
                        <StatusBadge status={c.status} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          {mapLoaded && complaints.length > 0 && (
            <div className="absolute bottom-6 left-4 z-10">
              <div className="bg-white border border-gray-200 rounded-xl shadow-panel p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-2">Legend</p>
                <div className="space-y-1.5">
                  {Object.entries(STATUS_COLORS).map(([status, color]) => {
                    const count = counts[status];
                    if (!count) return null;
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-gray-600">{STATUS_LABELS[status]}</span>
                        <span className="text-gray-400 ml-auto pl-3">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
