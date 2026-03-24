const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

const getAnalytics = async (doctorNameOrId = null, isId = false) => {
    let matchFilter = {};
    if (doctorNameOrId) {
        if (isId || mongoose.Types.ObjectId.isValid(doctorNameOrId)) {
            const docId = new mongoose.Types.ObjectId(doctorNameOrId);
            const User = require('../models/User');
            const doctor = await User.findById(docId);
            
            matchFilter = {
                $or: [
                    { doctorId: docId },
                    ...(doctor ? [{ doctorName: doctor.name }] : [])
                ]
            };
        } else {
            matchFilter = { doctorName: doctorNameOrId };
        }
    }

    const totalAppointments = await Appointment.countDocuments(matchFilter);
    
    // Doctor performance stats
    const doctorStatsPipelines = [];
    if (Object.keys(matchFilter).length > 0) doctorStatsPipelines.push({ $match: matchFilter });
    doctorStatsPipelines.push({ $group: { 
        _id: "$doctorName", 
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        upcoming: { $sum: { $cond: [{ $eq: ["$status", "upcoming"] }, 1, 0] } }
    }});
    const doctorStats = await Appointment.aggregate(doctorStatsPipelines);

    // Emergency frequency
    const emergencyCount = await Appointment.countDocuments({ ...matchFilter, isUrgent: true });
    
    // Appointment completion rate
    const completedCount = await Appointment.countDocuments({ ...matchFilter, status: 'completed' });
    const completionRate = totalAppointments > 0 ? ((completedCount / totalAppointments) * 100).toFixed(2) : 0;

    // Daily summary
    const dailyPipelines = [];
    if (Object.keys(matchFilter).length > 0) dailyPipelines.push({ $match: matchFilter });
    dailyPipelines.push({ $group: {
        _id: "$date",
        totalAppointments: { $sum: 1 },
        emergencies: { $sum: { $cond: ["$isUrgent", 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
    }});
    dailyPipelines.push({ $sort: { _id: 1 } });
    const dailySummaryRaw = await Appointment.aggregate(dailyPipelines);
    
    // Format dailySummary for Recharts
    const dailySummary = dailySummaryRaw.map(day => ({
         date: day._id,
         totalAppointments: day.totalAppointments,
         emergencies: day.emergencies,
         completed: day.completed,
         cancelled: day.cancelled
    }));

    return {
        totalAppointments,
        emergencyCount,
        completionRate: `${completionRate}%`,
        doctorStats: (doctorNameOrId) ? doctorStats[0] || null : doctorStats,
        dailySummary
    };
};

module.exports = {
    getAnalytics
};
