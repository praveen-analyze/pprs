import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }           from '@/context/AuthContext';
import { adminLogin }        from '@/utils/api';
import toast                 from 'react-hot-toast';

export default function Login() {
  const navigate           = useNavigate();
  const { login }          = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password)     { setError('Password is required'); return; }
    setLoading(true);
    try {
      const data = await adminLogin(email.trim(), password);
      login(data.token, data.admin);
      toast.success(`Welcome back, ${data.admin.name}!`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Municipal Board</h1>
          <p className="text-sm text-gray-500 mt-1">Admin portal — sign in to continue</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2.5">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@municipal.gov" autoComplete="email" autoFocus className="input" disabled={loading} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password" autoComplete="current-password" className="input pr-10" disabled={loading} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPass ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</> : 'Sign in →'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Default credentials after seeding:</p>
            <p className="text-xs text-gray-500 font-mono mt-1">admin@municipal.gov / Admin@123</p>
          </div>
        </div>
        <p className="text-center mt-6 text-sm text-gray-400">
          <Link to="/" className="text-primary-600 hover:underline font-medium">← Back to public site</Link>
        </p>
      </div>
    </div>
  );
}
