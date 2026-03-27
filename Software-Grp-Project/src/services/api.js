/**
 * api.js — Centralised HTTP layer for the Healthcare Platform frontend.
 *
 * All fetch calls to the backend go through this file.
 * Components import individual functions; if the base URL changes,
 * only this file needs updating.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE = `${BASE_URL}/api`;

// ── helpers ────────────────────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem('hc_access_token');
}

async function request(path, options = {}) {
    const token = getToken();
    const res   = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    const data = await res.json();
    if (!data.success && res.status >= 400) throw data;
    return data;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export const authAPI = {
    register:             (payload)            => request('/auth/register',            { method: 'POST', body: JSON.stringify(payload) }),
    verifyOtp:            (email, otp, type)   => request('/auth/verify-otp',          { method: 'POST', body: JSON.stringify({ email, otp, type }) }),
    resendOtp:            (email, type)        => request('/auth/resend-otp',          { method: 'POST', body: JSON.stringify({ email, type }) }),
    login:                (email, pw, role)    => request('/auth/login',               { method: 'POST', body: JSON.stringify({ email, password: pw, role }) }),
    logout:               (refreshToken)       => request('/auth/logout',              { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    refreshToken:         (refreshToken)       => request('/auth/refresh-token',       { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    forgotPassword:       (email)              => request('/auth/forgot-password',     { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword:        (email, otp, pw)     => request('/auth/reset-password',      { method: 'POST', body: JSON.stringify({ email, otp, newPassword: pw }) }),
    getProfile:           ()                   => request('/auth/profile'),
    updateProfile:        (payload)            => request('/auth/profile',             { method: 'PUT',  body: JSON.stringify(payload) }),
};

// ── Hospitals ──────────────────────────────────────────────────────────────

export const hospitalAPI = {
    getAll:   ()   => request('/hospitals'),
    getById:  (id) => request(`/hospitals/${id}`),
};

// ── Doctors ────────────────────────────────────────────────────────────────

export const doctorAPI = {
    getAll:   (filters = {}) => {
        const q = new URLSearchParams(filters).toString();
        return request(`/doctors${q ? `?${q}` : ''}`);
    },
    getById:  (id)   => request(`/doctors/${id}`),
    nearest:  (body) => request('/doctors/nearest', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Departments ────────────────────────────────────────────────────────────

export const departmentAPI = {
    getAll: () => request('/departments'),
};

// ── Appointments ───────────────────────────────────────────────────────────

export const appointmentAPI = {
    getAll:    (filters = {}) => {
        const q = new URLSearchParams(filters).toString();
        return request(`/appointments${q ? `?${q}` : ''}`);
    },
    getById:   (id)    => request(`/appointments/${id}`),
    create:    (body)  => request('/appointments',             { method: 'POST', body: JSON.stringify(body) }),
    update:    (id, b) => request(`/appointments/${id}`,       { method: 'PUT',  body: JSON.stringify(b) }),
    cancel:    (id)    => request(`/appointments/${id}`,       { method: 'DELETE' }),
    accept:    (id)    => request(`/appointments/${id}/accept`, { method: 'PUT' }),
    reject:    (id)    => request(`/appointments/${id}/reject`, { method: 'PUT' }),
    complete:  (id)    => request(`/appointments/${id}/complete`,{ method: 'PUT' }),
};

// ── Medicine Suggestion ────────────────────────────────────────────────────

export const medicineAPI = {
    suggest: (symptoms, allergies = []) =>
        request('/medicine-suggestion', { method: 'POST', body: JSON.stringify({ symptoms, allergies }) }),
};

// ── AI Medical Report ──────────────────────────────────────────────────────

export const aiAPI = {
    analyze: (formData) =>
        fetch(`${BASE}/ai/analyze`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData    // FormData — do NOT set Content-Type (browser adds boundary automatically)
        }).then(r => r.json()),
};
