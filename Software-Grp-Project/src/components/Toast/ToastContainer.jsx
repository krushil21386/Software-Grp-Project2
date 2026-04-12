import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import Toast from './Toast';
import styles from './Toast.module.css';

const ToastContainer = () => {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div className={styles.container}>
            {notifications.map(notification => (
                <Toast 
                    key={notification.id} 
                    notification={notification} 
                    onClose={removeNotification} 
                />
            ))}
        </div>
    );
};

export default ToastContainer;
