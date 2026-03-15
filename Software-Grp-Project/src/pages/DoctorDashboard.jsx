import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './DoctorDashboard.module.css';
import { appointments as initialAppointments, doctors, hospitals } from '../utils/mockData';

const DoctorDashboard = () => {
  // Simulate logged-in doctor
  const currentDoctorId = 1;
  const currentDoctor = doctors.find(d => d.id === currentDoctorId);
  const [appointments, setAppointments] = useState(initialAppointments);
  const doctorAppointments = appointments.filter(a => a.doctorId === currentDoctorId);
  
  const [selectedTab, setSelectedTab] = useState('today');

  const todayAppointments = doctorAppointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.date === today && apt.status === 'upcoming';
  });

  const upcomingAppointments = doctorAppointments.filter(apt => apt.status === 'upcoming' || apt.status === 'pending');
  const pendingAppointments = doctorAppointments.filter(apt => apt.status === 'pending');
  const completedAppointments = doctorAppointments.filter(apt => apt.status === 'completed');
  const [availabilitySettings, setAvailabilitySettings] = useState({
    monday: { start: '9:00 AM', end: '5:00 PM', available: true },
    tuesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    wednesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    thursday: { start: '9:00 AM', end: '5:00 PM', available: true },
    friday: { start: '9:00 AM', end: '5:00 PM', available: true },
    saturday: { start: '10:00 AM', end: '2:00 PM', available: false },
    sunday: { start: '10:00 AM', end: '2:00 PM', available: false },
  });

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

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/accept`, {
        method: 'PUT',
      });

      if (response.ok) {
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === appointmentId
              ? { ...apt, status: 'upcoming' }
              : apt
          )
        );
      } else {
        // Update local state anyway (for demo purposes)
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === appointmentId
              ? { ...apt, status: 'upcoming' }
              : apt
          )
        );
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      // Update local state even if API call fails (for demo purposes)
      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: 'upcoming' }
            : apt
        )
      );
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to reject this appointment?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/reject`, {
          method: 'PUT',
        });

        if (response.ok) {
          setAppointments(prevAppointments =>
            prevAppointments.map(apt =>
              apt.id === appointmentId
                ? { ...apt, status: 'cancelled' }
                : apt
            )
          );
        } else {
          // Update local state anyway (for demo purposes)
          setAppointments(prevAppointments =>
            prevAppointments.map(apt =>
              apt.id === appointmentId
                ? { ...apt, status: 'cancelled' }
                : apt
            )
          );
        }
      } catch (error) {
        console.error('Error rejecting appointment:', error);
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

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/complete`, {
        method: 'PUT',
      });

      if (response.ok) {
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === appointmentId
              ? { ...apt, status: 'completed' }
              : apt
          )
        );
      } else {
        // Update local state anyway (for demo purposes)
        setAppointments(prevAppointments =>
          prevAppointments.map(apt =>
            apt.id === appointmentId
              ? { ...apt, status: 'completed' }
              : apt
          )
        );
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      // Update local state even if API call fails (for demo purposes)
      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === appointmentId
            ? { ...apt, status: 'completed' }
            : apt
        )
      );
    }
  };

  if (!currentDoctor) {
    return <div className={styles.container}>Doctor not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.profileHeader}>
          <img src={currentDoctor.image} alt={currentDoctor.name} className={styles.profileImage} />
          <div>
            <h1 className={styles.title}>Welcome, {currentDoctor.name}</h1>
            <p className={styles.subtitle}>{currentDoctor.specialty} • {currentDoctor.hospitalId && getAppointmentHospital(currentDoctor.hospitalId)?.name}</p>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Today's Appointments</h3>
            <p className={styles.statValue}>{todayAppointments.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <h3>Pending</h3>
            <p className={styles.statValue}>{pendingAppointments.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏰</div>
          <div className={styles.statInfo}>
            <h3>Upcoming</h3>
            <p className={styles.statValue}>{upcomingAppointments.filter(a => a.status === 'upcoming').length}</p>
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
            <p className={styles.statValue}>{currentDoctor.rating}</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link to="/doctor-availability" className={styles.actionCard}>
          <div className={styles.actionIcon}>📊</div>
          <h3>Availability Heatmap</h3>
          <p>View and manage your schedule</p>
        </Link>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedTab === 'today' ? styles.active : ''}`}
          onClick={() => setSelectedTab('today')}
        >
          Today
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'pending' ? styles.active : ''}`}
          onClick={() => setSelectedTab('pending')}
        >
          Pending {pendingAppointments.length > 0 && `(${pendingAppointments.length})`}
        </button>
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
          className={`${styles.tab} ${selectedTab === 'availability' ? styles.active : ''}`}
          onClick={() => setSelectedTab('availability')}
        >
          Set Availability
        </button>
      </div>

      <div className={styles.appointmentsList}>
        {selectedTab === 'today' && (
          <>
            {todayAppointments.length > 0 ? (
              todayAppointments.map(appointment => {
                const hospital = getAppointmentHospital(appointment.hospitalId);
                return (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.time}>{appointment.time}</span>
                      <span className={styles.date}>{appointment.date}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h3 className={styles.patientName}>{appointment.patientName}</h3>
                      <p className={styles.reason}>Reason: {appointment.reason}</p>
                      <p className={styles.hospital}>{hospital?.name}</p>
                    </div>
                    <div className={styles.appointmentActions}>
                      <button className={styles.actionButton}>View Details</button>
                      <button 
                        className={styles.completeButton}
                        onClick={() => handleCompleteAppointment(appointment.id)}
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>No appointments for today</div>
            )}
          </>
        )}

        {selectedTab === 'upcoming' && (
          <>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => {
                const hospital = getAppointmentHospital(appointment.hospitalId);
                return (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.time}>{appointment.time}</span>
                      <span className={styles.date}>{appointment.date}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h3 className={styles.patientName}>{appointment.patientName}</h3>
                      <p className={styles.reason}>Reason: {appointment.reason}</p>
                      <p className={styles.hospital}>{hospital?.name}</p>
                    </div>
                    <div className={styles.appointmentActions}>
                      <button className={styles.actionButton}>View Details</button>
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
              <div className={styles.emptyState}>No upcoming appointments</div>
            )}
          </>
        )}

        {selectedTab === 'pending' && (
          <>
            {pendingAppointments.length > 0 ? (
              pendingAppointments.map(appointment => {
                const hospital = getAppointmentHospital(appointment.hospitalId);
                return (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.time}>{appointment.time}</span>
                      <span className={styles.date}>{appointment.date}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h3 className={styles.patientName}>{appointment.patientName}</h3>
                      <p className={styles.reason}>Reason: {appointment.reason}</p>
                      <p className={styles.hospital}>{hospital?.name}</p>
                    </div>
                    <div className={styles.appointmentActions}>
                      <button 
                        className={styles.acceptButton}
                        onClick={() => handleAcceptAppointment(appointment.id)}
                      >
                        Accept
                      </button>
                      <button 
                        className={styles.rejectButton}
                        onClick={() => handleRejectAppointment(appointment.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>No pending appointments</div>
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {completedAppointments.length > 0 ? (
              completedAppointments.map(appointment => {
                const hospital = getAppointmentHospital(appointment.hospitalId);
                return (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      <span className={styles.time}>{appointment.time}</span>
                      <span className={styles.date}>{appointment.date}</span>
                    </div>
                    <div className={styles.appointmentDetails}>
                      <h3 className={styles.patientName}>{appointment.patientName}</h3>
                      <p className={styles.reason}>Reason: {appointment.reason}</p>
                      <p className={styles.hospital}>{hospital?.name}</p>
                    </div>
                    <div className={styles.appointmentActions}>
                      <button className={styles.actionButton}>View Records</button>
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

        {selectedTab === 'availability' && (
          <div className={styles.availabilitySection}>
            <h2 className={styles.sectionTitle}>Set Your Availability</h2>
            <div className={styles.availabilityGrid}>
              {Object.entries(availabilitySettings).map(([day, settings]) => (
                <div key={day} className={styles.availabilityCard}>
                  <div className={styles.availabilityHeader}>
                    <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={settings.available}
                        onChange={(e) => setAvailabilitySettings(prev => ({
                          ...prev,
                          [day]: { ...prev[day], available: e.target.checked }
                        }))}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  {settings.available && (
                    <div className={styles.timeInputs}>
                      <div className={styles.timeGroup}>
                        <label>Start</label>
                        <input
                          type="time"
                          value={settings.start}
                          onChange={(e) => setAvailabilitySettings(prev => ({
                            ...prev,
                            [day]: { ...prev[day], start: e.target.value }
                          }))}
                        />
                      </div>
                      <div className={styles.timeGroup}>
                        <label>End</label>
                        <input
                          type="time"
                          value={settings.end}
                          onChange={(e) => setAvailabilitySettings(prev => ({
                            ...prev,
                            [day]: { ...prev[day], end: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button 
              className={styles.saveButton}
              onClick={() => {
                alert('Availability settings saved successfully!');
              }}
            >
              Save Availability Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
