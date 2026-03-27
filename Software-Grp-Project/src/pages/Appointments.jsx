import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Appointments.module.css';
import { useAuth } from '../contexts/AuthContext';

const Appointments = () => {
  const { authFetch } = useAuth();
  const [filter, setFilter] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await authFetch(`${backendUrl}/api/appointments/my-appointments`);
        const data = await res.json();
        if (data.success) {
          const allApts = [
            ...(data.upcoming || []),
            ...(data.completed || []),
            ...(data.cancelled || [])
          ];
          setAppointments(allApts);
        }
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [authFetch]);

  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(apt => apt.status === filter);

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await authFetch(`${backendUrl}/api/appointments/${appointmentId}/reject`, {
          method: 'PUT',
        });
        if (response.ok) {
          setAppointments(prev => prev.map(apt => 
            apt._id === appointmentId ? { ...apt, status: 'cancelled' } : apt
          ));
        }
      } catch (error) {
        console.error('Error canceling appointment:', error);
      }
    }
  };

  if (loading) {
    return <div className={styles.container} style={{textAlign:'center', padding:'50px'}}>Loading appointments...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Appointments</h1>
        <Link to="/book-appointment" className={styles.bookButton}>
          Book New Appointment
        </Link>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'upcoming' ? styles.active : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className={styles.appointmentsList}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appointment => (
            <div key={appointment._id || appointment.appointmentId} className={styles.appointmentCard}>
              <div className={styles.appointmentHeader}>
                <div className={styles.dateTime}>
                  <span className={styles.date}>{appointment.date}</span>
                  <span className={styles.time}>{appointment.time}</span>
                </div>
                <span className={`${styles.status} ${styles[appointment.status]}`}>
                  {appointment.status}
                </span>
              </div>

              <div className={styles.appointmentBody}>
                <div className={styles.appointmentDetails}>
                  <h3 className={styles.doctorName}>{appointment.doctorName}</h3>
                  <p className={styles.specialty}>{appointment.specialization}</p>
                  <p><strong>Hospital:</strong> {appointment.clinicName}</p>
                  <p><strong>Address:</strong> {appointment.clinicAddress}</p>
                  <p><strong>Mode:</strong> {appointment.mode}</p>
                </div>
              </div>

              <div className={styles.appointmentActions}>
                {appointment.status === 'completed' && (
                  <Link
                    to="/medical-records"
                    className={styles.recordsButton}
                  >
                    View Medical Records
                  </Link>
                )}
                {appointment.status === 'upcoming' && (
                  <button 
                    className={styles.cancelButton}
                    onClick={() => handleCancelAppointment(appointment._id)}
                  >
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No appointments found</p>
            <Link to="/book-appointment" className={styles.bookLink}>
              Book your first appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
