const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Mongoose User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    phone: { type: String },
    age: { type: Number },
    gender: { type: String },
    address: { type: String },
    specialty: { type: String },
    license: { type: String },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lastLogin: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const doctors = [
  {
    name: "Dr. Monika Panchal",
    specialty: "Cardiology",
    image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Dr. Dharmesh Pandya",
    specialty: "Neurology",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTB8fGluZGlhbiUyMGRvY3RvcnN8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Dr. Dilip Vyas",
    specialty: "Physiotherapist",
    image: "https://wockhardthospitals.com/wp-content/uploads/2023/05/Dr.-Dilip-Vyas-2.jpg",
  },
  {
    name: "Dr. Rahul Sharma",
    specialty: "Cardiologist",
    image: "https://www.jaipurcardiologist.com/wp-content/uploads/2023/12/WhatsApp-Image-2023-12-26-at-01.24.41_add3ad4e.jpeg",
  },
  {
    name: "Dr. Praful Parmar",
    specialty: "Dermatology",
    image: "https://content.jdmagicbox.com/v2/comp/silvassa/k9/9999px260.x260.200915231302.y9k9/catalogue/dr-ritesh-parmar-best-brain-and-spine-surgeon-amli-silvassa-clinics-gqvd4enuq1-250.jpg",
  },
  {
    name: "Dr. Kirti Shah",
    specialty: "Oncology",
    image: "https://plus.unsplash.com/premium_photo-1682089874677-3eee554feb19?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTN8fGluZGlhbiUyMGRvY3RvcnN8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Dr. Mohit Anand",
    specialty: "Neurology",
    image: "https://www.artemishospitals.com/BackEndImages/DoctorImage/dr-dr-mohit-anand.jpg",
  },
  {
    name: "Dr. Yogendra Singh",
    specialty: "Mental Health & Internal Medicine",
    image: "https://www.fortishealthcare.com/drupal-data/doctors/dr-yogendra-singh-9001.jpg",
  }
];

const seedDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hackathon_platform');
        console.log('Connected to MongoDB');

        const hashedPassword = await bcrypt.hash('Password@123', 10);
        let inserted = 0;

        for (const doc of doctors) {
            // make email from name
            const email = doc.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@example.com';
            
            // Check if exists
            const existing = await User.findOne({ email });
            if (!existing) {
                await User.create({
                    name: doc.name,
                    email: email,
                    password: hashedPassword,
                    role: 'doctor',
                    specialty: doc.specialty,
                    profileImage: doc.image,
                    isVerified: true
                });
                console.log(`Created user for ${doc.name} (${email})`);
                inserted++;
            } else {
                const mockLicense = 'MCI-' + Math.floor(100000 + Math.random() * 900000);
                console.log(`User ${doc.name} already exists. Applying license ${mockLicense}...`);
                await User.updateOne({ email }, { profileImage: doc.image, license: mockLicense });
            }
        }

        console.log(`Seeding complete. Inserted ${inserted} new doctors.`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedDoctors();
