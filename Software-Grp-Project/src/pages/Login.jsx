import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  const [role, setRole]         = useState('patient');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const isPatient = role === 'patient';

  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname ||
        (user.role === 'doctor' ? '/doctor-dashboard' : 
         user.role === 'admin' ? '/admin-dashboard' : '/patient-dashboard');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, role);

      // If backend needs OTP verification
      if (data.requiresVerification) {
        navigate('/verify-otp', { state: { email, type: 'registration' } });
        return;
      }

      // If backend needs MFA
      if (data.requiresMfa) {
        navigate('/verify-otp', { 
          state: { 
            email, 
            type: 'login-mfa', 
            location: data.location,
            from: location.state?.from
          } 
        });
        return;
      }

      const from = location.state?.from?.pathname ||
        (data.user.role === 'doctor' ? '/doctor-dashboard' :
         data.user.role === 'admin'  ? '/admin-dashboard' : '/patient-dashboard');
      navigate(from, { replace: true });

    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');

      // If unverified, redirect to OTP page
      if (err?.requiresVerification) {
        navigate('/verify-otp', { state: { email, type: 'registration' } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.loginPage} ${isPatient ? styles.patientBg : styles.doctorBg}`}>
      <div className={styles.topBar}>
        <span className={styles.topBarText}>Don't have an account?</span>
        <Link to="/signup" className={styles.signUpLink}>Sign Up</Link>
      </div>

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <button className={styles.chip}>WELCOME BACK</button>
          <h1 className={styles.heading}>
            Continue Your <span className={styles.highlight}>Health</span>
            <br />Journey Today.
          </h1>
          <p className={styles.subheading}>
            Access your personalized health dashboard, manage appointments, and connect
            with your healthcare providers through our secure platform.
          </p>
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIconShield}>🛡️</div>
              <div>
                <div className={styles.featureTitle}>Secure Access</div>
                <div className={styles.featureDescription}>Your data is protected with bank-level security.</div>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIconBolt}>⚡</div>
              <div>
                <div className={styles.featureTitle}>Quick Access</div>
                <div className={styles.featureDescription}>Get instant access to your health records and appointments.</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formCard}>
            <div className={styles.cardTopAccent} />
            <div className={styles.cardHeader}>
              <span className={styles.cardSubtitle}>I AM A...</span>
              <div className={styles.toggleGroup}>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${isPatient ? styles.activeToggle : ''}`}
                  onClick={() => setRole('patient')}
                >Patient</button>
                <button
                  type="button"
                  className={`${styles.toggleButton} ${!isPatient ? styles.activeToggle : ''}`}
                  onClick={() => setRole('doctor')}
                >Doctor</button>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formVariant} key={role}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>EMAIL ADDRESS</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder={isPatient ? 'john@example.com' : 'dr.smith@hospital.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>PASSWORD</label>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.optionsRow}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/verify-otp" state={{ type: 'password-reset' }} className={styles.forgotPasswordLink}>
                    Forgot Password?
                  </Link>
                </div>

                {error && (
                  <div style={{
                    color: '#ef4444', fontSize: '14px', marginBottom: '16px',
                    padding: '12px', background: 'rgba(239,68,68,0.2)',
                    borderRadius: '8px', border: '1px solid rgba(239,68,68,0.5)'
                  }}>{error}</div>
                )}

                <button className={styles.primaryButton} type="submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In →'}
                </button>
              </div>

              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>OR CONTINUE WITH</span>
                <span className={styles.dividerLine} />
              </div>

              <div className={styles.socialRow}>
                <button type="button" className={styles.socialButton}>Google</button>
                <button type="button" className={styles.socialButton}>Facebook</button>
              </div>

              <Link to="/" className={styles.backHomeLink}>← Back to Home</Link>
            </form>
          </div>
        </div>
      </div>

      <p className={styles.footerNote}>
        © 2024 MediCare Plus. All health data is securely encrypted with AES-256.
      </p>
    </div>
  );
};

export default Login;
