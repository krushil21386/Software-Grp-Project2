import React from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './DoctorProfile.module.css';
import { doctors, hospitals } from '../utils/mockData';

const DoctorProfile = () => {
  const { id } = useParams();
  const doctor = doctors.find(d => d.id === parseInt(id));
  const hospital = doctor ? hospitals.find(h => h.id === doctor.hospitalId) : null;

  if (!doctor || !hospital) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>Doctor not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/hospitals" className={styles.backLink}>
          ← Back to Hospitals
        </Link>
      </div>

      <div className={styles.profileSection}>
        <div className={styles.profileCard}>
          <div className={styles.profileImage}>
            <img src={doctor.image} alt={doctor.name} />
          </div>

          <div className={styles.profileInfo}>
            <h1 className={styles.doctorName}>{doctor.name}</h1>
            <p className={styles.specialty}>{doctor.specialty}</p>
            <div className={styles.rating}>
              <span className={styles.stars}>⭐ {doctor.rating}</span>
              <span className={styles.reviews}>({doctor.reviews} reviews)</span>
            </div>

            <div className={styles.hospitalInfo}>
              <h3>🏥 {hospital.name}</h3>
              <p>{hospital.address}</p>
              <p>{hospital.phone}</p>
            </div>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.detailCard}>
            <h3>About</h3>
            <p className={styles.bio}>{doctor.bio}</p>
          </div>

          <div className={styles.detailCard}>
            <h3>Education</h3>
            <p>{doctor.education}</p>
          </div>

          <div className={styles.detailCard}>
            <h3>Experience</h3>
            <p>{doctor.experience}</p>
          </div>

          <div className={styles.detailCard}>
            <h3>Languages</h3>
            <div className={styles.languages}>
              {doctor.languages.map((lang, idx) => (
                <span key={idx} className={styles.languageTag}>{lang}</span>
              ))}
            </div>
          </div>

          <div className={styles.detailCard}>
            <h3>Availability</h3>
            <p><strong>Days:</strong> {doctor.availability.days.join(', ')}</p>
            <p><strong>Hours:</strong> {doctor.availability.hours}</p>
          </div>

          <div className={styles.detailCard}>
            <h3>Consultation Fee</h3>
            <p className={styles.fee}>${doctor.consultationFee}</p>
          </div>
        </div>

        <div className={styles.actionSection}>
          <Link
            to={`/book-appointment?doctorId=${doctor.id}`}
            className={styles.bookButton}
          >
            Book Appointment
          </Link>
          <Link
            to="/doctor-locator"
            className={styles.viewMapButton}
          >
            View on Map
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
