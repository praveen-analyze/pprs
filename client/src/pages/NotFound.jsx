import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Page not found</h2>
        <p className="text-gray-500 mb-8">The page you are looking for does not exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary">← Go back</button>
          <Link to="/" className="btn-primary">Go home</Link>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex gap-6 justify-center text-sm">
            <Link to="/report" className="text-primary-600 hover:underline font-medium">Report a problem</Link>
            <Link to="/track"  className="text-primary-600 hover:underline font-medium">Track complaint</Link>
            <Link to="/admin/login" className="text-primary-600 hover:underline font-medium">Admin login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
