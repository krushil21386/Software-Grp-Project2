import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './MedicalRecords.module.css';
import { useAuth } from '../contexts/AuthContext';
import { RecordsSkeleton } from '../components/Skeleton/Skeleton';

const MedicalRecords = () => {
  const { authFetch, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: [{ medicineName: '', dosage: '', frequency: '' }],
    doctorComments: ''
  });
  const [uploadingFile, setUploadingFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchRecords();
  }, [authFetch]);

  const fetchRecords = async () => {
    try {
      const endpoint = isDoctor ? '/api/medical-records/doctor-records' : '/api/medical-records/my-records';
      const res = await authFetch(`${backendUrl}${endpoint}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Doctor: Upload Prescription File ───
  const handleUploadPrescription = async (recordId) => {
    if (!uploadingFile) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('prescription', uploadingFile);
      const res = await authFetch(`${backendUrl}/api/medical-records/${recordId}/prescription`, {
        method: 'PATCH',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadingFile(null);
        fetchRecords();
      }
    } catch (err) {
      console.error('Failed to upload prescription:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Doctor: Update Prescription Text Fields ───
  const handleUpdatePrescriptionDetails = async (recordId) => {
    setSaving(true);
    try {
      const validMedicines = prescriptionForm.medicines.filter(m => m.medicineName.trim());
      const res = await authFetch(`${backendUrl}/api/medical-records/${recordId}/prescription-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: validMedicines,
          doctorComments: prescriptionForm.doctorComments
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingRecord(null);
        setPrescriptionForm({ medicines: [{ medicineName: '', dosage: '', frequency: '' }], doctorComments: '' });
        fetchRecords();
      }
    } catch (err) {
      console.error('Failed to update prescription:', err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record._id);
    // Pre-fill if prescriptions exist
    const existingRx = record.prescriptions?.[0];
    if (existingRx?.medicines?.length > 0) {
      setPrescriptionForm({
        medicines: existingRx.medicines.map(m => ({
          medicineName: m.medicineName || m.name || '',
          dosage: m.dosage || '',
          frequency: m.frequency || ''
        })),
        doctorComments: record.doctorComments || ''
      });
    } else {
      setPrescriptionForm({
        medicines: [{ medicineName: '', dosage: '', frequency: '' }],
        doctorComments: record.doctorComments || ''
      });
    }
  };

  const addMedicineRow = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { medicineName: '', dosage: '', frequency: '' }]
    }));
  };

  const removeMedicineRow = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicine = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  // Filter records by search
  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const patientName = r.patient?.name?.toLowerCase() || '';
    const disease = r.analysis?.disease?.toLowerCase() || r.analysis?.summary?.toLowerCase() || '';
    const reportType = r.reportType?.toLowerCase() || '';
    return patientName.includes(term) || disease.includes(term) || reportType.includes(term);
  });

  if (loading) return <RecordsSkeleton />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isDoctor ? 'Patient Records' : 'Medical Records'}</h1>
        <p className={styles.subtitle}>
          {isDoctor
            ? 'Records of patients you\'ve consulted — manage prescriptions & reports'
            : 'Your complete health history (Completed Appointments)'}
        </p>
      </div>

      {/* Search (Doctor only) */}
      {isDoctor && records.length > 0 && (
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by patient name, diagnosis, or report type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {filteredRecords.length > 0 ? (
        <div className={styles.recordsList}>
          {filteredRecords.map((record) => (
            <div key={record._id || record.appointmentId} className={styles.recordCard}>
              <div className={styles.recordHeader}>
                <div>
                  {isDoctor && record.patient && (
                    <p className={styles.patientName}>👤 {record.patient.name} {record.patient.age ? `• ${record.patient.age} yrs` : ''} {record.patient.gender ? `• ${record.patient.gender}` : ''}</p>
                  )}
                  <h2 className={styles.recordDate}>
                    {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : record.date}
                  </h2>
                  <p className={styles.recordTime}>{record.reportType || 'Medical Report'}</p>
                </div>
                <span className={`${styles.statusBadge} ${record.status === 'reviewed' ? styles.statusReviewed : styles.statusPending}`}>
                  {record.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending'}
                </span>
              </div>

              <div className={styles.recordBody}>
                {/* AI Analysis Section */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>AI Health Assessment</h3>
                  {record.analysis?.disease && (
                    <p className={styles.diagnosis}>🩺 {record.analysis.disease}</p>
                  )}
                  <p className={styles.summary}>{record.analysis?.summary || 'Analysis pending...'}</p>
                  {record.analysis?.overall_assessment && (
                    <div className={styles.assessment}>
                      <strong>Result:</strong> {record.analysis.overall_assessment}
                    </div>
                  )}
                  {record.analysis?.confidenceScore && (
                    <div className={styles.confidenceRow}>
                      <span>Confidence:</span>
                      <span className={styles.confidenceValue}>{record.analysis.confidenceScore}%</span>
                    </div>
                  )}
                </div>

                {/* Key Findings */}
                {record.analysis?.key_findings?.length > 0 && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Key Findings</h3>
                    <ul className={styles.findingsList}>
                      {record.analysis.key_findings.map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prescriptions attached to this record */}
                {record.prescriptions?.length > 0 && (
                  <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>💊 {isDoctor ? 'Prescriptions Given' : 'Your Prescriptions'}</h3>
                    {record.prescriptions.map((rx, idx) => (
                      <div key={idx} className={styles.rxCard}>
                        {rx.medicines?.map((med, mIdx) => (
                          <span key={mIdx} className={styles.medicinePill}>
                            {med.medicineName || med.name} {med.dosage ? `• ${med.dosage}` : ''} {med.frequency ? `• ${med.frequency}` : ''}
                          </span>
                        ))}
                        <span className={styles.rxStatus}>{rx.status?.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className={styles.footerActions}>
                  {record.prescriptionUrl ? (
                    <a 
                      href={`${backendUrl}${record.prescriptionUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.downloadButton}
                    >
                      📄 Download Prescription
                    </a>
                  ) : (
                    !isDoctor && !record.prescriptions?.length && <span className={styles.pendingPrescription}>Prescription not yet uploaded by doctor</span>
                  )}
                  {record.fileUrl && (
                    <a 
                      href={`${backendUrl}${record.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.viewLabReport}
                    >
                      🔬 View Lab Report
                    </a>
                  )}

                  {/* Doctor Actions */}
                  {isDoctor && (
                    <div className={styles.doctorActions}>
                      <button className={styles.editRxBtn} onClick={() => openEditModal(record)}>
                        ✏️ Update Prescription
                      </button>
                      <label className={styles.uploadLabel}>
                        📤 Upload Rx File
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={e => {
                            setUploadingFile(e.target.files[0]);
                            setTimeout(() => handleUploadPrescription(record._id), 100);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>
            {isDoctor
              ? 'No patient records found'
              : 'No medical records available'}
          </p>
          <p className={styles.emptySubtext}>
            {isDoctor
              ? 'Patient records will appear here after you complete consultations and they upload reports.'
              : 'Your medical records will appear here after completed appointments'}
          </p>
          {!isDoctor && (
            <Link to="/book-appointment" className={styles.bookLink}>
              Book an Appointment
            </Link>
          )}
        </div>
      )}

      {/* ─── Edit Prescription Modal ─── */}
      {editingRecord && (
        <div className={styles.modalOverlay} onClick={() => setEditingRecord(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Update Prescription</h3>
              <button className={styles.modalClose} onClick={() => setEditingRecord(null)}>×</button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.formLabel}>Medicines</label>
              {prescriptionForm.medicines.map((med, idx) => (
                <div key={idx} className={styles.medicineRow}>
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={med.medicineName}
                    onChange={e => updateMedicine(idx, 'medicineName', e.target.value)}
                    className={styles.formInput}
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={med.dosage}
                    onChange={e => updateMedicine(idx, 'dosage', e.target.value)}
                    className={styles.formInputSmall}
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. 2x/day)"
                    value={med.frequency}
                    onChange={e => updateMedicine(idx, 'frequency', e.target.value)}
                    className={styles.formInputSmall}
                  />
                  {prescriptionForm.medicines.length > 1 && (
                    <button className={styles.removeRowBtn} onClick={() => removeMedicineRow(idx)}>🗑️</button>
                  )}
                </div>
              ))}
              <button className={styles.addRowBtn} onClick={addMedicineRow}>+ Add Medicine</button>

              <label className={styles.formLabel} style={{ marginTop: 16 }}>Doctor Comments</label>
              <textarea
                placeholder="Additional notes or instructions..."
                value={prescriptionForm.doctorComments}
                onChange={e => setPrescriptionForm(prev => ({ ...prev, doctorComments: e.target.value }))}
                className={styles.formTextarea}
                rows={3}
              />
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setEditingRecord(null)}>Cancel</button>
              <button
                className={styles.saveBtn}
                onClick={() => handleUpdatePrescriptionDetails(editingRecord)}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save & Notify Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
