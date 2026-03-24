const analyticsService = require('../services/analyticsService');

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await analyticsService.getAnalytics();
        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Analytics Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve analytics', error: error.message });
    }
};

exports.getDoctorStats = async (req, res) => {
    try {
        const doctorName = req.params.doctorName;
        const stats = await analyticsService.getAnalytics(doctorName, false);
        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Doctor Analytics Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve doctor analytics', error: error.message });
    }
};

exports.getDoctorStatsById = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const stats = await analyticsService.getAnalytics(doctorId, true);
        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Doctor Analytics By ID Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve doctor analytics by ID', error: error.message });
    }
};
