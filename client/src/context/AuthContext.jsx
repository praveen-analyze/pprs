import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY   = 'municipal_admin_token';
const ADMIN_KEY   = 'municipal_admin_info';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY)); } catch { return null; }
  });

  const isAuthenticated = Boolean(token && admin);

  useEffect(() => {
    if (!token) return;
    try {
      const payload   = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000;
      if (Date.now() >= expiresAt) { logout(); return; }
      const timer = setTimeout(logout, expiresAt - Date.now());
      return () => clearTimeout(timer);
    } catch { logout(); }
  }, [token]);

  const login = useCallback((newToken, adminInfo) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminInfo));
    setToken(newToken);
    setAdmin(adminInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return (
    <AuthContext.Provider value={{ token, admin, isAuthenticated, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
