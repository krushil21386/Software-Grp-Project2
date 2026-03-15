import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Hospitals.module.css';
import { hospitals, departments, doctors } from '../utils/mockData';
import { getTrafficLevel } from '../utils/mapUtils';

const Hospitals = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);

  const filteredHospitals = selectedDepartment
    ? hospitals.filter(hospital =>
        hospital.departments.includes(parseInt(selectedDepartment))
      )
    : hospitals;

  const getHospitalDoctors = (hospitalId) => {
    return doctors.filter(doctor => doctor.hospitalId === hospitalId);
  };

  const getHospitalDepartments = (hospital) => {
    return departments.filter(dept => hospital.departments.includes(dept.id));
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Hospitals & Departments</h1>
          <p className={styles.subtitle}>
            Browse our network of hospitals and specialized departments
          </p>
        </div>

        <div className={styles.filterSection}>
          <label className={styles.filterLabel}>Filter by Department:</label>
          <select
            className={styles.select}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.icon} {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.hospitalsGrid}>
        {filteredHospitals.map((hospital) => {
          const trafficInfo = getTrafficLevel(hospital.traffic);
          const hospitalDoctors = getHospitalDoctors(hospital.id);
          const hospitalDepartments = getHospitalDepartments(hospital);

          return (
            <div key={hospital.id} className={styles.hospitalCard}>
              <div className={styles.hospitalImage}>
                <img src={hospital.image} alt={hospital.name} />
                <div className={styles.trafficBadge} style={{ backgroundColor: trafficInfo.color }}>
                  Traffic: {trafficInfo.level}
                </div>
              </div>

              <div className={styles.hospitalContent}>
                <h2 className={styles.hospitalName}>{hospital.name}</h2>
                <div className={styles.hospitalDetails}>
                  <p className={styles.address}>📍 {hospital.address}</p>
                  <p className={styles.phone}>📞 {hospital.phone}</p>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Doctors:</span>
                    <span className={styles.statValue}>{hospitalDoctors.length}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Departments:</span>
                    <span className={styles.statValue}>{hospitalDepartments.length}</span>
                  </div>
                </div>

                <div className={styles.departments}>
                  <h3 className={styles.departmentsTitle}>Available Departments:</h3>
                  <div className={styles.departmentTags}>
                    {hospitalDepartments.map((dept) => (
                      <span key={dept.id} className={styles.departmentTag}>
                        {dept.icon} {dept.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.doctorsPreview}>
                  <h3 className={styles.doctorsTitle}>Top Doctors:</h3>
                  <div className={styles.doctorsList}>
                    {hospitalDoctors.slice(0, 3).map((doctor) => (
                      <Link
                        key={doctor.id}
                        to={`/doctor/${doctor.id}`}
                        className={styles.doctorLink}
                      >
                        <img src={doctor.image} alt={doctor.name} className={styles.doctorImage} />
                        <div className={styles.doctorInfo}>
                          <p className={styles.doctorName}>{doctor.name}</p>
                          <p className={styles.doctorSpecialty}>{doctor.specialty}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {hospitalDoctors.length > 3 && (
                    <Link
                      to={`/doctor-locator?hospital=${hospital.id}`}
                      className={styles.viewAllLink}
                    >
                      View all {hospitalDoctors.length} doctors →
                    </Link>
                  )}
                </div>

                <div className={styles.actionButtons}>
                  <Link
                    to={`/doctor-locator?hospital=${hospital.id}`}
                    className={styles.viewDoctorsButton}
                  >
                    View Doctors
                  </Link>
                  <Link
                    to={`/book-appointment?hospital=${hospital.id}`}
                    className={styles.bookButton}
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default Hospitals;
