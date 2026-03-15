import React from 'react';
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.leftContent}>
          <div className={styles.featureTag}>NEW TELEHEALTH FEATURES</div>
          <h1 className={styles.title}>
            Modern Healthcare,<br />
            <span className={styles.titleAccent}>Reimagined for You</span>
          </h1>
          <p className={styles.description}>
            Experience the future of medicine with our patient-first approach. From AI-driven diagnostics to seamless virtual consultations, your health is our innovation.
          </p>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryButton}>Schedule a Visit</button>
            <button className={styles.secondaryButton}>Learn More</button>
          </div>
        </div>
        <div className={styles.rightContent}>
          <div className={styles.imageContainer}>
            <img 
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80" 
              alt="Medical professional with tablet"
              className={styles.heroImage}
            />
            <div className={styles.overlayCard}>
              <div className={styles.videoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 10L18.5 7.5V16.5L15 14V10Z" fill="white"/>
                  <rect x="3" y="5" width="12" height="14" rx="2" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.doctorName}>Dr. Sarah Johnson</div>
                <div className={styles.availability}>Available for Telehealth now</div>
              </div>
              <div className={styles.statusDot}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
