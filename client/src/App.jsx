import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }   from '@/context/AuthContext';

const Home            = lazy(() => import('@/pages/Home'));
const ReportForm      = lazy(() => import('@/pages/ReportForm'));
const TrackComplaint  = lazy(() => import('@/pages/TrackComplaint'));
const AdminLogin      = lazy(() => import('@/pages/admin/Login'));
const AdminDashboard  = lazy(() => import('@/pages/admin/Dashboard'));
const ComplaintsList  = lazy(() => import('@/pages/admin/ComplaintsList'));
const ComplaintDetail = lazy(() => import('@/pages/admin/ComplaintDetail'));
const MapView         = lazy(() => import('@/pages/admin/MapView'));
const NotFound        = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

function PublicAdminRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

import Chatbot    from '@/components/Chatbot';

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/report"               element={<ReportForm />} />
        <Route path="/track"                element={<TrackComplaint />} />
        <Route path="/track/:complaintNo"   element={<TrackComplaint />} />
        <Route path="/admin/login"          element={<PublicAdminRoute><AdminLogin /></PublicAdminRoute>} />
        <Route path="/admin/dashboard"      element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/complaints"     element={<ProtectedRoute><ComplaintsList /></ProtectedRoute>} />
        <Route path="/admin/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
        <Route path="/admin/map"            element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/admin"                element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="*"                     element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Chatbot />
    </AuthProvider>
  );
}
