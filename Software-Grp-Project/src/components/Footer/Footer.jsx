import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.column}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>+</div>
            <span>MediCare Plus</span>
          </div>
          <p className={styles.description}>
            Providing exceptional healthcare services with cutting-edge technology and compassionate care for patients and families.
          </p>
          <div className={styles.socialLinks}>
            <span>FB</span>
            <span>TW</span>
            <span>IG</span>
            <span>LI</span>
          </div>
        </div>
        
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Services</h3>
          <ul className={styles.linkList}>
            <li><a href="#primary-care">Primary Care</a></li>
            <li><a href="#cardiology">Cardiology</a></li>
            <li><a href="#urgent-care">Urgent Care</a></li>
            <li><a href="#telehealth">Telehealth</a></li>
            <li><a href="#mental-health">Mental Health</a></li>
          </ul>
        </div>
        
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Patient Center</h3>
          <ul className={styles.linkList}>
            <li><a href="#portal">Patient Portal</a></li>
            <li><a href="#pay-bill">Pay Bill Online</a></li>
            <li><a href="#insurance">Insurance Accepted</a></li>
            <li><a href="#records">Medical Records</a></li>
          </ul>
          
          <h3 className={styles.columnTitle} style={{ marginTop: '32px' }}>Stay Updated</h3>
          <p className={styles.newsletterDescription}>
            Subscribe to our newsletter for health tips and clinic news.
          </p>
          <div className={styles.newsletterForm}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className={styles.emailInput}
            />
            <button className={styles.subscribeButton}>Subscribe</button>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <div className={styles.copyright}>
          ©2023 MediCare Plus. All rights reserved.
        </div>
        <div className={styles.legalLinks}>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
