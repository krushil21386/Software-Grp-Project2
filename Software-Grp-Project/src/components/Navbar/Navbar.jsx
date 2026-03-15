import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const goToLogin = () => {
    navigate('/login', { state: { from: location } });
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsSidebarOpen(false);
  };

  const scrollToTop = () => {
    navigate('/');
    setIsSidebarOpen(false);
  };

  const handleLinkClick = (path) => {
    if (!isAuthenticated && path !== '/') {
      navigate('/login', { state: { from: { pathname: path } } });
      setIsSidebarOpen(false);
      return;
    }
    navigate(path);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div onClick={scrollToTop} className={styles.logo} style={{ cursor: 'pointer' }}>
          <div className={styles.logoIcon}>+</div>
          <h2>MediCare Plus</h2>
        </div>
        
        <div className={styles.navActions}>
          {isAuthenticated ? (
            <>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Welcome, {user?.name}</span>
                <span className={styles.userRole}>({user?.role})</span>
              </div>
              <div className={styles.btn}>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <div className={styles.btn}>
              <button onClick={goToLogin}>Login / Sign Up →</button>
            </div>
          )}
          
          <button 
            className={styles.menuButton}
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburger}>
              <span className={`${styles.line} ${isSidebarOpen ? styles.line1Open : ''}`}></span>
              <span className={`${styles.line} ${isSidebarOpen ? styles.line2Open : ''}`}></span>
              <span className={`${styles.line} ${isSidebarOpen ? styles.line3Open : ''}`}></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <div 
        className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3>Navigation</h3>
          <button 
            className={styles.closeButton}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        
        <div className={styles.sidebarLinks}>
          <Link to="/" onClick={() => handleLinkClick('/')}>Home</Link>
          <Link to="/hospitals" onClick={() => handleLinkClick('/hospitals')}>Hospitals</Link>
          <Link to="/doctor-locator" onClick={() => handleLinkClick('/doctor-locator')}>Find Doctors</Link>
          <Link to="/medicine-ai" onClick={() => handleLinkClick('/medicine-ai')}>AI Medicine Suggestion</Link>
          <Link to="/book-appointment" onClick={() => handleLinkClick('/book-appointment')}>Book Appointment</Link>
          <Link to="/emergency-services" onClick={() => handleLinkClick('/emergency-services')}>🚨 Emergency Services</Link>
          <Link to="/medicine-delivery" onClick={() => handleLinkClick('/medicine-delivery')}>💊 Medicine Delivery</Link>
          {isAuthenticated && (
            <>
              {user?.role === 'patient' && (
                <>
                  <Link to="/patient-dashboard" onClick={() => handleLinkClick('/patient-dashboard')}>Patient Dashboard</Link>
                  <Link to="/appointments" onClick={() => handleLinkClick('/appointments')}>My Appointments</Link>
                  <Link to="/medical-records" onClick={() => handleLinkClick('/medical-records')}>Medical Records</Link>
                </>
              )}
              {user?.role === 'doctor' && (
                <>
                  <Link to="/doctor-dashboard" onClick={() => handleLinkClick('/doctor-dashboard')}>Doctor Dashboard</Link>
                  <Link to="/doctor-availability" onClick={() => handleLinkClick('/doctor-availability')}>📅 Availability Heatmap</Link>
                  <Link to="/appointments" onClick={() => handleLinkClick('/appointments')}>My Appointments</Link>
                </>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin-dashboard" onClick={() => handleLinkClick('/admin-dashboard')}>Admin Dashboard</Link>
              )}
            </>
          )}
        </div>
        
        <div className={styles.sidebarFooter}>
          {isAuthenticated ? (
            <button className={styles.sidebarLoginButton} onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className={styles.sidebarLoginButton} onClick={goToLogin}>
              Login / Sign Up →
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
