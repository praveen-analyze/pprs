import React, { useState, useEffect } from 'react';
import { useParams, useNavigate }      from 'react-router-dom';
import AdminLayout                     from '@/components/AdminLayout';
import StatusBadge                     from '@/components/StatusBadge';
import StatusTimeline                  from '@/components/StatusTimeline';
import { fetchComplaintById, updateComplaintStatus, assignComplaintDept, fetchDepartments } from '@/utils/api';
import toast from 'react-hot-toast';

const STATUSES = [
  { value:'submitted',    label:'Submitted'    },
  { value:'under_review', label:'Under Review' },
  { value:'assigned',     label:'Assigned'     },
  { value:'in_progress',  label:'In Progress'  },
  { value:'resolved',     label:'Resolved'     },
  { value:'rejected',     label:'Rejected'     },
];

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const fmtDate  = (d) => new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }).format(new Date(d));

function buildMap(lat, lng) {
  if (!MAPS_KEY || MAPS_KEY === 'your_google_maps_api_key_here') return null;
  const p = new URLSearchParams({ center:`${lat},${lng}`, zoom:'16', size:'800x300', maptype:'roadmap', markers:`color:red|${lat},${lng}`, key:MAPS_KEY });
  return `https://maps.googleapis.com/maps/api/staticmap?${p}`;
}

export default function ComplaintDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [departments, setDepartments] = useState([]);
  const [lightbox, setLightbox]       = useState(null);
  const [newStatus, setNewStatus]     = useState('');
  const [adminNote, setAdminNote]     = useState('');
  const [publicNote, setPublicNote]   = useState('');
  const [department, setDepartment]   = useState('');
  const [updating, setUpdating]       = useState(false);
  const [assigning, setAssigning]     = useState(false);

  useEffect(() => { loadComplaint(); loadDepts(); }, [id]);

  const loadComplaint = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaintById(id);
      setComplaint(data); setNewStatus(data.status);
      setAdminNote(data.adminNote || ''); setPublicNote(data.publicNote || '');
      setDepartment(data.department || '');
    } catch (err) {
      if (err.response?.status === 404) { toast.error('Complaint not found'); navigate('/admin/complaints'); }
      else toast.error('Failed to load complaint');
    } finally { setLoading(false); }
  };

  const loadDepts = async () => {
    try { const d = await fetchDepartments(); setDepartments(d); } catch {}
  };

  const handleUpdate = async () => {
    if (!newStatus) { toast.error('Please select a status'); return; }
    setUpdating(true);
    try {
      const result = await updateComplaintStatus(id, { newStatus, adminNote: adminNote.trim(), publicNote: publicNote.trim() });
      toast.success(`Status updated to "${newStatus.replace('_',' ')}"`);
      setComplaint((p) => ({ ...p, status: result.complaint.status, adminNote: result.complaint.adminNote, publicNote: result.complaint.publicNote, statusLogs: result.complaint.statusLogs }));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update status'); }
    finally { setUpdating(false); }
  };

  const handleAssign = async () => {
    if (!department) { toast.error('Please select a department'); return; }
    setAssigning(true);
    try {
      await assignComplaintDept(id, department);
      toast.success(`Assigned to ${department}`);
      setComplaint((p) => ({ ...p, department, status: p.status === 'submitted' ? 'assigned' : p.status }));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to assign'); }
    finally { setAssigning(false); }
  };

  if (loading) return (
    <AdminLayout title="Complaint detail">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {[1,2,3].map((i) => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-32 mb-4" /><div className="h-32 bg-gray-100 rounded" /></div>)}
          </div>
          <div className="card p-6 animate-pulse h-64" />
        </div>
      </div>
    </AdminLayout>
  );

  if (!complaint) return null;
  const mapUrl = buildMap(complaint.latitude, complaint.longitude);

  return (
    <AdminLayout title={complaint.complaintNo}>
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/admin/complaints')} className="btn-ghost text-sm mb-5 pl-0">← Back to complaints</button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT: Main info */}
            <div className="lg:col-span-2 space-y-5">
              {/* Header */}
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Complaint number</p>
                    <p className="text-2xl font-bold text-gray-900 font-mono">{complaint.complaintNo}</p>
                    <p className="text-sm text-gray-500 mt-1">Submitted {fmtDate(complaint.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <StatusBadge status={complaint.status} />
                    {complaint.department && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{complaint.department}</span>}
                  </div>
                </div>
                <hr className="my-4 border-gray-100" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Category</p><p className="font-semibold text-gray-900">{complaint.category}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Last updated</p><p className="text-gray-700">{fmtDate(complaint.updatedAt)}</p></div>
                  <div className="sm:col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Location</p><p className="text-gray-700">{complaint.address}</p><p className="text-xs text-gray-400 mt-0.5">{complaint.latitude?.toFixed(6)}, {complaint.longitude?.toFixed(6)}</p></div>
                </div>
              </div>

              {/* Description */}
              <div className="card p-6">
                <h3 className="section-title mb-3">Problem description</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{complaint.description}</p>
              </div>

              {/* Photos */}
              {complaint.images?.length > 0 && (
                <div className="card p-6">
                  <h3 className="section-title mb-4">Photos ({complaint.images.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.images.map((img, idx) => (
                      <button key={idx} onClick={() => setLightbox(img.imageUrl)} className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                        <img src={img.imageUrl} alt={`Photo ${idx+1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="card p-6">
                <h3 className="section-title mb-4">Exact location</h3>
                <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                  {mapUrl
                    ? <img src={mapUrl} alt="Location map" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        <p className="text-sm">{complaint.latitude?.toFixed(5)}, {complaint.longitude?.toFixed(5)}</p>
                        <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">Open in Google Maps →</a>
                      </div>
                  }
                </div>
                {mapUrl && <a href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-2">Open in Google Maps →</a>}
              </div>

              {/* Reporter */}
              <div className="card p-6">
                <h3 className="section-title mb-4">Reporter information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {[{ label:'Name', value:complaint.reporterName }, { label:'Email', value:complaint.reporterEmail }, { label:'Phone', value:complaint.reporterPhone }].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</p>
                      <p className={value ? 'text-gray-900' : 'text-gray-300 italic'}>{value || 'Not provided'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="card p-6">
                <h3 className="section-title mb-5">Status history</h3>
                <StatusTimeline logs={complaint.statusLogs || []} />
              </div>
            </div>

            {/* RIGHT: Action panel */}
            <div className="space-y-5">
              {/* Update status */}
              <div className="card p-5 space-y-4">
                <h3 className="section-title">Update status</h3>
                <div>
                  <label className="label">New status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Admin note <span className="text-xs text-gray-400 font-normal">(internal only)</span></label>
                  <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Internal notes for the team..." rows={3} className="input resize-none text-sm" />
                </div>
                <div>
                  <label className="label">Public note <span className="text-xs text-gray-400 font-normal">(visible to citizen)</span></label>
                  <textarea value={publicNote} onChange={(e) => setPublicNote(e.target.value)} placeholder="Message shown to citizen on tracking page..." rows={3} className="input resize-none text-sm" />
                </div>
                <button onClick={handleUpdate} disabled={updating || newStatus === complaint.status} className="btn-primary w-full py-2.5">
                  {updating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : '✓ Update status'}
                </button>
                {newStatus === complaint.status && <p className="text-xs text-gray-400 text-center">Change the status to enable update</p>}
              </div>

              {/* Assign department */}
              <div className="card p-5 space-y-4">
                <h3 className="section-title">Assign department</h3>
                <div>
                  <label className="label">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input">
                    <option value="">Select department...</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button onClick={handleAssign} disabled={assigning || !department || department === complaint.department} className="btn-secondary w-full py-2.5">
                  {assigning ? 'Assigning...' : 'Assign department'}
                </button>
              </div>

              {/* Quick info */}
              <div className="card p-5 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick info</h3>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between"><dt className="text-gray-500">Images</dt><dd className="font-medium text-gray-900">{complaint.images?.length || 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Status changes</dt><dd className="font-medium text-gray-900">{complaint.statusLogs?.length || 0}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-500">Email on file</dt><dd className={`font-medium ${complaint.reporterEmail ? 'text-green-600' : 'text-gray-400'}`}>{complaint.reporterEmail ? 'Yes' : 'No'}</dd></div>
                </dl>
              </div>

              {/* Public tracking link */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Public tracking link</h3>
                <div className="flex items-center gap-2">
                  <input readOnly value={`${window.location.origin}/track/${complaint.complaintNo}`} className="input text-xs flex-1 bg-gray-50" />
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/track/${complaint.complaintNo}`); toast.success('Link copied!'); }} className="btn-secondary px-3 py-2 flex-shrink-0" title="Copy link">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </AdminLayout>
  );
}
