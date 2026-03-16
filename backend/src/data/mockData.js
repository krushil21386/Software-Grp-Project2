// Mock data for hospitals, departments, and doctors
// Moved from root mockData.js → backend/src/data/mockData.js

const hospitals = [
  { id: 1, name: 'City General Hospital',       address: '123 Medical Center Dr, New York, NY 10001',   phone: '(555) 123-4567', lat: 40.7128, lng: -74.0060,   traffic: 0.3, departments: [1, 2, 3, 4, 5] },
  { id: 2, name: 'Metro Health Care',            address: '456 Hospital Ave, Los Angeles, CA 90001',     phone: '(555) 234-5678', lat: 34.0522, lng: -118.2437,  traffic: 0.5, departments: [1, 2, 3, 6, 7] },
  { id: 3, name: 'University Medical Center',    address: '789 Health Blvd, Chicago, IL 60601',          phone: '(555) 345-6789', lat: 41.8781, lng: -87.6298,   traffic: 0.2, departments: [2, 3, 4, 5, 6, 7, 8] },
  { id: 4, name: 'Regional Medical Center',      address: '321 Care Street, Houston, TX 77001',          phone: '(555) 456-7890', lat: 29.7604, lng: -95.3698,   traffic: 0.4, departments: [1, 3, 5, 6, 8] },
  { id: 5, name: 'Parkview Hospital',            address: '654 Wellness Road, Phoenix, AZ 85001',        phone: '(555) 567-8901', lat: 33.4484, lng: -112.0740,  traffic: 0.6, departments: [1, 2, 4, 7] },
];

const departments = [
  { id: 1, name: 'Cardiology',         icon: '❤️'  },
  { id: 2, name: 'Neurology',          icon: '🧠'  },
  { id: 3, name: 'Orthopedics',        icon: '🦴'  },
  { id: 4, name: 'Pediatrics',         icon: '👶'  },
  { id: 5, name: 'Dermatology',        icon: '🧴'  },
  { id: 6, name: 'Oncology',           icon: '🎗️'  },
  { id: 7, name: 'Emergency Medicine', icon: '🚨'  },
  { id: 8, name: 'Internal Medicine',  icon: '🩺'  },
];

const doctors = [
  { id: 1, name: 'Dr. Monika Panchal',  specialty: 'Cardiology',         departmentId: 1, hospitalId: 1, experience: '15 years', education: 'MD, Harvard Medical School',          rating: 4.9,  reviews: 342, image: 'https://i.pravatar.cc/150?img=47', bio: 'Board-certified cardiologist with expertise in preventive cardiology.',        availability: { days: ['Mon','Wed','Fri'],                    hours: '9:00 AM - 5:00 PM' }, consultationFee: 250, languages: ['English','Spanish'] },
  { id: 2, name: 'Dr. Dharmesh Pandya',   specialty: 'Neurology',           departmentId: 2, hospitalId: 2, experience: '12 years', education: 'MD, Johns Hopkins University',        rating: 4.8,  reviews: 289, image: 'https://i.pravatar.cc/150?img=12', bio: 'Specialized in neurological disorders, stroke management.',                    availability: { days: ['Tue','Thu','Sat'],                    hours: '10:00 AM - 6:00 PM' }, consultationFee: 300, languages: ['English','Mandarin'] },
  { id: 3, name: 'Dr. Dilip Vyas',specialty: 'Pediatrics',          departmentId: 4, hospitalId: 3, experience: '10 years', education: 'MD, Stanford Medical School',         rating: 4.95, reviews: 456, image: 'https://i.pravatar.cc/150?img=45', bio: 'Dedicated pediatrician focused on child development.',                         availability: { days: ['Mon','Tue','Wed','Thu'],              hours: '8:00 AM - 4:00 PM' }, consultationFee: 200, languages: ['English','Spanish','French'] },
  { id: 4, name: 'Dr. Rahul Sharma',   specialty: 'Orthopedics',         departmentId: 3, hospitalId: 1, experience: '18 years', education: 'MD, Mayo Clinic',                    rating: 4.7,  reviews: 523, image: 'https://i.pravatar.cc/150?img=33', bio: 'Expert in joint replacement, sports medicine, and spinal surgery.',            availability: { days: ['Mon','Wed','Fri'],                    hours: '7:00 AM - 3:00 PM' }, consultationFee: 350, languages: ['English'] },
  { id: 5, name: 'Dr. Praful Parmar',    specialty: 'Dermatology',         departmentId: 5, hospitalId: 3, experience: '8 years',  education: 'MD, University of Pennsylvania',     rating: 4.85, reviews: 378, image: 'https://i.pravatar.cc/150?img=9',  bio: 'Specialized in cosmetic dermatology and skin cancer treatment.',               availability: { days: ['Tue','Thu','Sat'],                    hours: '9:00 AM - 5:00 PM' }, consultationFee: 275, languages: ['English','Hindi','Gujarati'] },
  { id: 6, name: 'Dr. Kirti Shah',     specialty: 'Oncology',            departmentId: 6, hospitalId: 2, experience: '20 years', education: 'MD, MD Anderson Cancer Center',      rating: 4.9,  reviews: 412, image: 'https://i.pravatar.cc/150?img=51', bio: 'Leading oncologist with expertise in breast cancer.',                          availability: { days: ['Mon','Tue','Wed','Thu','Fri'],        hours: '8:00 AM - 4:00 PM' }, consultationFee: 400, languages: ['English','Korean'] },
  { id: 7, name: 'Dr. Dhyanchand Rathod',  specialty: 'Emergency Medicine',  departmentId: 7, hospitalId: 4, experience: '14 years', education: 'MD, University of Chicago',          rating: 4.75, reviews: 267, image: 'https://i.pravatar.cc/150?img=23', bio: 'Emergency medicine specialist with experience in trauma.',                     availability: { days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], hours: '24/7' },   consultationFee: 300, languages: ['English','German'] },
  { id: 8, name: 'Dr. Yogendra Singh', specialty: 'Internal Medicine',   departmentId: 8, hospitalId: 3, experience: '16 years', education: 'MD, Yale School of Medicine',        rating: 4.8,  reviews: 391, image: 'https://i.pravatar.cc/150?img=14', bio: 'Comprehensive primary care physician focused on chronic disease management.',  availability: { days: ['Mon','Tue','Wed','Thu','Fri'],        hours: '9:00 AM - 5:00 PM' }, consultationFee: 225, languages: ['English','Spanish'] },
];

module.exports = { hospitals, departments, doctors };
