const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    dosage: { type: String },
    precautions: { type: String },
    requiresPrescription: { type: Boolean, default: false },
    stock: { type: Number, default: 50 },
    image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
