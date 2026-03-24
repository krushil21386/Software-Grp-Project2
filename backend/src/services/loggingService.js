const geoip = require('geoip-lite');
const requestIp = require('request-ip');
const AuditLog = require('../models/AuditLog');

// Warm up geoip-lite database (it loads on first call)
geoip.lookup('8.8.8.8');

/**
 * Records an entry in the Audit Log.
 */
const recordLog = (req, data) => {
    try {
        const clientIp = requestIp.getClientIp(req);
        // geoip-lite lookup is sync and fast once database is loaded into memory
        const geo = geoip.lookup(clientIp);
        const location = geo ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}` : 'Local/Private Network';

        // Perform the MongoDB write in the background (fire and forget)
        AuditLog.create({
            userId: data.userId || (req.user ? req.user.id : null),
            action: data.action,
            category: data.category,
            status: data.status || 'SUCCESS',
            details: data.details || {},
            ipAddress: clientIp,
            location: location,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error('⚠️ Audit Logging Failure:', err.message));

        // Return critical info immediately for MFA logic
        return { clientIp, location };
    } catch (error) {
        console.error('⚠️  Audit Service Error:', error.message);
        return { clientIp: 'unknown', location: 'unknown' };
    }
};

module.exports = {
    recordLog
};
