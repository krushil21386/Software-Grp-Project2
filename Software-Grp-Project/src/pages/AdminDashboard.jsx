import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './AdminDashboard.module.css';
import { doctors as initialDoctors, hospitals, appointments as initialAppointments } from '../utils/mockData';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [doctors, setDoctors] = useState(initialDoctors);
  const [appointments] = useState(initialAppointments);
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'patient', status: 'active', createdAt: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'patient', status: 'active', createdAt: '2024-02-20' },
    { id: 3, name: 'Dr. Sarah Johnson', email: 'sarah@hospital.com', role: 'doctor', status: 'active', createdAt: '2024-01-10' },
  ]);

  // Statistics
  const totalUsers = users.length;
  const totalDoctors = doctors.length;
  const totalAppointments = appointments.length;
  const activeAppointments = appointments.filter(a => a.status === 'upcoming').length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleDeleteDoctor = (doctorId) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
    }
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u
      )
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Manage users, doctors, and monitor system usage</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <h3>Total Users</h3>
            <p className={styles.statValue}>{totalUsers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👨‍⚕️</div>
          <div className={styles.statInfo}>
            <h3>Total Doctors</h3>
            <p className={styles.statValue}>{totalDoctors}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Total Appointments</h3>
            <p className={styles.statValue}>{totalAppointments}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed</h3>
            <p className={styles.statValue}>{completedAppointments}</p>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedTab === 'overview' ? styles.active : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'users' ? styles.active : ''}`}
          onClick={() => setSelectedTab('users')}
        >
          Manage Users
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'doctors' ? styles.active : ''}`}
          onClick={() => setSelectedTab('doctors')}
        >
          Manage Doctors
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'appointments' ? styles.active : ''}`}
          onClick={() => setSelectedTab('appointments')}
        >
          System Monitoring
        </button>
      </div>

      <div className={styles.content}>
        {selectedTab === 'overview' && (
          <div className={styles.overviewSection}>
            <h2 className={styles.sectionTitle}>System Overview</h2>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <h3>System Health</h3>
                <div className={styles.healthIndicator}>
                  <span className={styles.healthStatus}>✓ Operational</span>
                  <div className={styles.healthBar}>
                    <div className={styles.healthFill} style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>
              <div className={styles.overviewCard}>
                <h3>Recent Activity</h3>
                <ul className={styles.activityList}>
                  <li>New appointment booked</li>
                  <li>User registration completed</li>
                  <li>Doctor profile updated</li>
                  <li>Emergency service requested</li>
                </ul>
              </div>
              <div className={styles.overviewCard}>
                <h3>Appointment Status</h3>
                <div className={styles.statusBreakdown}>
                  <div className={styles.statusItem}>
                    <span>Upcoming: {activeAppointments}</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span>Completed: {completedAppointments}</span>
                  </div>
                  <div className={styles.statusItem}>
                    <span>Cancelled: {appointments.filter(a => a.status === 'cancelled').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className={styles.usersSection}>
            <h2 className={styles.sectionTitle}>User Management</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>{user.createdAt}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.toggleButton}
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'doctors' && (
          <div className={styles.doctorsSection}>
            <h2 className={styles.sectionTitle}>Doctor Management</h2>
            <div className={styles.doctorsGrid}>
              {doctors.map(doctor => (
                <div key={doctor.id} className={styles.doctorCard}>
                  <img src={doctor.image} alt={doctor.name} className={styles.doctorImage} />
                  <div className={styles.doctorInfo}>
                    <h3>{doctor.name}</h3>
                    <p className={styles.specialty}>{doctor.specialty}</p>
                    <p className={styles.hospital}>Hospital ID: {doctor.hospitalId}</p>
                    <p className={styles.rating}>⭐ {doctor.rating} ({doctor.reviews} reviews)</p>
                  </div>
                  <div className={styles.doctorActions}>
                    <button className={styles.editButton}>Edit</button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteDoctor(doctor.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'appointments' && (
          <div className={styles.monitoringSection}>
            <h2 className={styles.sectionTitle}>System Monitoring</h2>
            <div className={styles.monitoringGrid}>
              <div className={styles.monitorCard}>
                <h3>Total Appointments Today</h3>
                <p className={styles.monitorValue}>
                  {appointments.filter(a => {
                    const today = new Date().toISOString().split('T')[0];
                    return a.date === today;
                  }).length}
                </p>
              </div>
              <div className={styles.monitorCard}>
                <h3>Upcoming Appointments</h3>
                <p className={styles.monitorValue}>{activeAppointments}</p>
              </div>
              <div className={styles.monitorCard}>
                <h3>Completed This Week</h3>
                <p className={styles.monitorValue}>{completedAppointments}</p>
              </div>
              <div className={styles.monitorCard}>
                <h3>System Uptime</h3>
                <p className={styles.monitorValue}>99.9%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
