import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './DoctorAvailability.module.css';
import { appointments as initialAppointments } from '../utils/mockData';

const DoctorAvailability = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  // Availability settings
  const [availability, setAvailability] = useState({
    monday: { start: '9:00 AM', end: '5:00 PM', available: true },
    tuesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    wednesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    thursday: { start: '9:00 AM', end: '5:00 PM', available: true },
    friday: { start: '9:00 AM', end: '5:00 PM', available: true },
    saturday: { start: '10:00 AM', end: '2:00 PM', available: false },
    sunday: { start: '10:00 AM', end: '2:00 PM', available: false },
  });

  const currentDoctorId = user?.id || 1;
  const doctorAppointments = appointments.filter(a => a.doctorId === currentDoctorId);

  // Generate next 7 days
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + (selectedWeek * 7) - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return doctorAppointments.filter(apt => apt.date === dateStr && apt.status === 'upcoming');
  };

  // Get availability for a specific day
  const getDayAvailability = (date) => {
    const dayName = dayNames[date.getDay()].toLowerCase();
    return availability[dayName];
  };

  // Calculate heatmap value (0-100) based on booked slots
  const getHeatmapValue = (date) => {
    const dayName = dayNames[date.getDay()].toLowerCase();
    const dayAvailability = availability[dayName];
    if (!dayAvailability.available) return 0;
    
    const appointmentsForDate = getAppointmentsForDate(date);
    // Assume 30-minute slots, 8-hour day = 16 slots
    const totalSlots = 16;
    const bookedSlots = appointmentsForDate.length;
    return Math.min(100, (bookedSlots / totalSlots) * 100);
  };

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const toggleDayAvailability = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available
      }
    }));
  };

  const getHeatmapColor = (value) => {
    if (value === 0) return '#1a202c';
    if (value < 25) return '#22543d';
    if (value < 50) return '#2d5016';
    if (value < 75) return '#744210';
    return '#742a2a';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Availability Heatmap</h1>
        <p className={styles.subtitle}>Manage your schedule and view appointment density</p>
      </div>

      <div className={styles.controls}>
        <button 
          className={styles.navButton}
          onClick={() => setSelectedWeek(prev => prev - 1)}
        >
          ← Previous Week
        </button>
        <span className={styles.weekInfo}>
          Week {selectedWeek === 0 ? 'This Week' : selectedWeek > 0 ? `+${selectedWeek}` : selectedWeek}
        </span>
        <button 
          className={styles.navButton}
          onClick={() => setSelectedWeek(prev => prev + 1)}
        >
          Next Week →
        </button>
      </div>

      <div className={styles.heatmap}>
        <div className={styles.heatmapGrid}>
          {weekDates.map((date, index) => {
            const dayName = dayNames[date.getDay()];
            const heatmapValue = getHeatmapValue(date);
            const appointmentsForDate = getAppointmentsForDate(date);
            const dayAvailability = getDayAvailability(date);
            
            return (
              <div key={index} className={styles.heatmapDay}>
                <div className={styles.dayHeader}>
                  <h3>{dayName}</h3>
                  <span className={styles.date}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div 
                  className={styles.heatmapCell}
                  style={{ 
                    backgroundColor: getHeatmapColor(heatmapValue),
                    opacity: dayAvailability.available ? 1 : 0.3
                  }}
                >
                  <div className={styles.cellContent}>
                    {dayAvailability.available ? (
                      <>
                        <span className={styles.availabilityText}>
                          {dayAvailability.start} - {dayAvailability.end}
                        </span>
                        <span className={styles.bookedCount}>
                          {appointmentsForDate.length} booked
                        </span>
                        <span className={styles.percentage}>
                          {Math.round(heatmapValue)}%
                        </span>
                      </>
                    ) : (
                      <span className={styles.unavailable}>Unavailable</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.availabilitySettings}>
        <h2 className={styles.sectionTitle}>Set Weekly Availability</h2>
        <div className={styles.settingsGrid}>
          {Object.entries(availability).map(([day, settings]) => (
            <div key={day} className={styles.settingCard}>
              <div className={styles.settingHeader}>
                <h3 className={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.available}
                    onChange={() => toggleDayAvailability(day)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              {settings.available && (
                <div className={styles.timeInputs}>
                  <div className={styles.timeGroup}>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={settings.start}
                      onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                    />
                  </div>
                  <div className={styles.timeGroup}>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={settings.end}
                      onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
