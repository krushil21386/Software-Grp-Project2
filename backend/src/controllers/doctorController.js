const Availability = require('../models/Availability');
const loggingService = require('../services/loggingService');

exports.getAvailability = async (req, res) => {
  try {
    let availability = await Availability.findOne({ doctorId: req.user.id });
    
    // If no availability record exists, return default (or create one)
    if (!availability) {
      return res.status(200).json({
        success: true,
        availability: {
          monday: { start: '9:00 AM', end: '5:00 PM', available: true },
          tuesday: { start: '9:00 AM', end: '5:00 PM', available: true },
          wednesday: { start: '9:00 AM', end: '5:00 PM', available: true },
          thursday: { start: '9:00 AM', end: '5:00 PM', available: true },
          friday: { start: '9:00 AM', end: '5:00 PM', available: true },
          saturday: { start: '10:00 AM', end: '2:00 PM', available: false },
          sunday: { start: '10:00 AM', end: '2:00 PM', available: false },
        }
      });
    }

    res.status(200).json({
      success: true,
      availability: availability.schedule,
      specificDates: availability.specificDates || []
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { schedule } = req.body;
    
    if (!schedule) {
      return res.status(400).json({ success: false, message: 'Schedule is required' });
    }

    const availability = await Availability.findOneAndUpdate(
      { doctorId: req.user.id },
      { 
        schedule,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    // Record audit log
    await loggingService.recordLog({
      userId: req.user.id,
      action: 'UPDATE_AVAILABILITY',
      category: 'USER',
      status: 'SUCCESS',
      details: { doctorId: req.user.id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availability: availability.schedule
    });
  } catch (err) {
    console.error('Error updating availability:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDateAvailability = async (req, res) => {
  try {
    const { date, start, end, available } = req.body;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    let availability = await Availability.findOne({ doctorId: req.user.id });
    if (!availability) {
      availability = new Availability({ doctorId: req.user.id, schedule: {}, specificDates: [] });
    }

    // Remove existing entry for this date if it exists
    availability.specificDates = availability.specificDates.filter(d => d.date !== date);

    // Add new entry
    availability.specificDates.push({ date, start, end, available });
    
    availability.updatedAt = Date.now();
    await availability.save();

    res.status(200).json({
      success: true,
      message: `Availability for ${date} updated successfully`,
      specificDates: availability.specificDates
    });
  } catch (err) {
    console.error('Error updating date availability:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
