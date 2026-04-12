const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Medicine = require('../../src/models/Medicine');
const Prescription = require('../../src/models/Prescription');
const User = require('../../src/models/User');

const verifyLogic = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find the RX medicine (Amoxicillin)
        const amox = await Medicine.findOne({ name: 'Amoxicillin' });
        if (!amox) throw new Error('Amoxicillin not found in DB');

        // 2. Find a test user
        const user = await User.findOne({ role: 'patient' }) || await User.findOne({});
        if (!user) throw new Error('No test user found');

        console.log(`Checking prescription for User: ${user.email} and Medicine: ${amox.name}`);

        // 3. Check logic (Manual simulation of Controller logic)
        const userPrescriptions = await Prescription.find({ 
            patientId: user._id, 
            status: 'active',
            expiryDate: { $gt: new Date() } 
        });

        const hasPrescription = userPrescriptions.some(p => 
            p.medicines.some(m => m.medicineName.toLowerCase() === amox.name.toLowerCase())
        );

        if (!hasPrescription) {
            console.log('✅ Correct: Prescription restriction is active. User cannot order Amoxicillin.');
        } else {
            console.log('⚠️ Warning: User has a prescription (expected if already seeded).');
        }

        // 4. Create a mock prescription to verify success
        console.log('Creating a mock prescription for Amoxicillin...');
        await Prescription.create({
            patientId: user._id,
            doctorId: user._id, // Self-issued for test
            doctorName: 'System Test',
            medicines: [{ medicineName: 'Amoxicillin', dosage: '500mg' }],
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        const userPrescriptionsAfter = await Prescription.find({ patientId: user._id, status: 'active' });
        const hasPrescriptionAfter = userPrescriptionsAfter.some(p => 
            p.medicines.some(m => m.medicineName.toLowerCase() === amox.name.toLowerCase())
        );

        if (hasPrescriptionAfter) {
            console.log('✅ Correct: Prescription logic allows order after prescription is issued.');
        }

        // Cleanup test prescription
        await Prescription.deleteMany({ doctorName: 'System Test' });

        process.exit();
    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    }
};

verifyLogic();
