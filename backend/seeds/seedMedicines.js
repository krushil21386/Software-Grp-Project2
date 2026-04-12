const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Medicine = require('../src/models/Medicine');

const medicines = [
    {
        name: "Paracetamol",
        category: "fever",
        price: 5,
        dosage: "500mg",
        precautions: "Take with food. Do not exceed 4g/day",
        requiresPrescription: false
    },
    {
        name: "Ibuprofen",
        category: "pain",
        price: 8,
        dosage: "400mg",
        precautions: "Take with food.",
        requiresPrescription: false
    },
    {
        name: "Amoxicillin",
        category: "infection",
        price: 15,
        dosage: "500mg",
        precautions: "Complete full course. Take after food.",
        requiresPrescription: true
    },
    {
        name: "Atorvastatin",
        category: "cholesterol",
        price: 25,
        dosage: "20mg",
        precautions: "Avoid grapefruit.",
        requiresPrescription: true
    },
    {
        name: "Metformin",
        category: "diabetes",
        price: 12,
        dosage: "500mg",
        precautions: "Take with meals.",
        requiresPrescription: true
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare');
        console.log('Connected to MongoDB');

        await Medicine.deleteMany({});
        await Medicine.insertMany(medicines);

        console.log('✅ Medicine data seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDB();
