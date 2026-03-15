import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Appointments.module.css';
import { appointments as initialAppointments, doctors, hospitals } from '../utils/mockData';

const Appointments = () => {
  const [filter, setFilter] = useState('all');
  const [appointments, setAppointments] = useState(initialAppointments);
  const allAppointments = appointments;

  const filteredAppointments = filter === 'all'
    ? allAppointments
    : allAppointments.filter(apt => apt.status === filter);

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
          filteredAppointments.map(appointment => {
            const doctor = getAppointmentDoctor(appointment.doctorId);
            const hospital = getAppointmentHospital(appointment.hospitalId);
            
            return (
              <div key={appointment.id} className={styles.appointmentCard}>
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
                  <div className={styles.doctorInfo}>
                    {doctor && (
                      <>
                        <img src={doctor.image} alt={doctor.name} className={styles.doctorImage} />
                        <div>
                          <h3 className={styles.doctorName}>{doctor.name}</h3>
                          <p className={styles.specialty}>{doctor.specialty}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className={styles.appointmentDetails}>
                    <p><strong>Hospital:</strong> {hospital?.name}</p>
                    <p><strong>Reason:</strong> {appointment.reason}</p>
                    <p><strong>Patient:</strong> {appointment.patientName}</p>
                  </div>
                </div>

                <div className={styles.appointmentActions}>
                  {doctor && (
                    <Link
                      to={`/doctor/${doctor.id}`}
                      className={styles.viewButton}
                    >
                      View Doctor Profile
                    </Link>
                  )}
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
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            );
          })
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
