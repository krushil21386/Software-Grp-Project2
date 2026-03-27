import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './MedicalRecords.module.css';
import { useAuth } from '../contexts/AuthContext';

const MedicalRecords = () => {
  const { authFetch } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await authFetch(`${backendUrl}/api/appointments/my-appointments`);
        const data = await res.json();
        if (data.success) {
          setRecords(data.completed || []);
        }
      } catch (err) {
        console.error('Failed to fetch medical records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [authFetch]);

  if (loading) return <div className={styles.container} style={{textAlign:'center', padding:'50px'}}>Loading medical records...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Records</h1>
        <p className={styles.subtitle}>Your complete health history (Completed Appointments)</p>
      </div>

      {records.length > 0 ? (
        <div className={styles.recordsList}>
          {records.map((record) => (
            <div key={record._id || record.appointmentId} className={styles.recordCard}>
              <div className={styles.recordHeader}>
                <div>
                  <h2 className={styles.recordDate}>{record.date}</h2>
                  <p className={styles.recordTime}>{record.time}</p>
                </div>
                <span className={styles.statusBadge}>Completed</span>
              </div>

              <div className={styles.recordBody}>
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Doctor Information</h3>
                  <div className={styles.doctorInfo}>
                    <div>
                      <p className={styles.doctorName}>{record.doctorName}</p>
                      <p className={styles.specialty}>{record.specialization}</p>
                      <p className={styles.hospital}>{record.clinicName}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Appointment ID</h3>
                  <p>{record.appointmentId}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>No medical records available</p>
          <p className={styles.emptySubtext}>Your medical records will appear here after completed appointments</p>
          <Link to="/book-appointment" className={styles.bookLink}>
            Book an Appointment
          </Link>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
