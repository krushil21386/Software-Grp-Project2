import React from 'react';
import styles from './Statistics.module.css';

const Statistics = () => {
  return (
    <section className={styles.statistics}>
      <div className={styles.statCard}>
        <div className={styles.statNumber}>10k+</div>
        <div className={styles.statLabel}>Patients Healed</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statNumber}>50+</div>
        <div className={styles.statLabel}>Top Specialists</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statNumber}>24/7</div>
        <div className={styles.statLabel}>Virtual Support</div>
      </div>
    </section>
  );
};

export default Statistics;
