import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './DoctorLocator.module.css';
import { doctors, hospitals } from '../utils/mockData';
import { findNearestDoctors, getTrafficLevel } from '../utils/mapUtils';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for doctors
const doctorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to update map view when user location changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const DoctorLocator = () => {
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [nearestDoctors, setNearestDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(6);
  const mapRef = useRef(null);

  const specialties = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Oncology', 'Emergency Medicine', 'Internal Medicine'];

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setMapCenter([lat, lng]);
          setMapZoom(10);
          findDoctors(lat, lng, selectedSpecialty);
          setLoading(false);
        },
        () => {
          // Default to New York if geolocation fails
          const defaultLat = 40.7128;
          const defaultLng = -74.0060;
          setUserLocation({ lat: defaultLat, lng: defaultLng });
          setMapCenter([defaultLat, defaultLng]);
          setMapZoom(6);
          findDoctors(defaultLat, defaultLng, selectedSpecialty);
          setLoading(false);
        }
      );
    } else {
      // Default location
      const defaultLat = 40.7128;
      const defaultLng = -74.0060;
      setUserLocation({ lat: defaultLat, lng: defaultLng });
      setMapCenter([defaultLat, defaultLng]);
      setMapZoom(6);
      findDoctors(defaultLat, defaultLng, selectedSpecialty);
      setLoading(false);
    }
  }, [selectedSpecialty]);

  const findDoctors = (lat, lng, specialty) => {
    const results = findNearestDoctors(lat, lng, doctors, hospitals, specialty, 100);
    setNearestDoctors(results);
    
    // Update map center to show all results if there are any
    if (results.length > 0) {
      const bounds = L.latLngBounds([[lat, lng]]);
      results.forEach(doctor => {
        bounds.extend([doctor.hospital.lat, doctor.hospital.lng]);
      });
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const handleSpecialtyChange = (e) => {
    setSelectedSpecialty(e.target.value);
  };

  const handleDoctorClick = (doctor) => {
    if (mapRef.current) {
      mapRef.current.setView([doctor.hospital.lat, doctor.hospital.lng], 13, {
        animate: true,
        duration: 1
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Find Nearest Doctor</h1>
        <p className={styles.subtitle}>
          Discover nearby healthcare providers with real-time traffic information
        </p>
      </div>

      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Filter by Specialty:</label>
        <select
          className={styles.select}
          value={selectedSpecialty}
          onChange={handleSpecialtyChange}
        >
          <option value="">All Specialties</option>
          {specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.content}>
        <div className={styles.mapSection}>
          <div className={styles.mapContainer}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%', borderRadius: '16px' }}
              whenCreated={mapInstance => { mapRef.current = mapInstance; }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} zoom={mapZoom} />
              
              {/* User location marker */}
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <strong>Your Location</strong>
                </Popup>
              </Marker>

              {/* Doctor/hospital markers */}
              {nearestDoctors.map((doctor) => (
                <Marker
                  key={doctor.id}
                  position={[doctor.hospital.lat, doctor.hospital.lng]}
                  icon={doctorIcon}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <strong>{doctor.name}</strong>
                      <br />
                      <span style={{ fontSize: '12px', color: '#666' }}>{doctor.specialty}</span>
                      <br />
                      <span style={{ fontSize: '12px' }}>{doctor.hospital.name}</span>
                      <br />
                      <span style={{ fontSize: '11px', color: '#888' }}>
                        {doctor.distance} km away
                      </span>
                      <br />
                      <Link
                        to={`/doctor/${doctor.id}`}
                        style={{ fontSize: '12px', color: '#DC143C', textDecoration: 'underline' }}
                      >
                        View Profile
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className={styles.resultsSection}>
          <h2 className={styles.resultsTitle}>
            Nearest Doctors ({nearestDoctors.length})
          </h2>
          <div className={styles.doctorsList}>
            {nearestDoctors.length > 0 ? (
              nearestDoctors.map((doctor) => {
                const trafficInfo = getTrafficLevel(doctor.hospital.traffic);
                return (
                  <div 
                    key={doctor.id} 
                    className={styles.doctorCard}
                    onClick={() => handleDoctorClick(doctor)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.doctorHeader}>
                      <div className={styles.doctorInfo}>
                        <h3 className={styles.doctorName}>{doctor.name}</h3>
                        <p className={styles.doctorSpecialty}>{doctor.specialty}</p>
                        <div className={styles.rating}>
                          <span className={styles.stars}>⭐ {doctor.rating}</span>
                          <span className={styles.reviews}>({doctor.reviews} reviews)</span>
                        </div>
                      </div>
                      <div className={styles.doctorImage}>
                        <img src={doctor.image} alt={doctor.name} />
                      </div>
                    </div>

                    <div className={styles.hospitalInfo}>
                      <p className={styles.hospitalName}>🏥 {doctor.hospital.name}</p>
                      <p className={styles.hospitalAddress}>{doctor.hospital.address}</p>
                      <p className={styles.hospitalPhone}>{doctor.hospital.phone}</p>
                    </div>

                    <div className={styles.distanceInfo}>
                      <div className={styles.distanceItem}>
                        <span className={styles.distanceLabel}>Distance:</span>
                        <span className={styles.distanceValue}>{doctor.distance} km</span>
                      </div>
                      <div className={styles.distanceItem}>
                        <span className={styles.distanceLabel}>Travel Time:</span>
                        <span className={styles.distanceValue}>{doctor.estimatedTravelTime} min</span>
                      </div>
                      <div className={styles.distanceItem}>
                        <span className={styles.distanceLabel}>Traffic:</span>
                        <span
                          className={styles.trafficBadge}
                          style={{ backgroundColor: trafficInfo.color }}
                        >
                          {trafficInfo.level}
                        </span>
                      </div>
                    </div>

                    <div className={styles.doctorDetails}>
                      <p className={styles.fee}>Consultation Fee: ${doctor.consultationFee}</p>
                      <p className={styles.availability}>
                        Available: {doctor.availability.days.join(', ')} - {doctor.availability.hours}
                      </p>
                    </div>

                    <div className={styles.actionButtons}>
                      <Link
                        to={`/doctor/${doctor.id}`}
                        className={styles.viewProfileButton}
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/book-appointment?doctorId=${doctor.id}`}
                        className={styles.bookButton}
                      >
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noResults}>
                <p>No doctors found nearby. Please try a different specialty or expand your search radius.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLocator;
