const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
