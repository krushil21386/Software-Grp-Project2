import React, { useState, useRef, useEffect } from 'react';
import styles from './MedicineAI.module.css';
import { suggestMedicine, analyzeMedicalReport } from '../utils/medicineAI';

const MedicineAI = () => {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [allergies, setAllergies] = useState('');
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setResults(null); // Clear previous results
    }
  };

  // Draw bounding boxes when results are available
  useEffect(() => {
    if (!results || !results.fromReport || !imagePreview || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scaling factors (in case image is displayed at different size than original analysis)
    // Tesseract coordinates are based on the original image dimensions.
    // We assume the image loaded in <img> is the full resolution for simplicity, 
    // or we'd need the original dimensions from the API.
    // For specific UI, CSS sizing might affect this.
    // Let's assume natural size for now.

    const scaleX = img.width / img.naturalWidth;
    const scaleY = img.height / img.naturalHeight;

    if (results.extractedValues) {
      results.extractedValues.forEach(item => {
        if (item.bbox) {
          const { x0, y0, x1, y1 } = item.bbox;

          // Color code based on status
          let color = 'green';
          if (item.value < item.range.min || item.value > item.range.max) {
            color = 'red';
          }

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(
            x0 * scaleX,
            y0 * scaleY,
            (x1 - x0) * scaleX,
            (y1 - y0) * scaleY
          );
        }
      });
    }

  }, [results, imagePreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      let aiResults = null;

      // If file is present, analyze it with DeepSeek-OCR-2
      if (file) {
        try {
          const reportAnalysis = await analyzeMedicalReport(file);
          if (reportAnalysis.success) {
          const data = reportAnalysis.data;
          
          // Get identified diseases from OCR analysis
          const identifiedDiseases = data.diseases || [];
          const disease = data.disease || "No specific disease identified";
          
          // Use medicine suggestions from backend if available
          let medicineSuggestions = data.medicineSuggestions || [];
          
          // If no backend suggestions, generate from identified diseases
          if (medicineSuggestions.length === 0 && identifiedDiseases.length > 0) {
            const combinedSymptoms = identifiedDiseases.join(', ');
            const allergyList = allergies.split(',').map(a => a.trim()).filter(a => a);
            const symptomBasedResults = suggestMedicine(combinedSymptoms, age ? parseInt(age) : null, allergyList);
            medicineSuggestions = symptomBasedResults.suggestions;
          }
          
          // If still no suggestions, use symptom-based approach
          if (medicineSuggestions.length === 0) {
            const combinedSymptoms = disease !== "No specific disease identified" 
              ? `${symptoms} ${disease}` 
              : symptoms;
            const allergyList = allergies.split(',').map(a => a.trim()).filter(a => a);
            const symptomBasedResults = suggestMedicine(combinedSymptoms, age ? parseInt(age) : null, allergyList);
            medicineSuggestions = symptomBasedResults.suggestions;
          }

          // Merge specialized AI data with OCR results
          aiResults = {
            suggestions: medicineSuggestions,
            matchedSymptoms: identifiedDiseases.length > 0 ? identifiedDiseases : (symptoms ? [symptoms] : []),
            severityWarnings: data.diagnosisReport?.findings?.filter(f => f.status !== 'Normal').map(f => f.message) || [],
            disclaimer: 'These suggestions are based on OCR analysis of your medical report. Always consult a healthcare professional before taking any medication.',
            fromReport: true, // Flag for canvas effect
            extractedDisease: disease,
            identifiedDiseases: identifiedDiseases,
            extractedText: data.rawText,
            extractedValues: data.extractedValues, // {testName, value, units, range}
            diagnosisReport: data.diagnosisReport
          };
          }
        } catch (reportError) {
          // Handle backend unavailability gracefully
          const errorMessage = reportError.message || '';
          if (errorMessage === 'BACKEND_UNAVAILABLE' || 
              errorMessage === 'BACKEND_TIMEOUT' ||
              reportError.name === 'AbortError' ||
              errorMessage.includes('aborted') ||
              errorMessage.includes('timeout')) {
            console.warn('Backend server is not available or timed out. Falling back to symptom-based analysis.');
            
            // Fallback to symptom-based analysis
            const allergyList = allergies.split(',').map(a => a.trim()).filter(a => a);
            const fallbackResults = suggestMedicine(symptoms || 'general symptoms', age ? parseInt(age) : null, allergyList);
            
            // Add a warning about backend unavailability
            fallbackResults.backendUnavailable = true;
            fallbackResults.backendMessage = (errorMessage === 'BACKEND_TIMEOUT' || errorMessage.includes('timeout') || reportError.name === 'AbortError')
              ? 'OCR processing timed out (takes 1-2 minutes). Using symptom-based analysis instead. Please try again or use symptom-based analysis.'
              : 'Backend server is not running. Using symptom-based analysis instead. Please start the backend server for full OCR analysis.';
            
            aiResults = fallbackResults;
          } else {
            // Re-throw other errors
            throw reportError;
          }
        }
      }

      if (!aiResults) {
        // Fallback to text only
        const allergyList = allergies.split(',').map(a => a.trim()).filter(a => a);
        aiResults = suggestMedicine(symptoms, age ? parseInt(age) : null, allergyList);
      }

      setResults(aiResults);

    } catch (error) {
      console.error("AI Error", error);
      
      // Provide more helpful error messages
      let errorMessage = "Failed to analyze. Please try again.";
      
      if (error.message === 'BACKEND_UNAVAILABLE') {
        errorMessage = "Backend server is not running. Please start the backend server for full OCR analysis, or use symptom-based analysis without uploading a file.";
      } else if (error.message === 'BACKEND_TIMEOUT') {
        errorMessage = "Backend server timed out. Please check if the server is running and try again.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Cannot connect to backend server. Please ensure the backend server is running on port 5000.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AI Medicine Suggestion</h1>
        <p className={styles.subtitle}>
          Enter your symptoms and get personalized medicine recommendations
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>📄 Upload Medical Report (Optional - Uses DeepSeek-OCR-2)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
          />
          <small style={{ color: '#cbd5e0', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            Upload a clear image of your medical report. DeepSeek-OCR-2 will extract text, identify diseases, and suggest medicines automatically.
          </small>

          {imagePreview && (
            <div className={styles.imagePreviewContainer} style={{ position: 'relative', marginTop: '1rem', border: '1px solid #ccc' }}>
              <img
                ref={imageRef}
                src={imagePreview}
                alt="Report Preview"
                style={{ maxWidth: '100%', display: 'block' }}
              />
              <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              />
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Describe your symptoms {!file && '*'}</label>
          <textarea
            className={styles.textarea}
            placeholder="e.g., I have a fever and headache for the past 2 days... (Optional if uploading a report)"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            required={!file}
            rows={5}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Age (optional)</label>
            <input
              type="number"
              className={styles.input}
              placeholder="25"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              max="120"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Known Allergies (optional)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Paracetamol, Penicillin (comma separated)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Medicine Suggestions →'}
        </button>
      </form>

      {results && (
        <div className={styles.results}>
          {results.backendUnavailable && (
            <div className={styles.warningBox} style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--color-text-primary)', 
              borderColor: 'var(--color-crimson)', 
              border: '2px solid var(--color-crimson)', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '24px' 
            }}>
              <h3 style={{ color: 'var(--color-crimson)', marginBottom: '12px', fontSize: '18px' }}>⚠️ Backend Server Unavailable</h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                {results.backendMessage || 'The backend server is not running. Analysis is using symptom-based suggestions only.'}
              </p>
              <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                To enable full OCR analysis, please start the backend server by running: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>cd backend && npm start</code>
              </p>
            </div>
          )}
          
          {results.fromReport && (
            <div className={styles.warningBox} style={{ backgroundColor: 'rgba(220, 20, 60, 0.2)', color: '#ffffff', borderColor: '#DC143C', border: '2px solid rgba(220, 20, 60, 0.5)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ color: '#DC143C', marginBottom: '16px', fontSize: '24px' }}>📋 DeepSeek-OCR-2 Report Analysis</h3>
              
              {results.identifiedDiseases && results.identifiedDiseases.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: '#DC143C' }}>Identified Diseases/Conditions:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {results.identifiedDiseases.map((disease, idx) => (
                      <span key={idx} style={{ 
                        background: 'rgba(239, 68, 68, 0.3)', 
                        color: '#ef4444', 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid rgba(239, 68, 68, 0.5)'
                      }}>
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#DC143C' }}>Overall Assessment:</strong> {results.extractedDisease}
              </p>

              {results.diagnosisReport && results.diagnosisReport.findings.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <strong style={{ color: '#DC143C' }}>Key Findings:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    {results.diagnosisReport.findings.map((finding, idx) => (
                      <li key={idx} style={{ 
                        color: finding.status === 'Normal' ? '#10b981' : '#ef4444',
                        marginBottom: '6px',
                        fontSize: '14px'
                      }}>
                        <strong>{finding.testName}:</strong> {finding.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {results.extractedValues && results.extractedValues.length > 0 && (
            <div className={styles.tableContainer} style={{ 
              margin: '20px 0', 
              overflowX: 'auto',
              background: 'linear-gradient(150deg, rgba(30, 64, 175, 0.4), rgba(15, 23, 42, 0.9))',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(148, 163, 184, 0.25)'
            }}>
              <h3 style={{ marginBottom: '16px', color: '#DC143C', fontSize: '20px' }}>🔬 Lab Results (Extracted by DeepSeek-OCR-2)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', textAlign: 'left' }}>
                    <th style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#DC143C' }}>Test Name</th>
                    <th style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#DC143C' }}>Value</th>
                    <th style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#DC143C' }}>Normal Range</th>
                    <th style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#DC143C' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.extractedValues.map((item, idx) => {
                    let statusColor = '#10b981';
                    let statusText = 'Normal';
                    if (item.value < item.range.min) { statusColor = '#ef4444'; statusText = 'Low'; }
                    if (item.value > item.range.max) { statusColor = '#ef4444'; statusText = 'High'; }

                    return (
                      <tr key={idx} style={{ background: statusText !== 'Normal' ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                        <td style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#e2e8f0' }}>{item.testName}</td>
                        <td style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#e2e8f0', fontWeight: '600' }}>{item.value} {item.units}</td>
                        <td style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#cbd5e0' }}>{item.range.min} - {item.range.max} {item.units}</td>
                        <td style={{ padding: '12px', border: '1px solid rgba(148, 163, 184, 0.3)', color: statusColor, fontWeight: 'bold' }}>{statusText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {results.severityWarnings && results.severityWarnings.length > 0 && (
            <div className={styles.warningBox}>
              <h3>⚠️ Important Warning</h3>
              {results.severityWarnings.map((warning, idx) => (
                <p key={idx}>{warning}</p>
              ))}
            </div>
          )}

          {results.matchedSymptoms && results.matchedSymptoms.length > 0 && (
            <div className={styles.matchedSymptoms}>
              <h3>Matched Symptoms:</h3>
              <div className={styles.symptomTags}>
                {results.matchedSymptoms.map((symptom, idx) => (
                  <span key={idx} className={styles.tag}>{symptom}</span>
                ))}
              </div>
            </div>
          )}

          {results.suggestions && results.suggestions.length > 0 ? (
            <div className={styles.suggestions}>
              <h3 style={{ color: '#DC143C', marginBottom: '20px' }}>
                💊 Recommended Medicines (Based on {results.fromReport ? 'Report Analysis' : 'Symptoms'}):
              </h3>
              {results.suggestions.map((medicine, idx) => (
                <div key={idx} className={styles.medicineCard} style={{ 
                  background: 'linear-gradient(150deg, rgba(30, 64, 175, 0.4), rgba(15, 23, 42, 0.9))',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  marginBottom: '16px',
                  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 35px rgba(220, 20, 60, 0.3)'
                }}>
                  <div className={styles.medicineHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: 0 }}>{medicine.name}</h4>
                    {medicine.confidence && (
                      <span className={styles.confidence} style={{ 
                        background: 'rgba(220, 20, 60, 0.3)', 
                        color: '#DC143C', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {(medicine.confidence * 100).toFixed(0)}% match
                      </span>
                    )}
                    {medicine.forDisease && (
                      <span style={{ 
                        background: 'rgba(239, 68, 68, 0.3)', 
                        color: '#ef4444', 
                        padding: '4px 12px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginLeft: '8px'
                      }}>
                        For: {medicine.forDisease}
                      </span>
                    )}
                  </div>
                  <div className={styles.medicineDetails} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className={styles.detailItem} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={styles.detailLabel} style={{ color: '#cbd5e0', fontSize: '12px', fontWeight: '600' }}>Dosage:</span>
                      <span style={{ color: '#ffffff', fontSize: '14px' }}>{medicine.dosage}</span>
                    </div>
                    <div className={styles.detailItem} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={styles.detailLabel} style={{ color: '#cbd5e0', fontSize: '12px', fontWeight: '600' }}>Frequency:</span>
                      <span style={{ color: '#ffffff', fontSize: '14px' }}>{medicine.frequency}</span>
                    </div>
                    <div className={styles.detailItem} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={styles.detailLabel} style={{ color: '#cbd5e0', fontSize: '12px', fontWeight: '600' }}>Duration:</span>
                      <span style={{ color: '#ffffff', fontSize: '14px' }}>{medicine.duration}</span>
                    </div>
                    {medicine.precautions && (
                      <div className={styles.precautions} style={{ gridColumn: '1 / -1', marginTop: '8px', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px' }}>
                        <span className={styles.detailLabel} style={{ color: '#DC143C', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>⚠️ Precautions:</span>
                        <span style={{ color: '#cbd5e0', fontSize: '14px' }}>{medicine.precautions}</span>
                      </div>
                    )}
                  </div>
                  {medicine.symptom && !medicine.forDisease && (
                    <div className={styles.symptomBadge} style={{ 
                      marginTop: '12px', 
                      padding: '8px 12px', 
                      background: 'rgba(220, 20, 60, 0.3)', 
                      color: '#DC143C', 
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      For: {medicine.symptom}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noResults} style={{ textAlign: 'center', padding: '40px', color: '#cbd5e0' }}>
              <p>No specific medicine suggestions found. Please consult a healthcare professional.</p>
            </div>
          )}

          <div className={styles.disclaimer}>
            <p>{results.disclaimer}</p>
          </div>

          {results.extractedText && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <details>
                <summary style={{ cursor: 'pointer', color: '#666' }}>Show Raw Extracted Text (For Debugging)</summary>
                <pre style={{
                  background: '#f4f4f4',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {results.extractedText}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineAI;
