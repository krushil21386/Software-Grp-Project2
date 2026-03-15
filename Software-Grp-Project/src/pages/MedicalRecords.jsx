import React from 'react';
import { Link } from 'react-router-dom';
import styles from './MedicalRecords.module.css';
import { appointments, doctors, hospitals } from '../utils/mockData';

const MedicalRecords = () => {
  // Filter completed appointments as medical records
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  const getAppointmentDoctor = (doctorId) => {
    return doctors.find(d => d.id === doctorId);
  };

  const getAppointmentHospital = (hospitalId) => {
    return hospitals.find(h => h.id === hospitalId);
  };

  // Mock medical records data
  const medicalRecords = completedAppointments.map(appointment => ({
    ...appointment,
    diagnosis: 'Common cold',
    prescription: [
      { medicine: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
      { medicine: 'Vitamin C', dosage: '1000mg', frequency: 'Once daily', duration: '7 days' },
    ],
    notes: 'Patient presented with flu symptoms. Recommended rest and hydration.',
    followUp: appointment.date === '2024-12-18' ? '2024-12-25' : null,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Medical Records</h1>
        <p className={styles.subtitle}>Your complete health history</p>
      </div>

      {medicalRecords.length > 0 ? (
        <div className={styles.recordsList}>
          {medicalRecords.map((record) => {
            const doctor = getAppointmentDoctor(record.doctorId);
            const hospital = getAppointmentHospital(record.hospitalId);

            return (
              <div key={record.id} className={styles.recordCard}>
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
                      {doctor && (
                        <>
                          <img src={doctor.image} alt={doctor.name} className={styles.doctorImage} />
                          <div>
                            <p className={styles.doctorName}>{doctor.name}</p>
                            <p className={styles.specialty}>{doctor.specialty}</p>
                            <p className={styles.hospital}>{hospital?.name}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Visit Reason</h3>
                    <p>{record.reason}</p>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Diagnosis</h3>
                    <p className={styles.diagnosis}>{record.diagnosis}</p>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Prescription</h3>
                    <div className={styles.prescriptionList}>
                      {record.prescription.map((med, idx) => (
                        <div key={idx} className={styles.prescriptionItem}>
                          <div className={styles.medicineName}>{med.medicine}</div>
                          <div className={styles.medicineDetails}>
                            <span>Dosage: {med.dosage}</span>
                            <span>Frequency: {med.frequency}</span>
                            <span>Duration: {med.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Doctor's Notes</h3>
                    <p className={styles.notes}>{record.notes}</p>
                  </div>

                  {record.followUp && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Follow-up Appointment</h3>
                      <p>Recommended follow-up: <strong>{record.followUp}</strong></p>
                    </div>
                  )}
                </div>

                <div className={styles.recordActions}>
                  <Link
                    to={`/doctor/${record.doctorId}`}
                    className={styles.viewDoctorButton}
                  >
                    View Doctor Profile
                  </Link>
                  <button className={styles.downloadButton}>
                    Download Record
                  </button>
                </div>
              </div>
            );
          })}
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
