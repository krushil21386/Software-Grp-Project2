import React from 'react';
import styles from './TopSpecialists.module.css';

const TopSpecialists = () => {
  const specialists = [
    {
      name: 'Dr. Emily Chen',
      specialty: 'Neurologist',
      specialtyColor: 'var(--color-crimson)',
      description: 'Expert in neurological disorders with over 15 years of experience in treating complex brain conditions.'
    },
    {
      name: 'Dr. James Wilson',
      specialty: 'Cardiologist',
      specialtyColor: 'var(--color-crimson)',
      description: 'Leading heart specialist focused on preventive cardiology and advanced cardiac interventions.'
    },
    {
      name: 'Dr. Sarah Thompson',
      specialty: 'Pediatrician',
      specialtyColor: 'var(--color-crimson)',
      description: 'Dedicated to children\'s health with a compassionate approach to pediatric care and development.'
    }
  ];

  return (
    <section id="find-doctor" className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Meet Our Top Specialists</h2>
        <p className={styles.description}>
          Our team of board-certified physicians is dedicated to providing you with personalized and effective care.
        </p>
      </div>
      <div className={styles.cardsGrid}>
        {specialists.map((specialist, index) => (
          <div key={index} className={styles.specialistCard}>
            <div className={styles.profileImage}>
              <div className={styles.imagePlaceholder}>
                {specialist.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <h3 className={styles.name}>{specialist.name}</h3>
            <div className={styles.specialty} style={{ color: specialist.specialtyColor }}>
              {specialist.specialty}
            </div>
            <p className={styles.cardDescription}>{specialist.description}</p>
            <button className={styles.viewProfileButton}>View Profile</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopSpecialists;
