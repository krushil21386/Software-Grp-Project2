import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Signup.module.css';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  const [role, setRole]     = useState('patient');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', fullName: '', specialty: '',
    email: '', workEmail: '', license: '', password: '',
  });

  const isPatient = role === 'patient';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/patient-dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = isPatient ? formData.email : formData.workEmail;
    const name  = isPatient
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : formData.fullName;

    const payload = {
      name, email,
      password: formData.password,
      role,
      ...(isPatient ? {} : { specialty: formData.specialty, license: formData.license })
    };

    try {
      const data = await register(payload);
      navigate('/verify-otp', { state: { email, type: 'registration', role } });
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.signupPage} ${isPatient ? styles.patientBg : styles.doctorBg}`}>
      <div className={styles.topBar}>
        <span className={styles.topBarText}>Already have an account?</span>
        <Link to="/login" className={styles.signInLink}>Sign In</Link>
      </div>

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <button className={styles.chip}>JOIN THE FUTURE OF HEALTH</button>
          <h1 className={styles.heading}>
            Start Your <span className={styles.highlight}>Wellness</span>
            <br />Journey Today.
          </h1>
          <p className={styles.subheading}>
            Connect with world-class specialists, manage your health records, and experience
            personalized care through our secure platform.
          </p>
          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIconShield}>🛡️</div>
              <div>
                <div className={styles.featureTitle}>End-to-End Encryption</div>
                <div className={styles.featureDescription}>Your health data is safe and private.</div>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIconBolt}>⚡</div>
              <div>
                <div className={styles.featureTitle}>Instant Appointments</div>
                <div className={styles.featureDescription}>Skip the waiting room with telehealth.</div>
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
              {error && (
                <div style={{
                  color: '#ef4444', fontSize: '14px', marginBottom: '16px',
                  padding: '12px', background: 'rgba(239,68,68,0.2)',
                  borderRadius: '8px', border: '1px solid rgba(239,68,68,0.5)'
                }}>{error}</div>
              )}

              <div className={styles.formVariant} key={role}>
                {isPatient ? (
                  <>
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>FIRST NAME</label>
                        <input className={styles.input} placeholder="John"
                          name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>LAST NAME</label>
                        <input className={styles.input} placeholder="Doe"
                          name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>EMAIL ADDRESS</label>
                      <input className={styles.input} type="email" placeholder="john@example.com"
                        name="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>CREATE PASSWORD</label>
                      <input className={styles.input} type="password" placeholder="••••••••••"
                        name="password" value={formData.password} onChange={handleInputChange} required minLength={6} />
                    </div>
                    <button className={styles.primaryButton} type="submit" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account →'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>FULL NAME</label>
                        <input className={styles.input} placeholder="Dr. Jane Smith"
                          name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>SPECIALTY</label>
                        <input className={styles.input} placeholder="Cardiologist"
                          name="specialty" value={formData.specialty} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>WORK EMAIL</label>
                      <input className={styles.input} type="email" placeholder="dr.smith@hospital.com"
                        name="workEmail" value={formData.workEmail} onChange={handleInputChange} required />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>LICENSE / REGISTRATION ID</label>
                      <input className={styles.input} placeholder="e.g. MED-123456"
                        name="license" value={formData.license} onChange={handleInputChange} required />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>CREATE PASSWORD</label>
                      <input className={styles.input} type="password" placeholder="••••••••••"
                        name="password" value={formData.password} onChange={handleInputChange} required minLength={6} />
                    </div>
                    <button className={styles.primaryButton} type="submit" disabled={loading}>
                      {loading ? 'Registering...' : 'Continue as Doctor →'}
                    </button>
                  </>
                )}
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
              <p className={styles.termsText}>
                By creating an account, you agree to our <a href="#terms">Terms of Service</a> and{' '}
                <a href="#privacy">Privacy Policy</a>, including Cookie Use.
              </p>
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

export default Signup;
