import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './EmergencyServices.module.css';
import { hospitals, doctors } from '../utils/mockData';

const EmergencyServices = () => {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const emergencyHospitals = hospitals.slice(0, 3);
  const emergencyDoctors = doctors.filter(d => d.specialty === 'Emergency Medicine' || d.specialty === 'Cardiology');

  const handleEmergencyRequest = async (hospitalId) => {
    if (window.confirm('Call emergency services for immediate assistance? This will request emergency medical care.')) {
      alert('Emergency services have been notified. Please proceed to the emergency room immediately or call 911.');
      // In a real app, this would trigger an API call to emergency services
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.emergencyBanner}>
          <div className={styles.emergencyIcon}>🚨</div>
          <div>
            <h1 className={styles.title}>Emergency Medical Services</h1>
            <p className={styles.subtitle}>Immediate medical assistance available 24/7</p>
          </div>
        </div>
        <div className={styles.emergencyInfo}>
          <p className={styles.emergencyNumber}>Emergency Hotline: <strong>911</strong></p>
          <p className={styles.quickAccess}>Available 24 hours a day, 7 days a week</p>
        </div>
      </div>

      <div className={styles.quickActions}>
        <button 
          className={styles.emergencyButton}
          onClick={() => window.location.href = 'tel:911'}
        >
          📞 Call 911 Now
        </button>
        <Link to="/book-appointment" className={styles.urgentAppointmentButton}>
          ⚡ Book Urgent Appointment
        </Link>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Emergency Hospitals</h2>
        <div className={styles.hospitalsGrid}>
          {emergencyHospitals.map(hospital => (
            <div key={hospital.id} className={styles.hospitalCard}>
              <div className={styles.hospitalHeader}>
                <h3>{hospital.name}</h3>
                <span className={styles.emergencyBadge}>24/7 Emergency</span>
              </div>
              <div className={styles.hospitalInfo}>
                <p><strong>Address:</strong> {hospital.address}</p>
                <p><strong>Phone:</strong> {hospital.phone}</p>
                <p className={styles.trafficInfo}>
                  <strong>Current Traffic:</strong> 
                  <span className={styles.trafficLevel} style={{ color: hospital.traffic < 0.3 ? '#10b981' : hospital.traffic < 0.6 ? '#f59e0b' : '#ef4444' }}>
                    {hospital.traffic < 0.3 ? 'Low' : hospital.traffic < 0.6 ? 'Medium' : 'High'}
                  </span>
                </p>
              </div>
              <div className={styles.hospitalActions}>
                <button 
                  className={styles.requestButton}
                  onClick={() => handleEmergencyRequest(hospital.id)}
                >
                  Request Emergency Service
                </button>
                <Link 
                  to={`/book-appointment?hospitalId=${hospital.id}&urgent=true`}
                  className={styles.urgentBookButton}
                >
                  Book Urgent Appointment
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Available Emergency Doctors</h2>
        <div className={styles.doctorsGrid}>
          {emergencyDoctors.slice(0, 4).map(doctor => (
            <div key={doctor.id} className={styles.doctorCard}>
              <img src={doctor.image} alt={doctor.name} className={styles.doctorImage} />
              <div className={styles.doctorInfo}>
                <h3>{doctor.name}</h3>
                <p className={styles.specialty}>{doctor.specialty}</p>
                <p className={styles.rating}>⭐ {doctor.rating} ({doctor.reviews} reviews)</p>
                <p className={styles.experience}>{doctor.experience}</p>
              </div>
              <Link 
                to={`/book-appointment?doctorId=${doctor.id}&urgent=true`}
                className={styles.bookNowButton}
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.emergencyGuidelines}>
        <h2 className={styles.sectionTitle}>When to Seek Emergency Care</h2>
        <div className={styles.guidelinesGrid}>
          <div className={styles.guidelineCard}>
            <div className={styles.guidelineIcon}>🩺</div>
            <h3>Chest Pain</h3>
            <p>Seek immediate care for chest pain, especially if it radiates to arms, neck, or jaw.</p>
          </div>
          <div className={styles.guidelineCard}>
            <div className={styles.guidelineIcon}>💨</div>
            <h3>Difficulty Breathing</h3>
            <p>Any sudden or severe breathing problems require immediate emergency attention.</p>
          </div>
          <div className={styles.guidelineCard}>
            <div className={styles.guidelineIcon}>🧠</div>
            <h3>Severe Headache</h3>
            <p>Sudden, severe headaches with vision changes or confusion need urgent care.</p>
          </div>
          <div className={styles.guidelineCard}>
            <div className={styles.guidelineIcon}>🩸</div>
            <h3>Uncontrolled Bleeding</h3>
            <p>Severe bleeding that doesn't stop with pressure requires emergency treatment.</p>
          </div>
          <div className={styles.guidelineCard}>
            <div className={styles.guidelineIcon}>🚑</div>
            <h3>Loss of Consciousness</h3>
            <p>Fainting, seizures, or loss of consciousness needs immediate medical evaluation.</p>
          </div>
          <div className={styles.guidelineCard}>
            <div className={styles.guidelineIcon}>🔥</div>
            <h3>Severe Burns</h3>
            <p>Large burns, burns on face/hands, or electrical/chemical burns need urgent care.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyServices;
