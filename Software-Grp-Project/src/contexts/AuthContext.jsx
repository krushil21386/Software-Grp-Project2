import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

import BACKEND_URL from '../config';
const API_BASE = `${BACKEND_URL}/api/auth`;

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  // ── Session Restoration (Verification) ──────────────────
  // Instead of reading tokens (which are now httpOnly), we ask
  // the server if we have a valid session via a profile check.
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('hc_user');
      if (!savedUser) {
        setLoading(false);
        return;
      }

      try {
        // We attempt to fetch the profile. If the cookie is valid, this succeeds.
        const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          headers: { 'Cache-Control': 'no-cache' },
          credentials: 'include'
        });
        
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('hc_user', JSON.stringify(data.user)); // Keep user metadata for UI
        } else if (res.status === 401) {
          // Token strictly invalid/expired - clear session
          localStorage.removeItem('hc_user');
          setUser(null);
        } else {
          // Server error (500) or Rate limit (429) - keep local user metadata to avoid kick-out
          console.warn(`[AuthContext] Session restore aborted with status ${res.status}. Keeping local metadata.`);
          const localUser = JSON.parse(savedUser);
          setUser(localUser);
        }
      } catch (err) {
        console.error('[AuthContext] Session restoration failed:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch { /* best-effort */ }

    setUser(null);
    localStorage.removeItem('hc_user');
  }, []);

  // ── Authenticated fetch helper ──────────────────────────
  // Automatically includes cookies and handles 401 transparently
  const authFetch = useCallback(async (url, options = {}) => {
    const makeRequest = (extraOptions = {}) =>
      fetch(url, {
        ...options,
        ...extraOptions,
        credentials: 'include', // CRITICAL: Send cookies
        headers: { 
          ...(options.headers || {}), 
          ...(extraOptions.headers || {}),
          // We no longer manually attach the Authorization header!
        }
      });

    let res;
    try {
      res = await makeRequest();
    } catch (err) {
      throw err;
    }

    // Handle session expiry / token refresh
    if (res.status === 401) {
      console.warn(`[AuthContext] 401 Unauthorized detected. Attempting silent refresh...`);
      
      try {
        const refreshRes = await fetch(`${API_BASE}/refresh-token`, {
          method: 'POST',
          credentials: 'include'
        });
        const refreshData = await refreshRes.json();

        if (refreshData.success) {
          console.log(`[AuthContext] Refresh successful. Retrying original request...`);
          res = await makeRequest();
        } else {
          console.error(`[AuthContext] Refresh failed. Session expired.`);
          logout();
        }
      } catch (refreshErr) {
        console.error(`[AuthContext] Refresh fetch error:`, refreshErr);
        logout();
      }
    }
    return res;
  }, [logout]);

  // ── Original Auth Handlers (Simplified) ──────────────────
  
  const login = async (email, password, role) => {
    const res  = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('hc_user', JSON.stringify(data.user));
    }
    return data;
  };

  const register = async (payload) => {
    const res  = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  };

  const verifyOtp = async (email, otp, type = 'registration') => {
    const res  = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, type })
    });
    return await res.json();
  };

  const verifyMfa = async (email, otp) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp })
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('hc_user', JSON.stringify(data.user));
    }
    return data;
  };

  const resendOtp = async (email, type = 'registration') => {
    const res  = await fetch(`${API_BASE}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type })
    });
    return await res.json();
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    localStorage.setItem('hc_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      updateUser,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      verifyOtp,
      verifyMfa,
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
