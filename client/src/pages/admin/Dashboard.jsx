import React, { useState, useEffect } from 'react';
import { useNavigate }                 from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminLayout    from '@/components/AdminLayout';
import StatusBadge    from '@/components/StatusBadge';
import { fetchStats } from '@/utils/api';
import toast          from 'react-hot-toast';

const CAT_COLORS = { Road:'#185FA5', Garbage:'#16A34A', Streetlight:'#D97706', Drainage:'#7C3AED', Water:'#2563EB', Other:'#6B7280' };

function MetricCard({ title, value, color, subtitle, icon }) {
  const bgColor = color.replace('text-', 'bg-').replace('-600', '-100').replace('-900', '-100');
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
          <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
        </div>
      </div>
    </div>
  );
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-panel px-3 py-2">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{payload[0].value} complaints</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate          = useNavigate();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); const d = await fetchStats(); setStats(d); }
    catch { toast.error('Failed to load dashboard stats'); }
    finally { setLoading(false); }
  };

  const fmtDate = (d) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  if (loading) return (
    <AdminLayout title="Dashboard">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="card p-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-24 mb-3" /><div className="h-8 bg-gray-200 rounded w-16" /></div>)}
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Dashboard">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total complaints" value={stats?.total ?? 0} color="text-gray-900" subtitle="All time"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />} />
          <MetricCard title="Pending" value={stats?.pending ?? 0} color="text-amber-600" subtitle="Submitted + under review"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} />
          <MetricCard title="In progress" value={stats?.inProgress ?? 0} color="text-purple-600" subtitle="Being actioned now"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />} />
          <MetricCard title="Resolved today" value={stats?.resolvedToday ?? 0} color="text-green-600" subtitle="Closed in last 24hrs"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="section-title mb-1">By category</h2>
            <p className="text-xs text-gray-400 mb-6">Last 30 days</p>
            {stats?.byCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.byCategory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<Tip />} cursor={{ fill: '#F9FAFB' }} />
                  <Bar dataKey="count" radius={[6,6,0,0]} maxBarSize={48}>
                    {stats.byCategory.map((e) => <Cell key={e.category} fill={CAT_COLORS[e.category] || '#6B7280'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data for last 30 days</div>}
          </div>

          <div className="card p-6">
            <h2 className="section-title mb-1">Daily volume</h2>
            <p className="text-xs text-gray-400 mb-6">Last 14 days</p>
            {stats?.dailyVolume?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.dailyVolume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                    tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth()+1}`; }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<Tip />} labelFormatter={(d) => new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short' }).format(new Date(d))} />
                  <Line type="monotone" dataKey="count" stroke="#185FA5" strokeWidth={2.5} dot={{ r:3, fill:'#185FA5', strokeWidth:0 }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data for last 14 days</div>}
          </div>
        </div>

        {/* Map Preview */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title mb-1">Service Area Map</h2>
              <p className="text-xs text-gray-400">Geographic distribution of reported problems</p>
            </div>
            <button onClick={() => navigate('/admin/map')} className="btn-ghost text-sm font-medium">View full map →</button>
          </div>
          <div className="aspect-[21/9] sm:aspect-[4/1] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 relative group cursor-pointer" onClick={() => navigate('/admin/map')}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white bg-opacity-40 group-hover:bg-opacity-20 transition-all">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">Interactive Map View</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm px-4">See exactly where problems are being reported across the city. Requires Google Maps API Key.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent complaints */}
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="section-title">Recent complaints</h2>
            <button onClick={() => navigate('/admin/complaints')} className="text-sm text-primary-600 hover:underline font-medium">View all</button>
          </div>
          {stats?.recentComplaints?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Complaint No','Category','Address','Status','Date'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentComplaints.map((c) => (
                    <tr key={c._id} onClick={() => navigate(`/admin/complaints/${c._id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-medium text-gray-900">{c.complaintNo}</td>
                      <td className="px-6 py-3.5 text-gray-700">{c.category}</td>
                      <td className="px-6 py-3.5 text-gray-500 max-w-xs truncate">{c.address}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={c.status} size="sm" /></td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs">{fmtDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="px-6 py-12 text-center text-gray-400 text-sm">No complaints yet</div>}
        </div>
      </div>
    </AdminLayout>
  );
}
