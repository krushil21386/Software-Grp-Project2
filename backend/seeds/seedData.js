const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { doctors: mockDoctors, hospitals: mockHospitals, departments: mockDepartments } = require('../src/data/mockData');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Department = require('../src/models/Department');

const seedAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hackathon_platform');
        console.log('Connected to MongoDB');

        // 1. Seed Departments
        console.log('Seeding Departments...');
        let departmentMap = {}; // Maps mock ID to Mongo ObjectId
        for (const dep of mockDepartments) {
            let existing = await Department.findOne({ name: dep.name });
            if (!existing) {
                existing = await Department.create({
                    name: dep.name,
                    icon: dep.icon
                });
                console.log(`Created department: ${dep.name}`);
            }
            departmentMap[dep.id] = existing._id;
        }

        // 2. Seed Hospitals
        console.log('Seeding Hospitals...');
        for (const h of mockHospitals) {
            let existing = await Hospital.findOne({ name: h.name });
            
            // Map the mock department IDs to real ObjectIds
            const mappedDepartments = h.departments.map(depId => departmentMap[depId]).filter(id => id);

            if (!existing) {
                await Hospital.create({
                    name: h.name,
                    address: h.address,
                    phone: h.phone,
                    lat: h.lat,
                    lng: h.lng,
                    traffic: h.traffic,
                    departments: mappedDepartments
                });
                console.log(`Created hospital: ${h.name}`);
            } else {
                // Update existing hospital to have ObjectIds instead of numbers
                await Hospital.updateOne({ _id: existing._id }, { departments: mappedDepartments });
                console.log(`Updated hospital departments: ${h.name}`);
            }
        }

        // 3. Seed Doctors
        console.log('Seeding Doctors...');
        const hashedPassword = await bcrypt.hash('Password@123', 10);
        for (const d of mockDoctors) {
            const email = d.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@hospital.com';
            const existing = await User.findOne({ email });
            
            // Find hospital record to link
            const mockHospitalDesc = mockHospitals.find(mh => mh.id === d.hospitalId);
            let hospitalRecord = null;
            if (mockHospitalDesc) {
                hospitalRecord = await Hospital.findOne({ name: mockHospitalDesc.name });
            }

            if (!existing) {
                await User.create({
                    name: d.name,
                    email: email,
                    password: hashedPassword,
                    role: 'doctor',
                    specialty: d.specialty,
                    hospitalId: hospitalRecord ? hospitalRecord._id : null,
                    phone: d.phone || '555-0100',
                    address: d.address || 'Medical Center',
                    profileImage: d.image,
                    license: 'MCI-' + Math.floor(100000 + Math.random() * 900000),
                    isVerified: true
                });
                console.log(`Created doctor: ${d.name} (${email})`);
            } else {
                if(hospitalRecord) {
                    await User.updateOne({ _id: existing._id }, { hospitalId: hospitalRecord._id });
                }
                console.log(`Doctor ${d.name} already exists. Updated hospital links.`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedAll();
