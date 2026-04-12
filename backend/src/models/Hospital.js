const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    traffic: { type: Number, default: 0 },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
