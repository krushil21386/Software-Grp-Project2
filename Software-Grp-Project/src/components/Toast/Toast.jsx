import React from 'react';
import styles from './Toast.module.css';

const Toast = ({ notification, onClose }) => {
    const { title, message, type = 'info', icon, priority, id } = notification;
    
    return (
        <div className={`${styles.toast} ${styles[type]} ${priority === 'high' ? styles.highPriority : ''}`}>
            <div className={styles.iconSection}>
                {icon || '🔔'}
            </div>
            <div className={styles.content}>
                <h4 className={styles.title}>{title}</h4>
                <p className={styles.message}>{message}</p>
                <button className={styles.closeButton} onClick={() => onClose(id)}>×</button>
            </div>
            <div className={styles.progressBar} />
        </div>
    );
};

export default Toast;
