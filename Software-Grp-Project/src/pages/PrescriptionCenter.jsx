import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './MedicalRecords.module.css'; // Reusing styles

const PrescriptionCenter = () => {
    const { authFetch } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await authFetch(`${backendUrl}/api/medical-records/me`);
                const data = await response.json();
                
                if (data.success) {
                    // Extract all prescriptions from all records
                    const allRx = data.data.reduce((acc, record) => {
                        if (record.prescriptionUrl) {
                            acc.push({
                                id: record._id,
                                doctorName: 'Clinical Prescription',
                                date: new Date(record.createdAt).toLocaleDateString(),
                                fileName: record.prescriptionFileName || 'prescription.pdf',
                                url: `${backendUrl}${record.prescriptionUrl}`
                            });
                        }
                        return acc;
                    }, []);
                    setPrescriptions(allRx);
                }
            } catch (err) {
                console.error('Failed to fetch prescriptions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
    }, [authFetch]);

    if (loading) return <div className={styles.loading}>Loading your prescriptions...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Prescription Center</h1>
                <p className={styles.subtitle}>Securely access and download your medical prescriptions</p>
            </div>

            {prescriptions.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📄</div>
                    <h3>No prescriptions found</h3>
                    <p>When your doctor uploads a prescription, it will appear here.</p>
                </div>
            ) : (
                <div className={styles.recordsGrid}>
                    {prescriptions.map((rx) => (
                        <div key={rx.id} className={styles.recordCard}>
                            <div className={styles.recordHeader}>
                                <div className={styles.recordIcon}>💊</div>
                                <div className={styles.recordInfo}>
                                    <h3>{rx.doctorName}</h3>
                                    <span>Issued on {rx.date}</span>
                                </div>
                            </div>
                            <div className={styles.recordBody}>
                                <p className={styles.fileName}>{rx.fileName}</p>
                            </div>
                            <div className={styles.recordFooter}>
                                <a 
                                    href={rx.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className={styles.downloadButton}
                                    download
                                >
                                    📥 Download Secure File
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrescriptionCenter;
