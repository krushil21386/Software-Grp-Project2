import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './HealthPassport.module.css';

const HealthPassport = () => {
  const { authFetch, user } = useAuth();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('share');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);

  useEffect(() => {
    if (shareToken) {
      fetchSharedData(shareToken);
    } else {
      fetchPassportData();
    }
  }, [shareToken]);

  const fetchPassportData = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await authFetch(`${backendUrl}/api/passport/data`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch passport data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedData = async (token) => {
    try {
      setIsSharedView(true);
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/passport/view/${token}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch shared passport:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await authFetch(`${backendUrl}/api/passport/share`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setShareUrl(result.shareUrl);
      }
    } catch (err) {
      console.error('Failed to generate share link:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    setGenerating(true);

    try {
      // Dynamic imports for code splitting
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const autoTable = (await import('jspdf-autotable')).default;
      const QRCode = await import('qrcode');

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // ─── Header ───
      doc.setFillColor(220, 20, 60);
      doc.rect(0, 0, pageWidth, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Health Passport', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('MediCare Plus — Comprehensive Health Summary', pageWidth / 2, 26, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 33, { align: 'center' });
      y = 55;

      // ─── Patient Profile ───
      doc.setTextColor(220, 20, 60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Patient Profile', 14, y);
      y += 8;

      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const patient = data.patient || {};
      const profileLines = [
        `Name: ${patient.name || 'N/A'}`,
        `Age: ${patient.age || 'N/A'}   |   Gender: ${patient.gender || 'N/A'}`,
        `Email: ${patient.email || 'N/A'}   |   Phone: ${patient.phone || 'N/A'}`,
      ];
      profileLines.forEach(line => {
        doc.text(line, 14, y);
        y += 6;
      });
      y += 6;

      // ─── Diagnosis History ───
      if (data.records && data.records.length > 0) {
        const diagnosisRecords = data.records.filter(r => r.disease && r.disease !== 'General Health Consultation');
        if (diagnosisRecords.length > 0) {
          doc.setTextColor(220, 20, 60);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Diagnosis History', 14, y);
          y += 4;

          autoTable(doc, {
            startY: y,
            head: [['Date', 'Diagnosis', 'Confidence', 'Summary']],
            body: diagnosisRecords.map(r => [
              new Date(r.date).toLocaleDateString(),
              r.disease || 'N/A',
              r.confidence ? `${r.confidence}%` : 'N/A',
              (r.summary || 'N/A').substring(0, 80) + ((r.summary || '').length > 80 ? '...' : '')
            ]),
            headStyles: { fillColor: [220, 20, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [60, 60, 60], fontSize: 8 },
            alternateRowStyles: { fillColor: [250, 245, 245] },
            margin: { left: 14, right: 14 },
            styles: { cellPadding: 4 }
          });
          y = doc.lastAutoTable.finalY + 12;
        }
      }

      // ─── Appointment History ───
      if (data.appointments && data.appointments.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setTextColor(220, 20, 60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Appointment History', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Date', 'Time', 'Doctor', 'Specialization', 'Clinic', 'Status']],
          body: data.appointments.map(a => [
            a.date,
            a.time || '',
            a.doctorName,
            a.specialization,
            a.clinicName,
            a.status?.toUpperCase() || ''
          ]),
          headStyles: { fillColor: [220, 20, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { textColor: [60, 60, 60], fontSize: 8 },
          alternateRowStyles: { fillColor: [250, 245, 245] },
          margin: { left: 14, right: 14 },
          styles: { cellPadding: 3 }
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ─── Prescriptions ───
      if (data.prescriptions && data.prescriptions.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setTextColor(220, 20, 60);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Prescription History', 14, y);
        y += 4;

        const rxBody = [];
        data.prescriptions.forEach(p => {
          if (p.medicines && p.medicines.length > 0) {
            p.medicines.forEach(m => {
              rxBody.push([
                p.issuedDate ? new Date(p.issuedDate).toLocaleDateString() : 'N/A',
                p.doctorName || 'N/A',
                m.medicineName || m.name || 'N/A',
                m.dosage || 'N/A',
                m.frequency || 'N/A',
                p.status?.toUpperCase() || ''
              ]);
            });
          }
        });

        if (rxBody.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Date', 'Doctor', 'Medicine', 'Dosage', 'Frequency', 'Status']],
            body: rxBody,
            headStyles: { fillColor: [220, 20, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [60, 60, 60], fontSize: 8 },
            alternateRowStyles: { fillColor: [250, 245, 245] },
            margin: { left: 14, right: 14 },
            styles: { cellPadding: 3 }
          });
          y = doc.lastAutoTable.finalY + 12;
        }
      }

      // ─── QR Code ───
      if (y > 230) { doc.addPage(); y = 20; }
      try {
        const verificationUrl = window.location.origin + '/Software-Grp-Project/health-passport';
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 120, margin: 1 });
        doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 15, y, 30, 30);
        y += 34;
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text('Scan to verify this document', pageWidth / 2, y, { align: 'center' });
      } catch (qrErr) {
        console.warn('QR code generation failed:', qrErr);
      }

      // ─── Footer ───
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(7);
        doc.text(
          `MediCare Plus Health Passport — Page ${i} of ${totalPages} — Confidential Medical Document`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }

      // ─── Save ───
      const fileName = `HealthPassport_${(patient.name || 'Patient').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Health Passport...</div>;
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h2 className={styles.emptyTitle}>No Health Data Found</h2>
          <p className={styles.emptySubtext}>
            {isSharedView
              ? 'This share link is invalid or has expired.'
              : 'Start by booking an appointment or uploading a medical report.'}
          </p>
        </div>
      </div>
    );
  }

  const patient = data.patient || {};
  const stats = data.stats || {};

  return (
    <div className={styles.container}>
      {isSharedView && (
        <div className={styles.sharedBanner}>
          🔗 You are viewing a shared Health Passport. This link will expire in 24 hours.
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>🛡️ Health Passport</h1>
        <p className={styles.subtitle}>Your complete health identity — download, share, or print</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statValue}>{stats.totalAppointments || 0}</div>
          <div className={styles.statLabel}>Total Appointments</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{stats.completedAppointments || 0}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔬</div>
          <div className={styles.statValue}>{stats.totalReports || 0}</div>
          <div className={styles.statLabel}>AI Reports Analyzed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💊</div>
          <div className={styles.statValue}>{stats.activePrescriptions || 0}</div>
          <div className={styles.statLabel}>Active Prescriptions</div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isSharedView && (
        <div className={styles.actions}>
          <button className={styles.downloadBtn} onClick={handleDownloadPDF} disabled={generating}>
            {generating ? '⏳ Generating...' : '📄 Download Health Passport PDF'}
          </button>
          <button className={styles.shareBtn} onClick={handleShare}>
            🔗 Generate 24h Share Link
          </button>
        </div>
      )}

      {/* Share URL Banner */}
      {shareUrl && (
        <div className={styles.shareBanner}>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>🔗 Share Link:</span>
          <input className={styles.shareUrl} value={shareUrl} readOnly onClick={e => e.target.select()} />
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      )}

      {/* Patient Profile */}
      <h2 className={styles.sectionTitle}>👤 Patient Profile</h2>
      <div className={styles.profileCard}>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Full Name</span>
          <span className={styles.profileValue}>{patient.name || 'N/A'}</span>
        </div>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Age</span>
          <span className={styles.profileValue}>{patient.age || 'N/A'}</span>
        </div>
        <div className={styles.profileItem}>
          <span className={styles.profileLabel}>Gender</span>
          <span className={styles.profileValue}>{patient.gender || 'N/A'}</span>
        </div>
        {!isSharedView && (
          <>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Email</span>
              <span className={styles.profileValue}>{patient.email || 'N/A'}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Phone</span>
              <span className={styles.profileValue}>{patient.phone || 'N/A'}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Member Since</span>
              <span className={styles.profileValue}>
                {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Diagnosis History */}
      {data.records && data.records.filter(r => r.disease).length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>🩺 AI Diagnosis History</h2>
          <div className={styles.diagnosisGrid}>
            {data.records.filter(r => r.disease).map((record, idx) => (
              <div key={idx} className={styles.diagnosisCard}>
                <div className={styles.diagnosisName}>{record.disease}</div>
                <div className={styles.diagnosisSummary}>{record.summary}</div>
                {record.confidence && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Confidence</span>
                      <span style={{ fontSize: '0.75rem', color: record.confidence > 80 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                        {record.confidence}%
                      </span>
                    </div>
                    <div className={styles.confidenceBar}>
                      <div
                        className={styles.confidenceFill}
                        style={{
                          width: `${record.confidence}%`,
                          background: record.confidence > 80 ? '#10b981' : '#f59e0b'
                        }}
                      />
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(record.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Appointment Timeline */}
      {data.appointments && data.appointments.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>📅 Appointment History</h2>
          <div className={styles.timeline}>
            {data.appointments.slice(0, 10).map((apt, idx) => (
              <div key={idx} className={styles.timelineItem}>
                <div className={styles.timelineDate}>{apt.date} {apt.time && `at ${apt.time}`}</div>
                <div className={styles.timelineTitle}>{apt.doctorName} — {apt.specialization}</div>
                <div className={styles.timelineDetail}>{apt.clinicName} • {apt.mode} Mode</div>
                <span className={`${styles.timelineBadge} ${
                  apt.status === 'completed' ? styles.badgeCompleted :
                  apt.status === 'cancelled' ? styles.badgeCancelled :
                  styles.badgeUpcoming
                }`}>
                  {apt.status?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Prescriptions */}
      {data.prescriptions && data.prescriptions.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>💊 Prescription History</h2>
          <div className={styles.prescriptionList}>
            {data.prescriptions.map((rx, idx) => (
              <div key={idx} className={styles.prescriptionCard}>
                <div className={styles.prescriptionHeader}>
                  <span className={styles.prescriptionDoctor}>
                    Dr. {rx.doctorName || 'Unknown'} — {rx.issuedDate ? new Date(rx.issuedDate).toLocaleDateString() : ''}
                  </span>
                  <span className={`${styles.prescriptionStatus} ${
                    rx.status === 'active' ? styles.statusActive : styles.statusExpired
                  }`}>
                    {rx.status?.toUpperCase()}
                  </span>
                </div>
                <div className={styles.medicineList}>
                  {rx.medicines?.map((med, mIdx) => (
                    <span key={mIdx} className={styles.medicinePill}>
                      {med.medicineName || med.name} {med.dosage ? `• ${med.dosage}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State for no records */}
      {(!data.appointments || data.appointments.length === 0) &&
       (!data.records || data.records.length === 0) &&
       (!data.prescriptions || data.prescriptions.length === 0) && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h2 className={styles.emptyTitle}>Your Health Passport is Empty</h2>
          <p className={styles.emptySubtext}>
            Book appointments, upload medical reports, or get AI analysis to build your health identity.
          </p>
        </div>
      )}
    </div>
  );
};

export default HealthPassport;
