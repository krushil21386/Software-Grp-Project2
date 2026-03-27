import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { io } from 'socket.io-client';
import styles from './DoctorPerformanceChart.module.css';

const DoctorPerformanceChart = ({ doctorId, doctorName, authFetch }) => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = doctorId 
        ? `${backendUrl}/api/analytics/doctor/id/${doctorId}`
        : `${backendUrl}/api/analytics/doctor/${encodeURIComponent(doctorName)}`;
      
      const res = await authFetch(endpoint);
      const result = await res.json();
      if (result.success) {
        setData(result.data.dailySummary);
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching chart stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Connect to Socket.io for real-time updates
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(backendUrl);

    socket.on('analytics_update', (payload) => {
      // Only refresh if the update belongs to this doctor or is global
      const isMatch = (payload.doctorId && payload.doctorId === doctorId) || 
                      (!payload.doctorId && payload.doctorName === doctorName) ||
                      (!payload.doctorId && !payload.doctorName);
                      
      if (isMatch) {
        console.log('Real-time update received for doctor:', doctorName);
        fetchStats();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [doctorId, doctorName]);

  if (loading) return <div className={styles.loading}>Loading charts...</div>;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>Performance Analytics (Real-Time)</h2>
        <div className={styles.badgeRow}>
           <span className={styles.badge}>Completion Rate: {stats?.completionRate}</span>
           <span className={styles.badge}>Emergencies Handled: {stats?.emergencyCount}</span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartBox}>
          <h3>Daily Appointments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="totalAppointments" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emergencies" fill="#ef4444" name="Urgent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartBox}>
          <h3>Efficiency Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 6 }} 
                activeDot={{ r: 8 }} 
                name="Success Rate"
              />
              <Line 
                type="monotone" 
                dataKey="cancelled" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                name="Cancellations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DoctorPerformanceChart;
