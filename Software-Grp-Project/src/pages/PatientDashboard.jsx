import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './PatientDashboard.module.css';
import { useAuth } from '../contexts/AuthContext';
import ProfileImageUpload from '../components/ProfileImageUpload/ProfileImageUpload';

const PatientDashboard = () => {
  const { authFetch, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('upcoming');
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await authFetch('http://localhost:5000/api/appointments/my-appointments');
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

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const response = await authFetch(`http://localhost:5000/api/appointments/${appointmentId}/reject`, {
          method: 'PUT',
        });
        if (response.ok) {
          const cancelledApt = upcomingAppointments.find(a => a._id === appointmentId);
          if (cancelledApt) {
            cancelledApt.status = 'cancelled';
            setCancelledAppointments(prev => [cancelledApt, ...prev]);
          }
          setUpcomingAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
        }
      } catch (error) {
        console.error('Error canceling appointment:', error);
      }
    }
  };

  if (loading) {
    return <div className={styles.container} style={{textAlign:'center', padding:'50px'}}>Loading dashboard...</div>;
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
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💊</div>
          <div className={styles.statInfo}>
            <h3>Active Prescriptions</h3>
            <p className={styles.statValue}>0</p>
          </div>
        </div>
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
                      onClick={() => handleCancelAppointment(appointment._id)}
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
    </div>
  );
};

export default PatientDashboard;
