import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerifyOtp = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { verifyOtp, verifyMfa, resendOtp, login } = useAuth();

  // State passed via navigate(..., { state: { email, type, role, devOtp } })
  const email  = location.state?.email   || '';
  const type   = location.state?.type    || 'registration';
  const role   = location.state?.role    || 'patient';
  const devOtp = location.state?.devOtp  || null;  // Only present when email not configured

  const [otp, setOtp]           = useState(['','','','','','']);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // New-password fields for password-reset flow
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect guard — if no email passed, go back to login
  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Focus next input automatically
  const handleOtpChange = (value, idx) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const fullOtp = otp.join('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (fullOtp.length < 6) { setError('Please enter all 6 digits.'); return; }

    // Password-reset flow: show new-password fields first
    if (type === 'password-reset' && (!newPassword || !confirmPassword)) {
      setError('Please fill in both password fields.');
      return;
    }
    if (type === 'password-reset' && newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (type === 'password-reset') {
        // Call reset-password endpoint
        const res  = await fetch('http://localhost:5000/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: fullOtp, newPassword })
        });
        const data = await res.json();
        if (!data.success) throw data;
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else if (type === 'login-mfa') {
        // Multi-Factor Authentication
        await verifyMfa(email, fullOtp);
        setSuccess('Security verification successful! Logging you in...');
        
        // Grab the intended destination from state
        const from = location.state?.from?.pathname || '/';
        setTimeout(() => navigate(from, { replace: true }), 1500);
      } else {
        // Registration verification
        await verifyOtp(email, fullOtp, type);
        setSuccess('Email verified! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await resendOtp(email, type);
      setCountdown(60);
      setCanResend(false);
      setSuccess('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #0ea5e9 0%, #0f172a 60%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding: '48px 40px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {type === 'password-reset' ? '🔑' : '✉️'}
          </div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
            {type === 'password-reset' ? 'Reset Password' : 
             type === 'login-mfa' ? 'Security Verification' : 'Verify Your Email'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            {type === 'login-mfa' 
              ? `Login attempt detected from ${location.state?.location || 'a new location'}.` 
              : 'We sent a 6-digit code to'}
            <br />
            <strong style={{ color: '#0ea5e9' }}>{email}</strong>
          </p>
        </div>

        {/* DEV MODE — show OTP on screen when email not configured */}
        {devOtp && (
          <div style={{
            background: 'rgba(251,191,36,0.15)',
            border: '2px solid rgba(251,191,36,0.6)',
            borderRadius: '12px', padding: '14px 18px',
            marginBottom: '20px', textAlign: 'center'
          }}>
            <p style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🛠 Dev Mode — Email not configured
            </p>
            <p style={{ color: '#fff', fontSize: '32px', fontWeight: 800, letterSpacing: '10px', margin: 0 }}>
              {devOtp}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '11px', margin: '6px 0 0' }}>
              Enter this code below · configure EMAIL in backend/.env for real emails
            </p>
          </div>
        )}

        <form onSubmit={handleVerify}>
          {/* OTP Input Grid */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(e.target.value, idx)}
                onKeyDown={e => handleOtpKeyDown(e, idx)}
                style={{
                  width: '48px', height: '56px',
                  textAlign: 'center', fontSize: '24px', fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)',
                  border: `2px solid ${digit ? '#0ea5e9' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: '12px', color: '#fff',
                  outline: 'none', transition: 'border-color 0.2s'
                }}
              />
            ))}
          </div>

          {/* Password fields for reset flow */}
          {type === 'password-reset' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  NEW PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  style={{
                    width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>
            </>
          )}

          {/* Feedback messages */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '10px', padding: '12px', color: '#fca5a5',
              fontSize: '13px', marginBottom: '16px', textAlign: 'center'
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '10px', padding: '12px', color: '#6ee7b7',
              fontSize: '13px', marginBottom: '16px', textAlign: 'center'
            }}>{success}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
            border: 'none', borderRadius: '12px', color: '#fff',
            fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', marginBottom: '16px'
          }}>
            {loading ? 'Verifying...' : type === 'password-reset' ? 'Reset Password' : 'Verify & Continue'}
          </button>
        </form>

        {/* Resend */}
        <div style={{ textAlign: 'center' }}>
          {canResend ? (
            <button onClick={handleResend} disabled={resending} style={{
              background: 'none', border: 'none', color: '#0ea5e9',
              cursor: 'pointer', fontSize: '14px', fontWeight: 600
            }}>
              {resending ? 'Sending...' : '↻ Resend OTP'}
            </button>
          ) : (
            <span style={{ color: '#64748b', fontSize: '13px' }}>
              Resend OTP in <strong style={{ color: '#94a3b8' }}>{countdown}s</strong>
            </span>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: '#475569', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
