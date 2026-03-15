// Map utility functions for calculating distances and finding nearest doctors

export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Haversine formula to calculate distance between two coordinates
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

export const findNearestDoctors = (userLat, userLng, doctors, hospitals, specialty = null, maxDistance = 50) => {
  // Filter by specialty if provided
  let filteredDoctors = specialty
    ? doctors.filter(doctor => doctor.specialty.toLowerCase() === specialty.toLowerCase())
    : doctors;

  // Calculate distance for each doctor and add hospital info
  const doctorsWithDistance = filteredDoctors.map(doctor => {
    const hospital = hospitals.find(h => h.id === doctor.hospitalId);
    if (!hospital) return null;

    const distance = calculateDistance(userLat, userLng, hospital.lat, hospital.lng);
    const estimatedTravelTime = calculateTravelTime(distance, hospital.traffic);

    return {
      ...doctor,
      hospital: {
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        lat: hospital.lat,
        lng: hospital.lng,
        traffic: hospital.traffic,
      },
      distance: parseFloat(distance.toFixed(2)),
      estimatedTravelTime: estimatedTravelTime,
      totalScore: calculateTotalScore(distance, hospital.traffic, doctor.rating),
    };
  }).filter(doctor => doctor !== null && doctor.distance <= maxDistance);

  // Sort by total score (considering distance, traffic, and rating)
  doctorsWithDistance.sort((a, b) => b.totalScore - a.totalScore);

  return doctorsWithDistance;
};

const calculateTravelTime = (distanceKm, traffic) => {
  // Base speed in km/h (assuming average city speed of 40 km/h)
  const baseSpeed = 40;
  // Traffic factor (0 = no traffic, 1 = heavy traffic)
  const adjustedSpeed = baseSpeed * (1 - traffic * 0.6); // Heavy traffic reduces speed by up to 60%
  const timeHours = distanceKm / adjustedSpeed;
  return Math.ceil(timeHours * 60); // Return time in minutes
};

const calculateTotalScore = (distance, traffic, rating) => {
  // Score calculation considering multiple factors
  // Lower distance = higher score
  // Lower traffic = higher score
  // Higher rating = higher score
  const distanceScore = Math.max(0, 100 - distance * 10); // Max 100 points for distance
  const trafficScore = (1 - traffic) * 50; // Max 50 points for low traffic
  const ratingScore = rating * 10; // Max 50 points for rating (5.0 * 10)

  return distanceScore + trafficScore + ratingScore;
};

export const getTrafficLevel = (traffic) => {
  if (traffic < 0.3) return { level: 'Low', color: '#10b981' };
  if (traffic < 0.6) return { level: 'Medium', color: '#f59e0b' };
  return { level: 'High', color: '#ef4444' };
};
