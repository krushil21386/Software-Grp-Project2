import React from 'react';
import styles from './ComprehensiveCare.module.css';

const ComprehensiveCare = () => {
  const services = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
      ),
      iconColor: 'var(--color-crimson)',
      title: 'Primary Care',
      description: 'Routine check-ups, preventive care, and comprehensive health management for the whole family.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor"/>
        </svg>
      ),
      iconColor: 'var(--color-crimson)',
      title: 'Cardiology',
      description: 'Expert heart health specialists using advanced diagnostics to keep your heart healthy.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 10.5V7C17 6.45 16.55 6 16 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.55 18 17 17.55 17 17V13.5L21 17.5V6.5L17 10.5Z" fill="currentColor"/>
        </svg>
      ),
      iconColor: 'var(--color-crimson)',
      title: 'Telehealth',
      description: 'Virtual consultations from the comfort of your home with our board-certified physicians.'
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V10H17V12ZM15 16H7V14H15V16ZM17 8H7V6H17V8Z" fill="currentColor"/>
        </svg>
      ),
      iconColor: 'var(--color-crimson)',
      title: 'Lab Services',
      description: 'Fast and accurate diagnostic results to help guide your treatment and recovery.'
    }
  ];

  return (
    <section id="services" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Comprehensive Care Designed Around You</h2>
          <p className={styles.description}>
            We combine compassionate care with the latest technology to ensure you get the best treatment possible.
          </p>
        </div>
        <a href="#services" className={styles.viewAllLink}>
          View all services →
        </a>
      </div>
      <div className={styles.cardsGrid}>
        {services.map((service, index) => (
          <div key={index} className={styles.serviceCard}>
            <div className={styles.iconContainer} style={{ backgroundColor: `${service.iconColor}20` }}>
              <div className={styles.icon} style={{ color: service.iconColor }}>{service.icon}</div>
            </div>
            <h3 className={styles.cardTitle}>{service.title}</h3>
            <p className={styles.cardDescription}>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ComprehensiveCare;
