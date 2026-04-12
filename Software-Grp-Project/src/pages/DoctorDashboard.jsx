import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './DoctorDashboard.module.css';
import { useAuth } from '../contexts/AuthContext';
import ProfileImageUpload from '../components/ProfileImageUpload/ProfileImageUpload';
import DoctorPerformanceChart from '../components/DoctorPerformanceChart/DoctorPerformanceChart';
import { DashboardSkeleton } from '../components/Skeleton/Skeleton';

const DoctorDashboard = () => {
  const { authFetch, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleModal, setRescheduleModal] = useState({ show: false, appointmentId: null, date: '', time: '', reason: '' });
  const [cancelModal, setCancelModal] = useState({ show: false, appointmentId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [prescriptionModal, setPrescriptionModal] = useState({ show: false, recordId: null, patientName: '' });
  const [reportModal, setReportModal] = useState({ show: false, patientId: null, patientName: '' });
  const [uploadLoading, setUploadLoading] = useState(false);

  // Default settings that aren't stored in DB yet, keeping UI interactive
  const [availabilitySettings, setAvailabilitySettings] = useState({
    monday: { start: '9:00 AM', end: '5:00 PM', available: true },
    tuesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    wednesday: { start: '9:00 AM', end: '5:00 PM', available: true },
    thursday: { start: '9:00 AM', end: '5:00 PM', available: true },
    friday: { start: '9:00 AM', end: '5:00 PM', available: true },
    saturday: { start: '10:00 AM', end: '2:00 PM', available: false },
    sunday: { start: '10:00 AM', end: '2:00 PM', available: false },
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await authFetch(`${backendUrl}/api/appointments/my-appointments`);
        const data = await res.json();
        if (data.success) {
          setUpcomingAppointments(data.upcoming || []);
          setCompletedAppointments(data.completed || []);
          setCancelledAppointments(data.cancelled || []);
        }
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAppointments();

    // Poll every 10 seconds for live updates
    const intervalId = setInterval(fetchAppointments, 10000);

    return () => clearInterval(intervalId);
  }, [authFetch]);

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await authFetch(`${backendUrl}/api/appointments/${cancelModal.appointmentId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (response.ok) {
        const rejectedApt = upcomingAppointments.find(a => a._id === cancelModal.appointmentId);
        if (rejectedApt) {
          rejectedApt.status = 'cancelled';
          setCancelledAppointments(prev => [rejectedApt, ...prev]);
        }
        setUpcomingAppointments(prev => prev.filter(apt => apt._id !== cancelModal.appointmentId));
        setCancelModal({ show: false, appointmentId: null });
        setCancelReason('');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
    } finally {
      setCancelling(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleModal.date || !rescheduleModal.time || !rescheduleModal.reason) {
      alert('Please provide a new date, time, and a reason for rescheduling.');
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await authFetch(`${backendUrl}/api/appointments/${rescheduleModal.appointmentId}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: rescheduleModal.date,
          time: rescheduleModal.time,
          reason: rescheduleModal.reason
        })
      });

      if (response.ok) {
        setRescheduleModal({ show: false, appointmentId: null, date: '', time: '', reason: '' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await authFetch(`${backendUrl}/api/appointments/${appointmentId}/complete`, {
        method: 'PUT',
      });
      if (response.ok) {
        const completedApt = upcomingAppointments.find(a => a._id === appointmentId);
        if (completedApt) {
          completedApt.status = 'completed';
          setCompletedAppointments(prev => [...prev, completedApt]);
        }
        setUpcomingAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
    }
  };

  const handleUploadPrescription = async (e) => {
    e.preventDefault();
    const file = e.target.prescription.files[0];
    if (!file) return alert('Please select a file');

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('prescription', file);

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await authFetch(`${backendUrl}/api/medical-records/${prescriptionModal.recordId}/prescription`, {
        method: 'PATCH',
        body: formData, // authFetch should handle FormData correctly by not setting JSON header
      });

      const data = await response.json();
      if (data.success) {
        alert('Prescription uploaded successfully!');
        setPrescriptionModal({ show: false, recordId: null, patientName: '' });
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    const file = e.target.report.files[0];
    if (!file) return alert('Please select a file');

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('report', file);
    formData.append('patientId', reportModal.patientId);

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      // Change to the manual upload endpoint
      const response = await authFetch(`${backendUrl}/api/medical-records/upload-report`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert('Report uploaded successfully!');
        setReportModal({ show: false, patientId: null, patientName: '' });
      } else {
        alert(data.message || 'Report upload failed');
      }
    } catch (error) {
      console.error('Report upload error:', error);
      alert('An error occurred during report upload.');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <ProfileImageUpload size={100} />
          <div>
            <h1 className={styles.title}>Welcome back, Dr. {user?.name?.replace('Dr. ', '') || 'Doctor'}!</h1>
            <p className={styles.subtitle}>
              {user?.specialty ? `${user.specialty} • ` : ''} Manage your patients and schedule
            </p>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statInfo}>
            <h3>Upcoming Appointments</h3>
            <p className={styles.statValue}>{upcomingAppointments.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>Completed</h3>
            <p className={styles.statValue}>{completedAppointments.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statInfo}>
            <h3>Rating</h3>
            <p className={styles.statValue}>4.9</p>
          </div>
        </div>
      </div>

      {user?.id && (
        <DoctorPerformanceChart
          doctorId={user.id}
          doctorName={user.name}
          authFetch={authFetch}
        />
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${selectedTab === 'upcoming' ? styles.active : ''}`}
          onClick={() => setSelectedTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'completed' ? styles.active : ''}`}
          onClick={() => setSelectedTab('completed')}
        >
          Completed
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'cancelled' ? styles.active : ''}`}
          onClick={() => setSelectedTab('cancelled')}
        >
          Cancelled
        </button>
        <button
          className={`${styles.tab} ${selectedTab === 'availability' ? styles.active : ''}`}
          onClick={() => setSelectedTab('availability')}
        >
          Set Availability
        </button>
      </div>

      <div className={styles.appointmentsList}>
        {selectedTab === 'upcoming' && (
          <>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{appointment.date}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <h3 className={styles.patientName}>{appointment.patientName}</h3>
                    <p className={styles.reason}>Contact: {appointment.patientPhone || appointment.patientEmail}</p>
                    <p className={styles.hospital}>{appointment.clinicName} • {appointment.mode} Mode</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <button
                      className={styles.completeButton}
                      onClick={() => handleCompleteAppointment(appointment._id)}
                    >
                      Complete
                    </button>
                    <button
                      className={styles.rescheduleButton}
                      onClick={() => setRescheduleModal({ show: true, appointmentId: appointment._id, date: '', time: '', reason: '' })}
                      style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Reschedule
                    </button>
                    <button
                      className={styles.cancelButton}
                      onClick={() => setCancelModal({ show: true, appointmentId: appointment._id })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No upcoming appointments scheduled</div>
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {completedAppointments.length > 0 ? (
              completedAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard}>
                  <div className={styles.appointmentTime}>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{appointment.date}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <h3 className={styles.patientName}>{appointment.patientName}</h3>
                    <p className={styles.reason}>Contact: {appointment.patientPhone || appointment.patientEmail}</p>
                    <p className={styles.hospital}>{appointment.clinicName}</p>
                  </div>
                  <div className={styles.appointmentActions}>
                    <button 
                      className={styles.viewButton}
                      style={{ background: '#0ea5e9', border: 'none', borderRadius: '14px', padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)' }}
                      onClick={() => setReportModal({ show: true, patientId: appointment.userId || appointment.patientId, patientName: appointment.patientName })}
                    >
                      Report Upload
                    </button>
                    <button 
                      className={styles.viewButton}
                      style={{ background: '#10b981', border: 'none', borderRadius: '14px', padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}
                      onClick={async () => {
                        // Fetch the medical record for this patient
                        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                        const res = await authFetch(`${backendUrl}/api/medical-records/patient/${appointment.userId || appointment.patientId}`);
                        const data = await res.json();
                        if (data.success && data.records?.length > 0) {
                          setPrescriptionModal({ 
                            show: true, 
                            recordId: data.records[0]._id, 
                            patientName: appointment.patientName 
                          });
                        } else {
                          alert('No medical record found. Please upload a report first.');
                        }
                      }}
                    >
                      Medicine Report
                    </button>
                    <span className={styles.completedBadge}>Completed</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No completed appointments</div>
            )}
          </>
        )}

        {/* Report Upload Modal (Doctor) */}
        {reportModal.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
              <h2 style={{ margin: '0 0 10px' }}>Upload Medical Report</h2>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>For: <strong>{reportModal.patientName}</strong></p>

              <form onSubmit={handleUploadReport}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Lab Report (PDF/Image)</label>
                  <input type="file" name="report" accept=".pdf,image/*" required style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setReportModal({ show: false, patientId: null, patientName: '' })}
                    style={{ padding: '10px 16px', borderRadius: '6px', background: '#e2e8f0', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    style={{ padding: '10px 16px', borderRadius: '6px', background: '#0ea5e9', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload & Analyze →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prescription Modal */}
        {prescriptionModal.show && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
              <h2 style={{ margin: '0 0 10px' }}>Upload Prescription</h2>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>For: <strong>{prescriptionModal.patientName}</strong></p>

              <form onSubmit={handleUploadPrescription}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select File (PDF/Image)</label>
                  <input type="file" name="prescription" accept=".pdf,image/*" required style={{ width: '100%' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setPrescriptionModal({ show: false, recordId: null, patientName: '' })}
                    style={{ padding: '10px 16px', borderRadius: '6px', background: '#e2e8f0', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading}
                    style={{ padding: '10px 16px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload & Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedTab === 'availability' && (
          <div className={styles.availabilitySection} style={{ textAlign: 'center', padding: '40px' }}>
            <h2 className={styles.sectionTitle}>Manage Your Schedule</h2>
            <p style={{ marginBottom: '24px', color: 'var(--color-text-muted)' }}>
              Use our advanced Heatmap tool to view appointment density and set your weekly hours.
            </p>
            <Link
              to="/doctor-availability"
              className={styles.saveButton}
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Open Availability Heatmap →
            </Link>
          </div>
        )}

        {selectedTab === 'cancelled' && (
          <>
            {cancelledAppointments.length > 0 ? (
              cancelledAppointments.map(appointment => (
                <div key={appointment._id} className={styles.appointmentCard} style={{ opacity: 0.7 }}>
                  <div className={styles.appointmentTime}>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{appointment.date}</span>
                  </div>
                  <div className={styles.appointmentDetails}>
                    <h3 className={styles.patientName}>{appointment.patientName}</h3>
                    <p className={styles.patientInfo}>{appointment.patientEmail || appointment.patientPhone}</p>
                    <p className={styles.appointmentType}>{appointment.mode} Mode</p>
                  </div>
                  <div className={styles.statusBadge} style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '4px 12px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '500' }}>
                    Cancelled
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No cancelled appointments</div>
            )}
          </>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#1e293b' }}>Reschedule Appointment</h2>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>New Date</label>
              <input type="date" value={rescheduleModal.date} onChange={e => setRescheduleModal(prev => ({ ...prev, date: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>New Time</label>
              <input type="time" value={rescheduleModal.time} onChange={e => setRescheduleModal(prev => ({ ...prev, time: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Reason <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" placeholder="e.g., Unexpected emergency" value={rescheduleModal.reason} onChange={e => setRescheduleModal(prev => ({ ...prev, reason: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRescheduleModal({ show: false, appointmentId: null, date: '', time: '', reason: '' })} style={{ padding: '10px 16px', borderRadius: '6px', background: '#e2e8f0', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={submitReschedule} style={{ padding: '10px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Confirm Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => { setCancelModal({ show: false, appointmentId: null }); setCancelReason(''); }}>
          <div style={{
            background: '#fff', borderRadius: '20px', width: '90%', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>Cancel Appointment</h3>
              <button onClick={() => { setCancelModal({ show: false, appointmentId: null }); setCancelReason(''); }}
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>
                This will notify the patient via email. Please provide a reason:
              </p>
              <textarea
                placeholder="e.g. Doctor unavailable, emergency surgery..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              padding: '16px 28px', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'flex-end', gap: '12px'
            }}>
              <button
                onClick={() => { setCancelModal({ show: false, appointmentId: null }); setCancelReason(''); }}
                style={{
                  padding: '10px 24px', borderRadius: '10px', background: '#f8fafc',
                  color: '#1e293b', border: '1px solid #e2e8f0', fontSize: '14px',
                  fontWeight: 600, cursor: 'pointer'
                }}>Keep Appointment</button>
              <button
                onClick={handleCancelAppointment}
                disabled={!cancelReason.trim() || cancelling}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  background: cancelReason.trim() ? '#DC143C' : '#fca5a5',
                  color: '#fff', border: 'none', fontSize: '14px',
                  fontWeight: 600, cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: cancelling ? 0.6 : 1
                }}>{cancelling ? 'Cancelling...' : 'Confirm Cancellation'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
