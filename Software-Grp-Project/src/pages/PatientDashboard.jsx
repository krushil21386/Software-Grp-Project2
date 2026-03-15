import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PatientDashboard.module.css';
import { appointments as initialAppointments, doctors, hospitals } from '../utils/mockData';

const PatientDashboard = () => {
  // Simulate logged-in patient
  const currentPatientId = 1;
  const [appointments, setAppointments] = useState(initialAppointments);
  const patientAppointments = appointments.filter(a => a.patientId === currentPatientId);
  
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const upcomingAppointments = patientAppointments.filter(apt => apt.status === 'upcoming');
  const completedAppointments = patientAppointments.filter(apt => apt.status === 'completed');

  const getAppointmentDoctor = (doctorId) => {
    return doctors.find(d => d.id === doctorId);
  };

  const getAppointmentHospital = (hospitalId) => {
    return hospitals.find(h => h.id === hospitalId);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        // Try to call backend API
        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Update local state
          setAppointments(prevAppointments =>
            prevAppointments.map(apt =>
              apt.id === appointmentId
                ? { ...apt, status: 'cancelled' }
                : apt
            )
          );
        } else {
          // If API fails, update local state anyway (for demo purposes)
          setAppointments(prevAppointments =>
            prevAppointments.map(apt =>
              apt.id === appointmentId
                ? { ...apt, status: 'cancelled' }
                : apt
            )
          );
        }
      } catch (error) {
        console.error('Error canceling appointment:', error);
        // Update local state even if API call fails (for demo purposes)
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === appointmentId
              ? { ...apt, status: 'cancelled' }
              : apt
          )
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Dashboard</h1>
          <p className={styles.subtitle}>Manage your appointments and health records</p>
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
            <p className={styles.statValue}>2</p>
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
      </div>

      <div className={styles.appointmentsList}>
        {selectedTab === 'upcoming' && (
          <>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => {
                const doctor = getAppointmentDoctor(appointment.doctorId);
                const hospital = getAppointmentHospital(appointment.hospitalId);
                return (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.time}>{appointment.time}</span>
                      <span className={styles.date}>{appointment.date}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h3 className={styles.doctorName}>{doctor?.name || 'Doctor'}</h3>
                      <p className={styles.specialty}>{doctor?.specialty}</p>
                      <p className={styles.reason}>Reason: {appointment.reason}</p>
                      <p className={styles.hospital}>{hospital?.name}</p>
                    </div>
                    {doctor && (
                      <div className={styles.doctorImage}>
                        <img src={doctor.image} alt={doctor.name} />
                      </div>
                    )}
                    <div className={styles.appointmentActions}>
                      <Link
                        to={`/doctor/${appointment.doctorId}`}
                        className={styles.viewButton}
                      >
                        View Doctor
                      </Link>
                      <button 
                        className={styles.rescheduleButton}
                        onClick={() => {
                          if (window.confirm('Reschedule this appointment?')) {
                            // Navigate to book appointment page with doctor pre-selected
                            window.location.href = `/book-appointment?doctorId=${appointment.doctorId}&reschedule=${appointment.id}`;
                          }
                        }}
                      >
                        Reschedule
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })
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
              completedAppointments.map(appointment => {
                const doctor = getAppointmentDoctor(appointment.doctorId);
                const hospital = getAppointmentHospital(appointment.hospitalId);
                return (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.time}>{appointment.time}</span>
                      <span className={styles.date}>{appointment.date}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h3 className={styles.doctorName}>{doctor?.name || 'Doctor'}</h3>
                      <p className={styles.specialty}>{doctor?.specialty}</p>
                      <p className={styles.reason}>Reason: {appointment.reason}</p>
                      <p className={styles.hospital}>{hospital?.name}</p>
                    </div>
                    {doctor && (
                      <div className={styles.doctorImage}>
                        <img src={doctor.image} alt={doctor.name} />
                      </div>
                    )}
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
                );
              })
            ) : (
              <div className={styles.emptyState}>No completed appointments</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
