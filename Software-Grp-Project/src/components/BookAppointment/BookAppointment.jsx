import React from 'react';
import { Link } from 'react-router-dom';
import styles from './BookAppointment.module.css';

const BookAppointment = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Ready to prioritize your health?</h2>
        <p className={styles.description}>
          Book an appointment online easily. Choose your specialist, select a time, and get confirmation instantly.
        </p>
        <Link to="/book-appointment" className={styles.bookButton}>
          <svg className={styles.calendarIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Book Appointment
        </Link>
      </div>
    </section>
  );
};

export default BookAppointment;
