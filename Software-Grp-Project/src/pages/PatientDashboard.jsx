import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PatientDashboard.module.css';
import { useAuth } from '../contexts/AuthContext';
import ProfileImageUpload from '../components/ProfileImageUpload/ProfileImageUpload';
import { DashboardSkeleton } from '../components/Skeleton/Skeleton';

const PatientDashboard = () => {
  const { authFetch, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('upcoming');
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, appointmentId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await authFetch(`${backendUrl}/api/appointments/my-appointments`);
        const data = await res.json();
        if (data.success) {
          setUpcomingAppointments(data.upcoming || []);
          setCompletedAppointments(data.completed || []);
          setCancelledAppointments(data.cancelled || []);
        }
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [authFetch]);

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await authFetch(`${backendUrl}/api/appointments/${cancelModal.appointmentId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (response.ok) {
        const cancelledApt = upcomingAppointments.find(a => a._id === cancelModal.appointmentId);
        if (cancelledApt) {
          cancelledApt.status = 'cancelled';
          setCancelledAppointments(prev => [cancelledApt, ...prev]);
        }
        setUpcomingAppointments(prev => prev.filter(apt => apt._id !== cancelModal.appointmentId));
        setCancelModal({ show: false, appointmentId: null });
        setCancelReason('');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <ProfileImageUpload size={80} />
          <div>
            <h1 className={styles.title}>Welcome back, {user?.name || 'Patient'}!</h1>
            <p className={styles.subtitle}>Manage your appointments and health records</p>
          </div>
        </div>
        <Link to="/book-appointment" className={styles.bookButton}>
          Book New Appointment
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏰</div>
          <div className={styles.statInfo}>
            <h3>Upcoming Appointments</h3>
            <p className={styles.statValue}>{upcomingAppointments.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed</h3>
            <p className={styles.statValue}>{completedAppointments.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statInfo}>
            <h3>Medical Records</h3>
            <p className={styles.statValue}>{completedAppointments.length}</p>
          </div>
        </div>
        <Link to="/prescriptions" className={styles.statCard} style={{ textDecoration: 'none' }}>
          <div className={styles.statIcon}>💊</div>
          <div className={styles.statInfo}>
            <h3>Clinical Prescriptions</h3>
            <p className={styles.statValue}>View All</p>
          </div>
        </Link>
      </div>

      <div className={styles.quickActions}>
        <Link to="/medicine-ai" className={styles.actionCard}>
          <div className={styles.actionIcon}>🤖</div>
          <h3>AI Medicine Suggestion</h3>
          <p>Get medicine recommendations</p>
        </Link>
        <Link to="/doctor-locator" className={styles.actionCard}>
          <div className={styles.actionIcon}>📍</div>
          <h3>Find Nearest Doctor</h3>
          <p>Locate nearby healthcare providers</p>
        </Link>
        <Link to="/medical-records" className={styles.actionCard}>
          <div className={styles.actionIcon}>📄</div>
          <h3>Medical Records</h3>
          <p>View your health history</p>
        </Link>
        <Link to="/hospitals" className={styles.actionCard}>
          <div className={styles.actionIcon}>🏥</div>
          <h3>Browse Hospitals</h3>
          <p>Explore our network</p>
        </Link>
        <Link to="/prescriptions" className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
          <div className={styles.actionIcon}>🧾</div>
          <h3>Prescription Center</h3>
          <p>Download secure medical documents</p>
        </Link>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedTab === 'upcoming' ? styles.active : ''}`}
          onClick={() => setSelectedTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'completed' ? styles.active : ''}`}
          onClick={() => setSelectedTab('completed')}
        >
          Completed
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'cancelled' ? styles.active : ''}`}
          onClick={() => setSelectedTab('cancelled')}
        >
          Cancelled
        </button>
      </div>
      <div className={styles.appointmentsList}>
        {selectedTab === 'upcoming' && (
          <>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{appointment.date}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <h3 className={styles.doctorName}>{appointment.doctorName}</h3>
                    <p className={styles.specialty}>{appointment.specialization}</p>
                    <p className={styles.hospital}>{appointment.clinicName}</p>
                    <p className={styles.hospital}>{appointment.mode} Mode</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <button 
                      className={styles.cancelButton}
                      onClick={() => setCancelModal({ show: true, appointmentId: appointment._id })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No upcoming appointments</p>
                <Link to="/book-appointment" className={styles.bookLink}>
                  Book your first appointment
                </Link>
              </div>
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {completedAppointments.length > 0 ? (
              completedAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{appointment.date}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <h3 className={styles.doctorName}>{appointment.doctorName}</h3>
                    <p className={styles.specialty}>{appointment.specialization}</p>
                    <p className={styles.hospital}>{appointment.clinicName}</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <Link
                      to="/medical-records"
                      className={styles.viewButton}
                    >
                      View Records
                    </Link>
                    <span className={styles.completedBadge}>Completed</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No completed appointments</div>
            )}
          </>
        )}

        {selectedTab === 'cancelled' && (
          <>
            {cancelledAppointments.length > 0 ? (
              cancelledAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard} style={{ opacity: 0.7 }}>
                  <div className={styles.appointmentTime}>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{appointment.date}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <h3 className={styles.doctorName}>{appointment.doctorName}</h3>
                    <p className={styles.specialty}>{appointment.specialization}</p>
                    <p className={styles.hospital}>{appointment.clinicName}</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <span className={styles.cancelledBadge} style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 12px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '500' }}>
                      Cancelled
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No cancelled appointments</div>
            )}
          </>
        )}
      </div>

      {/* Cancel Appointment Modal */}
      {cancelModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => { setCancelModal({ show: false, appointmentId: null }); setCancelReason(''); }}>
          <div style={{
            background: '#fff', borderRadius: '20px', width: '90%', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Cancel Appointment</h3>
              <button onClick={() => { setCancelModal({ show: false, appointmentId: null }); setCancelReason(''); }}
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>
                Are you sure you want to cancel this appointment? Please provide a reason:
              </p>
              <textarea
                placeholder="e.g. Schedule conflict, feeling better..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              padding: '16px 28px', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'flex-end', gap: '12px'
            }}>
              <button
                onClick={() => { setCancelModal({ show: false, appointmentId: null }); setCancelReason(''); }}
                style={{
                  padding: '10px 24px', borderRadius: '10px', background: '#f8fafc',
                  color: '#1e293b', border: '1px solid #e2e8f0', fontSize: '14px',
                  fontWeight: 600, cursor: 'pointer'
                }}>Keep Appointment</button>
              <button
                onClick={handleCancelAppointment}
                disabled={!cancelReason.trim() || cancelling}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  background: cancelReason.trim() ? '#DC143C' : '#fca5a5',
                  color: '#fff', border: 'none', fontSize: '14px',
                  fontWeight: 600, cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: cancelling ? 0.6 : 1
                }}>{cancelling ? 'Cancelling...' : 'Confirm Cancellation'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
