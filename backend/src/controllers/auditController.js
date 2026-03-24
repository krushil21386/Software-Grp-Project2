const AuditLog = require('../models/AuditLog');

const auditController = {

    /**
     * GET /api/audit/logs
     * Admin only: fetch all audit logs with basic filtering and pagination
     */
    async getLogs(req, res) {
        try {
            const { category, status, userId, action, page = 1, limit = 50 } = req.query;
            
            const filter = {};
            if (category) filter.category = category;
            if (status) filter.status = status;
            if (userId) filter.userId = userId;
            if (action) filter.action = action;

            const logs = await AuditLog.find(filter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('userId', 'name email role');

            const total = await AuditLog.countDocuments(filter);

            res.json({
                success: true,
                count: logs.length,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                logs
            });

        } catch (error) {
            console.error('Audit Fetch Error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
        }
    },

    /**
     * GET /api/audit/my-activity
     * For all users: fetch their own audit logs
     */
    async getMyLogs(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            
            const logs = await AuditLog.find({ userId: req.user.id })
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await AuditLog.countDocuments({ userId: req.user.id });

            res.json({
                success: true,
                count: logs.length,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                logs
            });

        } catch (error) {
            console.error('My Activity Error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch your activity logs.' });
        }
    },

    /**
     * GET /api/audit/stats
     * Admin only: summary of security and activity stats
     */
    async getStats(req, res) {
        try {
            const stats = await AuditLog.aggregate([
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: 1 },
                        failures: { 
                            $sum: { $cond: [{ $eq: ["$status", "FAILURE"] }, 1, 0] } 
                        },
                        warnings: { 
                            $sum: { $cond: [{ $eq: ["$status", "WARNING"] }, 1, 0] } 
                        }
                    }
                }
            ]);

            const recentSecurityEvents = await AuditLog.find({ 
                category: 'AUTH', 
                status: { $in: ['FAILURE', 'WARNING'] } 
            })
            .sort({ timestamp: -1 })
            .limit(5)
            .populate('userId', 'name email');

            res.json({
                success: true,
                stats,
                recentSecurityEvents
            });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch audit stats.' });
        }
    },

    /**
     * GET /api/audit/export
     * Admin only: exports all audit logs as a CSV file
     */
    async exportLogs(req, res) {
        try {
            const logs = await AuditLog.find()
                .sort({ timestamp: -1 })
                .populate('userId', 'name email role');

            // CSV Header
            let csv = 'Timestamp,User Name,User Email,Role,Action,Category,Status,IP Address,Location,User Agent\n';

            // Add rows
            logs.forEach(log => {
                const row = [
                    new Date(log.timestamp).toISOString(),
                    log.userId?.name || 'Anonymous',
                    log.userId?.email || 'N/A',
                    log.userId?.role || 'N/A',
                    log.action,
                    log.category,
                    log.status,
                    log.ipAddress,
                    `"${log.location || 'Unknown'}"`,
                    `"${log.userAgent?.replace(/"/g, '""') || 'Unknown'}"`
                ].join(',');
                csv += row + '\n';
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
            
            return res.status(200).send(csv);

        } catch (error) {
            console.error('Export Error:', error);
            res.status(500).json({ success: false, message: 'Failed to export logs.' });
        }
    }
};

module.exports = auditController;
