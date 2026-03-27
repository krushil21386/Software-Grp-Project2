import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './DoctorDashboard.module.css';
import { useAuth } from '../contexts/AuthContext';
import ProfileImageUpload from '../components/ProfileImageUpload/ProfileImageUpload';
import DoctorPerformanceChart from '../components/DoctorPerformanceChart/DoctorPerformanceChart';

const DoctorDashboard = () => {
  const { authFetch, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('upcoming');
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleModal, setRescheduleModal] = useState({ show: false, appointmentId: null, date: '', time: '', reason: '' });

  // Default settings that aren't stored in DB yet, keeping UI interactive
  const [availabilitySettings, setAvailabilitySettings] = useState({
    monday: { start: '9:00 AM', end: '5:00 PM', available: true },
    tuesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    wednesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    thursday: { start: '9:00 AM', end: '5:00 PM', available: true },
    friday: { start: '9:00 AM', end: '5:00 PM', available: true },
    saturday: { start: '10:00 AM', end: '2:00 PM', available: false },
    sunday: { start: '10:00 AM', end: '2:00 PM', available: false },
  });

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
    
    // Initial fetch
    fetchAppointments();

    // Poll every 10 seconds for live updates
    const intervalId = setInterval(fetchAppointments, 10000);

    return () => clearInterval(intervalId);
  }, [authFetch]);

  const handleCancelAppointment = async (appointmentId) => {
    const reason = window.prompt('Please provide a reason for cancellation (this will be emailed to the patient):');
    if (reason !== null) {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await authFetch(`${backendUrl}/api/appointments/${appointmentId}/reject`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason || 'Not provided' })
        });
        if (response.ok) {
          const rejectedApt = upcomingAppointments.find(a => a._id === appointmentId);
          if (rejectedApt) {
            rejectedApt.status = 'cancelled';
            setCancelledAppointments(prev => [rejectedApt, ...prev]);
          }
          setUpcomingAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
          alert('Appointment canceled and email sent.');
        }
      } catch (error) {
        console.error('Error canceling appointment:', error);
      }
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleModal.date || !rescheduleModal.time) {
        alert('Please select a new date and time.');
        return;
    }
    
    try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await authFetch(`${backendUrl}/api/appointments/${rescheduleModal.appointmentId}/reschedule`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: rescheduleModal.date,
                time: rescheduleModal.time,
                reason: rescheduleModal.reason || 'Not provided'
            })
        });

        if (response.ok) {
            alert('Appointment rescheduled and patient notified!');
            setRescheduleModal({ show: false, appointmentId: null, date: '', time: '', reason: '' });
            // Refresh logic - simplest is to just window.location.reload() or manually update state
            window.location.reload();
        }
    } catch (error) {
        console.error('Error rescheduling:', error);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await authFetch(`${backendUrl}/api/appointments/${appointmentId}/complete`, {
        method: 'PUT',
      });
      if (response.ok) {
        const completedApt = upcomingAppointments.find(a => a._id === appointmentId);
        if (completedApt) {
            completedApt.status = 'completed';
            setCompletedAppointments(prev => [...prev, completedApt]);
        }
        setUpcomingAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  if (loading) {
    return <div className={styles.container} style={{textAlign:'center', padding:'50px'}}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <ProfileImageUpload size={100} />
          <div>
            <h1 className={styles.title}>Welcome back, Dr. {user?.name?.replace('Dr. ', '') || 'Doctor'}!</h1>
            <p className={styles.subtitle}>
              {user?.specialty ? `${user.specialty} • ` : ''} Manage your patients and schedule
            </p>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
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
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statInfo}>
            <h3>Rating</h3>
            <p className={styles.statValue}>4.9</p>
          </div>
        </div>
      </div>
      
      {user?.id && (
        <DoctorPerformanceChart 
          doctorId={user.id}
          doctorName={user.name} 
          authFetch={authFetch} 
        />
      )}

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
        <button
          className={`${styles.tab} ${selectedTab === 'availability' ? styles.active : ''}`}
          onClick={() => setSelectedTab('availability')}
        >
          Set Availability
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
                    <h3 className={styles.patientName}>{appointment.patientName}</h3>
                    <p className={styles.reason}>Contact: {appointment.patientPhone || appointment.patientEmail}</p>
                    <p className={styles.hospital}>{appointment.clinicName} • {appointment.mode} Mode</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <button 
                      className={styles.completeButton}
                      onClick={() => handleCompleteAppointment(appointment._id)}
                    >
                      Complete
                    </button>
                    <button 
                      className={styles.rescheduleButton}
                      onClick={() => setRescheduleModal({ show: true, appointmentId: appointment._id, date: '', time: '', reason: '' })}
                      style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Reschedule
                    </button>
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
              <div className={styles.emptyState}>No upcoming appointments scheduled</div>
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
                    <h3 className={styles.patientName}>{appointment.patientName}</h3>
                    <p className={styles.reason}>Contact: {appointment.patientPhone || appointment.patientEmail}</p>
                    <p className={styles.hospital}>{appointment.clinicName}</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <span className={styles.completedBadge}>Completed</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No completed appointments</div>
            )}
          </>
        )}

        {selectedTab === 'availability' && (
          <div className={styles.availabilitySection} style={{ textAlign: 'center', padding: '40px' }}>
            <h2 className={styles.sectionTitle}>Manage Your Schedule</h2>
            <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
              Use our advanced Heatmap tool to view appointment density and set your weekly hours.
            </p>
            <Link 
              to="/doctor-availability" 
              className={styles.saveButton}
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Open Availability Heatmap →
            </Link>
          </div>
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
                    <h3 className={styles.patientName}>{appointment.patientName}</h3>
                    <p className={styles.patientInfo}>{appointment.patientEmail || appointment.patientPhone}</p>
                    <p className={styles.appointmentType}>{appointment.mode} Mode</p>
                  </div>
                  <div className={styles.statusBadge} style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 12px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '500' }}>
                    Cancelled
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No cancelled appointments</div>
            )}
          </>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#1e293b' }}>Reschedule Appointment</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>New Date</label>
              <input type="date" value={rescheduleModal.date} onChange={e => setRescheduleModal(prev => ({ ...prev, date: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>New Time</label>
              <input type="time" value={rescheduleModal.time} onChange={e => setRescheduleModal(prev => ({ ...prev, time: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Reason (Optional)</label>
              <input type="text" placeholder="e.g., Unexpected emergency" value={rescheduleModal.reason} onChange={e => setRescheduleModal(prev => ({ ...prev, reason: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRescheduleModal({ show: false, appointmentId: null, date: '', time: '', reason: '' })} style={{ padding: '10px 16px', borderRadius: '6px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={submitReschedule} style={{ padding: '10px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Confirm Reschedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
