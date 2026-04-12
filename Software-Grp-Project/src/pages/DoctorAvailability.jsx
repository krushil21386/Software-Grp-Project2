import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './DoctorAvailability.module.css';
import { appointments as initialAppointments } from '../utils/mockData';

const DoctorAvailability = () => {
  const { user, authFetch } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(0);
  
  const [availability, setAvailability] = useState({
    monday: { start: '09:00', end: '17:00', available: true },
    tuesday: { start: '09:00', end: '17:00', available: true },
    wednesday: { start: '09:00', end: '17:00', available: true },
    thursday: { start: '09:00', end: '17:00', available: true },
    friday: { start: '09:00', end: '17:00', available: true },
    saturday: { start: '10:00', end: '14:00', available: false },
    sunday: { start: '10:00', end: '14:00', available: false },
  });
  const [specificDates, setSpecificDates] = useState([]); // Array of {date, start, end, available}
  const [selectedDate, setSelectedDate] = useState(null); // The date being edited in modal
  const [editDateModal, setEditDateModal] = useState({ show: false, date: '', start: '', end: '', available: true });

  // Time conversion helpers
  const convertTo24Hour = (timeStr) => {
    if (!timeStr || timeStr.includes(':') && !timeStr.includes(' ')) return timeStr; // Already 24h or invalid
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const convertTo12Hour = (time24) => {
    if (!time24 || time24.includes(' ')) return time24; // Already 12h or invalid
    let [hours, minutes] = time24.split(':');
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${modifier}`;
  };

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Availability
        const availRes = await authFetch(`${backendUrl}/api/doctors/availability`);
        const availData = await availRes.json();
        if (availData.success && availData.availability) {
          // Store internally as 24h
          const normalizedAvail = {};
          Object.keys(availData.availability).forEach(day => {
            normalizedAvail[day] = {
              ...availData.availability[day],
              start: convertTo24Hour(availData.availability[day].start),
              end: convertTo24Hour(availData.availability[day].end)
            };
          });
          setAvailability(normalizedAvail);
        }
        if (availData.success && availData.specificDates) {
          setSpecificDates(availData.specificDates);
        }

        // Fetch Appointments
        const apptRes = await authFetch(`${backendUrl}/api/appointments/my-appointments`);
        const apptData = await apptRes.json();
        if (apptData.success) {
          setAppointments(apptData.upcoming || []);
        }
      } catch (err) {
        console.error('Failed to fetch doctor data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authFetch]);

  const handleSaveSettings = async () => {
    try {
      setSaveLoading(true);
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // Convert to 12h for backend compatibility if necessary (or just send 24h if backend handles it)
      // I'll send 12h to match existing backend expectations
      const payloadSchedule = {};
      Object.keys(availability).forEach(day => {
        payloadSchedule[day] = {
          ...availability[day],
          start: convertTo12Hour(availability[day].start),
          end: convertTo12Hour(availability[day].end)
        };
      });

      const res = await authFetch(`${backendUrl}/api/doctors/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: payloadSchedule })
      });
      const data = await res.json();
      if (data.success) {
        alert('Availability settings saved to database!');
      }
    } catch (err) {
      console.error('Failed to save availability:', err);
      alert('Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  const doctorAppointments = appointments; // Already filtered by doctor on the backend

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

  // Get availability for a specific day (Check date-specific first, then weekly)
  const getDayAvailability = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const specific = specificDates.find(d => d.date === dateStr);
    if (specific) return specific;

    const dayName = dayNames[date.getDay()].toLowerCase();
    return availability[dayName];
  };

  const getHeatmapValue = (date) => {
    const dayAvailability = getDayAvailability(date);
    if (!dayAvailability || !dayAvailability.available) return 0;
    
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

  const handleHeatmapCellClick = (date) => {
    const avail = getDayAvailability(date);
    const dateStr = date.toISOString().split('T')[0];
    setEditDateModal({
      show: true,
      date: dateStr,
      start: avail.start || '09:00',
      end: avail.end || '17:00',
      available: avail.available
    });
  };

  const handleSaveDateSpecific = async () => {
    try {
      setSaveLoading(true);
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await authFetch(`${backendUrl}/api/doctors/availability/date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editDateModal.date,
          start: editDateModal.start.includes(':') && !editDateModal.start.includes(' ') ? convertTo12Hour(editDateModal.start) : editDateModal.start,
          end: editDateModal.end.includes(':') && !editDateModal.end.includes(' ') ? convertTo12Hour(editDateModal.end) : editDateModal.end,
          available: editDateModal.available
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSpecificDates(data.specificDates);
        setEditDateModal({ ...editDateModal, show: false });
        alert(`Availability for ${editDateModal.date} updated!`);
      }
    } catch (err) {
      console.error('Failed to save date availability:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const getHeatmapColor = (value) => {
    if (value === 0) return '#f8fafc'; // Very light grey
    if (value < 25) return '#dcfce7'; // Light green
    if (value < 50) return '#fef08a'; // Light yellow
    if (value < 75) return '#fed7aa'; // Light orange
    return '#fecaca'; // Light red
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Availability Heatmap</h1>
        <p className={styles.subtitle}>Manage your schedule and view appointment density</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          Loading your schedule...
        </div>
      )}

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
                  onClick={() => handleHeatmapCellClick(date)}
                  style={{ 
                    backgroundColor: getHeatmapColor(heatmapValue),
                    opacity: dayAvailability.available ? 1 : 0.3,
                    position: 'relative'
                  }}
                >
                  {specificDates.some(d => d.date === date.toISOString().split('T')[0]) && (
                    <div style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-crimson)' }}></div>
                  )}
                  <div className={styles.cellContent}>
                    {dayAvailability.available ? (
                      <>
                        <span className={styles.availabilityText}>
                          {convertTo12Hour(dayAvailability.start)} - {convertTo12Hour(dayAvailability.end)}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`${styles.toggleLabel} ${settings.available ? styles.availableLabel : styles.unavailableLabel}`}>
                    {settings.available ? 'Available' : 'Unavailable'}
                  </span>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      id={`avail-toggle-${day}`}
                      checked={settings.available}
                      onChange={() => toggleDayAvailability(day)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
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
        
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button 
            className={styles.navButton} 
            onClick={handleSaveSettings}
            disabled={saveLoading}
            style={{ padding: '12px 32px', fontSize: '16px', fontWeight: '700' }}
          >
            {saveLoading ? 'Saving...' : '💾 Save Weekly Availability'}
          </button>
        </div>
      </div>

      {editDateModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h2>Edit Availability for {editDateModal.date}</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>This will apply ONLY to this specific day.</p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Available on this day?</label>
              <select 
                value={editDateModal.available} 
                onChange={e => setEditDateModal({...editDateModal, available: e.target.value === 'true'})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px' }}
              >
                <option value="true">Yes, Available</option>
                <option value="false">No, Unavailable</option>
              </select>
            </div>

            {editDateModal.available && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label>Start</label>
                  <input 
                    type="time" 
                    value={convertTo24Hour(editDateModal.start)} 
                    onChange={e => setEditDateModal({...editDateModal, start: e.target.value})}
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>End</label>
                  <input 
                    type="time" 
                    value={convertTo24Hour(editDateModal.end)} 
                    onChange={e => setEditDateModal({...editDateModal, end: e.target.value})}
                    style={{ width: '100%', padding: '10px' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditDateModal({...editDateModal, show: false})} style={{ padding: '10px 16px', borderRadius: '6px', background: '#e2e8f0', border: 'none' }}>Cancel</button>
              <button onClick={handleSaveDateSpecific} disabled={saveLoading} style={{ padding: '10px 16px', borderRadius: '6px', background: 'var(--color-crimson)', color: '#fff', border: 'none' }}>
                {saveLoading ? 'Saving...' : 'Save for this day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
