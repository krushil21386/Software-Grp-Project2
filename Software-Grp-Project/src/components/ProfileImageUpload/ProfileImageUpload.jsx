import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ProfileImageUpload.module.css';

const ProfileImageUpload = ({ size = 100 }) => {
  const { user, authFetch, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fallback to initial if no profile image exists
  const fallbackInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Optional: Validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File is too large! Please upload something under 2MB.');
      return;
    }

    setIsUploading(true);
    
    // Read the file as a Base64 string
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result;

      try {
        // Send to backend
        const res = await authFetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage: base64String })
        });

        const data = await res.json();
        if (data.success) {
          // Update global context
          updateUser({ profileImage: base64String });
        } else {
          alert('Failed to update profile image.');
        }
      } catch (err) {
        console.error('Image upload failed', err);
        alert('An error occurred during upload.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      alert('Error reading the file.');
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className={styles.uploadContainer} 
      style={{ width: size, height: size }}
      onClick={handleImageClick}
      title="Click to update profile photo"
    >
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className={styles.hiddenInput} 
      />
      
      {user?.profileImage ? (
        <img 
          src={user.profileImage} 
          alt="Profile" 
          className={styles.profileImage} 
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {fallbackInitial}
        </div>
      )}

      {/* Overlay on Hover */}
      <div className={styles.overlay}>
        {isUploading ? (
          <span className={styles.spinner}>⌛</span>
        ) : (
          <span className={styles.cameraIcon}>📷</span>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;
