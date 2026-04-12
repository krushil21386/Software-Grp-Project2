const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema({
  start: { type: String, default: '9:00 AM' },
  end: { type: String, default: '5:00 PM' },
  available: { type: Boolean, default: true }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  schedule: {
    monday: { type: dayScheduleSchema, default: {} },
    tuesday: { type: dayScheduleSchema, default: {} },
    wednesday: { type: dayScheduleSchema, default: {} },
    thursday: { type: dayScheduleSchema, default: {} },
    friday: { type: dayScheduleSchema, default: {} },
    saturday: { type: dayScheduleSchema, default: { available: false, start: '10:00 AM', end: '2:00 PM' } },
    sunday: { type: dayScheduleSchema, default: { available: false, start: '10:00 AM', end: '2:00 PM' } },
  },
  specificDates: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    start: { type: String },
    end: { type: String },
    available: { type: Boolean, default: true },
    _id: false
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Availability', availabilitySchema);
