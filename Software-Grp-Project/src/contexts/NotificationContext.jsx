import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);

    const addNotification = useCallback((notification) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 6000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const newSocket = io(backendUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('🔌 Connected to Socket.io server');
        });

        // Event: Appointment Status Update
        newSocket.on('appointment_status_update', (data) => {
            console.log('🔔 Received appointment update:', data);
            addNotification({
                title: 'Appointment Update',
                message: data.message,
                type: data.newStatus === 'cancelled' ? 'error' : 'success',
                icon: '📅'
            });
        });

        // Event: Low Stock Alert (Admins only)
        newSocket.on('LOW_STOCK_ALERT', (data) => {
            if (user?.role === 'admin') {
                data.items.forEach(item => {
                    addNotification({
                        title: '⚠️ Low Stock Alert',
                        message: `${item.name} is low on stock (${item.stock} units left). Please restock soon.`,
                        type: 'warning',
                        icon: '📦',
                        priority: 'high'
                    });
                });
            }
        });

        // Event: Analytics Update (Subtle notification for admins/doctors)
        newSocket.on('analytics_update', (data) => {
            if (user?.role === 'admin' || user?.role === 'doctor') {
                addNotification({
                    title: 'System Activity',
                    message: `New activity detected for Dr. ${data.doctorName}. Dashboard updated.`,
                    type: 'info',
                    icon: '📊'
                });
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [addNotification, user?.role]);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
