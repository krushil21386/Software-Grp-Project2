import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:5000/api/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading]   = useState(true);

  // ── Restore session from localStorage ──────────────────
  useEffect(() => {
    const savedUser  = localStorage.getItem('hc_user');
    const savedToken = localStorage.getItem('hc_access_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setAccessToken(savedToken);
      } catch {
        localStorage.removeItem('hc_user');
        localStorage.removeItem('hc_access_token');
        localStorage.removeItem('hc_refresh_token');
      }
    }
    setLoading(false);
  }, []);

  // ── Save tokens after login ─────────────────────────────
  const saveSession = (userData, accToken, refToken) => {
    setUser(userData);
    setAccessToken(accToken);
    localStorage.setItem('hc_user',          JSON.stringify(userData));
    localStorage.setItem('hc_access_token',  accToken);
    if (refToken) localStorage.setItem('hc_refresh_token', refToken);
  };

  // ── Login ───────────────────────────────────────────────
  const login = async (email, password, role) => {
    const res  = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();

    if (!data.success) throw data;           // caller catches & shows msg

    saveSession(data.user, data.accessToken, data.refreshToken);
    return data;
  };

  // ── Register ────────────────────────────────────────────
  const register = async (payload) => {
    const res  = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw data;
    return data;                              // caller redirects to /verify-otp
  };

  // ── Verify OTP ──────────────────────────────────────────
  const verifyOtp = async (email, otp, type = 'registration') => {
    const res  = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type })
    });
    const data = await res.json();
    if (!data.success) throw data;
    return data;
  };

  // ── Resend OTP ──────────────────────────────────────────
  const resendOtp = async (email, type = 'registration') => {
    const res  = await fetch(`${API_BASE}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });
    const data = await res.json();
    if (!data.success) throw data;
    return data;
  };

  // ── Refresh access token silently ───────────────────────
  const refreshAccessToken = useCallback(async () => {
    const refToken = localStorage.getItem('hc_refresh_token');
    if (!refToken) return null;

    try {
      const res  = await fetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refToken })
      });
      const data = await res.json();
      if (data.success) {
        setAccessToken(data.accessToken);
        localStorage.setItem('hc_access_token', data.accessToken);
        return data.accessToken;
      }
    } catch { /* silent */ }
    return null;
  }, []);

  // ── Logout ──────────────────────────────────────────────
  const logout = async () => {
    const refToken = localStorage.getItem('hc_refresh_token');
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refToken })
      });
    } catch { /* best-effort */ }

    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('hc_user');
    localStorage.removeItem('hc_access_token');
    localStorage.removeItem('hc_refresh_token');
  };

  // ── Authenticated fetch helper ──────────────────────────
  // Automatically attaches Bearer token; retries once on 401 after refresh
  const authFetch = useCallback(async (url, options = {}) => {
    let token = accessToken || localStorage.getItem('hc_access_token');
    const makeRequest = (t) =>
      fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${t}` }
      });

    let res = await makeRequest(token);

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        res = await makeRequest(newToken);
      }
    }
    return res;
  }, [accessToken, refreshAccessToken]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      verifyOtp,
      resendOtp,
      authFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
