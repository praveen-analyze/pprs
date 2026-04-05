import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate }          from 'react-router-dom';
import AdminLayout              from '@/components/AdminLayout';
import StatusBadge              from '@/components/StatusBadge';
import { fetchAdminComplaints } from '@/utils/api';
import toast                    from 'react-hot-toast';

const STATUSES   = ['','submitted','under_review','assigned','in_progress','resolved','rejected'];
const CATEGORIES = ['','Road','Garbage','Streetlight','Drainage','Water','Other'];
const S_LABELS   = { '':'All statuses', submitted:'Submitted', under_review:'Under Review', assigned:'Assigned', in_progress:'In Progress', resolved:'Resolved', rejected:'Rejected' };

const fmtDate = (d) => new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', year:'numeric' }).format(new Date(d));

export default function ComplaintsList() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState('');
  const [category, setCategory]     = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]             = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page };
      if (status)    params.status    = status;
      if (category)  params.category  = category;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      if (search)    params.search    = search;
      const data = await fetchAdminComplaints(params);
      setComplaints(data.complaints);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  }, [status, category, startDate, endDate, search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, category, startDate, endDate, search]);

  const clearFilters = () => { setStatus(''); setCategory(''); setStartDate(''); setEndDate(''); setSearch(''); setSearchInput(''); setPage(1); };
  const hasFilters = status || category || startDate || endDate || search;

  return (
    <AdminLayout title="Complaints">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Filters */}
        <div className="card p-4 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by complaint number or address..." className="input pl-9" />
            </div>
            <button type="submit" className="btn-primary px-5 flex-shrink-0">Search</button>
            {hasFilters && <button type="button" onClick={clearFilters} className="btn-secondary px-4 flex-shrink-0">Clear</button>}
          </form>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={status}    onChange={(e) => setStatus(e.target.value)}    className="input text-sm">{STATUSES.map((s)   => <option key={s} value={s}>{S_LABELS[s]}</option>)}</select>
            <select value={category}  onChange={(e) => setCategory(e.target.value)}  className="input text-sm">{CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}</select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input text-sm" />
            <input type="date" value={endDate}   onChange={(e) => setEndDate(e.target.value)}   className="input text-sm" />
          </div>
          {hasFilters && (
            <div className="flex flex-wrap gap-2">
              {status   && <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">Status: {S_LABELS[status]}<button onClick={() => setStatus('')} className="ml-0.5 hover:text-primary-900">×</button></span>}
              {category && <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">Category: {category}<button onClick={() => setCategory('')} className="ml-0.5 hover:text-primary-900">×</button></span>}
              {search   && <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">Search: "{search}"<button onClick={() => { setSearch(''); setSearchInput(''); }} className="ml-0.5 hover:text-primary-900">×</button></span>}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100">
            <p className="text-sm text-gray-500">{loading ? 'Loading...' : `${pagination?.total ?? 0} complaint${pagination?.total !== 1 ? 's' : ''} found`}</p>
            <button onClick={load} className="btn-ghost text-xs py-1.5 px-3">
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32" /><div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded flex-1" /><div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 font-medium mb-1">No complaints found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Complaint No','Category','Address','Status','Date','Action'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/complaints/${c._id}`)}>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">{c.complaintNo}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{c.category}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs"><span className="line-clamp-1">{c.address}</span></td>
                      <td className="px-6 py-4"><StatusBadge status={c.status} size="sm" /></td>
                      <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/complaints/${c._id}`); }} className="text-xs text-primary-600 hover:underline font-medium">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(p-1,1))} disabled={pagination.page <= 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">← Prev</button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  const n = Math.max(1, Math.min(pagination.page-2, pagination.totalPages-4)) + i;
                  if (n > pagination.totalPages) return null;
                  return <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${n === pagination.page ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{n}</button>;
                })}
                <button onClick={() => setPage((p) => Math.min(p+1, pagination.totalPages))} disabled={pagination.page >= pagination.totalPages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
