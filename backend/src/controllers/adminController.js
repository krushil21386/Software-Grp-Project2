const User = require('../models/User');
const Appointment = require('../models/Appointment');
const cacheService = require('../services/cacheService');
const logger = require('../services/loggerService');

exports.getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let filter = {};
        if (role) filter.role = role;
        
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching admin users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { isLocked, isVerified } = req.body;
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ success: false, message: 'User not found' });

        if(typeof isLocked !== 'undefined') user.isLocked = isLocked;
        if(typeof isVerified !== 'undefined') user.isVerified = isVerified;
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'User status updated successfully',
            user: { 
                id: user._id, 
                name: user.name,
                email: user.email,
                role: user.role, 
                isLocked: user.isLocked, 
                isVerified: user.isVerified 
            } 
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const cacheKey = 'admin_dashboard_stats';
        const cachedData = await cacheService.get(cacheKey);
        
        if (cachedData) {
            return res.json({ success: true, stats: cachedData, fromCache: true });
        }

        const stats = {
            totalUsers: await User.countDocuments({ role: 'patient' }),
            totalDoctors: await User.countDocuments({ role: 'doctor' }),
            totalAppointments: await Appointment.countDocuments(),
            completedAppointments: await Appointment.countDocuments({ status: 'completed' }),
            cancelledAppointments: await Appointment.countDocuments({ status: 'cancelled' }),
            recentRegistrations: await User.find({ role: 'patient' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
            upcomingRevenue: await Appointment.aggregate([
                { $match: { status: 'upcoming' } },
                { $group: { _id: null, total: { $sum: 500 } } } // Assuming fixed fee for demo
            ])
        };

        // Cache for 5 minutes
        await cacheService.set(cacheKey, stats, 300);

        res.json({ success: true, stats });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch real-time stats' });
    }
};

exports.getInventoryStatus = async (req, res) => {
    try {
        const Medicine = require('../models/Medicine');
        const inventory = await Medicine.find().select('name category price stock').sort({ stock: 1 });
        res.json({ success: true, inventory });
    } catch (error) {
        console.error('Error fetching inventory status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
