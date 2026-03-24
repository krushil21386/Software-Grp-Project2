const User = require('../models/User');

/**
 * Checks if a login location is "known" for this user.
 * Using cached locations on the user object for performance.
 */
const isLocationRecognized = async (user, newLocation) => {
    if (newLocation === 'Local/Private Network' || !newLocation) {
        return true;
    }

    if (!user.knownLocations || user.knownLocations.length === 0) {
        return true; // First login
    }

    return user.knownLocations.includes(newLocation);
};

/**
 * Updates the known locations for a user, keeping only the last 10.
 */
const updateKnownLocation = async (userId, newLocation) => {
    if (newLocation === 'Local/Private Network' || !newLocation) return;

    await User.updateOne(
        { _id: userId },
        { 
            $addToSet: { knownLocations: newLocation },
            $push: { 
                knownLocations: { 
                    $each: [], 
                    $slice: -10 // Keep last 10
                } 
            } 
        }
    );
};

module.exports = {
    isLocationRecognized,
    updateKnownLocation
};
