const HIGH_RISK_KEYWORDS = [
    'chest pain',
    'heart',
    'stroke',
    'severe',
    'urgent',
    'emergency',
    'bleeding',
    'unconscious',
    'breathing',
    'shortness of breath',
    'critical'
];

/**
 * Detects if a patient's condition or request warrants high-priority handling.
 * @param {string} condition - A text description of symptoms or condition.
 * @param {boolean} isUrgent - A direct flag indicating urgency.
 * @returns {string} - 'high', 'medium', or 'low' risk level.
 */
function detectRiskLevel(condition = '', isUrgent = false) {
    if (isUrgent) return 'high';

    const lowerCondition = condition.toLowerCase();
    const hasHighRiskKeyword = HIGH_RISK_KEYWORDS.some(keyword => lowerCondition.includes(keyword));
    
    if (hasHighRiskKeyword) {
        return 'high';
    }

    // Default to normal/low priority
    return 'low';
}

/**
 * Suggests and prioritizes slots based on risk level.
 * @param {Array} availableSlots - Array of slot objects, e.g., { date: '2023-11-20', time: '10:00 AM', doctorId: '...', doctorName: '...' }
 * @param {string} riskLevel - The computed risk level.
 * @param {string} preferredDate - The date the patient specified (optional).
 * @returns {Array} - An array of prioritized slots.
 */
function prioritizeSlots(availableSlots, riskLevel, preferredDate = null) {
    if (!availableSlots || availableSlots.length === 0) {
        return [];
    }

    // Helper to convert date/time into a comparable Date object
    // Assuming standard formats like 'YYYY-MM-DD' and 'HH:mm AM/PM'
    const parseSlotDateTime = (slot) => {
        try {
            return new Date(`${slot.date} ${slot.time}`);
        } catch (e) {
            return new Date(0); // fallback
        }
    };

    // Sort all slots strictly chronologically
    let sortedSlots = [...availableSlots].sort((a, b) => {
        return parseSlotDateTime(a) - parseSlotDateTime(b);
    });

    if (riskLevel === 'high') {
        // High risk: Immediately offer the absolute earliest slots, regardless of preferred date
        // Return top 3 earliest slots across the clinic/doctor
        return sortedSlots.slice(0, 3).map(slot => ({
            ...slot,
            suggestionReason: 'Urgent condition detected. Earliest possible slot suggested.'
        }));
    } else {
        // Low risk: Try to prioritize slots on the preferred date
        let filteredSlots = sortedSlots;
        
        if (preferredDate) {
            filteredSlots = sortedSlots.filter(s => s.date === preferredDate);
            // If no slots on preferred date, fallback to next available
            if (filteredSlots.length === 0) {
                filteredSlots = sortedSlots;
            }
        }
        
        return filteredSlots.slice(0, 5).map(slot => ({
            ...slot,
            suggestionReason: 'Standard availability'
        }));
    }
}

/**
 * Orchestrates the full risk-based appointment processing logic for testing.
 */
function processBookingRequest(requestData) {
    const { patientName, condition, isUrgent, preferredDate, availableSlots } = requestData;
    
    // 1. Detect risk
    const riskLevel = detectRiskLevel(condition, isUrgent);
    
    // 2. Prioritize slots
    const suggestedSlots = prioritizeSlots(availableSlots, riskLevel, preferredDate);

    return {
        patientName,
        condition,
        riskLevel,
        isUrgentRequest: riskLevel === 'high',
        suggestedSlots
    };
}

module.exports = {
    detectRiskLevel,
    prioritizeSlots,
    processBookingRequest,
    HIGH_RISK_KEYWORDS
};
